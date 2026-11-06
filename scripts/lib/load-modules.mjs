// Membaca dan memeriksa seluruh konten Modul Belajar dari satu folder (Fase 24.5). Tanpa database dan tanpa dependensi
// baru; dipakai scripts/import-modules.mjs dan diuji di tests/study.test.mts.
import fs from "node:fs";
import path from "node:path";
import { parseLessonFile, parseQuizFile, parseSubjectFile } from "./parse-lesson.mjs";

/** Membaca seluruh konten dan memeriksanya; tidak menyentuh database. */
export function loadModules(root, { only } = {}) {
  const subjects = [];
  const problems = [];
  if (!fs.existsSync(root)) return { subjects, problems: [`Folder ${root} tidak ada.`] };
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || (only && entry.name !== only)) continue;
    const base = path.join(root, entry.name);
    const subjFile = path.join(base, "_subject.md");
    if (!fs.existsSync(subjFile)) {
      problems.push(`${entry.name}: _subject.md tidak ada`);
      continue;
    }
    const parsedSubject = parseSubjectFile(fs.readFileSync(subjFile, "utf8"), `${entry.name}/_subject.md`);
    problems.push(...parsedSubject.errors);
    if (!parsedSubject.subject) continue;
    if (parsedSubject.subject.slug !== entry.name) problems.push(`${entry.name}: slug di _subject.md (${parsedSubject.subject.slug}) harus sama dengan nama folder`);

    const lessons = [];
    for (const f of fs.readdirSync(base).filter((n) => n.endsWith(".md") && !n.startsWith("_")).sort()) {
      const parsed = parseLessonFile(fs.readFileSync(path.join(base, f), "utf8"), `${entry.name}/${f}`);
      problems.push(...parsed.errors);
      if (!parsed.lesson) continue;
      if (parsed.lesson.subject_slug !== parsedSubject.subject.slug) problems.push(`${entry.name}/${f}: subject harus ${parsedSubject.subject.slug}`);
      lessons.push({ file: f, ...parsed });
    }
    const slugs = lessons.map((l) => l.lesson.slug);
    if (new Set(slugs).size !== slugs.length) problems.push(`${entry.name}: ada slug pelajaran ganda`);
    const orders = lessons.map((l) => l.lesson.sort_order);
    if (new Set(orders).size !== orders.length) problems.push(`${entry.name}: ada urutan pelajaran ganda`);

    let quiz = null;
    const quizFile = path.join(base, "_kuis.md");
    if (fs.existsSync(quizFile)) {
      quiz = parseQuizFile(fs.readFileSync(quizFile, "utf8"), `${entry.name}/_kuis.md`);
      problems.push(...quiz.errors);
      if (quiz.subject_slug && quiz.subject_slug !== parsedSubject.subject.slug) problems.push(`${entry.name}/_kuis.md: subject harus ${parsedSubject.subject.slug}`);
    }
    subjects.push({ ...parsedSubject, lessons, quiz });
  }
  const orders = subjects.map((s) => s.subject.sort_order);
  if (new Set(orders).size !== orders.length) problems.push("Ada urutan mata pelajaran (order) ganda di antara _subject.md.");
  return { subjects, problems };
}
