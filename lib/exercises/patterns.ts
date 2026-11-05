// Penyusun kalimat (Fase 22.1): data kurasi per soal (subjek, kata kerja dengan bentuk I/You/We/They dan He/She/It,
// objek, catatan Indonesia). BUKAN mesin konjugasi umum: bentuk kata kerja ditulis tangan pada tiap soal.
// Fungsi murni tanpa impor runtime (hanya `import type`) agar bisa diuji unit (tests/patterns.test.mts).
import type { PatternPrompt, PatternResponse, PatternSubject, PatternVerb } from "./types";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const PERSONS: readonly string[] = ["i", "sg3", "other"];

/** Bentuk kata kerja untuk subjek: I → `first` (bila ada, mis. am) atau bentuk dasar; he/she/it → `third`; lainnya → bentuk dasar. */
export function conjugate(subject: PatternSubject, verb: PatternVerb): string {
  if (subject.person === "i") return verb.first ?? verb.base;
  if (subject.person === "sg3") return verb.third;
  return verb.base;
}

/** Kunci perbandingan kalimat: huruf kecil, tanda baca dibuang, spasi dirapikan. */
export function patternKey(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

/** Huruf pertama kapital dan titik di akhir: "She eats rice." */
function sentence(parts: string[]): string {
  const text = parts.join(" ").trim();
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}.` : "";
}

/** Kalimat dari pilihan pengguna; null bila ada pilihan yang tidak ada di soal. */
export function buildPatternSentence(prompt: PatternPrompt, response: Partial<PatternResponse> | null | undefined): string | null {
  const subject = prompt.subjects.find((s) => s.text === response?.subject);
  const verb = prompt.verbs.find((v) => v.base === response?.verb);
  const object = prompt.objects.find((o) => o === response?.object);
  if (!subject || !verb || object === undefined) return null;
  return sentence([subject.text, conjugate(subject, verb), object]);
}

/** Catatan singkat bahasa Indonesia saat subjek berubah (mis. I → She mengubah eat → eats). */
export function conjugationNote(subject: PatternSubject, verb: PatternVerb): string | null {
  const form = conjugate(subject, verb);
  if (subject.person === "sg3" && verb.third !== verb.base) {
    return `${subject.text} memakai bentuk kata kerja tunggal orang ketiga: ${verb.base} menjadi ${form}.`;
  }
  if (subject.person === "i" && verb.first && verb.first !== verb.base) {
    return `Setelah I, kata kerjanya ${verb.first} (bukan ${verb.base}).`;
  }
  if (subject.person === "other" && verb.third !== verb.base) {
    return `Setelah ${subject.text}, kata kerja memakai bentuk dasar: ${form} (tanpa -s).`;
  }
  return null;
}

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.length <= max ? t : null;
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Memeriksa data soal penyusun kalimat dan kalimat benarnya. Setiap kalimat benar harus bisa dibentuk dari pilihan yang tersedia. */
export function validatePattern(prompt: unknown, answer: unknown): Result<{ prompt: PatternPrompt; answer: { sentences: string[] } }> {
  if (!isRecord(prompt)) return { ok: false, error: "Penyusun kalimat: prompt harus berupa objek." };
  if (!isRecord(answer)) return { ok: false, error: "Penyusun kalimat: answer harus berupa objek." };

  const rawSubjects = Array.isArray(prompt.subjects) ? prompt.subjects : [];
  if (rawSubjects.length < 1 || rawSubjects.length > 8) return { ok: false, error: "Penyusun kalimat: butuh 1-8 subjek." };
  const subjects: PatternSubject[] = [];
  for (const s of rawSubjects) {
    const text = isRecord(s) ? str(s.text, 30) : null;
    const person = isRecord(s) && typeof s.person === "string" && PERSONS.includes(s.person) ? (s.person as PatternSubject["person"]) : null;
    if (!text || !person) return { ok: false, error: "Penyusun kalimat: tiap subjek butuh text dan person (i, sg3, atau other)." };
    subjects.push({ text, person });
  }
  if (new Set(subjects.map((s) => s.text)).size !== subjects.length) return { ok: false, error: "Penyusun kalimat: subjek tidak boleh kembar." };

  const rawVerbs = Array.isArray(prompt.verbs) ? prompt.verbs : [];
  if (rawVerbs.length < 1 || rawVerbs.length > 6) return { ok: false, error: "Penyusun kalimat: butuh 1-6 kata kerja." };
  const verbs: PatternVerb[] = [];
  for (const v of rawVerbs) {
    const base = isRecord(v) ? str(v.base, 30) : null;
    const third = isRecord(v) ? str(v.third, 30) : null;
    if (!base || !third) return { ok: false, error: "Penyusun kalimat: tiap kata kerja butuh base dan third." };
    const first = isRecord(v) && v.first !== undefined && v.first !== "" ? str(v.first, 30) : undefined;
    const meaning = isRecord(v) && v.meaning_id !== undefined && v.meaning_id !== "" ? str(v.meaning_id, 80) : undefined;
    if (first === null || meaning === null) return { ok: false, error: "Penyusun kalimat: first/meaning_id tidak valid." };
    verbs.push({ base, third, ...(first ? { first } : {}), ...(meaning ? { meaning_id: meaning } : {}) });
  }
  if (new Set(verbs.map((v) => v.base)).size !== verbs.length) return { ok: false, error: "Penyusun kalimat: kata kerja tidak boleh kembar." };

  const rawObjects = Array.isArray(prompt.objects) ? prompt.objects : [];
  const objects = rawObjects.map((o) => str(o, 40));
  if (objects.length < 1 || objects.length > 8 || objects.some((o) => o === null)) return { ok: false, error: "Penyusun kalimat: butuh 1-8 objek." };
  if (new Set(objects).size !== objects.length) return { ok: false, error: "Penyusun kalimat: objek tidak boleh kembar." };

  const hint = prompt.hint === undefined || prompt.hint === null || prompt.hint === "" ? undefined : str(prompt.hint, 200);
  const note = prompt.note_id === undefined || prompt.note_id === null || prompt.note_id === "" ? undefined : str(prompt.note_id, 400);
  if (hint === null || note === null) return { ok: false, error: "Penyusun kalimat: hint/note_id terlalu panjang." };

  const sentences = Array.isArray(answer.sentences) ? answer.sentences.map((s) => str(s, 200)) : [];
  if (sentences.length < 1 || sentences.length > 4 || sentences.some((s) => s === null)) return { ok: false, error: "Penyusun kalimat: butuh 1-4 kalimat benar." };

  const value: PatternPrompt = { subjects, verbs, objects: objects as string[], ...(hint ? { hint } : {}), ...(note ? { note_id: note } : {}) };
  const buildable = new Set<string>();
  for (const s of subjects) for (const v of verbs) for (const o of value.objects) buildable.add(patternKey(`${s.text} ${conjugate(s, v)} ${o}`));
  for (const s of sentences as string[]) {
    if (!buildable.has(patternKey(s))) return { ok: false, error: `Penyusun kalimat: kalimat benar "${s}" tidak bisa dibentuk dari pilihan yang tersedia.` };
  }
  return { ok: true, value: { prompt: value, answer: { sentences: sentences as string[] } } };
}
