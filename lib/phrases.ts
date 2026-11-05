// Frasa harian (Fase 22.4): bentuk data, daftar situasi, validasi, dan pengelompokan. Fungsi murni tanpa impor
// agar bisa diuji unit (tests/phrases.test.mts). Tabel `daily_phrases` dibuat migrasi 0021.

export const PHRASE_SITUATIONS = [
  { id: "salam", label: "Salam & perkenalan" },
  { id: "angka-waktu", label: "Angka & waktu" },
  { id: "sopan-bantuan", label: "Sopan & minta bantuan" },
  { id: "belanja-makan", label: "Belanja & makan" },
  { id: "arah", label: "Arah & tempat" },
  { id: "darurat", label: "Darurat" },
] as const;

export type PhraseSituation = (typeof PHRASE_SITUATIONS)[number]["id"];

export interface DailyPhrase {
  slug: string;
  situation: string;
  text_en: string;
  /** Arti natural bahasa Indonesia. */
  text_id: string;
  /** Arti kata per kata ("Bagaimana · adalah · kamu"); boleh kosong. */
  literal_id: string | null;
  sort_order: number;
  status: "draft" | "published";
}

export function situationLabel(id: string): string {
  return PHRASE_SITUATIONS.find((s) => s.id === id)?.label ?? id;
}

export function isSituation(v: unknown): v is PhraseSituation {
  return typeof v === "string" && PHRASE_SITUATIONS.some((s) => s.id === v);
}

const SLUG = /^[a-z0-9-]{2,80}$/;

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.length <= max ? t : null;
};

export type PhraseDraft = Omit<DailyPhrase, "status">;

/** Merapikan masukan admin; error berbahasa Indonesia. */
export function cleanPhrase(raw: unknown): { ok: true; value: PhraseDraft } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "Frasa harus berupa objek." };
  const r = raw as Record<string, unknown>;
  const slug = typeof r.slug === "string" ? r.slug.trim().toLowerCase() : "";
  if (!SLUG.test(slug)) return { ok: false, error: "Slug hanya huruf kecil, angka, dan tanda hubung (2-80 karakter)." };
  if (!isSituation(r.situation)) return { ok: false, error: "Situasi tidak dikenal." };
  const en = str(r.text_en, 160);
  if (!en) return { ok: false, error: "Frasa Inggris wajib (maks. 160 karakter)." };
  const id = str(r.text_id, 240);
  if (!id) return { ok: false, error: "Arti Indonesia wajib (maks. 240 karakter)." };
  const literal = r.literal_id === undefined || r.literal_id === null || r.literal_id === "" ? null : str(r.literal_id, 240);
  if (r.literal_id && literal === null) return { ok: false, error: "Arti kata per kata maksimal 240 karakter." };
  const order = Number(r.sort_order ?? 0);
  if (!Number.isInteger(order) || order < 0 || order > 10000) return { ok: false, error: "Urutan harus bilangan bulat 0-10000." };
  return { ok: true, value: { slug, situation: r.situation, text_en: en, text_id: id, literal_id: literal, sort_order: order } };
}

/** Kelompok per situasi dengan urutan situasi tetap, lalu sort_order; situasi kosong dibuang. */
export function groupPhrases<T extends { situation: string; sort_order: number }>(rows: readonly T[]): { id: string; label: string; phrases: T[] }[] {
  const known: string[] = PHRASE_SITUATIONS.map((s) => s.id);
  const extra = Array.from(new Set(rows.map((r) => r.situation).filter((s) => !known.includes(s))));
  return [...known, ...extra]
    .map((id) => ({ id, label: situationLabel(id), phrases: rows.filter((r) => r.situation === id).sort((a, b) => a.sort_order - b.sort_order) }))
    .filter((g) => g.phrases.length > 0);
}

/** Entri Vocabulary Bank untuk satu frasa (kata = frasa Inggris, arti = arti natural). */
export function phraseToVocabulary(p: Pick<DailyPhrase, "text_en" | "text_id">): { word: string; definition: string } {
  return { word: p.text_en.replace(/\s+/g, " ").trim(), definition: p.text_id.trim() };
}
