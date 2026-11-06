// Uji Modul Belajar (Fase 24): logika murni (lib/study.ts, lib/lesson-check.ts), pembaca berkas konten, isi mata pelajaran
// percobaan, migrasi 0023, dan keamanan penghubungnya. Jalankan:
//   node --experimental-transform-types --no-warnings tests/study.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const load = (f: string) => import(pathToFileURL(path.join(repo, f)).href);
const read = (p: string) => fs.readFileSync(path.join(repo, p), "utf8");
const st = await load("lib/study.ts");
const lc = await load("lib/lesson-check.ts");
const pl = await load("scripts/lib/parse-lesson.mjs");
const lm = await load("scripts/lib/load-modules.mjs");
const rooms = await load("lib/rooms.ts");
const flags = await load("lib/ai/flag-rules.ts");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

// --- Logika murni: urutan, progres, saran ---
const subjects = [
  { slug: "b", stage: "transisi", sort_order: 2 },
  { slug: "a", stage: "fondasi", sort_order: 1 },
  { slug: "c", stage: "fondasi", sort_order: 3 },
];
const lessons = [
  { slug: "b1", subject_slug: "b", sort_order: 1 },
  { slug: "a2", subject_slug: "a", sort_order: 2 },
  { slug: "a1", subject_slug: "a", sort_order: 1 },
  { slug: "c1", subject_slug: "c", sort_order: 1 },
];

test("urutan global dan pengelompokan per tahap mengikuti sort_order", () => {
  assert.deepEqual(st.orderSubjects(subjects).map((s: { slug: string }) => s.slug), ["a", "b", "c"]);
  assert.deepEqual(st.globalLessonOrder(subjects, lessons).map((l: { slug: string }) => l.slug), ["a1", "a2", "b1", "c1"]);
  const groups = st.groupByStage(subjects);
  assert.deepEqual(groups.map((g: { stage: string }) => g.stage), ["fondasi", "transisi"]);
  assert.deepEqual(groups[0].subjects.map((s: { slug: string }) => s.slug), ["a", "c"]);
  assert.deepEqual(st.STAGES, ["fondasi", "transisi", "pendalaman", "lanjut"]);
  assert.equal(st.STAGE_LABELS.lanjut, "Lanjut & proyek");
});

test("progres per mata pelajaran dan per tahap", () => {
  const done = new Set(["a1", "b1"]);
  assert.deepEqual(st.subjectProgress(lessons, "a", done), { done: 1, total: 2, percent: 50 });
  assert.deepEqual(st.subjectProgress(lessons, "zzz", done), { done: 0, total: 0, percent: 0 });
  assert.deepEqual(st.stageProgress(subjects, lessons, "fondasi", done), { done: 1, total: 3, percent: 33 });
  assert.deepEqual(st.stageProgress(subjects, lessons, "transisi", done), { done: 1, total: 1, percent: 100 });
  assert.equal(st.stageProgress(subjects, lessons, "lanjut", done).percent, 0);
  assert.equal(st.subjectComplete(lessons, "b", done), true);
  assert.equal(st.subjectComplete(lessons, "a", done), false);
  assert.equal(st.subjectComplete(lessons, "zzz", done), false);
});

test("pelajaran berikutnya hanya disarankan, tidak mengunci; yang sudah selesai dilewati", () => {
  assert.equal(st.nextLesson(subjects, lessons, new Set(), null).slug, "a1");
  assert.equal(st.nextLesson(subjects, lessons, new Set(["a1"]), "a1").slug, "a2");
  assert.equal(st.nextLesson(subjects, lessons, new Set(["a1", "a2"]), "a2").slug, "b1");
  // setelah pelajaran terakhir: tawarkan yang terlewat di depan
  assert.equal(st.nextLesson(subjects, lessons, new Set(["a2", "b1", "c1"]), "c1").slug, "a1");
  // semuanya selesai
  assert.equal(st.nextLesson(subjects, lessons, new Set(["a1", "a2", "b1", "c1"]), "c1"), null);
  // pelajaran saat ini tidak disarankan lagi walau belum ditandai selesai
  assert.notEqual(st.nextLesson(subjects, lessons, new Set(), "a1")?.slug, "a1");
  assert.equal(st.nextLesson(subjects, [], new Set(), null), null);
});

test("pelajaran yang disarankan: lanjutkan mata pelajaran yang sedang berjalan, selain itu yang pertama", () => {
  assert.equal(st.suggestedLesson(subjects, lessons, new Set()).slug, "a1");
  assert.equal(st.suggestedLesson(subjects, lessons, new Set(["a1"])).slug, "a2");
  // b selesai sebagian? (hanya 1 pelajaran, jadi tidak): pilih pertama yang belum selesai
  assert.equal(st.suggestedLesson(subjects, lessons, new Set(["a1", "a2"])).slug, "b1");
  assert.equal(st.suggestedLesson(subjects, lessons, new Set(["a1", "a2", "b1", "c1"])), null);
  assert.equal(st.suggestedLesson([], [], new Set()), null);
});

// --- Normalisasi masukan ---
test("cleanLessonInput: batas, slug, dan bentuk tugas", () => {
  const ok = st.cleanLessonInput({ slug: " Ok-Slug ", subject_slug: "membaca", sort_order: 2, title: " Judul ", objectives: "- Satu\n- Dua\n\n", body_md: "Isi", summary_md: "", task: "Tulis", tool_paths: "/library, bukan-path, /tools/nuance-detector", sources: [{ title: "S", url: "https://a.b/c", status: "ok" }, { title: "T", url: "javascript:alert(1)" }] });
  assert.equal(ok.ok, true, ok.error);
  assert.equal(ok.value.slug, "ok-slug");
  assert.deepEqual(ok.value.objectives, ["Satu", "Dua"]);
  assert.deepEqual(ok.value.task, { prompt: "Tulis" });
  assert.deepEqual(ok.value.tool_paths, ["/library", "/tools/nuance-detector"]);
  assert.equal(ok.value.sources.length, 2);
  assert.equal(ok.value.sources[1].url, undefined, "URL berbahaya dibuang");
  assert.equal(st.cleanLessonInput({ slug: "X!", subject_slug: "mapel", sort_order: 1, title: "T" }).ok, false);
  assert.equal(st.cleanLessonInput({ slug: "ok", subject_slug: "", sort_order: 1, title: "T" }).ok, false);
  assert.equal(st.cleanLessonInput({ slug: "ok", subject_slug: "mapel", sort_order: -1, title: "T" }).ok, false);
  assert.equal(st.cleanLessonInput({ slug: "ok", subject_slug: "mapel", sort_order: 1, title: "" }).ok, false);
  assert.equal(st.cleanLessonInput({ slug: "ok", subject_slug: "mapel", sort_order: 1, title: "T", body_md: "x".repeat(st.LESSON_LIMITS.maxBodyChars + 1) }).ok, false);
  assert.equal(st.cleanLessonInput({ slug: "ok", subject_slug: "mapel", sort_order: 1, title: "T", task: "" }).value.task, null);
  assert.equal(st.cleanLessonInput(null).ok, false);
});

test("sumber: baris teks ↔ daftar, status bawaan perlu-cek", () => {
  const list = st.parseSourceLines("Judul A | https://a.example/x | ok\nJudul B | - | \nJudul C | https://c.example | perlu-cek\n\n | https://x | ok");
  assert.deepEqual(list.map((s: { title: string }) => s.title), ["Judul A", "Judul B", "Judul C"]);
  assert.equal(list[0].status, "ok");
  assert.equal(list[1].url, undefined);
  assert.equal(list[1].status, "perlu-cek");
  assert.equal(st.formatSourceLines(list).split("\n").length, 3);
  assert.deepEqual(st.parseSourceLines(st.formatSourceLines(list)), list);
});

// --- checkLesson ---
const known = rooms.allRoomPaths();
const base = { title: "T", objectives: ["Tujuan"], body_md: "kata ".repeat(700), summary_md: "- ringkas", tool_paths: ["/library"], sources: [{ title: "S", url: "https://a.b", status: "ok" }] };

test("checkLesson: semua butir lolos pada pelajaran lengkap; informasi saja", () => {
  const c = lc.checkLesson(base, 4, known);
  assert.equal(c.ok, true, JSON.stringify(c.items.filter((i: { ok: boolean }) => !i.ok)));
  assert.equal(c.wordCount, 700);
  assert.equal(c.items.length, 7);
});

test("checkLesson: menandai tujuan, panjang, soal, rangkuman, sumber, alat, dan penanda perlu cek", () => {
  const bad = lc.checkLesson({ title: "T", objectives: [], body_md: "pendek [perlu cek]", summary_md: " ", tool_paths: ["/tidak-ada"], sources: [] }, 1, known);
  const failed = bad.items.filter((i: { ok: boolean }) => !i.ok).map((i: { id: string }) => i.id).sort();
  assert.deepEqual(failed, ["exercises", "objectives", "sources", "summary", "tools", "verify", "words"].sort());
  assert.equal(lc.checkLesson({ ...base, body_md: "kata ".repeat(1600) }, 4, known).items.find((i: { id: string }) => i.id === "words").ok, false);
  assert.equal(lc.checkLesson({ ...base, sources: [{ title: "S", status: "perlu-cek" }] }, 4, known).items.find((i: { id: string }) => i.id === "verify").ok, false);
  assert.equal(lc.countWords("## Judul\n\n**tebal** *miring* [tautan](https://x.y)\n\n```json\n{ \"a\": 1 }\n```\n\n- satu\n- dua"), 6);
  assert.equal(lc.countUnverified("a [perlu cek] b [Perlu Cek]", "c"), 2);
});

// --- Pembaca berkas ---
const sample = `---
slug: contoh-1
subject: contoh
order: 1
level: A2
title: Contoh pelajaran
tools: /library, /tools/nuance-detector
objectives:
- Tujuan satu
- Tujuan dua
sources:
- Sumber A | https://a.example/x | ok
- Sumber B | - | perlu-cek
---

Pengantar.

## Penjelasan
Isi penjelasan.

### Subbagian
Detail.

## Latihan

\`\`\`exercise
{ "type": "mcq", "prompt": { "question": "Apa?", "options": ["a", "b"] }, "answer": { "correct": "a" }, "explanation_id": "Karena a." }
\`\`\`

\`\`\`exercise
{ "type": "cloze", "prompt": { "text": "The ___ idea.", "hint": "pokok" }, "answer": { "blanks": [["main"]] }, "explanation_id": "Main idea." }
\`\`\`

## Rangkuman
- Butir satu
- Butir dua

## Tugas
Tulis satu paragraf.
`;

test("parseLessonFile: frontmatter, bagian khusus, dan blok soal", () => {
  const r = pl.parseLessonFile(sample, "contoh.md");
  assert.equal(r.ok, true, r.errors.join("; "));
  assert.equal(r.lesson.slug, "contoh-1");
  assert.equal(r.lesson.sort_order, 1);
  assert.deepEqual(r.lesson.objectives, ["Tujuan satu", "Tujuan dua"]);
  assert.deepEqual(r.lesson.tool_paths, ["/library", "/tools/nuance-detector"]);
  assert.equal(r.lesson.sources.length, 2);
  assert.equal(r.lesson.sources[0].status, "ok");
  assert.equal(r.lesson.sources[1].status, "perlu-cek");
  assert.match(r.lesson.body_md, /Pengantar/);
  assert.match(r.lesson.body_md, /## Penjelasan/);
  assert.match(r.lesson.body_md, /### Subbagian/);
  assert.ok(!/Rangkuman|Tugas|exercise/.test(r.lesson.body_md), "bagian khusus tidak masuk isi");
  assert.match(r.lesson.summary_md, /Butir satu/);
  assert.deepEqual(r.lesson.task, { prompt: "Tulis satu paragraf." });
  assert.equal(r.exercises.length, 2);
  assert.equal(r.exercises[0].cefr_level, "A2", "level bawaan dari frontmatter");
});

test("parseLessonFile: galat dilaporkan, bukan dilempar", () => {
  assert.equal(pl.parseLessonFile("tanpa frontmatter", "x.md").ok, false);
  assert.equal(pl.parseLessonFile("---\nslug: a\n", "x.md").ok, false);
  const badSlug = pl.parseLessonFile(sample.replace("slug: contoh-1", "slug: Salah Slug"), "x.md");
  assert.equal(badSlug.ok, false);
  assert.match(badSlug.errors.join(" "), /slug/);
  const badJson = pl.parseLessonFile(sample.replace('{ "type": "cloze"', '{ type cloze'), "x.md");
  assert.equal(badJson.ok, false);
  assert.match(badJson.errors.join(" "), /JSON/);
  const badEx = pl.parseLessonFile(sample.replace('"correct": "a"', '"correct": "z"'), "x.md");
  assert.equal(badEx.ok, false, "jawaban benar harus ada di opsi");
  assert.equal(pl.parseLessonFile(sample.replace("order: 1", "order: x"), "x.md").ok, false);
  assert.equal(pl.parseLessonFile(sample.replace("level: A2", "level: Z9"), "x.md").ok, false);
});

test("judul ## di dalam blok kode tidak memecah bagian; sumber tanpa status = perlu-cek", () => {
  const withFence = sample.replace("Detail.", "Detail.\n\n```text\n## Rangkuman palsu\n```\n");
  const r = pl.parseLessonFile(withFence, "x.md");
  assert.equal(r.ok, true, r.errors.join("; "));
  assert.match(r.lesson.body_md, /Rangkuman palsu/);
  assert.equal(pl.parseSourceLine("Judul | https://x.y").status, "perlu-cek");
  assert.equal(pl.parseSourceLine("Judul | https://x.y | ok").status, "ok");
});

test("parseSubjectFile dan parseQuizFile", () => {
  const subj = pl.parseSubjectFile("---\nslug: contoh\nstage: fondasi\norder: 3\ntitle: Contoh\nroom: belajar-dasar\ndescription: Deskripsi.\noutcomes:\n- A\n- B\n---\n", "_subject.md");
  assert.equal(subj.ok, true, subj.errors.join("; "));
  assert.equal(subj.subject.sort_order, 3);
  assert.deepEqual(subj.subject.outcomes, ["A", "B"]);
  assert.equal(pl.parseSubjectFile("---\nslug: x\nstage: semester-1\norder: 1\ntitle: T\n---\n").ok, false, "tanpa nama Semester");
  const quiz = pl.parseQuizFile("---\nsubject: contoh\n---\n\n```exercise\n" + JSON.stringify({ type: "mcq", prompt: { question: "Apa?", options: ["a", "b"] }, answer: { correct: "b" }, explanation_id: "Karena b." }) + "\n```\n", "_kuis.md");
  assert.equal(quiz.ok, true, quiz.errors.join("; "));
  assert.equal(quiz.exercises.length, 1);
  assert.equal(quiz.subject_slug, "contoh");
});

// --- Konten sungguhan: mata pelajaran percobaan ---
const root = path.join(repo, "content/modules");
const loaded = lm.loadModules(root);
const trial = loaded.subjects.find((s: { subject: { slug: string } }) => s.subject.slug === "membaca-cepat-ide-pokok");

test("semua berkas konten sah dan mata pelajaran percobaan lengkap", () => {
  assert.deepEqual(loaded.problems, []);
  assert.ok(trial, "mata pelajaran percobaan ada");
  assert.equal(trial.subject.stage, "fondasi");
  assert.equal(trial.subject.sort_order, 1);
  assert.ok(trial.lessons.length >= 4 && trial.lessons.length <= 6, `${trial.lessons.length} pelajaran`);
  assert.ok(trial.quiz && trial.quiz.exercises.length >= 8, "kuis akhir");
  assert.ok(trial.subject.outcomes.length >= 3);
});

test("setiap pelajaran percobaan memenuhi panduan: tujuan, panjang, 3+ soal, rangkuman, tugas, sumber, alat valid", () => {
  const orders = trial.lessons.map((l: { lesson: { sort_order: number } }) => l.lesson.sort_order);
  assert.deepEqual(orders, orders.slice().sort((a: number, b: number) => a - b));
  for (const l of trial.lessons) {
    const c = lc.checkLesson(l.lesson, l.exercises.length, known);
    const failing = c.items.filter((i: { ok: boolean; id: string }) => !i.ok && i.id !== "verify");
    assert.deepEqual(failing, [], `${l.lesson.slug}: ${JSON.stringify(failing)}`);
    assert.ok(l.lesson.task, `${l.lesson.slug}: tugas`);
    assert.ok(l.lesson.objectives.length >= 3 && l.lesson.objectives.length <= 5, `${l.lesson.slug}: tujuan`);
    const types = new Set(l.exercises.map((e: { type: string }) => e.type));
    assert.ok(types.size >= 2, `${l.lesson.slug}: soal beragam`);
    assert.ok(l.exercises.every((e: { explanation_id: string }) => e.explanation_id.length >= 30), `${l.lesson.slug}: penjelasan soal`);
  }
});

test("mata pelajaran percobaan bisa dituntaskan tanpa AI dan tanpa alat: tidak ada rujukan AI, tombol alat opsional", () => {
  const all = [...trial.lessons.map((l: { file: string }) => read(`content/modules/membaca-cepat-ide-pokok/${l.file}`)), read("content/modules/membaca-cepat-ide-pokok/_kuis.md")].join("\n");
  assert.ok(!/runAI|openai|groq|chatgpt/i.test(all));
  const page = read("app/(dashboard)/modul/[subject]/[lesson]/page.tsx");
  assert.match(page, /Praktikkan \(opsional\)/);
  assert.match(page, /sudah lengkap tanpa alat/);
});

test("bahasa klaim dan batas: tanpa kode mata kuliah, Semester, atau klaim yang dilarang", () => {
  const files = fs.readdirSync(path.join(root, "membaca-cepat-ide-pokok")).map((f) => read(`content/modules/membaca-cepat-ide-pokok/${f}`));
  const all = files.join("\n");
  for (const bad of [/\bakurat\b/i, /siap (skripsi|TAP)/i, /offline penuh/i, /aman secara hukum/i, /\bBING\d{4}/, /\bPBIS\d{4}/, /\bSemester [1-8]\b/i, /\bSKS\b/]) {
    assert.ok(!bad.test(all), `klaim/kode terlarang: ${bad}`);
  }
});

test("sumber nyata: tautan http(s), yang belum dicek bertanda perlu-cek, tanpa duplikat judul", () => {
  for (const l of trial.lessons) {
    for (const s of l.lesson.sources) {
      if (s.url) assert.match(s.url, /^https?:\/\//);
      if (s.status === "ok") assert.ok(s.url, `${l.lesson.slug}: sumber 'ok' harus punya tautan`);
    }
    const titles = l.lesson.sources.map((s: { title: string }) => s.title);
    assert.equal(new Set(titles).size, titles.length);
  }
  // Sumber yang tidak bisa diperiksa dari sini tetap tertandai
  const flagged = trial.lessons.flatMap((l: { lesson: { sources: { status: string; title: string }[] } }) => l.lesson.sources).filter((s: { title: string }) => /British Council/.test(s.title));
  assert.ok(flagged.length > 0 && flagged.every((s: { status: string }) => s.status === "perlu-cek"));
});

test("semua mata pelajaran yang sudah ditulis memenuhi panduan (Fase 25 dst.)", () => {
  assert.ok(loaded.subjects.length >= 2);
  const stages = new Set(["fondasi", "transisi", "pendalaman", "lanjut"]);
  const orders = new Set<number>();
  for (const s of loaded.subjects) {
    assert.ok(stages.has(s.subject.stage), s.subject.slug);
    assert.ok(!orders.has(s.subject.sort_order), `urutan ganda: ${s.subject.sort_order}`);
    orders.add(s.subject.sort_order);
    assert.ok(s.lessons.length >= 4 && s.lessons.length <= 6, `${s.subject.slug}: ${s.lessons.length} pelajaran`);
    assert.ok(s.quiz && s.quiz.exercises.length >= 8, `${s.subject.slug}: kuis akhir`);
    assert.ok(s.subject.outcomes.length >= 3, `${s.subject.slug}: kemampuan`);
    const slugs = new Set<string>();
    for (const l of s.lessons) {
      assert.ok(!slugs.has(l.lesson.slug));
      slugs.add(l.lesson.slug);
      const c = lc.checkLesson(l.lesson, l.exercises.length, known);
      const failing = c.items.filter((i: { ok: boolean; id: string }) => !i.ok && i.id !== "verify");
      assert.deepEqual(failing, [], `${l.lesson.slug}: ${JSON.stringify(failing)}`);
      assert.ok(l.lesson.task && l.lesson.objectives.length >= 3, `${l.lesson.slug}: tugas dan tujuan`);
    }
    for (const l of s.lessons) assert.ok(l.lesson.slug.length <= 80);
  }
  // slug pelajaran unik di seluruh konten
  const all = loaded.subjects.flatMap((s: { lessons: { lesson: { slug: string } }[] }) => s.lessons.map((l) => l.lesson.slug));
  assert.equal(new Set(all).size, all.length);
});

test("tahap Fondasi: Struktur Kalimat Dasar menempati urutan 2 dan semua sumbernya terverifikasi", () => {
  const s = loaded.subjects.find((x: { subject: { slug: string } }) => x.subject.slug === "struktur-kalimat-dasar");
  assert.ok(s);
  assert.equal(s.subject.sort_order, 2);
  assert.equal(s.subject.stage, "fondasi");
  for (const l of s.lessons) for (const src of l.lesson.sources) assert.equal(src.status, "ok", `${l.lesson.slug}: ${src.title}`);
  // contoh Inggris dalam kutipan blok memberi lang="en"; tidak ada kode mata kuliah atau klaim terlarang
  const text = fs.readdirSync(path.join(root, "struktur-kalimat-dasar")).map((f) => read(`content/modules/struktur-kalimat-dasar/${f}`)).join("\n");
  for (const bad of [/\bakurat\b/i, /siap (skripsi|TAP)/i, /offline penuh/i, /aman secara hukum/i, /\bBING\d{4}/, /\bPBIS\d{4}/, /\bSemester [1-8]\b/i, /\bSKS\b/]) assert.ok(!bad.test(text), `${bad}`);
});

// --- Migrasi, flag, AI, rute ---
const sql = read("supabase/migrations/0023_study_modules.sql");
const code = sql.replace(/^--.*$/gm, "");

test("migrasi 0023: tabel, kolom soal, RLS, dan feature key AI", () => {
  for (const t of ["study_subjects", "study_lessons", "lesson_progress", "lesson_tasks", "lesson_simple_versions"]) {
    assert.match(code, new RegExp(`CREATE TABLE IF NOT EXISTS ${t}`));
    assert.match(code, new RegExp(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`));
  }
  assert.match(code, /sort_order INT NOT NULL UNIQUE/);
  assert.match(code, /CHECK \(stage IN \('fondasi', 'transisi', 'pendalaman', 'lanjut'\)\)/);
  assert.match(code, /ADD COLUMN IF NOT EXISTS lesson_slug TEXT/);
  assert.match(code, /ADD COLUMN IF NOT EXISTS subject_slug TEXT/);
  // pengguna biasa hanya membaca yang terbit; admin menulis
  assert.match(code, /status = 'published' OR public\.is_admin\(\)/);
  // progres dan tugas milik sendiri; versi sederhana tanpa policy tulis
  assert.match(code, /lesson_progress[\s\S]*auth\.uid\(\) = user_id/);
  assert.ok(!/ON lesson_simple_versions\s+FOR (ALL|INSERT|UPDATE)/.test(code), "versi sederhana hanya ditulis server");
  for (const k of ["lesson-simplify", "lesson-chat", "lesson-draft"]) {
    assert.ok(code.includes(`'${k}'`), `${k} di seed`);
    assert.ok(read("lib/ai/features.ts").includes(`"${k}"`), `${k} di features.ts`);
  }
});

test("flag modul_belajar default mati (fail-closed) dan Modul disembunyikan dari pengguna biasa", () => {
  assert.equal(flags.FEATURE_DEFAULTS.modul_belajar, false);
  assert.equal(flags.resolveFlag(null, "modul_belajar"), false);
  assert.equal(rooms.isPathVisible("/modul", true, false), false);
  assert.equal(rooms.isPathVisible("/modul", false, true), true);
  assert.equal(rooms.isPathVisible("/modul", true), false, "bawaan: tersembunyi");
  assert.equal(rooms.isPathVisible("/kursus", true), true, "perilaku Kursus tidak berubah");
  assert.equal(rooms.isPathVisible("/library", false, false), true);
  for (const slug of ["belajar-dasar", "baca-sastra", "terjemah"]) {
    const room = rooms.getRoom(slug);
    assert.ok(room.sections.some((s: { paths: string[] }) => s.paths.includes("/modul")), `${slug} memuat /modul`);
    assert.ok(!rooms.visibleSections(room, true, false).some((s: { paths: string[] }) => s.paths.includes("/modul")));
    assert.ok(rooms.visibleSections(room, true, true).some((s: { paths: string[] }) => s.paths.includes("/modul")));
  }
  assert.equal(rooms.resolveItem("/modul", []).name, "Modul Belajar");
  assert.match(read("lib/study-access.ts"), /flagOn = \(await getFeatureFlags\(\)\)\[STUDY_FLAG\] === true/);
});

test("AI hanya pendamping: rute lewat guardAIRoute; halaman utuh tanpa AI; keterangan bukan program resmi", () => {
  for (const f of ["app/api/modul/simplify/route.ts", "app/api/modul/chat/route.ts"]) {
    const src = read(f);
    assert.match(src, /guardAIRoute\(/);
    assert.match(src, /getStudyAccess/);
  }
  assert.match(read("app/api/modul/simplify/route.ts"), /lesson_simple_versions/);
  assert.match(read("app/api/modul/simplify/route.ts"), /inflight/);
  assert.match(read("components/study/LessonActions.tsx"), /Dibuat AI, periksa kembali/);
  // halaman pelajaran tidak memanggil runAI saat dirender
  assert.ok(!/runAI/.test(read("app/(dashboard)/modul/[subject]/[lesson]/page.tsx")));
  assert.match(read("components/study/StudyDisclaimer.tsx"), /bukan program resmi lembaga mana pun/);
  // aksi admin mencatat log dan memeriksa admin
  const adminActions = read("app/(dashboard)/admin/study-actions.ts");
  assert.equal((adminActions.match(/await assertAdmin\(\)/g) ?? []).length, 7);
  assert.ok((adminActions.match(/await logAdminAction\(/g) ?? []).length >= 7);
  // Markdown aman: tanpa HTML mentah
  const md = read("components/study/LessonMarkdown.tsx");
  assert.ok(!/rehype-raw|dangerouslySetInnerHTML/.test(md));
  assert.match(md, /lang="en"/);
});

test("impor aman: melewati pelajaran yang sudah ditinjau/disunting dan tidak menerbitkan", () => {
  const script = read("scripts/import-modules.mjs");
  assert.match(script, /old\.edited_at \|\| old\.reviewed_at/);
  assert.match(script, /--force|has\("force"\)/);
  assert.ok(!/status:\s*"published"/.test(script), "impor tidak boleh menerbitkan");
  assert.match(script, /status: "draft"/);
  assert.match(script, /dry-run/);
  // penyuntingan admin membatalkan tinjauan sehingga impor berikutnya tidak menimpa dan terbit ulang butuh tinjau
  assert.match(read("app/(dashboard)/admin/study-actions.ts"), /edited_at: now, reviewed_at: null/);
});

console.log(`\n${passed} lulus, 0 gagal`);
