"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type AddCoreWordsResult = { ok: true; added: number } | { ok: false; error: string };

const CORE_LEVELS = ["A1", "A2", "B1", "B2"];
const BATCH = 10;
const SCAN_PAGE = 200;
const SCAN_MAX_PAGES = 15;

/**
 * Tambahkan 10 kosakata inti berikutnya (urut frekuensi) yang belum ada di Vocabulary Bank pengguna.
 * `level` = A1..B2 untuk satu level, atau "all" untuk semua level.
 * Memakai tabel vocabulary + SRS yang sudah ada (kata baru langsung jatuh tempo untuk di-review).
 */
export async function addNextCoreWords(level: string): Promise<AddCoreWordsResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan masuk terlebih dahulu." };
  if (level !== "all" && !CORE_LEVELS.includes(level)) return { ok: false, error: "Level tidak valid." };

  const picked: { word: string; example: string | null }[] = [];

  for (let page = 0; page < SCAN_MAX_PAGES && picked.length < BATCH; page++) {
    let q = supabase
      .from("core_words")
      .select("word, example")
      .order("band", { ascending: true })
      .range(page * SCAN_PAGE, (page + 1) * SCAN_PAGE - 1);
    if (level !== "all") q = q.eq("cefr_estimate", level);

    const { data: candidates, error } = await q;
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") return { ok: false, error: "Kosakata inti belum aktif (migrasi 0007 belum dijalankan)." };
      return { ok: false, error: "Gagal memuat kosakata inti." };
    }
    if (!candidates || candidates.length === 0) break;

    const words = candidates.map((c) => c.word as string);
    const { data: owned } = await supabase.from("vocabulary").select("word").eq("user_id", user.id).in("word", words);
    const ownedSet = new Set((owned || []).map((o) => String(o.word).toLowerCase()));

    for (const c of candidates) {
      if (picked.length >= BATCH) break;
      if (!ownedSet.has(String(c.word).toLowerCase())) picked.push({ word: c.word as string, example: (c.example as string | null) ?? null });
    }
    if (candidates.length < SCAN_PAGE) break;
  }

  if (picked.length === 0) return { ok: true, added: 0 };

  const now = new Date().toISOString();
  const { error } = await supabase.from("vocabulary").upsert(
    picked.map((p) => ({
      user_id: user.id,
      word: p.word,
      definition: "",
      context_sentence: p.example,
      context_source: "Kosakata Inti",
      mastery_level: 0,
      next_review_at: now,
      interval: 0,
      repetition_count: 0,
      efactor: 2.5,
      is_collocation: false,
    })),
    { onConflict: "user_id,word", ignoreDuplicates: true }
  );
  if (error) return { ok: false, error: "Gagal menyimpan ke Vocabulary Bank." };

  revalidatePath("/vocabulary/core");
  revalidatePath("/vocabulary");
  return { ok: true, added: picked.length };
}
