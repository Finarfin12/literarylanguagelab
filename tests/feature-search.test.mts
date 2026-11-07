// Uji lib/feature-search.ts (menu pencarian), pemasangannya, dan pembaruan Bantuan/Liter AI. Jalankan:
//   node --experimental-transform-types --no-warnings tests/feature-search.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const fsr = await import(pathToFileURL(path.join(repo, "lib/feature-search.ts")).href);
const rooms = await import(pathToFileURL(path.join(repo, "lib/rooms.ts")).href);
const read = (p: string) => fs.readFileSync(path.join(repo, p), "utf8");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const index = fsr.buildFeatureIndex();
const top = (q: string, opts = {}) => fsr.searchFeatures(q, index, opts).map((e: { path: string }) => e.path);

test("indeks memuat semua path ruang, satu entri per path, dan tiap entri bernama", () => {
  const paths = index.map((e: { path: string }) => e.path);
  assert.equal(new Set(paths).size, paths.length, "path tidak boleh ganda");
  for (const p of rooms.allRoomPaths()) assert.ok(paths.includes(p), `hilang dari indeks: ${p}`);
  for (const r of rooms.ROOMS) assert.ok(paths.includes(`/ruang/${r.slug}`), r.slug);
  for (const e of index) {
    assert.ok(e.name && e.name !== e.path, `nama kosong/mentah: ${e.path}`);
    assert.ok(e.path.startsWith("/"), e.path);
  }
});

test("kata sehari-hari menemukan fitur yang tepat di urutan teratas", () => {
  assert.equal(top("kamus")[0], "/tools/a-z-dictionary");
  assert.equal(top("skimming")[0], "/latihan-membaca");
  assert.ok(top("hafalan").includes("/review"));
  assert.ok(top("ringkasan statistik").includes("/translation-workspace"));
  assert.ok(top("bantuan").includes("/help"));
  assert.ok(top("kursus").includes("/kursus"));
  assert.ok(top("modul").includes("/modul"));
});

test("pencarian tak peka huruf besar, aksen, dan tanda baca; semua kata harus cocok", () => {
  assert.deepEqual(top("KAMUS"), top("kamus"));
  assert.deepEqual(top("  kamus!! "), top("kamus"));
  assert.equal(fsr.normalizeQuery("Café, Ünïcode!"), "cafe unicode");
  assert.deepEqual(top("kamus zzzxqv"), []);
  assert.deepEqual(top(""), []);
  assert.deepEqual(top("   "), []);
});

test("flag menyembunyikan Kursus dan Modul dari hasil; batas jumlah dihormati", () => {
  const hidden = fsr.visibilityFilter(false, false);
  assert.ok(!top("kursus", { isVisible: hidden }).includes("/kursus"));
  assert.ok(!top("modul", { isVisible: hidden }).includes("/modul"));
  const shown = fsr.visibilityFilter(true, true);
  assert.ok(top("kursus", { isVisible: shown }).includes("/kursus"));
  assert.ok(top("a", { limit: 3 }).length <= 3);
});

test("daftar halaman untuk Liter AI memuat setiap path indeks", () => {
  const list: string = fsr.featureListForAI(index);
  for (const e of index) assert.ok(list.includes(`(${e.path})`), e.path);
});

test("menu pencarian terpasang: layout, sidebar, bilah atas, pintasan Ctrl+K dan /", () => {
  assert.match(read("app/(dashboard)/layout.tsx"), /<FeatureSearch \/>/);
  assert.match(read("components/Sidebar.tsx"), /openFeatureSearch/);
  assert.match(read("components/TopActions.tsx"), /openFeatureSearch/);
  const ui = read("components/FeatureSearch.tsx");
  assert.match(ui, /ctrlKey \|\| e\.metaKey/);
  assert.match(ui, /e\.key === "\/"/);
  assert.match(ui, /role="dialog"/);
  assert.match(ui, /aria-modal="true"/);
  assert.match(ui, /Escape/);
  assert.match(ui, /isTypingTarget/, "tombol / tidak boleh aktif saat mengetik");
});

test("Bantuan: FAQ memuat fitur v4/v5 dan bisa dicari; semua path di FAQ ada di aplikasi", () => {
  const help = read("app/(dashboard)/help/page.tsx");
  for (const k of ["Ctrl+K", "Ruang belajar", "Kursus Dasar", "Modul Belajar", "Skimming", "Ringkasan statistik", "Kesalahan Umum", "B2-C1"]) {
    assert.ok(help.includes(k), `FAQ belum menyebut: ${k}`);
  }
  assert.match(help, /type="search"/);
  assert.match(help, /openFeatureSearch/);
  const known = new Set(index.map((e: { path: string }) => e.path));
  const extra = new Set(["/p", "/login", "/english-lab/listening-test", "/english-lab/slang-decoder", "/english-lab/dialogue-simulator", "/english-lab/placement-test", "/english-lab/grammar-clinic", "/english-lab/flashcard"]);
  const menuMapPaths = [...help.matchAll(/^\s*"(\/[a-z0-9/-]+)":\s*\{ label/gm)].map((m) => m[1]);
  assert.ok(menuMapPaths.length > 5);
  for (const p of menuMapPaths) assert.ok(known.has(p) || extra.has(p) || [...known].some((k) => (k as string).startsWith(p)), `FaqAnswer menaut path tak dikenal: ${p}`);
});

test("Liter AI: prompt memuat bagian baru dan daftar halaman otomatis; tetap lewat runAI/guard", () => {
  const route = read("app/api/liter-ai/route.ts");
  assert.match(route, /featureListForAI\(\)/);
  assert.match(route, /Ruang belajar/);
  assert.match(route, /Modul Belajar/);
  assert.match(route, /Ctrl\+K/);
  assert.match(route, /HANYA path pada daftar/);
  assert.match(route, /guardAIRoute\(req/);
  assert.match(route, /runAI\("liter-ai"/);
  assert.ok(!/llama-3\.3-70b/.test(route), "prompt tidak boleh mengklaim satu model tetap");
});

console.log(`\n${passed} lulus, 0 gagal`);
