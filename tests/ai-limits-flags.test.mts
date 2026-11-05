// Uji aturan murni batas pemakaian (0019), flag fitur fail-closed, dan daftar status skema (Fase 19.3, 19.4, 19.6).
// Jalankan:
//   node --experimental-transform-types --no-warnings tests/ai-limits-flags.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const load = (rel: string) => import(pathToFileURL(path.join(repo, rel)).href);
const rl = await load("lib/rate-limit-rules.ts");
const fl = await load("lib/ai/flag-rules.ts");
const ss = await load("lib/schema-status.ts");

// --- rate limit: galat "fungsi belum ada" ---
assert.equal(rl.isMissingRpc({ code: "42883" }), true);
assert.equal(rl.isMissingRpc({ code: "PGRST202" }), true);
assert.equal(rl.isMissingRpc({ message: "Could not find the function public.consume_rate_limit(...) in the schema cache" }), true);
assert.equal(rl.isMissingRpc({ code: "28000", message: "Harus login." }), false);
assert.equal(rl.isMissingRpc({ code: "57014" }), false);
assert.equal(rl.isMissingRpc(null), false);
assert.equal(rl.isMissingRpc(undefined), false);

// hitungan dikembalikan setelah penambahan: tepat di batas masih lolos
assert.equal(rl.isOverLimit(30, 30), false);
assert.equal(rl.isOverLimit(31, 30), true);

const specs = rl.windowSpecs({ perMinute: 5, perHour: 50, perDay: 200 });
assert.deepEqual(specs.map((s: { name: string }) => s.name), ["minute", "hour", "day"]);
assert.deepEqual(specs.map((s: { seconds: number }) => s.seconds), [60, 3600, 86400]);
assert.equal(specs[2].limit, 200);
assert.match(rl.limitMessage("minute", 5), /5 request\/menit/);
assert.match(rl.limitMessage("day", 200), /harian/);

// migrasi 0019 memuat fungsi dan tabel yang dipanggil kode
const sql = fs.readFileSync(path.join(repo, "supabase/migrations/0019_rate_limit_counters.sql"), "utf8");
assert.match(sql, /CREATE TABLE IF NOT EXISTS rate_limit_counters/);
assert.match(sql, /FUNCTION consume_rate_limit\(/);
assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
assert.match(sql, /SECURITY DEFINER/);
assert.match(sql, /auth\.uid\(\)/);
assert.ok(!/CREATE POLICY/i.test(sql), "tabel penghitung tidak boleh punya policy untuk klien");

// --- flag fitur ---
assert.equal(fl.FEATURE_DEFAULTS.kursus_dasar, false);
assert.equal(fl.FEATURE_DEFAULTS.modul_belajar, false);
// fail-closed: tanpa konfigurasi sama sekali, fitur eksperimen mati
assert.equal(fl.resolveFlag(null, "kursus_dasar"), false);
assert.equal(fl.resolveFlag({}, "modul_belajar"), false);
// key lain yang tak terdaftar tetap aktif
assert.equal(fl.resolveFlag(null, "lookup"), true);
assert.equal(fl.resolveFlag({}, "fitur_baru"), true);
// nilai eksplisit menang
assert.equal(fl.resolveFlag({ kursus_dasar: true }, "kursus_dasar"), true);
assert.equal(fl.resolveFlag({ lookup: false }, "lookup"), false);
assert.equal(fl.resolveFlag({ kursus_dasar: "ya" as unknown as boolean }, "kursus_dasar"), false, "nilai bukan boolean diabaikan");
// peta lengkap untuk pemanggil lama
assert.equal(fl.withDefaults(null).kursus_dasar, false);
assert.equal(fl.withDefaults({ kursus_dasar: true }).kursus_dasar, true);
assert.equal(fl.withDefaults({ lookup: false }).lookup, false);

// --- status skema ---
const probe = ss.SCHEMA_PROBES[0];
assert.equal(ss.classifyProbe(probe, null), "ok");
assert.equal(ss.classifyProbe(probe, { code: "42P01" }), "missing");
assert.equal(ss.classifyProbe(probe, { code: "PGRST205" }), "missing");
assert.equal(ss.classifyProbe(probe, { code: "42703" }), "missing");
assert.equal(ss.classifyProbe(probe, { code: "42501", message: "permission denied" }), "error");
const gone = { ...probe, expectAbsent: true };
assert.equal(ss.classifyProbe(gone, { code: "42703" }), "ok", "kolom sudah dihapus = migrasi dijalankan");
assert.equal(ss.classifyProbe(gone, null), "missing");
const seeded = { ...probe, seedColumn: "x" };
assert.equal(ss.classifyProbe(seeded, null, 3), "ok");
assert.equal(ss.classifyProbe(seeded, null, 0), "missing");
assert.deepEqual(ss.summarize(["ok", "ok", "missing", "error"]), { ok: 2, missing: 1, error: 1 });

// setiap migrasi yang dicek benar-benar ada berkasnya
const files = fs.readdirSync(path.join(repo, "supabase/migrations"));
for (const p of ss.SCHEMA_PROBES) {
  assert.ok(files.some((f: string) => f.startsWith(p.migration + "_")), `berkas migrasi ${p.migration} tidak ada`);
}

console.log("ai-limits-flags: OK");
