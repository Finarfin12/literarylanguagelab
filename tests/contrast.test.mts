// Uji kontras WCAG token desain v4 (docs/v4/DESIGN.md §3 dan §9). Membaca nilai langsung dari app/globals.css.
// Jalankan:
//   node --experimental-transform-types --no-warnings tests/contrast.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repo = path.resolve(process.argv[2] ?? ".");
const css = fs.readFileSync(path.join(repo, "app/globals.css"), "utf8");

function block(selector: RegExp): Record<string, string> {
  const m = css.match(selector);
  assert.ok(m, `blok ${selector} tidak ditemukan di globals.css`);
  const out: Record<string, string> = {};
  for (const d of m[1].matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[d[1]] = d[2].toLowerCase();
  return out;
}

const light = block(/:root\s*\{([^}]*)\}/);
const dark = block(/\.dark\s*\{([^}]*)\}/);

function lum(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

let passed = 0;
function check(theme: string, t: Record<string, string>, fg: string, bg: string, min: number) {
  const f = t[fg] ?? fg;
  const b = t[bg] ?? bg;
  const r = ratio(f, b);
  assert.ok(r >= min, `${theme}: ${fg} (${f}) di atas ${bg} (${b}) = ${r.toFixed(2)} < ${min}`);
  passed++;
  console.log(`ok - ${theme}: ${fg} / ${bg} = ${r.toFixed(2)}`);
}

// Pasangan teks/latar utama; teks normal ≥ 4.5
for (const [name, t] of [["terang", light], ["gelap", dark]] as const) {
  for (const bg of ["background", "card", "muted"]) {
    check(name, t, "foreground", bg, 4.5);
    check(name, t, "muted-foreground", bg, 4.5);
  }
  check(name, t, "brand-ink", "card", 4.5);
  check(name, t, "brand-ink", "background", 4.5);
  check(name, t, "brand-ink", "brand-tint", 4.5);
  check(name, t, "on-brand", "brand-solid", 4.5);
  check(name, t, "danger", "card", 4.5);
  check(name, t, "danger", "danger-tint", 4.5);
  check(name, t, "warning-ink", "card", 4.5);
  check(name, t, "warning-ink", "background", 4.5);
  check(name, t, "warning-ink", "warning-tint", 4.5);
  check(name, t, "ink", "paper", 4.5);
}

// Tema reader (DESIGN.md §3.3)
check("reader sepia", {}, "#43352a", "#f4ecd8", 4.5);
check("reader terang", {}, "#2a2620", "#fbf8f1", 4.5);

console.log(`\n${passed} pemeriksaan kontras lulus`);
