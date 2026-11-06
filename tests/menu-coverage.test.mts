// Uji cakupan navigasi v4 (IMPLEMENTATION_PLAN 13.1): TIDAK ADA fitur yang hilang dari susunan ruang.
// Jalankan:
//   node --experimental-transform-types --no-warnings tests/menu-coverage.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const rooms = await import(pathToFileURL(path.join(repo, "lib/rooms.ts")).href);
const covered: Set<string> = rooms.allRoomPaths();

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}
const read = (p: string) => fs.readFileSync(path.join(repo, p), "utf8");

// Path menu lama (dibaca dari teks agar tak perlu alias "@/")
const menuPaths = [...read("lib/menu-config.ts").matchAll(/path:\s*"(\/[^"]*)"/g)].map((m) => m[1]);
// Alat dinamis /tools/[id]
const toolIds = [...read("lib/tools-config.ts").matchAll(/^\s*id:\s*"([^"]+)"/gm)].map((m) => m[1]);

function staticRoutes(dir: string, base = ""): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(path.join(repo, dir), { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.includes("[")) continue;
    const route = `${base}/${e.name.replace(/^\(.*\)$/, "")}`.replace(/\/+/g, "/");
    if (fs.existsSync(path.join(repo, dir, e.name, "page.tsx"))) out.push(route);
    out.push(...staticRoutes(`${dir}/${e.name}`, route));
  }
  return out;
}
const routes = staticRoutes("app/(dashboard)");

// Rute yang terjangkau dari kerangka global (Sidebar, Menu, TopActions), bukan dari ruang
const CHROME = new Set(["/menu", "/ruang", "/tools", "/settings", "/help", "/onboarding", "/profile", "/messages"]);
// Sub-halaman yang dibuka dari halaman induknya (tombol di dalam halaman)
const SUBPAGES = new Set(["/forum/create", "/vocabulary/review"]);

test("setiap path di menu lama muncul di minimal satu ruang", () => {
  const missing = menuPaths.filter((p) => !covered.has(p));
  assert.deepEqual(missing, []);
});

test("setiap alat dinamis di tools-config muncul di minimal satu ruang", () => {
  const missing = toolIds.map((id) => `/tools/${id}`).filter((p) => !covered.has(p));
  assert.deepEqual(missing, []);
});

test("setiap halaman statis (selain admin & kerangka global) terjangkau lewat ruang", () => {
  const missing = routes.filter(
    (r) => !r.startsWith("/admin") && !CHROME.has(r) && !SUBPAGES.has(r) && !covered.has(r) && r !== "/dashboard"
  );
  assert.deepEqual(missing, []);
});

test("sub-halaman punya induk yang ada di ruang", () => {
  assert.ok(covered.has("/forum"));
  assert.ok(covered.has("/vocabulary"));
});

test("tidak ada path ganda dalam satu bagian & semua path diawali /", () => {
  for (const r of rooms.ROOMS) {
    for (const s of r.sections) {
      assert.equal(new Set(s.paths).size, s.paths.length, `${r.slug}/${s.title} berisi path ganda`);
      for (const p of s.paths) assert.ok(p.startsWith("/"), p);
    }
  }
});

test("setiap path ruang menunjuk halaman yang ada (statis atau alat dinamis)", () => {
  const known = new Set([...routes, ...toolIds.map((id) => `/tools/${id}`), ...menuPaths]);
  const unknown = [...covered].filter((p) => !known.has(p));
  assert.deepEqual(unknown, []);
});

test("tiga ruang belajar punya tujuan berbeda & LingoWise ada di Ruang II", () => {
  assert.deepEqual(rooms.LEARNING_ROOMS.map((r: { goal: string }) => r.goal), ["umum", "sastra", "penerjemahan"]);
  assert.ok(rooms.getRoom("baca-sastra").sections.some((s: { paths: string[] }) => s.paths.includes("/lingowise")));
});

test("resolveItem: menu, extra, dan path tak dikenal tidak hilang", () => {
  const menu = [{ name: "Text Library", path: "/library", description: "x" }];
  assert.equal(rooms.resolveItem("/library", menu).name, "Text Library");
  assert.equal(rooms.resolveItem("/messages", menu).name, "Pesan");
  assert.equal(rooms.resolveItem("/zzz", menu).path, "/zzz");
});

test("Kursus Dasar (Fase 16): urutan ke-2 di Ruang I, terdaftar walau flag mati, tersembunyi bagi pengguna biasa", () => {
  const room = rooms.getRoom("belajar-dasar");
  const flat = room.sections.flatMap((s: { paths: string[] }) => s.paths);
  assert.equal(flat[2], "/kursus"); // setelah Placement Test dan Tes Naik Level (urutan ke-2 dari tahap belajar)
  assert.ok(covered.has("/kursus"));
  assert.equal(rooms.resolveItem("/kursus", []).name, "Kursus Dasar");
  assert.equal(rooms.isPathVisible("/kursus", false), false);
  assert.equal(rooms.isPathVisible("/kursus", true), true);
  assert.equal(rooms.isPathVisible("/library", false), true);
  const hidden = rooms.visibleSections(room, false);
  assert.ok(!hidden.some((s: { paths: string[] }) => s.paths.includes("/kursus")));
  assert.ok(!hidden.some((s: { title: string }) => s.title === "Kursus Dasar")); // bagian kosong ikut dibuang
  assert.equal(rooms.visibleSections(room, true, true).length, room.sections.length);
});

console.log(`\n${passed} lulus, 0 gagal`);
