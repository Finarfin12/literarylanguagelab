"use server";

// Server actions tab Konten → Latihan (Fase 15): buat soal dengan AI (draft), buat soal dari Kosakata Inti (tanpa AI),
// edit, terbitkan, hapus. Setiap action memanggil assertAdmin() dan mencatat logAdminAction().
// AI HANYA membantu admin membuat draf; latihan yang dikerjakan pengguna tidak memanggil AI.

import { revalidatePath } from "next/cache";
import { assertAdmin, toErrorMessage, type ActionResult } from "./_lib/guard";
import { logAdminAction } from "@/lib/admin-audit";
import { runAI } from "@/lib/ai/run";
import { extractJsonObject } from "@/lib/ai/json";
import { isCefrLevel } from "@/lib/cefr";
import { validateExerciseDraft } from "@/lib/exercises/grade";
import { mulberry32 } from "@/lib/exercises/session";
import { buildCoreWordExercises } from "@/lib/exercises/from-core-words";
import { EXERCISE_TYPES, type ExerciseDraft, type ExerciseType } from "@/lib/exercises/types";
import { MISSING_SCHEMA_CODES } from "./_lib/content-types";

const MIGRATION_HINT = "Migrasi 0012_exercises.sql belum dijalankan.";

function dbError(error: { code?: string; message: string }): string {
  return error.code && MISSING_SCHEMA_CODES.includes(error.code) ? MIGRATION_HINT : error.message;
}

const SHAPES: Record<ExerciseType, string> = {
  mcq: `{"type":"mcq","prompt":{"question":"She ___ happy.","options":["am","is","are"]},"answer":{"correct":"is"}}`,
  cloze: `{"type":"cloze","prompt":{"text":"I ___ a student and she ___ a teacher.","hint":"(petunjuk Indonesia, opsional)"},"answer":{"blanks":[["am"],["is"]]}}`,
  order: `{"type":"order","prompt":{"tokens":["goes","She","school","to","."],"hint":"Dia pergi ke sekolah."},"answer":{"sentences":["She goes to school."]}}`,
  match: `{"type":"match","prompt":{"lefts":["cat","dog"],"rights":["anjing","kucing"]},"answer":{"pairs":[{"left":"cat","right":"kucing"},{"left":"dog","right":"anjing"}]}}`,
  dictation: `{"type":"dictation","prompt":{"text":"She goes to school every day."},"answer":{"accept":["She goes to school every day."]}}`,
};

const MAX_AI_COUNT = 10;

/** Membuat draf soal dengan AI untuk satu topik grammar. Hasil divalidasi; yang tidak sah dibuang. */
export async function generateExercisesWithAI(input: {
  topic_slug: string;
  type: string;
  count: number;
  note?: string;
}): Promise<ActionResult<{ created: number; rejected: number; reasons: string[] }>> {
  try {
    const { supabase, user } = await assertAdmin();
    if (!(EXERCISE_TYPES as readonly string[]).includes(input.type)) return { ok: false, error: "Pilih tipe soal." };
    const type = input.type as ExerciseType;
    const count = Math.max(1, Math.min(MAX_AI_COUNT, Math.floor(input.count) || 5));

    const { data: topic, error: topicError } = await supabase
      .from("grammar_topics")
      .select("slug, title, cefr_level, summary_id, examples")
      .eq("slug", input.topic_slug)
      .maybeSingle();
    if (topicError) return { ok: false, error: dbError(topicError) };
    if (!topic) return { ok: false, error: "Topik tidak ditemukan." };

    const note = (input.note ?? "").trim().slice(0, 300);
    const completion = await runAI(
      "exercise-generate",
      {
        messages: [
          {
            role: "system",
            content: `You write ORIGINAL practice exercises for Indonesian learners of English (CEFR ${topic.cefr_level}). Exercise type: "${type}". Write exactly ${count} different exercises about the grammar topic. Use simple, natural, correct English suited to the level. Do not copy any textbook. Explanations ("explanation_id") MUST be in Indonesian, 1-3 short sentences saying why the answer is right.
Respond ONLY with valid JSON: {"exercises":[{"type":"${type}","prompt":...,"answer":...,"explanation_id":"..."}]}.
Shape of one exercise's "type", "prompt" and "answer" (follow it exactly):
${SHAPES[type]}
Rules: cloze text uses "___" for each blank and "blanks" has one array of accepted answers per blank; order "tokens" are the words/pieces of the sentence in scrambled order and every accepted sentence uses exactly those pieces; match needs 3-5 pairs with unique items; mcq has 3-4 options, exactly one correct, and "correct" equals one option exactly.`,
          },
          {
            role: "user",
            content: `Topic: ${topic.title}\nSummary (Indonesian): ${topic.summary_id}\nExamples: ${JSON.stringify(topic.examples ?? []).slice(0, 800)}${note ? `\nExtra instruction: ${note}` : ""}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 2500,
      },
      { userId: user.id }
    );

    const parsed = extractJsonObject(completion.content) as { exercises?: unknown } | null;
    if (!parsed || !Array.isArray(parsed.exercises)) return { ok: false, error: "Respons AI bukan JSON soal yang valid. Coba lagi." };

    const drafts: ExerciseDraft[] = [];
    const reasons: string[] = [];
    for (const raw of parsed.exercises.slice(0, MAX_AI_COUNT)) {
      const candidate = typeof raw === "object" && raw !== null ? { ...(raw as object), type, cefr_level: topic.cefr_level, topic_slug: topic.slug, tags: [] } : raw;
      const v = validateExerciseDraft(candidate);
      if (v.ok) drafts.push(v.value);
      else reasons.push(v.error);
    }
    if (drafts.length === 0) return { ok: false, error: `Semua soal dari AI ditolak: ${reasons[0] ?? "format tidak sesuai"}. Coba lagi.` };

    const { data, error } = await supabase
      .from("exercises")
      .insert(drafts.map((d) => ({ ...d, status: "draft", source: "ai" })))
      .select("id");
    if (error) return { ok: false, error: dbError(error) };

    await logAdminAction({
      actorId: user.id,
      action: "exercise.generate_ai",
      target: topic.slug,
      after: { type, requested: count, created: data?.length ?? drafts.length, rejected: reasons.length },
    });
    revalidatePath("/admin/content/exercises");
    return { ok: true, data: { created: data?.length ?? drafts.length, rejected: reasons.length, reasons: reasons.slice(0, 3) } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Membuat draf soal (pilihan ganda "apa arti kata ini?" dan pasangkan) dari Kosakata Inti, TANPA AI. */
export async function generateCoreWordExercises(input: { cefr?: string; mcqCount: number; matchCount: number }): Promise<ActionResult<{ created: number }>> {
  try {
    const { supabase, user } = await assertAdmin();
    const mcqCount = Math.max(0, Math.min(30, Math.floor(input.mcqCount) || 0));
    const matchCount = Math.max(0, Math.min(10, Math.floor(input.matchCount) || 0));
    if (mcqCount + matchCount === 0) return { ok: false, error: "Isi jumlah soal." };
    if (input.cefr && !isCefrLevel(input.cefr)) return { ok: false, error: "Level tidak valid." };

    let q = supabase.from("core_words").select("word, definition_en, cefr_estimate").not("definition_en", "is", null).limit(1500);
    if (input.cefr) q = q.eq("cefr_estimate", input.cefr);
    const { data: words, error } = await q;
    if (error) {
      return { ok: false, error: error.code && MISSING_SCHEMA_CODES.includes(error.code) ? "Kolom definisi belum ada: jalankan migrasi 0015 dan scripts/enrich-ngsl.mjs." : error.message };
    }
    if (!words || words.length < 8) return { ok: false, error: "Kosakata Inti belum punya cukup definisi (jalankan scripts/enrich-ngsl.mjs)." };

    // Lewati kata yang sudah punya soal (tag core:<kata>)
    const skip = new Set<string>();
    const existing = await supabase.from("exercises").select("tags").contains("tags", ["core-word"]).limit(5000);
    if (existing.error) return { ok: false, error: dbError(existing.error) };
    for (const row of existing.data || []) for (const t of (row.tags as string[] | null) ?? []) if (t.startsWith("core:")) skip.add(t.slice(5));

    const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    const drafts = buildCoreWordExercises(words, { mcqCount, matchCount, skipWords: skip, rng: mulberry32(seed) });
    if (drafts.length === 0) return { ok: false, error: "Tidak ada kata baru yang bisa dibuat soalnya (semua sudah punya soal atau definisinya kurang)." };

    const valid = drafts.filter((d) => validateExerciseDraft(d).ok);
    const { error: insertError } = await supabase.from("exercises").insert(valid.map((d) => ({ ...d, status: "draft", source: "admin" })));
    if (insertError) return { ok: false, error: dbError(insertError) };

    await logAdminAction({ actorId: user.id, action: "exercise.generate_core_words", target: input.cefr ?? "all", after: { created: valid.length, mcqCount, matchCount } });
    revalidatePath("/admin/content/exercises");
    return { ok: true, data: { created: valid.length } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Menyimpan perubahan soal (formulir admin). `prompt`/`answer` divalidasi lagi sebelum disimpan. */
export async function saveExercise(input: {
  id?: string;
  type: string;
  cefr_level: string;
  topic_slug: string | null;
  unit_slug?: string | null;
  tags: string[];
  prompt: unknown;
  answer: unknown;
  explanation_id: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, user } = await assertAdmin();
    const v = validateExerciseDraft({ ...input, unit_slug: input.unit_slug || null });
    if (!v.ok) return { ok: false, error: v.error };
    const d = v.value;

    if (input.id) {
      const { data: before } = await supabase.from("exercises").select("status").eq("id", input.id).maybeSingle();
      // Mengubah soal menurunkannya ke draft agar ditinjau lagi
      const { error } = await supabase
        .from("exercises")
        .update({ type: d.type, cefr_level: d.cefr_level, topic_slug: d.topic_slug, unit_slug: d.unit_slug, tags: d.tags, prompt: d.prompt, answer: d.answer, explanation_id: d.explanation_id, status: "draft" })
        .eq("id", input.id);
      if (error) return { ok: false, error: dbError(error) };
      await logAdminAction({ actorId: user.id, action: "exercise.edit", target: input.id, before: { status: before?.status ?? null }, after: { type: d.type, cefr_level: d.cefr_level } });
      revalidatePath("/admin/content/exercises");
      return { ok: true, data: { id: input.id } };
    }

    const { data, error } = await supabase.from("exercises").insert({ ...d, status: "draft", source: "admin" }).select("id").single();
    if (error) return { ok: false, error: dbError(error) };
    await logAdminAction({ actorId: user.id, action: "exercise.create", target: data.id, after: { type: d.type, cefr_level: d.cefr_level } });
    revalidatePath("/admin/content/exercises");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Menerbitkan atau menarik beberapa soal sekaligus. Soal yang rusak tidak diterbitkan. */
export async function setExercisesPublished(ids: string[], published: boolean): Promise<ActionResult<{ changed: number; skipped: number }>> {
  try {
    const { supabase, user } = await assertAdmin();
    const list = Array.from(new Set(ids.filter((x) => typeof x === "string"))).slice(0, 100);
    if (list.length === 0) return { ok: false, error: "Tidak ada soal dipilih." };

    let target = list;
    let skipped = 0;
    if (published) {
      const { data, error } = await supabase.from("exercises").select("*").in("id", list);
      if (error) return { ok: false, error: dbError(error) };
      target = (data || []).filter((row) => validateExerciseDraft(row).ok).map((row) => row.id as string);
      skipped = list.length - target.length;
      if (target.length === 0) return { ok: false, error: "Soal yang dipilih tidak valid. Perbaiki lewat Edit." };
    }

    const { error } = await supabase.from("exercises").update({ status: published ? "published" : "draft" }).in("id", target);
    if (error) return { ok: false, error: dbError(error) };

    await logAdminAction({ actorId: user.id, action: published ? "exercise.publish" : "exercise.unpublish", target: target.length === 1 ? target[0] : `${target.length} soal`, after: { ids: target } });
    revalidatePath("/admin/content/exercises");
    return { ok: true, data: { changed: target.length, skipped } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteExercise(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (error) return { ok: false, error: dbError(error) };
    await logAdminAction({ actorId: user.id, action: "exercise.delete", target: id });
    revalidatePath("/admin/content/exercises");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
