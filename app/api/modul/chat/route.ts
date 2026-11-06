import { NextResponse } from "next/server";
import { runAI } from "@/lib/ai/run";
import { guardAIRoute } from "@/lib/ai/guard";
import { getStudyAccess } from "@/lib/study-access";
import { SLUG } from "@/lib/study";
import { loadLesson } from "@/lib/study-server";

const MAX_LESSON_CHARS = 9000;

/**
 * Tanya jawab seputar satu pelajaran (Fase 24.4). Riwayat tidak disimpan untuk umum; klien mengirim ulang percakapan
 * tiap kali. Lewat guardAIRoute (login, batas pemakaian, ukuran, peran pesan). Halaman pelajaran tetap utuh tanpa ini.
 */
export async function POST(req: Request) {
  try {
    const guard = await guardAIRoute(req, { limitKey: "lesson-chat", maxChars: 6000, maxMessages: 12 });
    if (guard instanceof NextResponse) return guard;
    const { user, supabase, body } = guard;
    const { lesson_slug, messages } = body as { lesson_slug?: string; messages?: { role: "user" | "assistant"; content: string }[] };
    if (typeof lesson_slug !== "string" || !SLUG.test(lesson_slug)) return NextResponse.json({ error: "Pelajaran tidak valid." }, { status: 400 });
    if (!Array.isArray(messages) || messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "Tulis pertanyaanmu dulu." }, { status: 400 });
    }

    const access = await getStudyAccess(supabase, user.id);
    if (!access.visible) return NextResponse.json({ error: "Modul Belajar belum dibuka." }, { status: 403 });
    const { available, lesson } = await loadLesson(supabase, lesson_slug);
    if (!available) return NextResponse.json({ error: "Modul Belajar belum tersedia." }, { status: 503 });
    if (!lesson) return NextResponse.json({ error: "Pelajaran tidak ditemukan." }, { status: 404 });

    const system = `You are a patient study companion for an Indonesian learner who is studying the lesson below.
Answer in clear, simple Indonesian (Bahasa Indonesia); keep English terms and examples in English with a short explanation.
Stay on the topic of the lesson. If the question is outside the lesson, say so briefly and answer only if it is closely related.
Keep answers short (under 200 words). Do not invent facts, quotations, or references; if you are not sure, say so.
Never claim to be an official course or to give grades.

LESSON: ${lesson.title}
${lesson.body_md.slice(0, MAX_LESSON_CHARS)}`;

    const result = await runAI(
      "lesson-chat",
      {
        messages: [{ role: "system", content: system }, ...messages.slice(-8).map((m) => ({ role: m.role, content: m.content }))],
        temperature: 0.4,
        max_tokens: 700,
      },
      { userId: user.id }
    );
    const reply = (result.content || "").trim();
    if (!reply) return NextResponse.json({ error: "Jawaban kosong. Coba lagi." }, { status: 502 });
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Lesson Chat Error:", error);
    return NextResponse.json({ error: "Tanya jawab belum bisa dipakai. Coba lagi nanti." }, { status: 500 });
  }
}
