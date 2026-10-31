// Bandingkan dua keluaran `eslint -f json` dan cetak temuan BARU (repo punya ±370 temuan lama; kriterianya
// "tidak ada temuan baru dibanding HEAD", bukan nol). Nomor baris diabaikan supaya geseran baris tidak dihitung.
//
// Pakai:
//   git stash -u && npx eslint . -f json > before.json; git stash pop      # baseline (HEAD tanpa perubahanmu)
//   npx eslint . -f json > after.json                                       # dengan perubahanmu
//   node scripts/lint-diff.mjs before.json after.json
// Atau commit baseline lebih dulu: simpan before.json dari commit sebelum fase, lalu bandingkan.
import fs from "node:fs";

function load(file) {
  const counts = new Map();
  for (const f of JSON.parse(fs.readFileSync(file, "utf8"))) {
    const rel = f.filePath.split("\\").join("/").replace(/^.*?\/literarylanguagelab/i, "");
    for (const m of f.messages) {
      const key = `${rel} | ${m.ruleId} | ${String(m.message).split("\n")[0]}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return counts;
}

const [, , beforeFile, afterFile] = process.argv;
if (!beforeFile || !afterFile) {
  console.error("Pemakaian: node scripts/lint-diff.mjs before.json after.json");
  process.exit(2);
}
const before = load(beforeFile);
const after = load(afterFile);

let added = 0;
let totalBefore = 0;
let totalAfter = 0;
for (const n of before.values()) totalBefore += n;
for (const [key, n] of after) {
  totalAfter += n;
  const extra = n - (before.get(key) || 0);
  if (extra > 0) {
    added += extra;
    console.log(`${extra}x ${key}`);
  }
}
console.log(`sebelum=${totalBefore} sesudah=${totalAfter} baru=${added}`);
process.exit(added > 0 ? 1 : 0);
