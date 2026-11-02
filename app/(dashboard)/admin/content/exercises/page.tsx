import Link from "next/link";
import { Library } from "lucide-react";
import { requireAdminPage } from "../../_lib/guard";
import { AdminPageHeader, MigrationNotice } from "../../_lib/ui";
import { CEFR_LEVELS, isCefrLevel } from "@/lib/cefr";
import { EXERCISE_TYPES } from "@/lib/exercises/types";
import { MISSING_SCHEMA_CODES } from "../../_lib/content-types";
import type { AdminExerciseRow } from "../../_lib/exercise-templates";
import ContentSubnav from "../ContentSubnav";
import ExerciseManager from "./ExerciseManager";

export const dynamic = "force-dynamic";

const PAGE_LIMIT = 100;

export default async function AdminExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; level?: string; status?: string; topic?: string; unit?: string }>;
}) {
  const { supabase } = await requireAdminPage();
  const params = await searchParams;
  const type = (EXERCISE_TYPES as readonly string[]).includes(params.type ?? "") ? params.type! : "";
  const level = isCefrLevel(params.level) ? params.level : "";
  const status = params.status === "draft" || params.status === "published" ? params.status : "";
  const topic = /^[a-z0-9-]{2,64}$/.test(params.topic ?? "") ? params.topic! : "";
  const unit = /^[a-z0-9-]{2,64}$/.test(params.unit ?? "") ? params.unit! : "";

  let q = supabase
    .from("exercises")
    .select("id, type, cefr_level, topic_slug, unit_slug, tags, prompt, answer, explanation_id, status, source")
    .order("created_at", { ascending: false })
    .limit(PAGE_LIMIT);
  if (type) q = q.eq("type", type);
  if (level) q = q.eq("cefr_level", level);
  if (status) q = q.eq("status", status);
  if (topic) q = q.eq("topic_slug", topic);
  if (unit) q = q.eq("unit_slug", unit);

  const [res, topicsRes, unitsRes] = await Promise.all([
    q,
    supabase.from("grammar_topics").select("slug, title").order("sort_order"),
    // Tabel course_units dari migrasi 0013; error (belum ada) diabaikan
    supabase.from("course_units").select("slug, title").order("sort_order"),
  ]);
  const missing = !!res.error && !!res.error.code && MISSING_SCHEMA_CODES.includes(res.error.code);
  const rows = (res.error ? [] : res.data || []) as AdminExerciseRow[];
  const topics = (topicsRes.data || []) as { slug: string; title: string }[];
  const units = (unitsRes.error ? [] : unitsRes.data || []) as { slug: string; title: string }[];

  const filterHref = (next: Partial<Record<"type" | "level" | "status" | "topic" | "unit", string>>) => {
    const merged = { type, level, status, topic, unit, ...next };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const qs = sp.toString();
    return `/admin/content/exercises${qs ? `?${qs}` : ""}`;
  };
  const chip = (active: boolean) =>
    `inline-flex items-center min-h-[44px] px-4 rounded-full text-sm font-bold border ${active ? "bg-brand-solid text-on-brand border-brand" : "bg-card text-muted-foreground border-border hover:bg-muted"}`;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
      <AdminPageHeader
        icon={<Library className="w-7 h-7" />}
        title="Konten: Latihan"
        description="Buat soal (dengan AI atau dari Kosakata Inti), tinjau drafnya, lalu terbitkan. Soal terbit muncul di halaman topik Grammar Dasar."
      />
      <ContentSubnav />

      {missing && <MigrationNotice file="0012_exercises.sql" message={res.error?.message} />}
      {res.error && !missing && <p className="text-danger mb-4">Gagal memuat soal: {res.error.message}</p>}

      <div className="flex flex-wrap items-center gap-2 mb-6" aria-label="Filter soal">
        <Link href={filterHref({ type: "" })} className={chip(!type)}>Semua tipe</Link>
        {EXERCISE_TYPES.map((t) => (
          <Link key={t} href={filterHref({ type: t })} className={chip(type === t)}>{t}</Link>
        ))}
        <span className="w-px h-6 bg-border mx-1" />
        <Link href={filterHref({ level: "" })} className={chip(!level)}>Semua level</Link>
        {CEFR_LEVELS.slice(0, 4).map((l) => (
          <Link key={l} href={filterHref({ level: l })} className={chip(level === l)}>{l}</Link>
        ))}
        <span className="w-px h-6 bg-border mx-1" />
        <Link href={filterHref({ status: "" })} className={chip(!status)}>Semua status</Link>
        <Link href={filterHref({ status: "draft" })} className={chip(status === "draft")}>Draft</Link>
        <Link href={filterHref({ status: "published" })} className={chip(status === "published")}>Terbit</Link>
      </div>

      <ExerciseManager rows={rows} topics={topics} units={units} schemaReady={!missing} activeTopic={topic} />
      {rows.length >= PAGE_LIMIT && <p className="text-xs text-muted-foreground mt-4">Menampilkan {PAGE_LIMIT} soal terbaru. Gunakan filter untuk mempersempit.</p>}
    </div>
  );
}
