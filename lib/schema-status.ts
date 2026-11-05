// Daftar pemeriksaan skema per migrasi (Fase 19.6) untuk kartu "Status skema" di Admin → Ringkasan.
// Hanya memeriksa KEBERADAAN tabel/kolom (select ... limit 0 / head), tidak membaca data pengguna.
// Fungsi murni (tanpa import) agar bisa diuji unit.

export type SchemaProbe = {
  migration: string;
  label: string;
  table: string;
  /** Kolom yang harus ada (dipisah koma). Kosong = cukup tabelnya. */
  columns: string;
  /** Migrasi yang MENGHAPUS kolom: dianggap sudah dijalankan bila kolomnya tidak ada lagi. */
  expectAbsent?: boolean;
  /** Migrasi berisi data awal: dianggap sudah dijalankan bila ada minimal satu baris dengan kolom ini terisi. */
  seedColumn?: string;
};

export const SCHEMA_PROBES: SchemaProbe[] = [
  { migration: "0000", label: "Tabel dasar (profiles)", table: "profiles", columns: "id" },
  { migration: "0001", label: "Log pemakaian AI", table: "ai_usage_logs", columns: "id" },
  { migration: "0003", label: "Registry provider AI", table: "ai_providers", columns: "id" },
  { migration: "0003", label: "Routing fitur AI", table: "ai_feature_routes", columns: "feature_key" },
  { migration: "0003", label: "Kolom used_fallback", table: "ai_usage_logs", columns: "used_fallback" },
  { migration: "0004", label: "Audit log admin", table: "admin_audit_log", columns: "id" },
  { migration: "0004", label: "Harga model", table: "ai_models", columns: "price_in,price_out" },
  { migration: "0005", label: "Posisi baca", table: "reading_sessions", columns: "last_paragraph_index" },
  { migration: "0006", label: "Onboarding", table: "profiles", columns: "learning_goal,daily_minutes,onboarded_at" },
  { migration: "0007", label: "Konten berjenjang", table: "texts", columns: "cefr_level,status,source" },
  { migration: "0007", label: "Kosakata Inti & Grammar", table: "core_words", columns: "id" },
  { migration: "0008", label: "Level per keterampilan", table: "skill_evidence", columns: "id" },
  { migration: "0008", label: "Level profil", table: "profiles", columns: "skill_levels" },
  { migration: "0009", label: "Gamifikasi dihapus", table: "profiles", columns: "xp", expectAbsent: true },
  { migration: "0010", label: "Penerjemahan akademik", table: "translation_projects", columns: "id" },
  { migration: "0012", label: "Mesin latihan", table: "exercises", columns: "id" },
  { migration: "0012", label: "Progres grammar", table: "grammar_progress", columns: "id" },
  { migration: "0013", label: "Unit Kursus Dasar", table: "course_units", columns: "id" },
  { migration: "0013", label: "Progres unit", table: "unit_progress", columns: "id" },
  { migration: "0014", label: "Kesalahan umum penutur Indonesia", table: "l1_errors", columns: "id" },
  { migration: "0014", label: "Pasangan bunyi", table: "minimal_pairs", columns: "id" },
  { migration: "0015", label: "Pengayaan Kosakata Inti", table: "core_words", columns: "definition_en,forms" },
  { migration: "0016", label: "Paket konten Kursus Dasar", table: "exercises", columns: "unit_slug", seedColumn: "unit_slug" },
  { migration: "0019", label: "Penghitung batas pemakaian", table: "rate_limit_counters", columns: "user_id" },
];

/** Migrasi yang tidak bisa dicek dari klien (policy, constraint, fungsi): pemilik memeriksanya manual. */
export const MANUAL_MIGRATIONS: { migration: string; note: string }[] = [
  { migration: "0002", note: "Pengamanan profil (policy/trigger)" },
  { migration: "0011", note: "Hapus akun beruntun (constraint profiles)" },
  { migration: "0017", note: "Hapus pesan (policy direct_messages)" },
];

export type ProbeState = "ok" | "missing" | "error";

type ProbeError = { code?: string; message?: string } | null | undefined;

/** Kode galat tabel/kolom tidak ada: 42P01/PGRST205 (tabel), 42703/PGRST204 (kolom). */
export function isMissingObject(error: ProbeError): boolean {
  if (!error) return false;
  if (["42P01", "42703", "PGRST205", "PGRST204"].includes(error.code ?? "")) return true;
  return /does not exist|could not find the .* (table|column)/i.test(error.message ?? "");
}

export function classifyProbe(probe: SchemaProbe, error: ProbeError, rowCount?: number | null): ProbeState {
  if (probe.expectAbsent) {
    if (!error) return "missing";
    return isMissingObject(error) ? "ok" : "error";
  }
  if (error) return isMissingObject(error) ? "missing" : "error";
  if (probe.seedColumn) return (rowCount ?? 0) > 0 ? "ok" : "missing";
  return "ok";
}

export function summarize(states: ProbeState[]): { ok: number; missing: number; error: number } {
  return {
    ok: states.filter((s) => s === "ok").length,
    missing: states.filter((s) => s === "missing").length,
    error: states.filter((s) => s === "error").length,
  };
}
