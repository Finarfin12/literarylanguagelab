import Link from "next/link";
import { Library } from "lucide-react";
import { requireAdminPage } from "../../_lib/guard";
import { AdminPageHeader, MigrationNotice, Notice } from "../../_lib/ui";
import { MISSING_SCHEMA_CODES } from "../../_lib/content-types";
import { getFeatureFlags } from "@/lib/ai/flags";
import { COURSE_FLAG } from "@/lib/course-access";
import ContentSubnav from "../ContentSubnav";
import CourseManager, { type AdminUnit } from "./CourseManager";

export const dynamic = "force-dynamic";

export default async function AdminCoursePage() {
  const { supabase } = await requireAdminPage();

  const [unitsRes, topicsRes, textsRes, exercisesRes, flags] = await Promise.all([
    supabase.from("course_units").select("slug, title, cefr_level, sort_order, theme_id, intro_id, steps, status").order("sort_order"),
    supabase.from("grammar_topics").select("slug, title").order("sort_order"),
    supabase.from("texts").select("id, title, cefr_level").eq("is_public", true).order("created_at", { ascending: false }).limit(200),
    // Hitung soal per unit (tabel exercises dari migrasi 0012; error diabaikan)
    supabase.from("exercises").select("unit_slug, status").not("unit_slug", "is", null).limit(5000),
    getFeatureFlags(),
  ]);

  const missing = !!unitsRes.error && !!unitsRes.error.code && MISSING_SCHEMA_CODES.includes(unitsRes.error.code);
  const counts = new Map<string, { published: number; draft: number }>();
  for (const r of (exercisesRes.error ? [] : exercisesRes.data || []) as { unit_slug: string; status: string }[]) {
    const c = counts.get(r.unit_slug) ?? { published: 0, draft: 0 };
    if (r.status === "published") c.published++;
    else c.draft++;
    counts.set(r.unit_slug, c);
  }

  const units: AdminUnit[] = ((unitsRes.error ? [] : unitsRes.data || []) as Omit<AdminUnit, "exercises_published" | "exercises_draft">[]).map((u) => ({
    ...u,
    exercises_published: counts.get(u.slug)?.published ?? 0,
    exercises_draft: counts.get(u.slug)?.draft ?? 0,
  }));
  const flagOn = flags[COURSE_FLAG] === true;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
      <AdminPageHeader
        icon={<Library className="w-7 h-7" />}
        title="Konten: Kursus"
        description="Kelola unit Kursus Dasar dan langkahnya: pilih kata, topik grammar, bacaan, teks dengar, soal latihan, dan kalimat bicara."
      />
      <ContentSubnav />

      {missing && <MigrationNotice file="0013_course_units.sql" message={unitsRes.error?.message} />}
      {unitsRes.error && !missing && <p className="text-danger mb-4">Gagal memuat unit: {unitsRes.error.message}</p>}
      {!missing && (
        <Notice tone="warning">
          Kursus Dasar {flagOn ? "sedang DINYALAKAN untuk semua pengguna" : "masih tersembunyi dari pengguna biasa (hanya admin yang melihat)"}.
          {" "}Ubah di <Link href="/admin/features" className="font-bold underline">Admin → Fitur</Link> (flag <code>kursus_dasar</code>, grup &ldquo;Lainnya (non-AI)&rdquo;).
          Nyalakan setelah minimal unit 0–5 lengkap.
        </Notice>
      )}

      <CourseManager
        units={units}
        topics={(topicsRes.data || []) as { slug: string; title: string }[]}
        texts={(textsRes.error ? [] : textsRes.data || []) as { id: string; title: string; cefr_level: string | null }[]}
        schemaReady={!missing}
      />
    </div>
  );
}
