// Logika murni untuk scripts/enrich-ngsl.mjs: membaca file NGSL (definisi & bentuk kata) dan menyusun
// pembaruan untuk tabel core_words. Tanpa akses jaringan/berkas agar bisa diuji unit.
// File NGSL: https://www.newgeneralservicelist.com (CC BY-SA 4.0, Browne, Culligan & Phillips).

/** Parser CSV sederhana (kutip ganda, baris baru di dalam kutip). Baris kosong dilewati. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') inQuotes = false;
      else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

/**
 * Potongan kontraksi yang muncul sebagai "bentuk kata" di file NGSL (mis. `be` memuat `m`, `s`, `isn`;
 * `have` memuat `ve`, `d`). Bukan kata sungguhan, jadi dibuang.
 */
export const CONTRACTION_FRAGMENTS = new Set([
  "s", "m", "re", "ve", "ll", "d", "t", "isn", "aren", "ain", "wasn", "weren", "don", "doesn", "didn",
  "hasn", "haven", "hadn", "won", "wouldn", "couldn", "shouldn", "mustn", "needn", "bein",
]);

const normWord = (s) => String(s ?? "").trim().toLowerCase();

/**
 * File definisi ("with English definitions"): kolom kata diawali "word", kolom definisi diawali "defin"
 * (ejaan di file asli "Definitons"). Hasil: Map kata(huruf kecil) → definisi. Kata ganda digabung dengan "; ".
 */
export function parseDefinitions(csvText) {
  const rows = parseCsv(csvText);
  if (rows.length === 0) return new Map();
  const header = rows[0].map((h) => normWord(h));
  const iWord = header.findIndex((h) => h.startsWith("word"));
  const iDef = header.findIndex((h) => h.startsWith("defin"));
  if (iWord < 0 || iDef < 0) {
    throw new Error(`Kolom kata/definisi tidak ditemukan. Header: ${header.join(", ")}`);
  }

  const out = new Map();
  for (const r of rows.slice(1)) {
    const word = normWord(r[iWord]);
    const definition = String(r[iDef] ?? "").replace(/\s+/g, " ").trim();
    if (!word || !definition) continue;
    const prev = out.get(word);
    if (!prev) out.set(word, definition);
    else if (!prev.split("; ").includes(definition)) out.set(word, `${prev}; ${definition}`);
  }
  return out;
}

const FORM_PATTERN = /^\p{L}+(?:-\p{L}+)*$/u;

/**
 * File bentuk kata ("lemmatized for teaching"): baris `##` adalah komentar; tiap baris = headword lalu
 * bentuk-bentuknya. Homograf (headword sama di beberapa baris) digabung. Headword sendiri, potongan
 * kontraksi, dan bentuk yang bukan huruf/tanda hubung (mis. "web site") dibuang.
 * Hasil: Map headword(huruf kecil) → array bentuk (urutan kemunculan, tanpa duplikat).
 */
export function parseForms(csvText) {
  const out = new Map();
  for (const line of csvText.replace(/^﻿/, "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("##")) continue;
    const [head, ...rest] = trimmed.split(",").map(normWord);
    if (!head) continue;
    const list = out.get(head) ?? [];
    for (const form of rest) {
      if (!form || form === head || CONTRACTION_FRAGMENTS.has(form) || !FORM_PATTERN.test(form)) continue;
      if (!list.includes(form)) list.push(form);
    }
    out.set(head, list);
  }
  return out;
}

/**
 * Indeks varian ejaan bertanda hubung: "e-mail" (file) ↔ "email" (core_words). Hanya untuk kunci bertanda hubung
 * yang sendiri tidak ada di core_words, supaya tidak pernah menimpa kata yang cocok persis.
 */
function hyphenIndex(map, core) {
  const index = new Map();
  if (!map) return index;
  for (const key of map.keys()) {
    if (key.includes("-") && !core.has(key)) index.set(key.replace(/-/g, ""), key);
  }
  return index;
}

/**
 * Susun pembaruan untuk kata yang SUDAH ADA di core_words (tidak pernah menambah kata baru).
 * @param {string[]} coreWords daftar core_words.word
 * @param {{ definitions?: Map<string,string>, forms?: Map<string,string[]> }} sources salah satu boleh kosong
 */
export function buildEnrichment(coreWords, { definitions, forms } = {}) {
  const core = new Set(coreWords.map(normWord));
  const defAlias = hyphenIndex(definitions, core);
  const formAlias = hyphenIndex(forms, core);
  const usedDefKeys = new Set();
  const usedFormKeys = new Set();
  const updates = [];
  let withDefinition = 0;
  let withForms = 0;

  for (const word of [...core].sort()) {
    const patch = {};

    const defKey = definitions?.has(word) ? word : defAlias.get(word);
    if (defKey !== undefined && definitions?.has(defKey)) {
      usedDefKeys.add(defKey);
      patch.definition_en = definitions.get(defKey);
      withDefinition++;
    }

    const formKey = forms?.has(word) ? word : formAlias.get(word);
    if (formKey !== undefined && forms?.has(formKey)) {
      usedFormKeys.add(formKey);
      const f = forms.get(formKey);
      patch.forms = f;
      if (f.length > 0) withForms++;
    }

    if (Object.keys(patch).length > 0) updates.push({ word, ...patch });
  }

  return {
    updates,
    withDefinition,
    withForms,
    definitionsNotInCore: definitions ? [...definitions.keys()].filter((w) => !core.has(w) && !usedDefKeys.has(w)).sort() : [],
    formsNotInCore: forms ? [...forms.keys()].filter((w) => !core.has(w) && !usedFormKeys.has(w)).sort() : [],
    coreWithoutDefinition: definitions ? [...core].filter((w) => !updates.some((u) => u.word === w && u.definition_en)).sort() : [],
  };
}
