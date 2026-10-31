import Link from "next/link";
import { ScrollText } from "lucide-react";
import { requireAdminPage } from "../_lib/guard";
import { AdminPageHeader, MissingMigrationNotice, buttonClass } from "../_lib/ui";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const CATEGORIES = [
  { value: "", label: "Semua" },
  { value: "user", label: "Pengguna" },
  { value: "provider", label: "Provider" },
  { value: "model", label: "Model" },
  { value: "route", label: "Routing" },
  { value: "feature", label: "Fitur" },
  { value: "quota", label: "Kuota" },
];

const ACTION_LABELS: Record<string, string> = {
  "user.role": "Mengubah role pengguna",
  "user.ban": "Mem-ban pengguna",
  "user.unban": "Membuka ban pengguna",
  "user.delete": "Menghapus akun pengguna",
  "provider.create": "Menambah provider",
  "provider.update": "Mengubah provider",
  "provider.delete": "Menghapus provider",
  "model.create": "Menambah model",
  "model.update": "Mengubah model",
  "model.import": "Mengimpor model dari provider",
  "model.delete": "Menghapus model",
  "route.update": "Mengubah routing fitur",
  "feature.toggle": "Mengubah status fitur",
  "quota.update": "Mengubah kuota",
};

type AuditRow = {
  id: number;
  actor_id: string | null;
  action: string;
  target: string | null;
  before: unknown;
  after: unknown;
  created_at: string;
};

function Json({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>;
  return <pre className="text-[11px] leading-snug whitespace-pre-wrap break-all bg-muted/50 rounded-lg p-2 max-h-48 overflow-auto">{JSON.stringify(value, null, 2)}</pre>;
}

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const { supabase } = await requireAdminPage();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const category = CATEGORIES.some((c) => c.value === params.category) ? params.category || "" : "";

  let query = supabase
    .from("admin_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (category) query = query.like("action", `${category}.%`);
  const { data, count, error } = await query;
  const rows = (data || []) as AuditRow[];

  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((v): v is string => !!v))];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name, username").in("id", actorIds)
    : { data: [] as { id: string; full_name: string | null; username: string | null }[] };
  const names = new Map((actors || []).map((a) => [a.id, a.full_name || a.username || a.id.slice(0, 8)]));
  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
      <AdminPageHeader icon={<ScrollText className="w-7 h-7" />} title="Audit Log" description="Riwayat semua perubahan yang dilakukan admin." />

      <div className="flex gap-2 overflow-x-auto scrollbar-none mb-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={c.value ? `/admin/audit?category=${c.value}` : "/admin/audit"}
            className={`${buttonClass} whitespace-nowrap ${category === c.value ? "bg-brand text-background" : "bg-muted text-foreground"}`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {error ? (
        <MissingMigrationNotice message={`${error.message} (tabel admin_audit_log ada di migrasi 0004)`} />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground bg-card border border-border rounded-2xl p-6 text-center">Belum ada aksi admin yang tercatat.</p>
      ) : (
        <ul className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {rows.map((r) => (
            <li key={r.id}>
              <details className="group">
                <summary className="p-4 min-h-[56px] cursor-pointer list-none flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 hover:bg-muted/40">
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-foreground">{ACTION_LABELS[r.action] || r.action}</span>
                    <span className="block text-xs text-muted-foreground truncate">
                      oleh {r.actor_id ? names.get(r.actor_id) || r.actor_id.slice(0, 8) : "?"}
                      {r.target && ` · ${r.target}`}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(r.created_at).toLocaleString("id-ID")}</span>
                </summary>
                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1">Sebelum</p>
                    <Json value={r.before} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1">Sesudah</p>
                    <Json value={r.after} />
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          {page > 1 ? (
            <Link href={`/admin/audit?${category ? `category=${category}&` : ""}page=${page - 1}`} className={`${buttonClass} bg-muted text-foreground`}>Sebelumnya</Link>
          ) : <span />}
          <span className="text-muted-foreground">Halaman {page} / {totalPages}</span>
          {page < totalPages ? (
            <Link href={`/admin/audit?${category ? `category=${category}&` : ""}page=${page + 1}`} className={`${buttonClass} bg-muted text-foreground`}>Berikutnya</Link>
          ) : <span />}
        </div>
      )}
    </div>
  );
}
