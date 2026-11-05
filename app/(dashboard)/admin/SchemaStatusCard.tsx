import { Database } from "lucide-react";
import { getServiceClient } from "@/lib/ai/admin-client";
import { SCHEMA_PROBES, MANUAL_MIGRATIONS, classifyProbe, summarize, type ProbeState } from "@/lib/schema-status";

const STATE_LABEL: Record<ProbeState, string> = { ok: "Ada", missing: "Belum", error: "Tak terbaca" };
const STATE_CLASS: Record<ProbeState, string> = {
  ok: "bg-brand-tint text-brand-ink",
  missing: "bg-warning-tint text-warning-ink",
  error: "bg-danger-tint text-danger",
};

/** Kartu Status skema (Fase 19.6): memeriksa keberadaan tabel/kolom kunci tiap migrasi, tanpa membaca data pengguna. */
export default async function SchemaStatusCard() {
  const service = getServiceClient();
  if (!service) {
    return (
      <section className="bg-card border border-border rounded-card p-4 md:p-6 mb-6">
        <h2 className="font-bold text-foreground mb-2 flex items-center gap-2"><Database className="w-4 h-4" aria-hidden="true" /> Status skema</h2>
        <p className="text-sm text-muted-foreground">
          <code>SUPABASE_SERVICE_ROLE_KEY</code> belum diisi, jadi skema tidak bisa diperiksa dari sini.
        </p>
      </section>
    );
  }

  const results = await Promise.all(
    SCHEMA_PROBES.map(async (probe) => {
      try {
        let query = service.from(probe.table).select(probe.columns, { count: "exact", head: true });
        if (probe.seedColumn) query = query.not(probe.seedColumn, "is", null);
        const { error, count } = await query;
        return { probe, state: classifyProbe(probe, error, count) };
      } catch {
        return { probe, state: "error" as ProbeState };
      }
    })
  );

  const sum = summarize(results.map((r) => r.state));
  const pending = [...new Set(results.filter((r) => r.state !== "ok").map((r) => r.probe.migration))].sort();

  return (
    <section className="bg-card border border-border rounded-card p-4 md:p-6 mb-6">
      <h2 className="font-bold text-foreground mb-1 flex items-center gap-2"><Database className="w-4 h-4" aria-hidden="true" /> Status skema</h2>
      <p className="text-sm text-muted-foreground">
        {sum.ok} dari {results.length} pemeriksaan terpenuhi.{" "}
        {pending.length > 0
          ? <>Migrasi yang perlu dijalankan atau dicek: <strong className="text-foreground">{pending.join(", ")}</strong>.</>
          : "Semua migrasi yang bisa diperiksa sudah dijalankan."}
      </p>
      <details className="mt-3">
        <summary className="cursor-pointer min-h-[44px] flex items-center text-sm font-semibold text-brand-ink">Lihat rincian</summary>
        <ul className="divide-y divide-border text-sm">
          {results.map(({ probe, state }, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 text-foreground">
                <span className="font-mono text-xs text-muted-foreground mr-2">{probe.migration}</span>
                {probe.label}
              </span>
              <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full ${STATE_CLASS[state]}`}>{STATE_LABEL[state]}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          Dicek manual oleh pemilik: {MANUAL_MIGRATIONS.map((m) => `${m.migration} (${m.note})`).join("; ")}. Migrasi 0018 (RLS) menunggu tinjauan policy.
        </p>
      </details>
    </section>
  );
}
