// Impor daftar NGSL 1.2 ke tabel core_words.
//
// File NGSL TIDAK disertakan di repo. Unduh sendiri "NGSL 1.2 with basic statistics" (CSV)
// dari https://www.newgeneralservicelist.com/new-general-service-list
// Lisensi NGSL: CC BY-SA 4.0 (Browne, Culligan & Phillips). Atribusi ada di halaman /help.
//
// Pakai:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/import-ngsl.mjs path/ke/NGSL.csv [--dry-run]
//
// Kolom yang dikenali (tanpa peduli huruf besar/kecil): lemma|word, rank|band (opsional),
// pos (opsional), example (opsional). Tanpa kolom rank, urutan baris dipakai sebagai peringkat.
// Pemetaan band -> CEFR sama dengan BAND_LIMITS di lib/cefr.ts (usulan, perlu konfirmasi pemilik).

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BAND_LIMITS = [
  [500, "A1"],
  [1000, "A2"],
  [2000, "B1"],
  [2800, "B2"],
];

function bandToCefr(band) {
  for (const [max, level] of BAND_LIMITS) if (band <= max) return level;
  return null;
}

// Parser CSV sederhana yang mendukung tanda kutip ganda.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const file = args.find((a) => !a.startsWith("--"));
if (!file) {
  console.error("Pemakaian: node scripts/import-ngsl.mjs path/ke/NGSL.csv [--dry-run]");
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const header = rows.shift().map((h) => h.trim().toLowerCase());
const col = (...names) => header.findIndex((h) => names.includes(h));
const iWord = col("lemma", "word");
const iRank = col("rank", "band", "sfi rank");
const iPos = col("pos");
const iExample = col("example");
if (iWord < 0) {
  console.error(`Kolom 'lemma' atau 'word' tidak ditemukan. Header: ${header.join(", ")}`);
  process.exit(1);
}

const seen = new Set();
const records = [];
rows.forEach((r, idx) => {
  const word = (r[iWord] || "").trim().toLowerCase();
  if (!word || seen.has(word)) return;
  const band = iRank >= 0 ? Number(r[iRank]) : idx + 1;
  const cefr = bandToCefr(band);
  if (!Number.isFinite(band) || !cefr) return; // di luar rentang NGSL yang dipetakan
  seen.add(word);
  records.push({
    word,
    band,
    cefr_estimate: cefr,
    pos: iPos >= 0 ? (r[iPos] || "").trim() || null : null,
    example: iExample >= 0 ? (r[iExample] || "").trim() || null : null,
  });
});

const byLevel = records.reduce((acc, r) => ((acc[r.cefr_estimate] = (acc[r.cefr_estimate] || 0) + 1), acc), {});
console.log(`Terbaca ${records.length} kata unik.`, byLevel);

if (dryRun) {
  console.log("--dry-run: tidak ada yang ditulis.");
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di environment.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

for (let i = 0; i < records.length; i += 500) {
  const chunk = records.slice(i, i + 500);
  const { error } = await supabase.from("core_words").upsert(chunk, { onConflict: "word" });
  if (error) {
    console.error(`Gagal pada baris ${i + 1}-${i + chunk.length}: ${error.message}`);
    process.exit(1);
  }
  console.log(`Tersimpan ${Math.min(i + 500, records.length)}/${records.length}`);
}
console.log("Selesai.");
