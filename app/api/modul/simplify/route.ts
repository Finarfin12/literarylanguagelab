import { NextResponse } from "next/server";
import { runAI } from "@/lib/ai/run";
import { guardAIRoute } from "@/lib/ai/guard";
import { getServiceClient } from "@/lib/ai/admin-client";
import { getStudyAccess } from "@/lib/study-access";
import { SLUG } from "@/lib/study";
import { loadLesson } from "@/lib/study-server";
import { isMissingSchema } from "@/lib/skill-evidence";

const MAX_LESSON_CHARS = 14000;

// Permintaan bersamaan untuk pelajaran yang sama (di instance ini) berbagi satu panggilan AI.
const inflight = new Map<string, Promise<string>>();

const SYSTEM = `You rewrite a study lesson for a learner who found the original too difficult.
Write in clear, simple Indonesian (Bahasa Indonesia). Keep English examples as they are, each followed by a short explanation in Indonesian.
Use short sentences, one idea per paragraph, and at most 350 words. Start with one sentence on the main idea, then explain step by step with 1-2 small examples.
Do not add facts that are not in the lesson. Do not invent references. Output Markdown only, with no preface.`;

/**
 * "Jelaskan lebih sederhana" (Fase 24.4): versi sederhana pelajaran dibuat SEKALI oleh AI lalu disimpan di
 * lesson_simple_versions; pembukaan berikutnya memakai simpanan. Lewat guardAIRoute. Halaman pelajaran tetap utuh tanpa ini.
 */
export async function POST(req: Request) {
  try {
    const guard = await guardAIRoute(req, { limitKey: "lesson-simplify", maxChars: 200, maxMessages: 2 });
    if (guard instanceof NextResponse) return guard;
    const { user, supabase, body } = guard;
    const { lesson_slug } = body as { lesson_slug?: string };
    if (typeof lesson_slug !== "string" || !SLUG.test(lesson_slug)) return NextResponse.json({ error: "Pelajaran tidak valid." }, { status: 400 });

    const access = await getStudyAccess(supabase, user.id);
    if (!access.visible) return NextResponse.json({ error: "Modul Belajar belum dibuka." }, { status: 403 });

    const { available, lesson } = await loadLesson(supabase, lesson_slug);
    if (!available) return NextResponse.json({ error: "Modul Belajar belum tersedia." }, { status: 503 });
    if (!lesson) return NextResponse.json({ error: "Pelajaran tidak ditemukan." }, { status: 404 });

    // Sudah pernah dibuat: pakai simpanan, tanpa AI
    const cached = await supabase.from("lesson_simple_versions").select("content").eq("lesson_slug", lesson_slug).maybeSingle();
    if (cached.error && !isMissingSchema(cached.error)) console.error("baca lesson_simple_versions gagal:", cached.error.message);
    if (cached.data?.content) return NextResponse.json({ content: cached.data.content, cached: true });

    let pending = inflight.get(lesson_slug);
    if (!pending) {
      pending = (async () => {
        const result = await runAI(
          "lesson-simplify",
          {
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: `Title: ${lesson.title}\n\n${lesson.body_md.slice(0, MAX_LESSON_CHARS)}` },
            ],
            temperature: 0.3,
            max_tokens: 1200,
          },
          { userId: user.id }
        );
        const content = (result.content || "").trim();
        if (!content) throw new Error("empty");
        const service = getServiceClient();
        if (service) {
          // Penulisan hanya lewat server; jika sudah ada (balapan antar-instance), yang pertama tersimpan dipakai
          await service.from("lesson_simple_versions").upsert({ lesson_slug, content, model: null }, { onConflict: "lesson_slug", ignoreDuplicates: true });
          const stored = await service.from("lesson_simple_versions").select("content").eq("lesson_slug", lesson_slug).maybeSingle();
          if (stored.data?.content) return stored.data.content as string;
        }
        return content;
      })().finally(() => inflight.delete(lesson_slug));
      inflight.set(lesson_slug, pending);
    }
    const content = await pending;
    return NextResponse.json({ content, cached: false });
  } catch (error) {
    console.error("Lesson Simplify Error:", error);
    return NextResponse.json({ error: "Penjelasan sederhana belum bisa dibuat. Coba lagi nanti." }, { status: 500 });
  }
}
