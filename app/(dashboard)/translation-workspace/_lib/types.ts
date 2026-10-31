// Tipe bersama Ruang Kerja Segmen (file biasa, bukan "use server").

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

export interface WorkspaceProject {
  id: string;
  title: string;
  brief: string | null;
}

export interface WorkspaceSegment {
  id: string;
  idx: number;
  source: string;
  target: string | null;
  status: "draft" | "done";
  comment: string | null;
}

export interface WorkspaceAnnotation {
  id: string;
  segment_id: string;
  source_span: string;
  target_span: string;
  technique_key: string;
  suggested_by_ai: boolean;
}

export interface WorkspaceTechnique {
  key: string;
  name_id: string;
  name_en: string;
  definition_id: string;
  example: string | null;
}

export interface WorkspaceGlossaryEntry {
  term: string;
  preferred: string;
}

export interface WorkspaceTmEntry {
  source: string;
  target: string;
}

export interface WorkspaceAssessment {
  id: string;
  weighted_score: number;
  created_at: string;
  per_segment: { idx: number; accuracy: number; acceptability: number; readability: number; notes?: string }[];
}

export const MAX_SOURCE_CHARS = 50000;
export const MAX_SEGMENTS = 500;

/** Kode error untuk tabel/kolom yang belum ada (migrasi belum dijalankan). */
export const MISSING_SCHEMA_CODES = ["42703", "PGRST204", "42P01", "PGRST205"];
