// Logika murni pengayaan Kosakata Inti per tema (Fase 22.5): membaca CSV buatan pemilik dan menyusun UPDATE.
// Tanpa akses database dan tanpa dependensi baru; diuji di tests/a0-enrich.test.mts.
//
// Format CSV (baris pertama = header, UTF-8):
//   word,theme,translation_id
//   mother,keluarga,ibu
//   water,makanan-minuman,air
// - word: kata Inggris yang SUDAH ada di core_words (skrip tidak pernah INSERT).
// - theme: slug huruf kecil (a-z, 0-9, tanda hubung), mis. keluarga, makanan-minuman, rumah, waktu.
// - translation_id: arti bahasa Indonesia singkat yang sudah ditinjau pemilik (maks. 120 karakter).
// Baris yang tidak sah dilaporkan dan dilewati; satu kata hanya boleh muncul sekali (yang pertama dipakai).
import { parseCsv } from "./ngsl-enrich.mjs";

const THEME = /^[a-z0-9-]{2,40}$/;
const WORD = /^[a-z][a-z' -]{0,38}$/;

/** @returns {{ rows: {word: string, theme: string, translation_id: string}[], errors: string[] }} */
export function parseThemeCsv(csvText) {
  const table = parseCsv(csvText);
  const errors = [];
  if (table.length === 0) return { rows: [], errors: ["File kosong."] };
  const header = table[0].map((h) => h.trim().toLowerCase());
  const iWord = header.indexOf("word");
  const iTheme = header.indexOf("theme");
  const iTr = header.indexOf("translation_id");
  if (iWord < 0 || iTheme < 0 || iTr < 0) return { rows: [], errors: ["Header harus berisi kolom word, theme, dan translation_id."] };

  const seen = new Set();
  const rows = [];
  table.slice(1).forEach((r, idx) => {
    const line = idx + 2;
    if (r.every((c) => !String(c).trim())) return;
    const word = String(r[iWord] ?? "").trim().toLowerCase();
    const theme = String(r[iTheme] ?? "").trim().toLowerCase();
    const tr = String(r[iTr] ?? "").trim();
    if (!WORD.test(word)) return errors.push(`Baris ${line}: kata "${word}" tidak valid.`);
    if (!THEME.test(theme)) return errors.push(`Baris ${line}: tema "${theme}" tidak valid (huruf kecil, angka, tanda hubung).`);
    if (!tr || tr.length > 120) return errors.push(`Baris ${line}: arti Indonesia wajib dan maksimal 120 karakter.`);
    if (seen.has(word)) return errors.push(`Baris ${line}: kata "${word}" sudah muncul sebelumnya (dilewati).`);
    seen.add(word);
    rows.push({ word, theme, translation_id: tr });
  });
  return { rows, errors };
}

/**
 * Menyusun UPDATE hanya untuk kata yang ada di core_words.
 * @param {string[]} coreWords daftar kata (huruf kecil) di core_words
 */
export function buildThemeUpdates(coreWords, rows) {
  const core = new Set(coreWords.map((w) => String(w).toLowerCase()));
  const updates = [];
  const notInCore = [];
  for (const r of rows) {
    if (core.has(r.word)) updates.push({ word: r.word, theme: r.theme, translation_id: r.translation_id });
    else notInCore.push(r.word);
  }
  const themes = {};
  for (const u of updates) themes[u.theme] = (themes[u.theme] ?? 0) + 1;
  return { updates, notInCore, themes };
}
