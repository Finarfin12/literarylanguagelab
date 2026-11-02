// Penilaian dan validasi soal latihan (Fase 15). Fungsi murni tanpa akses database dan tanpa AI.
// Tanpa impor runtime agar bisa diuji unit (tests/exercises.test.mts); hanya `import type`.
import type {
  ClozeAnswer,
  ClozePrompt,
  DictationAnswer,
  DictationPrompt,
  Exercise,
  ExerciseDraft,
  ExerciseSkill,
  ExerciseType,
  GradeResult,
  MatchAnswer,
  MatchPrompt,
  McqAnswer,
  McqPrompt,
  OrderAnswer,
  OrderPrompt,
  ValidationResult,
} from "./types";

const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];
const TYPES: readonly string[] = ["mcq", "cloze", "order", "match", "dictation"];
const BLANK = "___";

/**
 * Menyamakan jawaban untuk perbandingan: huruf kecil, apostrof lurus/miring disamakan, tanda baca dan tanda hubung
 * menjadi spasi, spasi berlebih dibuang. "She's  Happy!" dan "she’s happy" dianggap sama.
 */
export function normalizeAnswer(input: unknown): string {
  return String(input ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter(Boolean)
    .join(" ");
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

/** Hasil kosong untuk jawaban yang bentuknya rusak (tidak pernah melempar error). */
function wrong(expected: string): GradeResult {
  return { correct: false, expected, score: 0 };
}

/** Isi bagian kosong cloze dengan jawaban pertama tiap bagian. */
export function fillCloze(text: string, blanks: string[][]): string {
  let i = 0;
  return text.split(BLANK).reduce((acc, part, idx) => (idx === 0 ? part : acc + (blanks[i++]?.[0] ?? BLANK) + part), "");
}

/**
 * Menilai satu jawaban. `response` datang dari klien atau dari body request, jadi bentuknya tidak dipercaya:
 * bentuk yang salah dinilai salah, bukan error.
 */
export function gradeAnswer(exercise: Pick<Exercise, "type" | "prompt" | "answer">, response: unknown): GradeResult {
  const r = isRecord(response) ? response : {};

  switch (exercise.type) {
    case "mcq": {
      const answer = exercise.answer as McqAnswer;
      const choice = typeof r.choice === "string" ? r.choice.trim() : "";
      const correct = choice !== "" && choice === answer.correct.trim();
      return { correct, expected: answer.correct, score: correct ? 1 : 0 };
    }
    case "cloze": {
      const answer = exercise.answer as ClozeAnswer;
      const prompt = exercise.prompt as ClozePrompt;
      const expected = fillCloze(prompt.text, answer.blanks);
      if (!isStringArray(r.blanks)) return wrong(expected);
      const given = r.blanks;
      const right = answer.blanks.filter((accepted, i) => {
        const g = normalizeAnswer(given[i]);
        return g !== "" && accepted.some((a) => normalizeAnswer(a) === g);
      }).length;
      const total = answer.blanks.length;
      return { correct: total > 0 && right === total, expected, score: total ? right / total : 0 };
    }
    case "order": {
      const answer = exercise.answer as OrderAnswer;
      const expected = answer.sentences[0] ?? "";
      if (!isStringArray(r.order)) return wrong(expected);
      const given = normalizeAnswer(r.order.join(" "));
      const correct = given !== "" && answer.sentences.some((s) => normalizeAnswer(s) === given);
      return { correct, expected, score: correct ? 1 : 0 };
    }
    case "match": {
      const answer = exercise.answer as MatchAnswer;
      const expected = answer.pairs.map((p) => `${p.left} = ${p.right}`).join("; ");
      const given = isRecord(r.pairs) ? r.pairs : null;
      if (!given) return wrong(expected);
      const right = answer.pairs.filter((p) => given[p.left] === p.right).length;
      const total = answer.pairs.length;
      return { correct: total > 0 && right === total, expected, score: total ? right / total : 0 };
    }
    case "dictation": {
      const answer = exercise.answer as DictationAnswer;
      const expected = answer.accept[0] ?? "";
      const given = typeof r.text === "string" ? normalizeAnswer(r.text) : "";
      const correct = given !== "" && answer.accept.some((a) => normalizeAnswer(a) === given);
      return { correct, expected, score: correct ? 1 : 0 };
    }
    default:
      return wrong("");
  }
}

/** Keterampilan yang dicatat sebagai bukti kemampuan untuk soal ini. */
export function exerciseSkill(exercise: { type: ExerciseType; tags?: string[] | null }): ExerciseSkill {
  if (exercise.type === "dictation") return "listening";
  if (exercise.type === "match") return "vocabulary";
  if ((exercise.tags ?? []).some((t) => t === "core-word" || t === "vocab")) return "vocabulary";
  return "grammar";
}

// ---------------------------------------------------------------------------------------------------------------
// Validasi: dipakai untuk keluaran AI, formulir admin, generator, dan membaca baris database.

function text(v: unknown, min: number, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length >= min && t.length <= max ? t : null;
}

function uniqueStrings(v: unknown, min: number, max: number, maxLen: number): string[] | null {
  if (!Array.isArray(v) || v.length < min || v.length > max) return null;
  const out: string[] = [];
  for (const item of v) {
    const t = text(item, 1, maxLen);
    if (t === null) return null;
    out.push(t);
  }
  return new Set(out).size === out.length ? out : null;
}

function validatePrompt(type: ExerciseType, prompt: unknown, answer: unknown): ValidationResult<{ prompt: unknown; answer: unknown }> {
  if (!isRecord(prompt)) return { ok: false, error: "prompt harus berupa objek." };
  if (!isRecord(answer)) return { ok: false, error: "answer harus berupa objek." };

  switch (type) {
    case "mcq": {
      const question = text(prompt.question, 3, 400);
      const options = uniqueStrings(prompt.options, 2, 6, 240);
      const correct = text(answer.correct, 1, 240);
      if (!question) return { ok: false, error: "Pilihan ganda: pertanyaan wajib (3-400 karakter)." };
      if (!options) return { ok: false, error: "Pilihan ganda: butuh 2-6 pilihan yang berbeda." };
      if (!correct || !options.includes(correct)) return { ok: false, error: "Pilihan ganda: jawaban benar harus sama persis dengan salah satu pilihan." };
      const value: { prompt: McqPrompt; answer: McqAnswer } = { prompt: { question, options }, answer: { correct } };
      return { ok: true, value };
    }
    case "cloze": {
      const body = text(prompt.text, 3, 500);
      if (!body) return { ok: false, error: "Isian: teks soal wajib (3-500 karakter)." };
      const count = body.split(BLANK).length - 1;
      if (count < 1 || count > 5) return { ok: false, error: `Isian: teks harus memuat 1-5 bagian kosong "${BLANK}".` };
      if (!Array.isArray(answer.blanks) || answer.blanks.length !== count) {
        return { ok: false, error: `Isian: jumlah jawaban (${Array.isArray(answer.blanks) ? answer.blanks.length : 0}) harus sama dengan jumlah bagian kosong (${count}).` };
      }
      const blanks: string[][] = [];
      for (const entry of answer.blanks) {
        const list = typeof entry === "string" ? [entry] : entry;
        if (!Array.isArray(list) || list.length < 1 || list.length > 6) return { ok: false, error: "Isian: tiap bagian kosong butuh 1-6 jawaban yang diterima." };
        const cleaned: string[] = [];
        for (const a of list) {
          const t = text(a, 1, 80);
          if (t === null) return { ok: false, error: "Isian: jawaban tidak boleh kosong atau lebih dari 80 karakter." };
          cleaned.push(t);
        }
        blanks.push(cleaned);
      }
      const hint = prompt.hint === undefined || prompt.hint === null || prompt.hint === "" ? undefined : text(prompt.hint, 1, 200);
      if (hint === null) return { ok: false, error: "Isian: petunjuk maksimal 200 karakter." };
      const value: { prompt: ClozePrompt; answer: ClozeAnswer } = { prompt: hint ? { text: body, hint } : { text: body }, answer: { blanks } };
      return { ok: true, value };
    }
    case "order": {
      const tokens = Array.isArray(prompt.tokens) && prompt.tokens.every((t) => typeof t === "string" && t.trim().length > 0 && t.trim().length <= 40)
        ? (prompt.tokens as string[]).map((t) => t.trim())
        : null;
      if (!tokens || tokens.length < 2 || tokens.length > 20) return { ok: false, error: "Susun kalimat: butuh 2-20 kata/potongan (maks. 40 karakter)." };
      const sentences = uniqueStrings(answer.sentences, 1, 6, 300);
      if (!sentences) return { ok: false, error: "Susun kalimat: butuh 1-6 kalimat benar yang berbeda." };
      // Potongan boleh berisi lebih dari satu kata: bandingkan kumpulan kata setelah dinormalkan
      const key = (list: string[]) => list.flatMap((t) => normalizeAnswer(t).split(" ")).filter(Boolean).sort().join("|");
      const want = key(tokens);
      for (const s of sentences) {
        if (key([s]) !== want) return { ok: false, error: `Susun kalimat: kalimat benar "${s}" tidak tersusun dari tepat semua potongan.` };
      }
      const hint = prompt.hint === undefined || prompt.hint === null || prompt.hint === "" ? undefined : text(prompt.hint, 1, 200);
      if (hint === null) return { ok: false, error: "Susun kalimat: petunjuk maksimal 200 karakter." };
      const value: { prompt: OrderPrompt; answer: OrderAnswer } = { prompt: hint ? { tokens, hint } : { tokens }, answer: { sentences } };
      return { ok: true, value };
    }
    case "match": {
      const lefts = uniqueStrings(prompt.lefts, 2, 8, 160);
      const rights = uniqueStrings(prompt.rights, 2, 8, 240);
      if (!lefts || !rights || lefts.length !== rights.length) return { ok: false, error: "Pasangkan: kiri dan kanan harus sama banyak (2-8) dan tidak boleh ada yang kembar." };
      if (!Array.isArray(answer.pairs) || answer.pairs.length !== lefts.length) return { ok: false, error: "Pasangkan: setiap item kiri butuh satu pasangan." };
      const pairs: { left: string; right: string }[] = [];
      for (const p of answer.pairs) {
        if (!isRecord(p) || typeof p.left !== "string" || typeof p.right !== "string") return { ok: false, error: "Pasangkan: pasangan harus berbentuk {left, right}." };
        pairs.push({ left: p.left.trim(), right: p.right.trim() });
      }
      const usedLeft = new Set(pairs.map((p) => p.left));
      const usedRight = new Set(pairs.map((p) => p.right));
      if (!lefts.every((l) => usedLeft.has(l)) || usedLeft.size !== lefts.length) return { ok: false, error: "Pasangkan: setiap item kiri harus muncul tepat sekali di jawaban." };
      if (!rights.every((r) => usedRight.has(r)) || usedRight.size !== rights.length) return { ok: false, error: "Pasangkan: setiap item kanan harus dipakai tepat sekali di jawaban." };
      const instruction = prompt.instruction === undefined || prompt.instruction === null || prompt.instruction === "" ? undefined : text(prompt.instruction, 1, 200);
      if (instruction === null) return { ok: false, error: "Pasangkan: petunjuk maksimal 200 karakter." };
      const value: { prompt: MatchPrompt; answer: MatchAnswer } = { prompt: instruction ? { lefts, rights, instruction } : { lefts, rights }, answer: { pairs } };
      return { ok: true, value };
    }
    case "dictation": {
      const spoken = text(prompt.text, 1, 300);
      if (!spoken) return { ok: false, error: "Dikte: kalimat yang dibacakan wajib (maks. 300 karakter)." };
      let accept: string[] = [spoken];
      if (answer.accept !== undefined && answer.accept !== null) {
        const list = uniqueStrings(answer.accept, 1, 6, 300);
        if (!list) return { ok: false, error: "Dikte: jawaban yang diterima maksimal 6 dan tidak boleh kosong." };
        accept = list;
      }
      if (!accept.some((a) => normalizeAnswer(a) === normalizeAnswer(spoken))) accept = [spoken, ...accept];
      const value: { prompt: DictationPrompt; answer: DictationAnswer } = { prompt: { text: spoken }, answer: { accept } };
      return { ok: true, value };
    }
  }
}

/** Memeriksa dan merapikan satu soal. Tidak melempar error; `error` berisi alasan berbahasa Indonesia. */
export function validateExerciseDraft(raw: unknown): ValidationResult<ExerciseDraft> {
  if (!isRecord(raw)) return { ok: false, error: "Soal harus berupa objek." };
  const type = typeof raw.type === "string" ? raw.type : "";
  if (!TYPES.includes(type)) return { ok: false, error: "Tipe soal tidak dikenal." };
  const cefr = typeof raw.cefr_level === "string" ? raw.cefr_level.trim().toUpperCase() : "";
  if (!CEFR.includes(cefr)) return { ok: false, error: "Level CEFR tidak valid." };

  const topic = raw.topic_slug === undefined || raw.topic_slug === null || raw.topic_slug === "" ? null : raw.topic_slug;
  if (topic !== null && !(typeof topic === "string" && /^[a-z0-9-]{2,64}$/.test(topic))) return { ok: false, error: "Slug topik tidak valid." };
  const unit = raw.unit_slug === undefined || raw.unit_slug === null || raw.unit_slug === "" ? null : raw.unit_slug;
  if (unit !== null && !(typeof unit === "string" && /^[a-z0-9-]{2,64}$/.test(unit))) return { ok: false, error: "Slug unit tidak valid." };

  const tagsRaw = raw.tags === undefined || raw.tags === null ? [] : raw.tags;
  if (!isStringArray(tagsRaw) || tagsRaw.length > 12) return { ok: false, error: "Tag maksimal 12 dan berupa teks." };
  const tags = Array.from(new Set(tagsRaw.map((t) => t.trim()).filter(Boolean)));
  if (tags.some((t) => t.length > 60)) return { ok: false, error: "Satu tag maksimal 60 karakter." };

  const explanation = text(raw.explanation_id, 3, 1200);
  if (!explanation) return { ok: false, error: "Penjelasan bahasa Indonesia wajib (3-1200 karakter)." };

  const body = validatePrompt(type as ExerciseType, raw.prompt, raw.answer);
  if (!body.ok) return body;

  return {
    ok: true,
    value: {
      type,
      cefr_level: cefr,
      topic_slug: topic as string | null,
      unit_slug: unit as string | null,
      tags,
      explanation_id: explanation,
      ...(body.value as { prompt: never; answer: never }),
    } as ExerciseDraft,
  };
}

/** Baris database → soal. null jika `prompt`/`answer` rusak, supaya satu baris buruk tidak merusak sesi. */
export function parseExerciseRow(row: unknown): Exercise | null {
  if (!isRecord(row) || typeof row.id !== "string") return null;
  const result = validateExerciseDraft(row);
  return result.ok ? ({ ...result.value, id: row.id } as Exercise) : null;
}
