// Mengimpor konten Modul Belajar dari content/modules/ ke database sebagai DRAFT (Fase 24.5).
//
// Struktur: content/modules/<mata-pelajaran>/_subject.md, NN-<pelajaran>.md, dan _kuis.md (kuis akhir).
// Format berkas: docs/v5/CONTENT_GUIDE.md. Soal masuk ke tabel exercises (migrasi 0012) dengan kolom lesson_slug/subject_slug
// (migrasi 0023), berstatus draft dan bertag mod:<pelajaran>:<n>.
//
// Aturan aman:
//   - Pelajaran yang sudah DITINJAU atau DISUNTING di Admin (reviewed_at / edited_at terisi) DILEWATI, kecuali --force.
//   - Soal yang sudah terbit tidak ditimpa (kecuali --force); soal draf dengan tag yang sama diperbarui.
//   - Status terbit tidak pernah diubah oleh skrip ini: menerbitkan hanya lewat Admin -> Konten -> Modul.
//
// Pakai:
//   node scripts/import-modules.mjs --dry-run            # hanya memeriksa berkas dan mencetak laporan (tanpa database)
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-modules.mjs [--force] [--only <mata-pelajaran>]
//
// Butuh Node 22.18+ (membaca TypeScript proyek langsung); tanpa dependensi baru selain @supabase/supabase-js yang sudah ada.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadModules } from "./lib/load-modules.mjs";
import { checkLesson } from "../lib/lesson-check.ts";
import { allRoomPaths } from "../lib/rooms.ts";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const has = (name) => process.argv.includes(`--${name}`);

const dryRun = has("dry-run");
const force = has("force");
const only = arg("only");
const dir = path.resolve(repo, arg("dir") ?? "content/modules");

function report(subjects, problems) {
  const known = allRoomPaths();
  let lessonCount = 0;
  let exerciseCount = 0;
  for (const s of subjects) {
    console.log(`\n${s.subject.sort_order}. ${s.subject.title} (${s.subject.stage}): ${s.lessons.length} pelajaran, kuis ${s.quiz?.exercises.length ?? 0} soal`);
    for (const l of s.lessons) {
      lessonCount++;
      exerciseCount += l.exercises.length;
      const c = checkLesson({ ...l.lesson }, l.exercises.length, known);
      const flags = c.items.filter((i) => !i.ok).map((i) => `${i.label}: ${i.detail}`);
      console.log(`   ${l.lesson.sort_order}. ${l.lesson.title}: ${c.wordCount} kata, ${l.exercises.length} soal${flags.length ? `  [!] ${flags.join("; ")}` : ""}`);
    }
    exerciseCount += s.quiz?.exercises.length ?? 0;
  }
  console.log(`\nTotal: ${subjects.length} mata pelajaran, ${lessonCount} pelajaran, ${exerciseCount} soal.`);
  if (problems.length) {
    console.log(`\n${problems.length} masalah:`);
    for (const p of problems) console.log(`  - ${p}`);
  }
}

const { subjects, problems } = loadModules(dir, { only });
report(subjects, problems);
if (problems.length) {
  console.error("\nBerkas belum sah; tidak ada yang ditulis.");
  process.exit(1);
}
if (dryRun) {
  console.log("\n--dry-run: tidak ada yang ditulis.");
  process.exit(0);
}

const { createClient } = await import("@supabase/supabase-js");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di environment (atau pakai --dry-run).");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const missing = (e) => e && ["42P01", "42703", "PGRST205", "PGRST204"].includes(e.code ?? "");
const fail = (what, e) => {
  console.error(`${what}: ${missing(e) ? "migrasi 0023_study_modules.sql belum dijalankan." : e.message}`);
  process.exit(1);
};

let skipped = 0;
let written = 0;

async function syncExercises(scope, exercises, ctx) {
  // scope = { lesson_slug, subject_slug, tagPrefix }; soal draf lama dengan tag yang tidak ada lagi dihapus
  const { data: existing, error } = await supabase.from("exercises").select("id, status, tags").contains("tags", [scope.tagPrefix]);
  if (error) fail("Gagal membaca soal", error);
  const byTag = new Map();
  for (const row of existing ?? []) {
    const t = (row.tags ?? []).find((x) => x.startsWith(`${scope.tagPrefix}:`));
    if (t) byTag.set(t, row);
  }
  const wanted = new Set();
  for (let i = 0; i < exercises.length; i++) {
    const tag = `${scope.tagPrefix}:${i + 1}`;
    wanted.add(tag);
    const ex = exercises[i];
    const row = {
      type: ex.type,
      cefr_level: ex.cefr_level,
      topic_slug: null,
      unit_slug: null,
      tags: [scope.tagPrefix, tag, ...ex.tags.filter((t) => !t.startsWith("mod:"))],
      prompt: ex.prompt,
      answer: ex.answer,
      explanation_id: ex.explanation_id,
      lesson_slug: scope.lesson_slug,
      subject_slug: scope.subject_slug,
    };
    const old = byTag.get(tag);
    if (old) {
      if (old.status === "published" && !force) {
        skipped++;
        continue;
      }
      const { error: e } = await supabase.from("exercises").update(row).eq("id", old.id);
      if (e) fail(`Gagal memperbarui soal ${tag}`, e);
    } else {
      const { error: e } = await supabase.from("exercises").insert({ ...row, status: "draft", source: "admin" });
      if (e) fail(`Gagal menambah soal ${tag}`, e);
    }
    written++;
  }
  for (const [tag, row] of byTag) {
    if (!wanted.has(tag) && row.status === "draft") await supabase.from("exercises").delete().eq("id", row.id);
  }
  void ctx;
}

for (const s of subjects) {
  const { subject } = s;
  const { data: existingSubject, error: subjectReadError } = await supabase.from("study_subjects").select("slug, status").eq("slug", subject.slug).maybeSingle();
  if (subjectReadError) fail("Gagal membaca mata pelajaran", subjectReadError);
  const subjectRow = { ...subject, updated_at: new Date().toISOString() };
  const { error: subjectError } = existingSubject
    ? await supabase.from("study_subjects").update(subjectRow).eq("slug", subject.slug) // status terbit tidak diubah
    : await supabase.from("study_subjects").insert({ ...subjectRow, status: "draft" });
  if (subjectError) fail(`Gagal menyimpan mata pelajaran ${subject.slug}`, subjectError);
  console.log(`\n${existingSubject ? "Diperbarui" : "Dibuat (draft)"}: ${subject.title}`);

  for (const l of s.lessons) {
    const { data: old, error: readError } = await supabase.from("study_lessons").select("slug, status, edited_at, reviewed_at").eq("slug", l.lesson.slug).maybeSingle();
    if (readError) fail("Gagal membaca pelajaran", readError);
    if (old && (old.edited_at || old.reviewed_at) && !force) {
      console.log(`  dilewati (sudah ditinjau/disunting): ${l.lesson.title}`);
      skipped++;
      continue;
    }
    const row = { ...l.lesson, origin: "claude", updated_at: new Date().toISOString() };
    const { error } = old
      ? await supabase.from("study_lessons").update(row).eq("slug", l.lesson.slug)
      : await supabase.from("study_lessons").insert({ ...row, status: "draft" });
    if (error) fail(`Gagal menyimpan pelajaran ${l.lesson.slug}`, error);
    await syncExercises({ lesson_slug: l.lesson.slug, subject_slug: subject.slug, tagPrefix: `mod:${l.lesson.slug}` }, l.exercises);
    console.log(`  ${old ? "diperbarui" : "dibuat (draft)"}: ${l.lesson.title} (${l.exercises.length} soal)`);
    written++;
  }

  if (s.quiz) {
    await syncExercises({ lesson_slug: null, subject_slug: subject.slug, tagPrefix: `mod:${subject.slug}:kuis` }, s.quiz.exercises);
    console.log(`  kuis akhir: ${s.quiz.exercises.length} soal`);
  }
}

console.log(`\nSelesai: ${written} ditulis, ${skipped} dilewati. Tinjau lalu terbitkan di Admin -> Konten -> Modul.`);
