// Pengayaan tabel core_words dengan data NGSL tambahan: definisi bahasa Inggris sederhana dan bentuk kata.
//
// Skrip ini HANYA meng-UPDATE baris core_words yang sudah ada (kolom definition_en dan forms, dari migrasi
// 0015_core_words_enrichment.sql). Tidak pernah INSERT dan tidak menyentuh band/cefr_estimate/pos/example.
// File NGSL TIDAK disertakan di repo. Unduh dari https://www.newgeneralservicelist.com/new-general-service-list
// (lisensi CC BY-SA 4.0, Browne, Culligan & Phillips; atribusi ada di halaman /help):
//   - "NGSL 1.2 list with definitions in easy English" (xlsx). Buka di Excel, lalu Save As -> CSV UTF-8.
//     Skrip tidak membaca xlsx agar tidak butuh dependensi baru.
//   - "NGSL 1.2 alphabetized and lemmatized for teaching" (CSV).
//
// Pakai:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/enrich-ngsl.mjs --definitions defs.csv --forms teaching.csv [--dry-run]
//
// Salah satu --definitions / --forms boleh dihilangkan. --dry-run hanya mencetak laporan (tetap membaca
// daftar kata dari database). Untuk mencoba TANPA database, pakai --core-from <NGSL_1.2_stats.csv>:
// daftar kata diambil dari file peringkat itu (peringkat <= 2800, sama seperti import-ngsl.mjs) dan
// skrip otomatis menjadi dry-run.

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { buildEnrichment, parseCsv, parseDefinitions, parseForms } from "./lib/ngsl-enrich.mjs";

const MAX_BAND = 2800; // sama dengan batas pemetaan di import-ngsl.mjs
const BATCH = 200;

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (name) => process.argv.includes(`--${name}`);

const definitionsPath = arg("definitions");
const formsPath = arg("forms");
const coreFrom = arg("core-from");
const dryRun = has("dry-run") || !!coreFrom;

if (!definitionsPath && !formsPath) {
  console.error("Pemakaian: node scripts/enrich-ngsl.mjs --definitions defs.csv --forms teaching.csv [--dry-run]");
  process.exit(1);
}

const read = (p) => fs.readFileSync(p, "utf8");
let definitions;
let forms;
try {
  if (definitionsPath) definitions = parseDefinitions(read(definitionsPath));
  if (formsPath) forms = parseForms(read(formsPath));
} catch (error) {
  console.error(`Gagal membaca file: ${error.message}`);
  process.exit(1);
}
if (definitions) console.log(`File definisi: ${definitions.size} kata.`);
if (forms) console.log(`File bentuk kata: ${forms.size} headword.`);

// Daftar kata yang sudah ada di core_words
let supabase = null;
let coreWords = [];
if (coreFrom) {
  const rows = parseCsv(read(coreFrom));
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const iWord = header.findIndex((h) => h === "lemma" || h === "word");
  const iRank = header.findIndex((h) => h === "rank" || h === "band" || h === "sfi rank");
  if (iWord < 0) {
    console.error(`Kolom 'lemma' atau 'word' tidak ditemukan di ${coreFrom}.`);
    process.exit(1);
  }
  coreWords = rows
    .slice(1)
    .filter((r, idx) => (iRank >= 0 ? Number(r[iRank]) : idx + 1) <= MAX_BAND)
    .map((r) => r[iWord].trim().toLowerCase())
    .filter(Boolean);
  console.log(`Daftar kata dari ${coreFrom} (tanpa database): ${coreWords.length} kata.`);
} else {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di environment (atau pakai --core-from untuk uji tanpa database).");
    process.exit(1);
  }
  supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("core_words").select("word").order("band").range(from, from + 999);
    if (error) {
      console.error(`Gagal membaca core_words: ${error.message}`);
      process.exit(1);
    }
    coreWords.push(...data.map((r) => r.word));
    if (data.length < 1000) break;
  }
  console.log(`core_words di database: ${coreWords.length} kata.`);
}

const report = buildEnrichment(coreWords, { definitions, forms });
const sample = (list) => (list.length ? ` Contoh: ${list.slice(0, 8).join(", ")}${list.length > 8 ? ", ..." : ""}` : "");

console.log("\n=== Laporan ===");
console.log(`Kata yang akan diperbarui: ${report.updates.length}`);
if (definitions) {
  console.log(`  dengan definisi: ${report.withDefinition}`);
  console.log(`  kata di file definisi yang tidak ada di core_words: ${report.definitionsNotInCore.length}.${sample(report.definitionsNotInCore)}`);
  console.log(`  kata core_words tanpa definisi: ${report.coreWithoutDefinition.length}.${sample(report.coreWithoutDefinition)}`);
}
if (forms) {
  console.log(`  dengan bentuk kata: ${report.withForms}`);
  console.log(`  headword di file bentuk yang tidak ada di core_words: ${report.formsNotInCore.length}.${sample(report.formsNotInCore)}`);
}

if (dryRun) {
  console.log("\n--dry-run: tidak ada yang ditulis.");
  process.exit(0);
}

// UPDATE per kata (bukan upsert: upsert parsial bisa memicu INSERT dan melanggar NOT NULL). Per batch paralel.
let done = 0;
for (let i = 0; i < report.updates.length; i += BATCH) {
  const chunk = report.updates.slice(i, i + BATCH);
  const results = await Promise.all(
    chunk.map(({ word, ...patch }) => supabase.from("core_words").update(patch).eq("word", word))
  );
  const failed = results.find((r) => r.error);
  if (failed) {
    console.error(`Gagal pada batch ${i + 1}-${i + chunk.length}: ${failed.error.message}`);
    if (failed.error.code === "42703" || failed.error.code === "PGRST204") {
      console.error("Kolom baru belum ada. Jalankan supabase/migrations/0015_core_words_enrichment.sql lebih dulu.");
    }
    process.exit(1);
  }
  done += chunk.length;
  console.log(`Diperbarui ${done}/${report.updates.length}`);
}
console.log("Selesai.");
