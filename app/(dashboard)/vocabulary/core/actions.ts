"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { isOwned, wordCandidates, type CoreWordRow } from "@/lib/core-words";

export type AddCoreWordsResult = { ok: true; added: number } | { ok: false; error: string };

const CORE_LEVELS = ["A1", "A2", "B1", "B2"];
const BATCH = 10;
const SCAN_PAGE = 200;
const SCAN_MAX_PAGES = 15;

type Candidate = CoreWordRow & { example: string | null; definition_en?: string | null };

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

  const picked: { word: string; example: string | null; definition: string }[] = [];
  // Kolom definition_en/forms dari migrasi 0015; jika belum ada, jatuh ke kolom lama (tanpa definisi dan bentuk kata)
  let columns = "word, example, definition_en, forms";

  for (let page = 0; page < SCAN_MAX_PAGES && picked.length < BATCH; page++) {
    const fetchPage = (cols: string) => {
      let q = supabase
        .from("core_words")
        .select(cols)
        .order("band", { ascending: true })
        .range(page * SCAN_PAGE, (page + 1) * SCAN_PAGE - 1);
      if (level !== "all") q = q.eq("cefr_estimate", level);
      return q;
    };

    let res = await fetchPage(columns);
    if (res.error && (res.error.code === "42703" || res.error.code === "PGRST204")) {
      columns = "word, example";
      res = await fetchPage(columns);
    }
    const { error } = res;
    const candidates = (res.data ?? null) as unknown as Candidate[] | null;
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") return { ok: false, error: "Kosakata inti belum aktif (migrasi 0007 belum dijalankan)." };
      return { ok: false, error: "Gagal memuat kosakata inti." };
    }
    if (!candidates || candidates.length === 0) break;

    // Kata yang sudah dimiliki dalam bentuk apa pun ("searched" untuk "search") dilewati dan tidak ditimpa
    const lookup = Array.from(new Set(candidates.flatMap((c) => wordCandidates(c))));
    const { data: owned } = await supabase.from("vocabulary").select("word").eq("user_id", user.id).in("word", lookup);
    const ownedSet = new Set((owned || []).map((o) => String(o.word).toLowerCase()));

    for (const c of candidates) {
      if (picked.length >= BATCH) break;
      if (!isOwned(c, ownedSet)) picked.push({ word: c.word, example: c.example ?? null, definition: c.definition_en ?? "" });
    }
    if (candidates.length < SCAN_PAGE) break;
  }

  if (picked.length === 0) return { ok: true, added: 0 };

  const now = new Date().toISOString();
  const { error } = await supabase.from("vocabulary").upsert(
    picked.map((p) => ({
      user_id: user.id,
      word: p.word,
      definition: p.definition,
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
