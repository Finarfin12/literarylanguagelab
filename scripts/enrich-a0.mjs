// Pengayaan Kosakata Inti per tema (Fase 22.5): mengisi kolom theme dan translation_id di core_words dari CSV
// yang ditinjau pemilik (±300 kata A1). Format CSV ada di scripts/lib/a0-enrich.mjs.
//
// Skrip ini HANYA meng-UPDATE baris core_words yang sudah ada (kolom dari migrasi 0022_core_words_a0.sql). Tidak pernah
// INSERT dan tidak menyentuh band/cefr_estimate/pos/example/definition_en/forms. Tanpa dataset atau API pihak ketiga.
//
// Pakai:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/enrich-a0.mjs --csv kata-per-tema.csv [--dry-run]
//
// --dry-run membaca daftar kata dari database tetapi tidak menulis apa pun.

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { buildThemeUpdates, parseThemeCsv } from "./lib/a0-enrich.mjs";

const BATCH = 100;
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const dryRun = process.argv.includes("--dry-run");

const csvPath = arg("csv");
if (!csvPath) {
  console.error("Pemakaian: node scripts/enrich-a0.mjs --csv kata-per-tema.csv [--dry-run]");
  process.exit(1);
}

let parsed;
try {
  parsed = parseThemeCsv(fs.readFileSync(csvPath, "utf8"));
} catch (error) {
  console.error(`Gagal membaca ${csvPath}: ${error.message}`);
  process.exit(1);
}
console.log(`CSV: ${parsed.rows.length} baris sah, ${parsed.errors.length} masalah.`);
for (const e of parsed.errors.slice(0, 20)) console.log(`  - ${e}`);
if (parsed.errors.length > 20) console.log(`  ... dan ${parsed.errors.length - 20} lainnya.`);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di environment.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const coreWords = [];
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

const report = buildThemeUpdates(coreWords, parsed.rows);
console.log("\n=== Laporan ===");
console.log(`Kata yang akan diperbarui: ${report.updates.length}`);
for (const [theme, n] of Object.entries(report.themes)) console.log(`  tema ${theme}: ${n} kata`);
console.log(`Kata di CSV yang tidak ada di core_words (dilewati): ${report.notInCore.length}${report.notInCore.length ? `. Contoh: ${report.notInCore.slice(0, 10).join(", ")}` : ""}`);

if (dryRun) {
  console.log("\n--dry-run: tidak ada yang ditulis.");
  process.exit(0);
}

let done = 0;
let failed = 0;
for (let i = 0; i < report.updates.length; i += BATCH) {
  const chunk = report.updates.slice(i, i + BATCH);
  const results = await Promise.all(chunk.map(({ word, ...patch }) => supabase.from("core_words").update(patch).eq("word", word)));
  for (const r of results) {
    if (r.error) {
      failed++;
      if (failed <= 5) console.error(`Gagal: ${r.error.message}`);
    } else done++;
  }
}
console.log(`\nSelesai: ${done} diperbarui, ${failed} gagal.`);
process.exit(failed > 0 ? 1 : 0);
