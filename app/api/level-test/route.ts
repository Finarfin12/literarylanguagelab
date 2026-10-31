import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getServiceClient } from "@/lib/ai/admin-client";
import { generateLevelTestQuestions, PLACEMENT_SECTIONS, type GeneratedQuestion, type PlacementSection } from "@/lib/placement";
import { loadLevelContext, recordEvidence, recordLevelChange } from "@/lib/skill-evidence";
import {
  SKILLS,
  canTakeLevelTest,
  evaluateLevelTest,
  levelAfterTest,
  levelUpReadiness,
  type SkillLevels,
  type TestSection,
} from "@/lib/levels";
import { isCefrLevel } from "@/lib/cefr";

// Soal dan kunci jawaban disimpan di level_test_sessions (hanya service role yang bisa mengaksesnya)
// dan dinilai di server. Klien tidak pernah menerima jawaban benar sebelum menyerahkan jawaban.

type StoredQuestion = GeneratedQuestion & { index: number; section: PlacementSection };

const letter = (v: unknown) => String(v ?? "").trim().charAt(0).toUpperCase();

function toClient(q: StoredQuestion) {
  return { index: q.index, section: q.section, passage: q.passage, audio_text: q.audio_text, question: q.question, options: q.options };
}

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;
    const { supabase, user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "level-test");
    if (rateLimitRes) return rateLimitRes;

    const service = getServiceClient();
    if (!service) {
      return NextResponse.json({ error: "Tes Naik Level membutuhkan SUPABASE_SERVICE_ROLE_KEY di server." }, { status: 503 });
    }

    const body = await req.json();
    const ctx = await loadLevelContext(supabase, user.id);
    if (!ctx.schemaReady) return NextResponse.json({ error: "Migrasi 0008_skill_levels.sql belum dijalankan." }, { status: 503 });
    if (!ctx.level) return NextResponse.json({ error: "Tentukan levelmu dulu lewat Placement Test." }, { status: 400 });

    // ===== MULAI =====
    if (body.action === "start") {
      const readiness = levelUpReadiness(ctx.evidence, ctx.level, ctx.vocab, ctx.rules);
      if (!readiness.target || !readiness.ready) {
        return NextResponse.json({ error: "Syarat naik level belum terpenuhi." }, { status: 403 });
      }

      // Cooldown dibaca dari sesi tes yang sudah diserahkan (tidak bisa diubah pengguna), bukan dari profil
      const { data: lastSession } = await service
        .from("level_test_sessions")
        .select("submitted_at")
        .eq("user_id", user.id)
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const cooldown = canTakeLevelTest(lastSession?.submitted_at ?? null, new Date(), ctx.rules.test.cooldownDays);
      if (!cooldown.allowed) {
        return NextResponse.json({ error: `Tes ulang tersedia dalam ${cooldown.daysLeft} hari.`, daysLeft: cooldown.daysLeft }, { status: 429 });
      }

      // Sesi terbuka yang belum kedaluwarsa dipakai ulang supaya soal tidak bisa diacak ulang
      const expiresMs = ctx.rules.test.expiresMinutes * 60 * 1000;
      const { data: open } = await service
        .from("level_test_sessions")
        .select("id, target_level, questions, created_at")
        .eq("user_id", user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (open && Date.now() - new Date(open.created_at).getTime() < expiresMs && open.target_level === readiness.target) {
        return NextResponse.json({
          sessionId: open.id,
          target: open.target_level,
          expiresAt: new Date(new Date(open.created_at).getTime() + expiresMs).toISOString(),
          questions: (open.questions as StoredQuestion[]).map(toClient),
        });
      }

      const perSection = ctx.rules.test.questionsPerSection;
      const generated = await Promise.all(
        PLACEMENT_SECTIONS.map((section) => generateLevelTestQuestions(section, readiness.target as string, perSection, user.id).then((qs) => ({ section, qs })))
      );
      if (generated.some((g) => g.qs.length === 0)) {
        return NextResponse.json({ error: "AI gagal membuat soal. Coba lagi sebentar lagi." }, { status: 502 });
      }
      const questions: StoredQuestion[] = [];
      for (const g of generated) for (const q of g.qs) questions.push({ ...q, index: questions.length, section: g.section });

      const { data: session, error } = await service
        .from("level_test_sessions")
        .insert({ user_id: user.id, target_level: readiness.target, questions })
        .select("id, created_at")
        .single();
      if (error || !session) return NextResponse.json({ error: "Gagal memulai tes." }, { status: 500 });

      return NextResponse.json({
        sessionId: session.id,
        target: readiness.target,
        expiresAt: new Date(new Date(session.created_at).getTime() + expiresMs).toISOString(),
        questions: questions.map(toClient),
      });
    }

    // ===== SERAHKAN JAWABAN =====
    if (body.action === "submit") {
      const { sessionId, answers } = body as { sessionId?: string; answers?: Record<string, string> };
      if (typeof sessionId !== "string" || !answers || typeof answers !== "object") {
        return NextResponse.json({ error: "Data jawaban tidak lengkap." }, { status: 400 });
      }

      const { data: session } = await service
        .from("level_test_sessions")
        .select("id, user_id, target_level, questions, status, created_at")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!session) return NextResponse.json({ error: "Sesi tes tidak ditemukan." }, { status: 404 });
      if (session.status !== "open") return NextResponse.json({ error: "Tes ini sudah diserahkan." }, { status: 409 });
      if (!isCefrLevel(session.target_level)) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 400 });

      const expiresMs = ctx.rules.test.expiresMinutes * 60 * 1000;
      if (Date.now() - new Date(session.created_at).getTime() > expiresMs) {
        await service.from("level_test_sessions").update({ status: "expired" }).eq("id", session.id);
        return NextResponse.json({ error: "Waktu tes sudah habis. Mulai tes baru." }, { status: 410 });
      }

      // Penilaian di server
      const questions = session.questions as StoredQuestion[];
      const tally: Partial<Record<TestSection, { correct: number; total: number }>> = {};
      const review = questions.map((q) => {
        const given = letter(answers[String(q.index)]);
        const isCorrect = given !== "" && given === letter(q.correct);
        const t = tally[q.section] ?? { correct: 0, total: 0 };
        t.total += 1;
        if (isCorrect) t.correct += 1;
        tally[q.section] = t;
        return { index: q.index, section: q.section, yourAnswer: given || null, correct: letter(q.correct), isCorrect, explanation_id: q.explanation_id ?? null };
      });
      const evaluation = evaluateLevelTest(tally, ctx.rules);

      // Hasil, bukti, dan level. Gagal tidak mengubah level (tanpa penalti).
      const nowIso = new Date().toISOString();
      await service
        .from("level_test_sessions")
        .update({ status: evaluation.passed ? "passed" : "failed", submitted_at: nowIso, result: { ...evaluation, tally } })
        .eq("id", session.id);

      for (const section of PLACEMENT_SECTIONS) {
        const pct = evaluation.sectionPct[section];
        if (pct === undefined) continue;
        await recordEvidence(supabase, user.id, {
          skill: section,
          source: "level_test",
          score: pct,
          cefr_estimate: evaluation.passed ? session.target_level : null,
          text_cefr: section === "reading" ? session.target_level : null,
          ref_id: session.id,
        });
      }

      const newLevel = levelAfterTest(ctx.level, session.target_level, evaluation.passed);
      const profileUpdate: Record<string, unknown> = { last_level_test_at: nowIso };
      if (evaluation.passed && newLevel !== ctx.level) {
        // Empat keterampilan yang diuji naik ke level target; menulis & berbicara tetap sampai ada bukti sendiri
        const skillLevels: SkillLevels = {};
        for (const skill of SKILLS) skillLevels[skill] = ctx.stored[skill] ?? ctx.level;
        for (const section of PLACEMENT_SECTIONS) skillLevels[section] = newLevel;
        profileUpdate.cefr_level = newLevel;
        profileUpdate.skill_levels = skillLevels;
      }
      await supabase.from("profiles").update(profileUpdate).eq("id", user.id);
      if (evaluation.passed && newLevel !== ctx.level) {
        await recordLevelChange(supabase, user.id, { from: ctx.level, to: newLevel, source: "level_test" });
      }

      const next = canTakeLevelTest(nowIso, new Date(), ctx.rules.test.cooldownDays);
      return NextResponse.json({
        passed: evaluation.passed,
        totalPct: evaluation.totalPct,
        sectionPct: evaluation.sectionPct,
        weakSections: evaluation.weakSections,
        newLevel,
        target: session.target_level,
        review,
        retryAt: next.nextAt?.toISOString() ?? null,
        passRules: { totalPct: ctx.rules.test.passTotalPct, minSectionPct: ctx.rules.test.minSectionPct },
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
  } catch (error) {
    console.error("Level test error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
