"use server";

// Server actions Ruang Kerja Segmen. Memakai sesi pengguna (RLS membatasi baris ke pemilik) dan
// memeriksa login di setiap action karena Server Action bisa dipanggil langsung lewat POST.

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { splitSentences } from "@/lib/translation/segment";
import { MAX_SEGMENTS, MAX_SOURCE_CHARS, MISSING_SCHEMA_CODES, type ActionResult } from "./_lib/types";

const TAXONOMY = "molina_hurtado_albir_2002";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

function dbMessage(error: { code?: string; message: string }): string {
  return error.code && MISSING_SCHEMA_CODES.includes(error.code) ? "Migrasi 0010_translation_academic.sql belum dijalankan." : "Gagal menyimpan. Coba lagi.";
}

export async function createProject(input: { title: string; brief: string; sourceText: string }): Promise<ActionResult<{ id: string }>> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Silakan masuk terlebih dahulu." };

  const title = input.title.trim().slice(0, 150);
  const brief = input.brief.trim().slice(0, 1000);
  const sourceText = input.sourceText.trim();
  if (!title) return { ok: false, error: "Judul proyek wajib diisi." };
  if (!sourceText) return { ok: false, error: "Tempel teks sumber terlebih dahulu." };
  if (sourceText.length > MAX_SOURCE_CHARS) return { ok: false, error: `Teks sumber maksimal ${MAX_SOURCE_CHARS.toLocaleString("id-ID")} karakter.` };

  const sentences = splitSentences(sourceText);
  if (sentences.length === 0) return { ok: false, error: "Tidak ada kalimat yang dapat disegmentasi." };
  if (sentences.length > MAX_SEGMENTS) return { ok: false, error: `Teks terlalu panjang (${sentences.length} segmen). Maksimal ${MAX_SEGMENTS}; bagi menjadi beberapa proyek.` };

  const { data: project, error } = await supabase
    .from("translation_projects")
    .insert({ user_id: user.id, title, brief: brief || null, source_text: sourceText })
    .select("id")
    .single();
  if (error || !project) return { ok: false, error: error ? dbMessage(error) : "Gagal membuat proyek." };

  const { error: segError } = await supabase
    .from("translation_segments")
    .insert(sentences.map((source, idx) => ({ project_id: project.id, idx, source })));
  if (segError) {
    await supabase.from("translation_projects").delete().eq("id", project.id); // jangan tinggalkan proyek tanpa segmen
    return { ok: false, error: dbMessage(segError) };
  }

  revalidatePath("/translation-workspace");
  return { ok: true, data: { id: project.id } };
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Silakan masuk terlebih dahulu." };
  if (!UUID.test(projectId)) return { ok: false, error: "Proyek tidak valid." };

  const { error } = await supabase.from("translation_projects").delete().eq("id", projectId).eq("user_id", user.id);
  if (error) return { ok: false, error: dbMessage(error) };
  revalidatePath("/translation-workspace");
  return { ok: true };
}

/** Simpan terjemahan, status, dan komentar satu segmen (dipanggil dengan debounce dari editor). */
export async function saveSegment(input: { id: string; target: string; status: "draft" | "done"; comment: string }): Promise<ActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Silakan masuk terlebih dahulu." };
  if (!UUID.test(input.id)) return { ok: false, error: "Segmen tidak valid." };
  if (input.status !== "draft" && input.status !== "done") return { ok: false, error: "Status tidak valid." };

  const { data, error } = await supabase
    .from("translation_segments")
    .update({ target: input.target.slice(0, 5000), status: input.status, comment: input.comment.slice(0, 2000) || null })
    .eq("id", input.id)
    .select("project_id")
    .maybeSingle();
  if (error) return { ok: false, error: dbMessage(error) };
  if (!data) return { ok: false, error: "Segmen tidak ditemukan." };

  await supabase.from("translation_projects").update({ updated_at: new Date().toISOString() }).eq("id", data.project_id);
  return { ok: true };
}

export async function addAnnotation(input: {
  segmentId: string;
  sourceSpan: string;
  targetSpan: string;
  techniqueKey: string;
  suggestedByAi: boolean;
}): Promise<ActionResult<{ id: string }>> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Silakan masuk terlebih dahulu." };
  if (!UUID.test(input.segmentId)) return { ok: false, error: "Segmen tidak valid." };

  const sourceSpan = input.sourceSpan.trim();
  const targetSpan = input.targetSpan.trim();
  if (!sourceSpan || !targetSpan) return { ok: false, error: "Pilih frasa pada teks sumber dan terjemahan." };
  if (sourceSpan.length > 300 || targetSpan.length > 300) return { ok: false, error: "Frasa terlalu panjang (maksimal 300 karakter)." };

  // Segmen milik pengguna (RLS) dan frasa harus benar-benar ada di segmen itu
  const { data: segment } = await supabase.from("translation_segments").select("source, target").eq("id", input.segmentId).maybeSingle();
  if (!segment) return { ok: false, error: "Segmen tidak ditemukan." };
  if (!segment.source.toLowerCase().includes(sourceSpan.toLowerCase())) return { ok: false, error: "Frasa sumber tidak ditemukan di segmen." };
  if (!(segment.target ?? "").toLowerCase().includes(targetSpan.toLowerCase())) return { ok: false, error: "Frasa terjemahan tidak ditemukan di segmen. Simpan terjemahan lebih dulu." };

  const { data: technique } = await supabase.from("translation_techniques").select("key").eq("taxonomy", TAXONOMY).eq("key", input.techniqueKey).maybeSingle();
  if (!technique) return { ok: false, error: "Teknik tidak dikenal." };

  const { data, error } = await supabase
    .from("technique_annotations")
    .insert({ segment_id: input.segmentId, source_span: sourceSpan, target_span: targetSpan, technique_key: input.techniqueKey, taxonomy: TAXONOMY, suggested_by_ai: input.suggestedByAi })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error ? dbMessage(error) : "Gagal menyimpan anotasi." };
  return { ok: true, data: { id: data.id } };
}

export async function deleteAnnotation(annotationId: string): Promise<ActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Silakan masuk terlebih dahulu." };
  if (!UUID.test(annotationId)) return { ok: false, error: "Anotasi tidak valid." };
  const { error } = await supabase.from("technique_annotations").delete().eq("id", annotationId);
  if (error) return { ok: false, error: dbMessage(error) };
  return { ok: true };
}

/** Simpan pasangan segmen ke Translation Memory milik pengguna (kolom mengikuti halaman Translation Memory). */
export async function saveSegmentToMemory(input: { source: string; target: string; context?: string }): Promise<ActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Silakan masuk terlebih dahulu." };
  const source = input.source.trim();
  const target = input.target.trim();
  if (!source || !target) return { ok: false, error: "Segmen belum punya terjemahan." };

  const { error } = await supabase.from("translation_memory").insert({
    user_id: user.id,
    source_phrase: source.slice(0, 2000),
    translated_phrase: target.slice(0, 2000),
    context: (input.context ?? "").slice(0, 200) || null,
  });
  if (error) return { ok: false, error: "Gagal menyimpan ke Translation Memory." };
  return { ok: true };
}
