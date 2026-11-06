// Membaca berkas konten Modul Belajar (Fase 24.5): content/modules/<mata-pelajaran>/<nn>-<pelajaran>.md,
// _subject.md (metadata mata pelajaran), dan _kuis.md (kuis akhir). Tanpa akses database dan tanpa dependensi baru;
// diuji di tests/study.test.mts. Format lengkap dan contoh: docs/v5/CONTENT_GUIDE.md.
//
// Frontmatter (antara dua baris ---): `kunci: nilai` dan daftar `kunci:` diikuti baris `- butir`.
//   sumber ditulis "Judul | https://alamat | ok" atau "Judul | - | perlu-cek" (status bawaan: perlu-cek).
// Isi: Markdown. Bagian dengan judul "## Rangkuman" dan "## Tugas" dipisahkan; "## Latihan" memuat blok
// ```exercise berisi JSON satu soal (bentuk sama dengan Admin → Konten → Latihan). Bagian lain = isi pelajaran.
import { LESSON_LIMITS, SLUG, cleanSources, isStage } from "../../lib/study.ts";
import { validateExerciseDraft } from "../../lib/exercises/grade.ts";

const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** @returns {{ meta: Record<string, string | string[]>, body: string } | { error: string }} */
export function parseFrontmatter(text) {
  const src = String(text).replace(/\r\n/g, "\n");
  if (!src.startsWith("---\n")) return { error: "Berkas harus diawali baris --- (frontmatter)." };
  const end = src.indexOf("\n---\n", 3);
  const endOfFile = src.endsWith("\n---") ? src.length - 4 : -1;
  const close = end >= 0 ? end : endOfFile;
  if (close < 0) return { error: "Frontmatter tidak ditutup dengan baris ---." };
  const head = src.slice(4, close);
  const body = end >= 0 ? src.slice(end + 5) : "";
  const meta = {};
  let listKey = null;
  for (const raw of head.split("\n")) {
    if (!raw.trim()) continue;
    const item = raw.match(/^\s*-\s+(.*)$/);
    if (item && listKey) {
      meta[listKey].push(item[1].trim());
      continue;
    }
    const kv = raw.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) return { error: `Baris frontmatter tidak dikenal: "${raw.slice(0, 60)}"` };
    const [, key, value] = kv;
    if (value === "") {
      meta[key] = [];
      listKey = key;
    } else {
      meta[key] = value.trim();
      listKey = null;
    }
  }
  return { meta, body };
}

/** "Judul | url | status" → { title, url?, status } (status bawaan perlu-cek). */
export function parseSourceLine(line) {
  const [title = "", url = "", status = ""] = String(line).split("|").map((s) => s.trim());
  return { title, ...(url && url !== "-" ? { url } : {}), status: status === "ok" ? "ok" : "perlu-cek" };
}

const asList = (v) => (Array.isArray(v) ? v : typeof v === "string" && v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

/** Memecah isi menjadi bagian: { before, sections: [{ title, text }] } berdasarkan judul tingkat 2, mengabaikan yang ada di blok kode. */
export function splitSections(body) {
  const lines = String(body).replace(/\r\n/g, "\n").split("\n");
  const sections = [];
  let current = { title: null, lines: [] };
  let fenced = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const h = !fenced ? line.match(/^##\s+(.+?)\s*$/) : null;
    if (h) {
      sections.push(current);
      current = { title: h[1], lines: [line] };
    } else current.lines.push(line);
  }
  sections.push(current);
  return sections.map((s) => ({ title: s.title, text: s.lines.join("\n") }));
}

/** Blok ```exercise ... ``` → daftar { json, error }. */
export function extractExerciseBlocks(text) {
  const out = [];
  const re = /```exercise[ \t]*\n([\s\S]*?)\n```/g;
  let m;
  while ((m = re.exec(String(text).replace(/\r\n/g, "\n"))) !== null) {
    try {
      out.push({ json: JSON.parse(m[1]) });
    } catch (e) {
      out.push({ error: `JSON soal tidak valid: ${e.message}` });
    }
  }
  return out;
}

function validateExercises(blocks, { level, label }) {
  const exercises = [];
  const errors = [];
  blocks.forEach((b, i) => {
    if (b.error) return errors.push(`${label}, soal ${i + 1}: ${b.error}`);
    const draft = {
      type: b.json?.type,
      cefr_level: b.json?.cefr_level ?? level,
      topic_slug: null,
      unit_slug: null,
      tags: Array.isArray(b.json?.tags) ? b.json.tags : [],
      prompt: b.json?.prompt,
      answer: b.json?.answer,
      explanation_id: b.json?.explanation_id,
    };
    const v = validateExerciseDraft(draft);
    if (!v.ok) errors.push(`${label}, soal ${i + 1}: ${v.error}`);
    else exercises.push(v.value);
  });
  return { exercises, errors };
}

/** Pelajaran: { ok, errors, lesson, exercises }. `fileName` hanya untuk pesan galat. */
export function parseLessonFile(text, fileName = "pelajaran") {
  const errors = [];
  const fm = parseFrontmatter(text);
  if (fm.error) return { ok: false, errors: [`${fileName}: ${fm.error}`] };
  const { meta, body } = fm;
  const slug = String(meta.slug ?? "");
  const subject = String(meta.subject ?? "");
  const title = String(meta.title ?? "");
  const order = Number(meta.order);
  const level = String(meta.level ?? "B1").toUpperCase();
  if (!SLUG.test(slug)) errors.push(`${fileName}: slug tidak valid`);
  if (!SLUG.test(subject)) errors.push(`${fileName}: subject tidak valid`);
  if (!title || title.length > LESSON_LIMITS.maxTitleChars) errors.push(`${fileName}: judul wajib dan maks. ${LESSON_LIMITS.maxTitleChars} karakter`);
  if (!Number.isInteger(order) || order < 0 || order > 1000) errors.push(`${fileName}: order harus bilangan bulat 0-1000`);
  if (!CEFR.includes(level)) errors.push(`${fileName}: level tidak valid`);

  const sections = splitSections(body);
  const norm = (t) => (t ?? "").trim().toLowerCase();
  const summary = sections.find((s) => norm(s.title) === "rangkuman");
  const task = sections.find((s) => norm(s.title) === "tugas");
  const practice = sections.find((s) => norm(s.title) === "latihan");
  const bodyMd = sections
    .filter((s) => !["rangkuman", "tugas", "latihan"].includes(norm(s.title)))
    .map((s) => s.text)
    .join("\n")
    .trim();
  const strip = (s) => (s ? s.text.replace(/^##\s+.*\n?/, "").trim() : "");

  const { exercises, errors: exErrors } = validateExercises(extractExerciseBlocks(practice?.text ?? ""), { level, label: fileName });
  errors.push(...exErrors);

  const sources = cleanSources(asList(meta.sources).map(parseSourceLine));
  const lesson = {
    slug,
    subject_slug: subject,
    sort_order: order,
    title,
    objectives: asList(meta.objectives),
    body_md: bodyMd,
    summary_md: strip(summary),
    task: strip(task) ? { prompt: strip(task) } : null,
    tool_paths: asList(meta.tools),
    sources,
  };
  if (lesson.body_md.length > LESSON_LIMITS.maxBodyChars) errors.push(`${fileName}: isi terlalu panjang`);
  return { ok: errors.length === 0, errors, lesson, exercises };
}

/** _subject.md → { ok, errors, subject }. */
export function parseSubjectFile(text, fileName = "_subject.md") {
  const errors = [];
  const fm = parseFrontmatter(text);
  if (fm.error) return { ok: false, errors: [`${fileName}: ${fm.error}`] };
  const { meta } = fm;
  const slug = String(meta.slug ?? "");
  const order = Number(meta.order);
  if (!SLUG.test(slug)) errors.push(`${fileName}: slug tidak valid`);
  if (!isStage(meta.stage)) errors.push(`${fileName}: stage harus fondasi, transisi, pendalaman, atau lanjut`);
  if (!meta.title) errors.push(`${fileName}: judul wajib`);
  if (!Number.isInteger(order) || order < 1 || order > 1000) errors.push(`${fileName}: order harus bilangan bulat 1-1000`);
  const subject = {
    slug,
    stage: String(meta.stage ?? ""),
    title: String(meta.title ?? ""),
    description_id: String(meta.description ?? ""),
    outcomes: asList(meta.outcomes),
    room_slug: meta.room ? String(meta.room) : null,
    sources: cleanSources(asList(meta.sources).map(parseSourceLine)),
    sort_order: order,
  };
  return { ok: errors.length === 0, errors, subject };
}

/** _kuis.md → { ok, errors, subject_slug, exercises } (soal tanpa lesson_slug = kuis akhir). */
export function parseQuizFile(text, fileName = "_kuis.md") {
  const fm = parseFrontmatter(text);
  if (fm.error) return { ok: false, errors: [`${fileName}: ${fm.error}`] };
  const subject = String(fm.meta.subject ?? "");
  const level = String(fm.meta.level ?? "B1").toUpperCase();
  const errors = [];
  if (!SLUG.test(subject)) errors.push(`${fileName}: subject tidak valid`);
  if (!CEFR.includes(level)) errors.push(`${fileName}: level tidak valid`);
  const { exercises, errors: exErrors } = validateExercises(extractExerciseBlocks(fm.body), { level, label: fileName });
  errors.push(...exErrors);
  return { ok: errors.length === 0, errors, subject_slug: subject, exercises };
}
