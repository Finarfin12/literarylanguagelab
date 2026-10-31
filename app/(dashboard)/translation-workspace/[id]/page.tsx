import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type {
  WorkspaceAnnotation,
  WorkspaceAssessment,
  WorkspaceGlossaryEntry,
  WorkspaceSegment,
  WorkspaceTechnique,
  WorkspaceTmEntry,
} from "../_lib/types";
import WorkspaceEditor from "./WorkspaceEditor";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TranslationProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: project } = await supabase.from("translation_projects").select("id, title, brief").eq("id", id).maybeSingle();
  if (!project) notFound();

  const { data: segmentRows } = await supabase
    .from("translation_segments")
    .select("id, idx, source, target, status, comment")
    .eq("project_id", id)
    .order("idx", { ascending: true });
  const segments = (segmentRows || []) as WorkspaceSegment[];
  const segmentIds = segments.map((s) => s.id);

  const [annotationsRes, techniquesRes, glossaryRes, tmRes, assessmentRes] = await Promise.all([
    segmentIds.length
      ? supabase.from("technique_annotations").select("id, segment_id, source_span, target_span, technique_key, suggested_by_ai").in("segment_id", segmentIds)
      : Promise.resolve({ data: [] as WorkspaceAnnotation[] }),
    supabase.from("translation_techniques").select("key, name_id, name_en, definition_id, example").eq("taxonomy", "molina_hurtado_albir_2002").order("name_en"),
    supabase.from("glossaries").select("term, preferred_translation").eq("user_id", user?.id ?? ""),
    supabase.from("translation_memory").select("*").eq("user_id", user?.id ?? "").order("created_at", { ascending: false }).limit(1000),
    supabase.from("translation_assessments").select("id, weighted_score, created_at, per_segment").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
  ]);

  const glossary: WorkspaceGlossaryEntry[] = (glossaryRes.data || []).map((g) => ({ term: g.term as string, preferred: g.preferred_translation as string }));
  // Kolom TM mengikuti halaman Translation Memory (source_phrase/translated_phrase); source_text/target_text untuk skema dasar lama
  const tm: WorkspaceTmEntry[] = (tmRes.data || [])
    .map((r: Record<string, unknown>) => ({
      source: String(r.source_phrase ?? r.source_text ?? ""),
      target: String(r.translated_phrase ?? r.target_text ?? ""),
    }))
    .filter((e) => e.source && e.target);

  return (
    <WorkspaceEditor
      project={{ id: project.id, title: project.title, brief: project.brief }}
      initialSegments={segments}
      initialAnnotations={(annotationsRes.data || []) as WorkspaceAnnotation[]}
      techniques={(techniquesRes.data || []) as WorkspaceTechnique[]}
      glossary={glossary}
      tm={tm}
      latestAssessment={((assessmentRes.data || [])[0] as WorkspaceAssessment | undefined) ?? null}
    />
  );
}
