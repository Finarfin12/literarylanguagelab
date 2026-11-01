// Uji unit lib/reader/drag-fab.ts (Tongkat Ajaib bisa digeser, PRD §5.4). Jalankan:
//   node --experimental-transform-types --no-warnings tests/drag-fab.test.mts <path-repo>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const m = await import(pathToFileURL(path.join(repo, "lib/reader/drag-fab.ts")).href);

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const vp = { w: 375, h: 812 };
const ins = { top: 56, bottom: 96 };

test("ketuk vs geser: ambang 6 px", () => {
  assert.equal(m.isDrag({ x: 100, y: 100 }, { x: 103, y: 104 }), false); // jarak 5
  assert.equal(m.isDrag({ x: 100, y: 100 }, { x: 106, y: 100 }), false); // tepat 6 = masih ketuk
  assert.equal(m.isDrag({ x: 100, y: 100 }, { x: 107, y: 100 }), true);
  assert.equal(m.isDrag({ x: 0, y: 0 }, { x: 5, y: 5 }), true); // diagonal 7.07
});

test("clampPosition menjaga tombol tetap terlihat", () => {
  const c = m.clampPosition({ x: -50, y: -50 }, vp, ins);
  assert.deepEqual(c, { x: 12, y: 56 });
  const d = m.clampPosition({ x: 999, y: 999 }, vp, ins);
  assert.deepEqual(d, { x: 375 - 56 - 12, y: 812 - 56 - 96 });
});

test("clampPosition: viewport terlalu kecil tidak menghasilkan NaN", () => {
  const c = m.clampPosition({ x: 5, y: 5 }, { w: 50, h: 100 }, ins);
  assert.ok(Number.isFinite(c.x) && Number.isFinite(c.y));
});

test("snapToEdge: kiri bila titik tengah di separuh kiri, kanan bila di kanan", () => {
  assert.equal(m.snapToEdge({ x: 100, y: 300 }, vp, ins).x, 12);
  assert.equal(m.snapToEdge({ x: 250, y: 300 }, vp, ins).x, 375 - 56 - 12);
  // tepat di tengah (titik tengah = w/2) → kanan
  assert.equal(m.nearestSide({ x: 375 / 2 - 28, y: 0 }, vp), "right");
});

test("snapToEdge menjepit y", () => {
  assert.equal(m.snapToEdge({ x: 10, y: 5000 }, vp, ins).y, 812 - 56 - 96);
});

test("toStored/fromStored bolak-balik", () => {
  const stored = m.toStored({ x: 300, y: 400 }, vp, ins);
  assert.equal(stored.side, "right");
  const back = m.fromStored(stored, vp, ins);
  assert.equal(back.x, 375 - 56 - 12);
  assert.ok(Math.abs(back.y - 400) < 1e-9);
});

test("fromStored mengikuti ukuran layar baru (rotasi/resize) dan tetap di dalam layar", () => {
  const stored = { side: "right" as const, yRatio: 0.9 };
  const land = m.fromStored(stored, { w: 812, h: 375 }, ins);
  assert.ok(land.y >= ins.top && land.y <= 375 - 56 - ins.bottom + 1e-9);
  assert.equal(land.x, 812 - 56 - 12);
});

test("fromStored: ruang vertikal tidak cukup → y = inset atas", () => {
  const p = m.fromStored({ side: "left", yRatio: 1 }, { w: 300, h: 100 }, ins);
  assert.equal(p.y, ins.top);
});

test("parseStored: nilai sah, rusak, dan di luar rentang", () => {
  assert.deepEqual(m.parseStored('{"side":"left","yRatio":0.25}'), { side: "left", yRatio: 0.25 });
  assert.deepEqual(m.parseStored('{"side":"right","yRatio":7}'), { side: "right", yRatio: 1 });
  assert.deepEqual(m.parseStored('{"side":"right","yRatio":-3}'), { side: "right", yRatio: 0 });
  assert.equal(m.parseStored("bukan json"), null);
  assert.equal(m.parseStored(null), null);
  assert.equal(m.parseStored('{"side":"tengah","yRatio":0.5}'), null);
  assert.equal(m.parseStored('{"side":"left"}'), null);
  assert.equal(m.parseStored('{"side":"left","yRatio":"x"}'), null);
});

test("serialize → parseStored", () => {
  const s = { side: "left" as const, yRatio: 0.4 };
  assert.deepEqual(m.parseStored(m.serialize(s)), s);
});

test("defaultStored: kanan di HP, kiri di desktop (seperti tombol lama)", () => {
  assert.equal(m.defaultStored({ w: 375, h: 800 }).side, "right");
  assert.equal(m.defaultStored({ w: 1280, h: 800 }).side, "left");
});

test("nudge: Alt+panah", () => {
  const p = { x: 100, y: 300 };
  assert.equal(m.nudge(p, "ArrowLeft", vp, ins).x, 12);
  assert.equal(m.nudge(p, "ArrowRight", vp, ins).x, 375 - 56 - 12);
  assert.equal(m.nudge(p, "ArrowUp", vp, ins).y, 276);
  assert.equal(m.nudge(p, "ArrowDown", vp, ins).y, 324);
  // dijepit di tepi
  assert.equal(m.nudge({ x: 12, y: 56 }, "ArrowUp", vp, ins).y, 56);
});

console.log(`\n${passed} lulus, 0 gagal`);
