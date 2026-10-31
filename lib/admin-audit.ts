// lib/admin-audit.ts
// Mencatat setiap aksi admin ke admin_audit_log (dibaca di tab Admin → Audit Log).
// Ditulis dengan service role; kegagalan pencatatan tidak boleh menggagalkan aksi admin.

import { getServiceClient } from "@/lib/ai/admin-client";

// Kolom yang tidak boleh ikut tercatat
const SECRET_KEYS = ["api_key", "api_key_encrypted", "password", "headers_encrypted"];

function scrub(value: unknown): unknown {
  if (!value || typeof value !== "object") return value ?? null;
  if (Array.isArray(value)) return value.map(scrub);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, SECRET_KEYS.includes(k) ? "[disembunyikan]" : scrub(v)])
  );
}

export async function logAdminAction(entry: {
  actorId: string;
  action: string;
  target?: string | null;
  before?: unknown;
  after?: unknown;
}) {
  const supabase = getServiceClient();
  if (!supabase) return;
  try {
    await supabase.from("admin_audit_log").insert({
      actor_id: entry.actorId,
      action: entry.action,
      target: entry.target ?? null,
      before: scrub(entry.before),
      after: scrub(entry.after),
    });
  } catch {
    // Tabel belum ada (migrasi 0004 belum dijalankan) atau jaringan gagal
  }
}
