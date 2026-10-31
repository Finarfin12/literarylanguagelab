// Tipe dan konstanta tab admin "Konten" (file biasa, bukan "use server").
import type { CefrLevel } from "@/lib/cefr";

export interface AdminTextRow {
  id: string;
  title: string;
  author: string;
  cefr_level: CefrLevel | null;
  status: "draft" | "published";
  source: string | null;
  word_count: number | null;
  created_at: string;
}

export interface GrammarTopicRow {
  slug: string;
  title: string;
  cefr_level: string;
  sort_order: number;
  summary_id: string;
}

export const TEXT_LENGTHS = {
  pendek: { label: "Pendek (±150 kata)", words: 150 },
  sedang: { label: "Sedang (±300 kata)", words: 300 },
  panjang: { label: "Panjang (±500 kata)", words: 500 },
} as const;
export type TextLength = keyof typeof TEXT_LENGTHS;

/** Kode error Postgres/PostgREST untuk kolom/tabel yang belum ada (migrasi belum dijalankan). */
export const MISSING_SCHEMA_CODES = ["42703", "PGRST204", "42P01", "PGRST205"];
