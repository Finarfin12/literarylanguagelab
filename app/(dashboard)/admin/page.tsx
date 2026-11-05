import { LayoutDashboard, Activity, AlertTriangle, Users, DollarSign } from "lucide-react";
import { requireAdminPage } from "./_lib/guard";
import { AdminPageHeader, MissingMigrationNotice } from "./_lib/ui";
import { getFeature } from "@/lib/ai/features";
import VocabChart from "@/components/dashboard/VocabChart";
import SchemaStatusCard from "./SchemaStatusCard";

export const dynamic = "force-dynamic";

type LogRow = {
  user_id: string | null;
  feature_key: string | null;
  model_id: string | null;
  provider_id: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  status: string | null;
  created_at: string;
};

type PriceRow = { model_id: string; provider_id: string; price_in: number | null; price_out: number | null };

function getWindows() {
  const now = Date.now();
  return {
    since7d: new Date(now - 7 * 24 * 60 * 60 * 1000),
    since24h: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
  };
}

// Batas baris yang diagregasi di server. Cukup untuk ringkasan 7 hari di skala aplikasi ini.
const MAX_ROWS = 20000;

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdminPage();

  const { since7d, since24h } = getWindows();
  // SHA deployment (Vercel mengisinya saat build/deploy; kosong di lokal)
  const deploySha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  const deployEnv = process.env.VERCEL_ENV;

  const [logsRes, usersRes, pricesRes] = await Promise.all([
    supabase
      .from("ai_usage_logs")
      .select("user_id, feature_key, model_id, provider_id, tokens_in, tokens_out, status, created_at")
      .gte("created_at", since7d.toISOString())
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("ai_models").select("model_id, provider_id, price_in, price_out"),
  ]);

  if (logsRes.error) {
    return (
      <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
        <AdminPageHeader icon={<LayoutDashboard className="w-7 h-7" />} title="Ringkasan" description="Pemakaian AI dan pengguna aktif." />
        <MissingMigrationNotice message={logsRes.error.message} />
      </div>
    );
  }

  const logs = (logsRes.data || []) as LogRow[];
  // Baris 'requested' dicatat checkRateLimit (1 per request pengguna); baris success/error dicatat runAI.
  const requests = logs.filter((l) => l.status === "requested");
  const results = logs.filter((l) => l.status === "success" || l.status === "error");
  const errors = results.filter((l) => l.status === "error");

  const requests24h = requests.filter((l) => l.created_at >= since24h).length;
  const activeUsers7d = new Set(requests.map((l) => l.user_id).filter(Boolean)).size;
  const errorRate = results.length ? Math.round((errors.length / results.length) * 1000) / 10 : 0;

  // Estimasi biaya dari token × harga model (kolom price_* dari migrasi 0004, opsional)
  const prices = new Map<string, PriceRow>();
  if (!pricesRes.error) {
    for (const p of (pricesRes.data || []) as PriceRow[]) prices.set(`${p.provider_id}:${p.model_id}`, p);
  }
  let cost = 0;
  let pricedCalls = 0;
  for (const l of results) {
    const price = prices.get(`${l.provider_id}:${l.model_id}`);
    if (!price || price.price_in === null) continue;
    pricedCalls++;
    cost += ((l.tokens_in || 0) * Number(price.price_in) + (l.tokens_out || 0) * Number(price.price_out || 0)) / 1_000_000;
  }

  const byFeature = new Map<string, { total: number; errors: number }>();
  for (const l of results) {
    const key = l.feature_key || "?";
    const entry = byFeature.get(key) || { total: 0, errors: 0 };
    entry.total++;
    if (l.status === "error") entry.errors++;
    byFeature.set(key, entry);
  }
  const topFeatures = [...byFeature.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 8);

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = d.toISOString().split("T")[0];
    chartData.push({
      date: d.toLocaleDateString("id-ID", { weekday: "short" }),
      count: requests.filter((l) => l.created_at.startsWith(day)).length,
    });
  }

  const cards = [
    { icon: Activity, color: "text-brand-ink", label: "Request AI 24 jam", value: requests24h.toLocaleString("id-ID") },
    { icon: Activity, color: "text-foreground", label: "Request AI 7 hari", value: requests.length.toLocaleString("id-ID") },
    { icon: AlertTriangle, color: errorRate > 5 ? "text-danger" : "text-warning-ink", label: "Error rate 7 hari", value: `${errorRate}%` },
    { icon: Users, color: "text-foreground", label: "Pengguna aktif AI 7 hari", value: `${activeUsers7d} / ${usersRes.count ?? "?"}` },
    {
      icon: DollarSign,
      color: "text-foreground",
      label: pricedCalls ? `Estimasi biaya 7 hari (${pricedCalls} panggilan berharga)` : "Estimasi biaya (isi harga di tab Model)",
      value: `$${cost.toFixed(2)}`,
    },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
      <AdminPageHeader icon={<LayoutDashboard className="w-7 h-7" />} title="Ringkasan" description="Pemakaian AI 7 hari terakhir, error, pengguna aktif, dan estimasi biaya." />
      <p className="text-xs text-muted-foreground -mt-3 mb-4">
        Deployment:{" "}
        {deploySha ? <code>{deploySha}</code> : "tidak diketahui (bukan deployment Vercel)"}
        {deployEnv ? ` · ${deployEnv}` : ""}
      </p>
      <SchemaStatusCard />
      {logs.length >= MAX_ROWS && (
        <p className="text-xs text-muted-foreground mb-4">Menampilkan {MAX_ROWS.toLocaleString("id-ID")} log terbaru; angka 7 hari mungkin lebih kecil dari sebenarnya.</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {cards.map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="bg-card border border-border rounded-card p-4">
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <p className="text-2xl font-serif font-medium text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-card p-4 md:p-6">
          <h2 className="font-bold text-foreground mb-4">Request AI per hari</h2>
          <div className="h-[240px]">
            <VocabChart data={chartData} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-card p-4 md:p-6">
          <h2 className="font-bold text-foreground mb-4">Fitur teratas</h2>
          {topFeatures.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pemakaian AI tercatat.</p>
          ) : (
            <ul className="space-y-3">
              {topFeatures.map(([key, v]) => (
                <li key={key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-foreground">{getFeature(key)?.label || key}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {v.total}
                    {v.errors > 0 && <span className="text-danger"> · {v.errors} error</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
