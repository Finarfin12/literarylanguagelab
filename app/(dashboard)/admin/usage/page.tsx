import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { requireAdminPage } from "../_lib/guard";
import { AdminPageHeader, MissingMigrationNotice, inputClass, buttonClass } from "../_lib/ui";
import { DEFAULT_RATE_LIMIT, RATE_LIMIT_LABELS, RATE_LIMIT_USE_CASES } from "../_lib/constants";
import { AI_FEATURES, getFeature } from "@/lib/ai/features";
import { getServiceClient } from "@/lib/ai/admin-client";
import QuotaForm from "./QuotaForm";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const STATUSES = ["success", "error", "requested"];

type LogRow = {
  id: number;
  user_id: string | null;
  feature_key: string | null;
  model_id: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  latency_ms: number | null;
  status: string | null;
  error: string | null;
  used_fallback?: boolean | null;
  created_at: string;
};

export default async function AdminUsagePage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string; status?: string; model?: string; user?: string; page?: string }>;
}) {
  const { supabase } = await requireAdminPage();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  let query = supabase
    .from("ai_usage_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (params.feature) query = query.eq("feature_key", params.feature);
  if (params.status && STATUSES.includes(params.status)) query = query.eq("status", params.status);
  const modelFilter = (params.model || "").replace(/[^\w./:-]/g, "");
  if (modelFilter) query = query.ilike("model_id", `%${modelFilter}%`);
  if (params.user && /^[0-9a-f-]{36}$/i.test(params.user)) query = query.eq("user_id", params.user);

  const { data, count, error } = await query;
  const logs = (data || []) as LogRow[];

  // Nama pengguna untuk log di halaman ini
  const userIds = [...new Set(logs.map((l) => l.user_id).filter((v): v is string => !!v))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, username").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null; username: string | null }[] };
  const names = new Map((profiles || []).map((p) => [p.id, p.full_name || p.username || p.id.slice(0, 8)]));

  // Kuota saat ini (system_config.rate_limits)
  const service = getServiceClient();
  const { data: limitsRow } = service
    ? await service.from("system_config").select("value").eq("key", "rate_limits").maybeSingle()
    : { data: null };
  const stored = (limitsRow?.value || {}) as Record<string, { requests_per_minute?: number; requests_per_hour?: number }>;
  const limits = RATE_LIMIT_USE_CASES.map((key) => ({
    key,
    label: RATE_LIMIT_LABELS[key],
    perMinute: stored[key]?.requests_per_minute ?? DEFAULT_RATE_LIMIT.requests_per_minute,
    perHour: stored[key]?.requests_per_hour ?? DEFAULT_RATE_LIMIT.requests_per_hour,
  }));

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
  const pageLink = (p: number) => {
    const sp = new URLSearchParams(Object.entries(params).filter(([k, v]) => k !== "page" && v) as [string, string][]);
    sp.set("page", String(p));
    return `/admin/usage?${sp.toString()}`;
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
      <AdminPageHeader
        icon={<BarChart3 className="w-7 h-7" />}
        title="Pemakaian & Kuota"
        description="Log setiap request AI dan batas pemakaian per pengguna."
      />

      <QuotaForm limits={limits} canSave={!!service} />

      <h2 className="font-bold text-foreground mt-8 mb-3">Log request AI</h2>
      <form method="get" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto] gap-3 mb-4">
        <select name="feature" defaultValue={params.feature || ""} className={inputClass} aria-label="Filter fitur">
          <option value="">Semua fitur</option>
          {AI_FEATURES.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={params.status || ""} className={inputClass} aria-label="Filter status">
          <option value="">Semua status</option>
          <option value="success">Sukses</option>
          <option value="error">Error</option>
          <option value="requested">Request (rate limit)</option>
        </select>
        <input name="model" defaultValue={params.model || ""} placeholder="Model, mis. qwen" className={inputClass} aria-label="Filter model" />
        {params.user && <input type="hidden" name="user" value={params.user} />}
        <div className="flex gap-2">
          <button type="submit" className={`${buttonClass} bg-brand text-background flex-1`}>Filter</button>
          <Link href="/admin/usage" className={`${buttonClass} bg-muted text-foreground`}>Reset</Link>
        </div>
      </form>
      {params.user && (
        <p className="text-sm text-muted-foreground mb-3">
          Hanya pengguna <b>{names.get(params.user) || params.user}</b>.{" "}
          <Link className="text-brand font-bold" href="/admin/usage">Tampilkan semua</Link>
        </p>
      )}

      {error ? (
        <MissingMigrationNotice message={error.message} />
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground bg-card border border-border rounded-2xl p-6 text-center">Tidak ada log yang cocok.</p>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <ul className="divide-y divide-border">
            {logs.map((l) => (
              <li key={l.id} className="p-3 md:p-4 grid grid-cols-1 md:grid-cols-[1.4fr_1.2fr_1fr_0.8fr] gap-1 md:gap-3 md:items-center text-sm">
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">{getFeature(l.feature_key || "")?.label || l.feature_key || "-"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("id-ID")}</p>
                </div>
                <div className="min-w-0 text-xs md:text-sm">
                  {l.user_id ? (
                    <Link href={`/admin/usage?user=${l.user_id}`} className="text-foreground hover:text-brand truncate block">
                      {names.get(l.user_id) || l.user_id.slice(0, 8)}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                  <p className="text-muted-foreground truncate">{l.model_id || ""}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {l.tokens_in != null && `${l.tokens_in} → ${l.tokens_out ?? 0} token`}
                  {l.latency_ms != null && <span className="block">{l.latency_ms} ms</span>}
                </div>
                <div className="text-xs">
                  <span
                    className={`inline-block font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      l.status === "error" ? "bg-danger-tint text-danger" : l.status === "success" ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {l.status}
                  </span>
                  {l.used_fallback && <span className="ml-1 text-warning-ink">cadangan</span>}
                  {l.error && <p className="text-danger mt-1 break-words">{l.error}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          {page > 1 ? <Link href={pageLink(page - 1)} className={`${buttonClass} bg-muted text-foreground`}>Sebelumnya</Link> : <span />}
          <span className="text-muted-foreground">Halaman {page} / {totalPages}</span>
          {page < totalPages ? <Link href={pageLink(page + 1)} className={`${buttonClass} bg-muted text-foreground`}>Berikutnya</Link> : <span />}
        </div>
      )}
    </div>
  );
}
