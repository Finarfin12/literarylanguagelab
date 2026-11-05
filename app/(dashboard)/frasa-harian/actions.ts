"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { phraseToVocabulary } from "@/lib/phrases";

export type SavePhraseResult = { ok: true; added: boolean } | { ok: false; error: string };

const SLUG = /^[a-z0-9-]{2,80}$/;

/**
 * Simpan satu frasa harian ke Vocabulary Bank (Review). Frasa diambil dari database, bukan dari klien.
 * Frasa yang sudah dimiliki dilewati dan tidak ditimpa. Tanpa AI.
 */
export async function savePhraseToReview(slug: string): Promise<SavePhraseResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan masuk terlebih dahulu." };
  if (typeof slug !== "string" || !SLUG.test(slug)) return { ok: false, error: "Frasa tidak valid." };

  const { data: phrase, error: phraseError } = await supabase.from("daily_phrases").select("text_en, text_id").eq("slug", slug).maybeSingle();
  if (phraseError || !phrase) return { ok: false, error: "Frasa tidak ditemukan." };

  const entry = phraseToVocabulary(phrase);
  const { data: owned, error: ownedError } = await supabase.from("vocabulary").select("word").eq("user_id", user.id).eq("word", entry.word);
  if (ownedError) return { ok: false, error: "Gagal memeriksa Vocabulary Bank. Coba lagi." };
  if ((owned ?? []).length > 0) return { ok: true, added: false };

  const { error } = await supabase.from("vocabulary").upsert(
    {
      user_id: user.id,
      word: entry.word,
      definition: entry.definition,
      context_sentence: null,
      context_source: "Frasa harian",
      mastery_level: 0,
      next_review_at: new Date().toISOString(),
      interval: 0,
      repetition_count: 0,
      efactor: 2.5,
      is_collocation: true,
    },
    { onConflict: "user_id,word", ignoreDuplicates: true }
  );
  if (error) return { ok: false, error: "Gagal menyimpan ke Vocabulary Bank. Coba lagi." };

  revalidatePath("/vocabulary");
  revalidatePath("/review");
  return { ok: true, added: true };
}
