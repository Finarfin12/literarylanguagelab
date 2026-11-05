// Menjalankan semua uji unit tests/*.test.mts (tanpa dependensi baru): `npm test`.
// Tiap berkas dijalankan terpisah dengan perintah dari docs/v3/HANDOFF.md; path repo diteruskan sebagai argumen.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(repo, "tests");
const only = process.argv[2]; // opsional: potongan nama berkas, mis. `npm test -- guard`
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".test.mts") && (!only || f.includes(only)))
  .sort();

const failed = [];
for (const f of files) {
  const res = spawnSync(
    process.execPath,
    ["--experimental-transform-types", "--no-warnings", path.join("tests", f), repo],
    { cwd: repo, encoding: "utf8" },
  );
  const ok = res.status === 0;
  console.log(`${ok ? "LULUS " : "GAGAL "} ${f}`);
  if (!ok) {
    failed.push(f);
    console.log((res.stdout || "") + (res.stderr || ""));
  }
}

console.log(`\n${files.length - failed.length}/${files.length} berkas uji lulus.`);
if (failed.length > 0) process.exit(1);
