"use server";

// Server actions tab Konten: level teks, teks berjenjang buatan AI, dan topik grammar.
// Setiap action memanggil assertAdmin() karena Server Action bisa dipanggil langsung lewat POST.

import { revalidatePath } from "next/cache";
import { assertAdmin, toErrorMessage, type ActionResult } from "./_lib/guard";
import { logAdminAction } from "@/lib/admin-audit";
import { runAI } from "@/lib/ai/run";
import { isCefrLevel } from "@/lib/cefr";
import { MISSING_SCHEMA_CODES, TEXT_LENGTHS, type TextLength } from "./_lib/content-types";
import { attachTextToUnit } from "./_lib/course-link";

const MIGRATION_HINT = "Migrasi 0007_graded_content.sql belum dijalankan.";

function dbError(error: { code?: string; message: string }): string {
  return error.code && MISSING_SCHEMA_CODES.includes(error.code) ? MIGRATION_HINT : error.message;
}

const LEVEL_GUIDE: Record<string, string> = {
  A1: "Use only the most common ~500 English words, present simple, sentences of 5-8 words, no idioms.",
  A2: "Use common everyday words (~1000), present and past simple, short sentences (up to 12 words), very few idioms.",
  B1: "Use general vocabulary (~2000 words), a mix of tenses, some linking words (because, although), sentences up to 18 words.",
  B2: "Use varied vocabulary, complex sentences, some idiomatic expressions, and abstract ideas.",
  C1: "Use rich, precise vocabulary, complex structures, and an implied or nuanced tone.",
  C2: "Use sophisticated, literary vocabulary and varied syntax like a native writer.",
};

export async function setTextLevel(textId: string, level: string | null): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    if (level !== null && !isCefrLevel(level)) return { ok: false, error: "Level tidak valid." };

    const { data: before } = await supabase.from("texts").select("cefr_level").eq("id", textId).maybeSingle();
    const { error } = await supabase.from("texts").update({ cefr_level: level }).eq("id", textId);
    if (error) return { ok: false, error: dbError(error) };

    await logAdminAction({ actorId: user.id, action: "text.set_level", target: textId, before: { cefr_level: before?.cefr_level ?? null }, after: { cefr_level: level } });
    revalidatePath("/admin/content");
    revalidatePath("/library");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Estimasi level dengan AI. Hanya mengembalikan saran; admin yang memutuskan dan menyimpan. */
export async function estimateTextLevel(textId: string): Promise<ActionResult<{ cefr: string; explanation: string }>> {
  try {
    const { supabase, user } = await assertAdmin();
    const { data: text, error } = await supabase.from("texts").select("content").eq("id", textId).maybeSingle();
    if (error) return { ok: false, error: dbError(error) };
    if (!text?.content) return { ok: false, error: "Teks tidak ditemukan." };

    const completion = await runAI("analyze-difficulty", {
      messages: [
        {
          role: "system",
          content: `Analyze the difficulty of this English literary text. Return JSON with:
- "cefr": CEFR level (A1/A2/B1/B2/C1/C2)
- "score": numeric 1-10 difficulty score
- "explanation": brief explanation in Indonesian why this level`,
        },
        { role: "user", content: String(text.content).slice(0, 3000) },
      ],
      response_format: { type: "json_object" },
    }, { userId: user.id });

    const parsed = JSON.parse(completion.content || "{}");
    if (!isCefrLevel(parsed.cefr)) return { ok: false, error: "AI tidak mengembalikan level yang valid. Coba lagi." };
    return { ok: true, data: { cefr: parsed.cefr, explanation: String(parsed.explanation || "") } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/**
 * Tombol lama "Buat teks berjenjang dengan AI" memakai {level, topic, length}. Fase 18 menambah dua bidang OPSIONAL untuk
 * pembuatan bacaan per unit: `targetWords` (kata yang sebaiknya dipakai) dan `approxWords` (panjang kira-kira; menimpa `length`).
 * Tanpa keduanya perilakunya sama seperti sebelumnya.
 */
export async function generateGradedText(input: { level: string; topic: string; length: string; targetWords?: string[]; approxWords?: number }): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, user } = await assertAdmin();
    const topic = input.topic.trim().slice(0, 200);
    if (!isCefrLevel(input.level)) return { ok: false, error: "Pilih level." };
    if (!topic) return { ok: false, error: "Tulis topik teks." };
    if (!(input.length in TEXT_LENGTHS)) return { ok: false, error: "Panjang tidak valid." };
    const words = typeof input.approxWords === "number" && Number.isFinite(input.approxWords)
      ? Math.max(50, Math.min(400, Math.round(input.approxWords)))
      : TEXT_LENGTHS[input.length as TextLength].words;
    const targets = (input.targetWords ?? []).map((w) => String(w).trim()).filter((w) => /^[A-Za-z][A-Za-z' -]{0,30}$/.test(w)).slice(0, 15);
    const targetNote = targets.length ? ` Where it fits naturally, use these target words: ${targets.join(", ")}. Use mostly very common English words besides these.` : "";

    const completion = await runAI("graded-text-generate", {
      messages: [
        {
          role: "system",
          content: `You write ORIGINAL graded reading texts for learners of English. Level: CEFR ${input.level}. ${LEVEL_GUIDE[input.level]} Target length: about ${words} words. Do not copy or imitate any existing graded reader or copyrighted text.${targetNote} Respond ONLY with valid JSON: {"title": string, "content": string}. Separate paragraphs with a blank line.`,
        },
        { role: "user", content: `Topic: ${topic}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1800,
    }, { userId: user.id });

    let parsed: { title?: string; content?: string };
    try {
      parsed = JSON.parse(completion.content || "{}");
    } catch {
      return { ok: false, error: "Respons AI bukan JSON yang valid. Coba lagi." };
    }
    const title = String(parsed.title || "").trim();
    const content = String(parsed.content || "").trim();
    if (!title || !content) return { ok: false, error: "AI mengembalikan teks kosong. Coba lagi." };

    const { data, error } = await supabase
      .from("texts")
      .insert({
        title,
        author: "Literary Language Lab (AI)",
        content,
        difficulty: input.level,
        word_count: content.split(/\s+/).filter(Boolean).length,
        cefr_level: input.level,
        status: "draft",
        source: "ai",
        is_public: false, // draft tidak tampil di Library
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: dbError(error) };

    await logAdminAction({ actorId: user.id, action: "text.generate_graded", target: data.id, after: { level: input.level, topic, length: input.length, ...(targets.length ? { target_words: targets.length } : {}), ...(input.approxWords ? { approx_words: words } : {}) } });
    revalidatePath("/admin/content");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateDraftText(textId: string, title: string, content: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    const t = title.trim().slice(0, 200);
    const c = content.trim();
    if (!t || !c) return { ok: false, error: "Judul dan isi tidak boleh kosong." };

    const { error } = await supabase
      .from("texts")
      .update({ title: t, content: c, word_count: c.split(/\s+/).filter(Boolean).length })
      .eq("id", textId);
    if (error) return { ok: false, error: dbError(error) };

    await logAdminAction({ actorId: user.id, action: "text.edit", target: textId, after: { title: t } });
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function setTextPublished(textId: string, published: boolean): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    if (published) {
      const { data: row } = await supabase.from("texts").select("cefr_level").eq("id", textId).maybeSingle();
      if (!row?.cefr_level) return { ok: false, error: "Tetapkan level teks sebelum menerbitkan." };
    }
    const { error } = await supabase
      .from("texts")
      .update({ status: published ? "published" : "draft", is_public: published })
      .eq("id", textId);
    if (error) return { ok: false, error: dbError(error) };

    await logAdminAction({ actorId: user.id, action: published ? "text.publish" : "text.unpublish", target: textId });
    revalidatePath("/admin/content");
    revalidatePath("/library");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function saveGrammarTopic(input: {
  slug: string;
  title: string;
  cefr_level: string;
  sort_order: number;
  summary_id: string;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    const slug = input.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,64}$/.test(slug)) return { ok: false, error: "Slug hanya huruf kecil, angka, dan tanda hubung (2-64 karakter)." };
    if (!isCefrLevel(input.cefr_level)) return { ok: false, error: "Level tidak valid." };
    if (!input.title.trim() || !input.summary_id.trim()) return { ok: false, error: "Judul dan ringkasan wajib diisi." };
    if (!Number.isInteger(input.sort_order) || input.sort_order < 0 || input.sort_order > 1000) return { ok: false, error: "Urutan harus bilangan bulat 0-1000." };

    // Upsert tidak menyentuh kolom examples/related_text_ids milik topik yang sudah ada
    const { error } = await supabase.from("grammar_topics").upsert(
      { slug, title: input.title.trim(), cefr_level: input.cefr_level, sort_order: input.sort_order, summary_id: input.summary_id.trim() },
      { onConflict: "slug" }
    );
    if (error) return { ok: false, error: dbError(error) };

    await logAdminAction({ actorId: user.id, action: "grammar_topic.save", target: slug, after: { title: input.title.trim(), cefr_level: input.cefr_level } });
    revalidatePath("/admin/content");
    revalidatePath("/english-lab/grammar");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteGrammarTopic(slug: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    const { error } = await supabase.from("grammar_topics").delete().eq("slug", slug);
    if (error) return { ok: false, error: dbError(error) };

    await logAdminAction({ actorId: user.id, action: "grammar_topic.delete", target: slug });
    revalidatePath("/admin/content");
    revalidatePath("/english-lab/grammar");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/**
 * Jalur 3 (Fase 18): "Tulis teks sendiri". Menyimpan teks buatan admin sebagai draft; bila `unitSlug` diisi, teks langsung
 * dikaitkan ke langkah baca unit itu. Draft bisa diedit dengan tombol Edit yang sudah ada.
 */
export async function createOwnText(input: { title: string; level: string; content: string; unitSlug?: string }): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, user } = await assertAdmin();
    const title = input.title.trim().slice(0, 200);
    const content = input.content.trim();
    if (!title) return { ok: false, error: "Judul wajib diisi." };
    if (!isCefrLevel(input.level)) return { ok: false, error: "Pilih level CEFR." };
    if (content.length < 20) return { ok: false, error: "Isi teks terlalu pendek." };
    if (content.length > 30000) return { ok: false, error: "Isi teks terlalu panjang (maks. 30.000 karakter)." };
    const unitSlug = (input.unitSlug ?? "").trim();
    if (unitSlug && !/^[a-z0-9-]{2,64}$/.test(unitSlug)) return { ok: false, error: "Unit tidak valid." };

    const { data, error } = await supabase
      .from("texts")
      .insert({
        title,
        author: "Literary Language Lab",
        content,
        difficulty: input.level,
        word_count: content.split(/\s+/).filter(Boolean).length,
        cefr_level: input.level,
        status: "draft",
        source: "admin",
        is_public: false, // draft tidak tampil di Library
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: dbError(error) };

    await logAdminAction({ actorId: user.id, action: "text.create_own", target: data.id, after: { level: input.level, title, unit: unitSlug || null } });

    if (unitSlug) {
      const linked = await attachTextToUnit(supabase, unitSlug, data.id, title);
      if (!linked.ok) {
        revalidatePath("/admin/content");
        return { ok: false, error: `Teks tersimpan sebagai draft, tetapi belum terkait ke unit: ${linked.error}` };
      }
      await logAdminAction({ actorId: user.id, action: "course_unit.attach_reading", target: unitSlug, after: { text_id: data.id } });
      revalidatePath("/admin/content/course");
    }
    revalidatePath("/admin/content");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
