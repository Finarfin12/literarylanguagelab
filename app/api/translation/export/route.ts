import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { toCsv } from "@/lib/translation/csv";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fileName(title: string, suffix: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "proyek";
  return `${base}-${suffix}.csv`;
}

/**
 * Ekspor CSV milik pengguna sendiri (RLS membatasi baris).
 *   ?project=<uuid>&kind=bilingual  → teks bilingual per segmen
 *   ?project=<uuid>&kind=techniques → anotasi teknik + ringkasan distribusi
 *   ?kind=glossary                  → glosarium pengguna
 */
export async function GET(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;
    const { supabase, user } = authResult;

    const url = new URL(req.url);
    const kind = url.searchParams.get("kind");
    const projectId = url.searchParams.get("project");

    const respond = (csv: string, name: string) =>
      new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${name}"`,
          "Cache-Control": "no-store",
        },
      });

    if (kind === "glossary") {
      const { data, error } = await supabase.from("glossaries").select("term, preferred_translation, book_title, notes").eq("user_id", user.id).order("term");
      if (error) return NextResponse.json({ error: "Gagal membaca glosarium." }, { status: 500 });
      return respond(
        toCsv([["Istilah", "Terjemahan pilihan", "Buku", "Catatan"], ...(data || []).map((g) => [g.term, g.preferred_translation, g.book_title, g.notes])]),
        "glosarium.csv"
      );
    }

    if ((kind !== "bilingual" && kind !== "techniques") || !projectId || !UUID.test(projectId)) {
      return NextResponse.json({ error: "Parameter tidak valid." }, { status: 400 });
    }

    const { data: project } = await supabase.from("translation_projects").select("id, title").eq("id", projectId).maybeSingle();
    if (!project) return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });

    const { data: segments } = await supabase
      .from("translation_segments")
      .select("id, idx, source, target, status, comment")
      .eq("project_id", projectId)
      .order("idx", { ascending: true });
    const segs = segments || [];

    if (kind === "bilingual") {
      return respond(
        toCsv([["No", "Sumber (Inggris)", "Terjemahan (Indonesia)", "Status", "Komentar penerjemah"], ...segs.map((s) => [s.idx + 1, s.source, s.target, s.status === "done" ? "Selesai" : "Draft", s.comment])]),
        fileName(project.title, "bilingual")
      );
    }

    // techniques
    const ids = segs.map((s) => s.id);
    const { data: annotations } = ids.length
      ? await supabase.from("technique_annotations").select("segment_id, source_span, target_span, technique_key, suggested_by_ai").in("segment_id", ids)
      : { data: [] as { segment_id: string; source_span: string; target_span: string; technique_key: string; suggested_by_ai: boolean }[] };
    const { data: techniques } = await supabase.from("translation_techniques").select("key, name_id, name_en");
    const names = new Map((techniques || []).map((t) => [t.key as string, `${t.name_id} (${t.name_en})`]));
    const idxOf = new Map(segs.map((s) => [s.id, s.idx]));

    const rows: unknown[][] = [["No segmen", "Frasa sumber", "Frasa terjemahan", "Teknik", "Diusulkan AI"]];
    const tally = new Map<string, number>();
    for (const a of annotations || []) {
      rows.push([(idxOf.get(a.segment_id) ?? 0) + 1, a.source_span, a.target_span, names.get(a.technique_key) ?? a.technique_key, a.suggested_by_ai ? "Ya" : "Tidak"]);
      tally.set(a.technique_key, (tally.get(a.technique_key) ?? 0) + 1);
    }
    rows.push([], ["Ringkasan teknik", "Jumlah", "Persentase"]);
    const total = [...tally.values()].reduce((a, b) => a + b, 0);
    for (const [key, n] of [...tally.entries()].sort((a, b) => b[1] - a[1])) {
      rows.push([names.get(key) ?? key, n, total ? `${Math.round((n / total) * 100)}%` : ""]);
    }
    return respond(toCsv(rows), fileName(project.title, "teknik"));
  } catch (error) {
    console.error("Translation export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
