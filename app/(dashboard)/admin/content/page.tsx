import Link from "next/link";
import { Library } from "lucide-react";
import { requireAdminPage } from "../_lib/guard";
import { AdminPageHeader, MigrationNotice, Notice } from "../_lib/ui";
import { CEFR_LEVELS, isCefrLevel } from "@/lib/cefr";
import { MISSING_SCHEMA_CODES, type AdminTextRow, type GrammarTopicRow } from "../_lib/content-types";
import ContentManager, { type EditableText } from "./ContentManager";

export const dynamic = "force-dynamic";

const PAGE_LIMIT = 100;

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; status?: string }>;
}) {
  const { supabase } = await requireAdminPage();
  const params = await searchParams;
  const level = isCefrLevel(params.level) ? params.level : params.level === "none" ? "none" : "";
  const status = params.status === "draft" || params.status === "published" ? params.status : "";

  // Teks. Jika kolom baru belum ada (migrasi 0007), tampilkan daftar dasar + pemberitahuan.
  let textsMissing: string | null = null;
  let q = supabase
    .from("texts")
    .select("id, title, author, cefr_level, status, source, word_count, created_at, content")
    .order("created_at", { ascending: false })
    .limit(PAGE_LIMIT);
  if (level === "none") q = q.is("cefr_level", null);
  else if (level) q = q.eq("cefr_level", level);
  if (status) q = q.eq("status", status);
  const textsRes = await q;

  let rows: (AdminTextRow & { content: string })[] = [];
  if (textsRes.error) {
    if (textsRes.error.code && MISSING_SCHEMA_CODES.includes(textsRes.error.code)) {
      textsMissing = textsRes.error.message;
      const basic = await supabase
        .from("texts")
        .select("id, title, author, word_count, created_at, content")
        .order("created_at", { ascending: false })
        .limit(PAGE_LIMIT);
      rows = (basic.data || []).map((t) => ({ ...t, cefr_level: null, status: "published" as const, source: null }));
    } else {
      return (
        <div className="p-4 md:p-8 text-center text-danger">
          <p>Gagal memuat teks: {textsRes.error.message}</p>
        </div>
      );
    }
  } else {
    rows = (textsRes.data || []) as (AdminTextRow & { content: string })[];
  }

  // Topik grammar & jumlah kosakata inti
  const [topicsRes, coreRes, coreDefRes] = await Promise.all([
    supabase.from("grammar_topics").select("slug, title, cefr_level, sort_order, summary_id").order("sort_order"),
    supabase.from("core_words").select("*", { count: "exact", head: true }),
    // Kolom definition_en dari migrasi 0015: error jika belum ada → jumlah definisi tidak ditampilkan
    supabase.from("core_words").select("*", { count: "exact", head: true }).not("definition_en", "is", null),
  ]);
  const topicsMissing = topicsRes.error?.message ?? null;
  const topics = (topicsRes.data || []) as GrammarTopicRow[];
  const coreCount = coreRes.error ? null : coreRes.count ?? 0;
  const coreWithDefinition = coreDefRes.error ? null : coreDefRes.count ?? 0;

  const texts: EditableText[] = rows.map((t) => ({
    id: t.id,
    title: t.title,
    author: t.author,
    cefr_level: t.cefr_level,
    status: t.status,
    source: t.source,
    word_count: t.word_count,
    // Isi hanya dikirim ke klien untuk draft (dipakai editor)
    content: t.status === "draft" ? t.content : null,
  }));

  const filterHref = (next: { level?: string; status?: string }) => {
    const sp = new URLSearchParams();
    const l = next.level ?? level;
    const s = next.status ?? status;
    if (l) sp.set("level", l);
    if (s) sp.set("status", s);
    const qs = sp.toString();
    return `/admin/content${qs ? `?${qs}` : ""}`;
  };
  const chip = (active: boolean) =>
    `inline-flex items-center min-h-[44px] px-4 rounded-full text-sm font-bold border ${active ? "bg-brand-solid text-on-brand border-brand" : "bg-card text-muted-foreground border-border hover:bg-muted"}`;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
      <AdminPageHeader
        icon={<Library className="w-7 h-7" />}
        title="Konten"
        description="Tandai level teks, buat teks berjenjang dengan AI, dan kelola topik grammar dasar."
      />

      {textsMissing && <MigrationNotice file="0007_graded_content.sql" message={textsMissing} />}
      {topicsMissing && !textsMissing && <MigrationNotice file="0007_graded_content.sql" message={topicsMissing} />}
      {coreCount === 0 && (
        <Notice>
          Tabel <code>core_words</code> masih kosong. Jalankan <code>node scripts/import-ngsl.mjs path/ke/NGSL.csv</code> (lihat komentar di skripnya).
        </Notice>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6" aria-label="Filter teks">
        <Link href={filterHref({ level: "" })} className={chip(!level)}>Semua level</Link>
        {CEFR_LEVELS.map((l) => (
          <Link key={l} href={filterHref({ level: l })} className={chip(level === l)}>{l}</Link>
        ))}
        <Link href={filterHref({ level: "none" })} className={chip(level === "none")}>Belum dinilai</Link>
        <span className="w-px h-6 bg-border mx-1" />
        <Link href={filterHref({ status: "" })} className={chip(!status)}>Semua status</Link>
        <Link href={filterHref({ status: "draft" })} className={chip(status === "draft")}>Draft</Link>
        <Link href={filterHref({ status: "published" })} className={chip(status === "published")}>Terbit</Link>
      </div>

      <ContentManager texts={texts} topics={topics} coreCount={coreCount} coreWithDefinition={coreWithDefinition} schemaReady={!textsMissing && !topicsMissing} />
      {rows.length >= PAGE_LIMIT && (
        <p className="text-xs text-muted-foreground mt-4">Menampilkan {PAGE_LIMIT} teks terbaru. Gunakan filter untuk mempersempit.</p>
      )}
    </div>
  );
}
