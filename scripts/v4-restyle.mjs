// Fase 12.4 — pembersihan gaya dekoratif global v4 (docs/v4/DESIGN.md §3.4, IMPLEMENTATION_PLAN Fase 12.4).
// Mengganti HANYA kelas gaya di dalam string literal .ts/.tsx (className, cn(...), objek data seperti
// `color: "text-blue-400"`). Tidak menyentuh elemen, handler, atau teks. Boleh dihapus setelah v4.
//
// Pakai:
//   node scripts/v4-restyle.mjs --dry-run     # tulis docs/v4/restyle-report.md, JANGAN ubah file
//   node scripts/v4-restyle.mjs               # terapkan + tulis laporan
//
// Aturan:
//  - warna kategori/neon bernomor -> token semantik (lihat MAP di bawah);
//  - gradasi dekoratif (from/via/to palet + bg-gradient-to-*) -> bg-muted;
//  - glow berwarna shadow-[0_0_...], hover:-translate-y-*, backdrop-blur pada kartu -> dihapus;
//  - varian dark: pada kelas yang dipetakan dihapus (token sudah mengikuti tema), lalu duplikat dibuang;
//  - berkas di EXCLUDE (warna yang membawa informasi) dilewati dan dicantumkan di laporan.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry-run");
const SCAN_DIRS = ["app", "components", "lib"];

// Warna yang MEMBAWA INFORMASI (DESIGN.md §3.4 "Pengecualian"): jangan diganti skrip, ditinjau di Fase 14.
// path (relatif, garis miring depan) -> alasan
const EXCLUDE = {
  "components/reader/SentenceAnalysisSidebar.tsx": "warna kelas kata / analisis kalimat",
  "components/reader/InteractiveParagraph.tsx": "warna sorotan & bedah sintaksis",
  "components/reader/ReaderBlock.tsx": "warna sorotan & bedah sintaksis",
  "components/reader/CulturalTextRenderer.tsx": "penanda referensi budaya (amber) berbeda dari idiom",
  "components/GraphViewer.tsx": "warna simpul/seri grafik",
  "components/reader/SemanticMapViewer.tsx": "warna simpul/seri grafik",
  "app/(dashboard)/tools/annotations/page.tsx": "pemilih warna anotasi",
  "app/(dashboard)/community-annotations/page.tsx": "warna anotasi pengguna",
  "app/(dashboard)/tools/comparator/page.tsx": "tanda diff (tambah/hapus)",
  "app/(dashboard)/tools/sentence-architect/page.tsx": "warna kelas kata (subjek/verba/objek)",
};
// Baris tertentu yang warnanya membawa informasi (berkas lain tetap diproses): [berkas, pola baris, alasan]
const EXCLUDE_LINES = [
  ["app/(dashboard)/english-lab/flashcard/page.tsx", /BOX_COLORS/, "skala kotak Leitner 1-5 (merah-hijau)"],
];

const PALETTE = "red|amber|yellow|orange|green|emerald|blue|sky|purple|violet|fuchsia|pink|rose|indigo|cyan|teal|lime";
const UTIL = "text|bg|border|ring|from|via|to|shadow|fill|stroke|divide|outline|decoration|accent|caret|placeholder";
const TOKEN_RE = new RegExp(`^((?:[a-z0-9-]+:)*)(!?)(${UTIL})-(${PALETTE})-(\\d{2,3})(\\/\\d+)?$`);
const GLOW_RE = /^((?:[a-z0-9-]+:)*)shadow-\[0_0_[^\]]+\]$/;
const BLUR_RE = /^((?:[a-z0-9-]+:)*)backdrop-blur(-(?:sm|md|lg|xl|2xl|3xl))?$/;
const GRADIENT_RE = /^((?:[a-z0-9-]+:)*)bg-gradient-to-(t|tr|r|br|b|bl|l|tl)$/;
const GRAD_STOP_RE = new RegExp(`^((?:[a-z0-9-]+:)*)(from|via|to)-(${PALETTE})-\\d{2,3}(\\/\\d+)?$`);
const TRANSLATE_RE = /^((?:[a-z0-9-]+:)*)-translate-y-/;

const KIND = {
  red: "danger",
  amber: "warning", yellow: "warning", // orange = warna kategori (dekoratif), bukan peringatan
  green: "success", emerald: "success",
  blue: "info", sky: "info",
};
// kategori dekoratif: purple violet fuchsia pink rose indigo cyan teal lime -> "decor"

function mapColor(util, color, n, op, forceDecor, variants) {
  const kind = forceDecor ? "decor" : (KIND[color] ?? "decor");
  const solid = !op && Number(n) >= 400; // blok warna pekat (mis. bg-red-600) -> token pekat
  const hover = /(^|:)hover:/.test(variants);
  switch (util) {
    case "text":
    case "fill":
    case "stroke":
    case "decoration":
    case "accent":
    case "caret":
      return `${util}-${{ danger: "danger", warning: "warning-ink", success: "brand-ink", info: "brand-ink", decor: "foreground" }[kind]}${op && kind !== "decor" ? op : ""}`;
    case "bg":
      if (solid && hover) return { danger: "bg-danger/90", warning: "bg-warning-ink/90", success: "bg-brand-hover", info: "bg-brand-hover", decor: "bg-brand-hover" }[kind];
      if (solid) return { danger: "bg-danger", warning: "bg-warning-ink", success: "bg-brand-solid", info: "bg-brand-solid", decor: "bg-brand-solid" }[kind];
      return { danger: "bg-danger-tint", warning: "bg-warning-tint", success: "bg-brand-tint", info: "bg-muted", decor: "bg-muted" }[kind];
    case "border":
    case "ring":
    case "divide":
    case "outline":
      return `${util}-${{ danger: "danger/30", warning: "warning-ink/30", success: "brand/30", info: "border", decor: "border" }[kind]}`;
    case "placeholder":
      return "placeholder-muted-foreground";
    default:
      return null; // from/via/to/shadow: ditangani di tempat lain
  }
}

// ---------- pemindai string literal ----------
// Mengembalikan daftar segmen statis [start, end) di dalam string literal (tanpa kutip, tanpa ${...}).
function findStringSegments(src) {
  const segs = [];
  const n = src.length;
  let i = 0;
  const tmplStack = []; // kedalaman kurung kurawal untuk ${ }
  let braceDepth = 0;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && d === "*") { const e = src.indexOf("*/", i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let ok = false;
      while (j < n) {
        if (src[j] === "\\") { j += 2; continue; }
        if (src[j] === "\n") break; // tanda kutip di teks JSX (mis. don't): bukan string
        if (src[j] === c) { ok = true; break; }
        j++;
      }
      if (ok) { segs.push([i + 1, j]); i = j + 1; } else i++;
      continue;
    }
    if (c === "`") { i = scanTemplate(i + 1); continue; }
    if (c === "{") braceDepth++;
    if (c === "}") {
      braceDepth--;
      if (tmplStack.length && tmplStack[tmplStack.length - 1] === braceDepth) {
        tmplStack.pop();
        i = scanTemplate(i + 1, true);
        continue;
      }
    }
    i++;
  }
  return segs;

  // memindai isi template mulai dari index `from`; mengembalikan index setelah penutup ` atau setelah ${
  function scanTemplate(from) {
    let j = from;
    let start = from;
    while (j < n) {
      if (src[j] === "\\") { j += 2; continue; }
      if (src[j] === "`") { segs.push([start, j]); return j + 1; }
      if (src[j] === "$" && src[j + 1] === "{") {
        segs.push([start, j]);
        tmplStack.push(braceDepth);
        braceDepth++;
        return j + 2;
      }
      j++;
    }
    return n;
  }
}

// ---------- transformasi satu segmen ----------
function transformSegment(text, before, after, rec, forceDecor) {
  // tokenisasi dengan mempertahankan spasi
  const parts = text.split(/(\s+)/);
  // batas: token pertama/terakhir menempel pada ${...} bila segmen berbatasan dengan ekspresi; lewati
  const firstGlued = before !== "" && !/[\s"'`{(\[,]/.test(before);
  const lastGlued = after !== "" && !/[\s"'`})\],]/.test(after);
  const hasGradientBg = parts.some((p) => GRADIENT_RE.test(p));
  const hasPaletteStop = parts.some((p) => GRAD_STOP_RE.test(p));
  const swapWhite = parts.some((p) => {
    const m = TOKEN_RE.exec(p);
    return m && m[3] === "bg" && !m[6] && Number(m[5]) >= 400 && !/(^|:)hover:/.test(m[1]);
  });
  const cardish = parts.some((p) => /^(?:[a-z0-9-]+:)*(?:bg-card|rounded-(?:card|xl|2xl|3xl))$/.test(p));
  const out = [];
  const seen = new Set();
  let lastIdx = parts.length - 1;
  while (lastIdx >= 0 && parts[lastIdx] === "") lastIdx--;
  parts.forEach((p, idx) => {
    if (p === "" || /^\s+$/.test(p)) { out.push(p); return; }
    const glued = (idx === 0 && firstGlued) || (idx === lastIdx && lastGlued);
    if (glued) { out.push(p); return; }
    let res = p;
    let m;
    if ((m = TOKEN_RE.exec(p))) {
      const [, variants, imp, util, color, num, op = ""] = m;
      if ((util === "from" || util === "via" || util === "to") && !hasGradientBg) {
        // stop gradasi terpisah dari bg-gradient-to-* (mis. di objek data): dibiarkan agar gradasi tidak rusak
        rec.review(p, "stop gradasi di string terpisah dari bg-gradient-to-*; ubah manual bersama pemakainya");
      } else if (util === "from" || util === "via" || util === "to") { res = ""; rec.drop(p, "gradasi dekoratif"); }
      else if (util === "shadow") { res = ""; rec.drop(p, "bayangan berwarna (glow)"); }
      else {
        const base = mapColor(util, color, num, op, forceDecor, variants);
        // varian dark: pada token yang dipetakan dibuang (token sudah adaptif)
        const v = variants.split(":").filter((x) => x && x !== "dark").map((x) => x + ":").join("");
        res = base ? v + imp + base : p;
        rec.map(p, res);
        if (res) {
          if (seen.has(res)) res = "";
          else seen.add(res);
        }
        if (res === "") rec.drop(p, "duplikat setelah pemetaan");
        out.push(res);
        return;
      }
    } else if ((m = GRADIENT_RE.exec(p))) {
      if (hasPaletteStop) { res = m[1].split(":").filter((x) => x && x !== "dark").map((x) => x + ":").join("") + "bg-muted"; rec.map(p, res); if (seen.has(res)) res = ""; else seen.add(res); }
      else { rec.review(p, "gradasi tanpa warna palet (token/transparan); periksa fungsinya (mis. fade)"); }
    } else if (hasGradientBg && hasPaletteStop && /^(?:[a-z0-9-]+:)*(?:from|via|to)-(?!\[)[\w./-]+$/.test(p)) {
      res = ""; rec.drop(p, "gradasi dekoratif");
    } else if (swapWhite && /^(?:[a-z0-9-]+:)*text-white$/.test(p)) {
      res = p.replace("text-white", "text-on-brand"); rec.map(p, res);
    } else if ((m = GLOW_RE.exec(p))) {
      const inner = p.slice(p.indexOf("[") + 1, -1);
      const black = /rgba\(0,\s*0,\s*0/.test(inner) && !/#|var\(|--brand/.test(inner);
      if (black) rec.review(p, "bayangan hitam (bukan glow berwarna)");
      else { res = ""; rec.drop(p, "glow berwarna"); }
    } else if (TRANSLATE_RE.test(p) && /(^|:)(?:group-)?hover:/.test(p)) {
      res = ""; rec.drop(p, "hover melompat");
    } else if (BLUR_RE.test(p)) {
      if (cardish) { res = ""; rec.drop(p, "backdrop-blur pada kartu"); }
      else rec.review(p, "backdrop-blur bukan pada kartu (header/overlay?); dibiarkan");
    } else if (p === "animate-pulse") {
      rec.review(p, "animate-pulse: dekoratif atau skeleton? dibiarkan");
    }
    if (res === "") {
      // buang token dan spasi sebelumnya
      if (out.length && /^\s+$/.test(out[out.length - 1])) out.pop();
      return;
    }
    out.push(res);
  });
  let joined = out.join("");
  // rapikan: spasi ganda yang tersisa dan spasi di tepi hanya bila kita mengubah sesuatu
  if (joined !== text) joined = joined.replace(/ {2,}/g, " ");
  return joined;
}

// ---------- jalankan ----------
function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== ".next") walk(p, files); }
    else if (/\.(ts|tsx)$/.test(e.name) && !e.name.endsWith(".d.ts")) files.push(p);
  }
  return files;
}

const report = { changed: [], excluded: [], review: [], other: [] };
const totals = { files: 0, maps: 0, drops: 0, outsideClassName: 0 };

for (const dirName of SCAN_DIRS) {
  const dir = path.join(ROOT, dirName);
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
    const rel = path.relative(ROOT, file).split(path.sep).join("/");
    const src = fs.readFileSync(file, "utf8");
    const segs = findStringSegments(src);
    const fileRec = { rel, maps: new Map(), drops: new Map(), review: new Map(), outside: [] };
    const reportRec = (seg) => ({
      map: (a, b) => { const k = `${a} → ${b || "(hapus)"}`; fileRec.maps.set(k, (fileRec.maps.get(k) || 0) + 1); },
      drop: (a, why) => { const k = `${a} (${why})`; fileRec.drops.set(k, (fileRec.drops.get(k) || 0) + 1); },
      review: (a, why) => { const k = `${a} — ${why}`; fileRec.review.set(k, (fileRec.review.get(k) || 0) + 1); },
      seg,
    });
    let outText = "";
    let cursor = 0;
    for (const [s, e] of segs) {
      const text = src.slice(s, e);
      // lewati cepat bila tak ada kandidat
      if (!/(?:text|bg|border|ring|from|via|to|shadow|fill|stroke|divide|outline|decoration|accent|caret|placeholder)-(?:red|amber|yellow|orange|green|emerald|blue|sky|purple|violet|fuchsia|pink|rose|indigo|cyan|teal|lime)-\d|shadow-\[0_0_|hover:-translate-y|bg-gradient-to|backdrop-blur|animate-pulse/.test(text)) continue;
      const rec = reportRec([s, e]);
      const before = src[s - 1] === "}" ? "}" : "";
      const after = src[e] === "$" ? "$" : "";
      // konteks: baris sumber, className/cn atau data?
      const NL = String.fromCharCode(10);
      const nl = src.lastIndexOf(NL, s);
      const nlEnd = src.indexOf(NL, s);
      const lineText = src.slice(nl + 1, nlEnd < 0 ? src.length : nlEnd);
      const window4 = src.slice(Math.max(0, nl - 300), s).split(NL).slice(-4).join(NL);
      const isClass = /(className|class)\s*=|\b(cn|cx|clsx|twMerge)\(|className:/.test(window4);
      const skipLine = EXCLUDE_LINES.find(([f, re]) => f === rel && re.test(lineText));
      if (skipLine) {
        fileRec.review.set(`${lineText.trim().slice(0, 90)} — dilewati: ${skipLine[2]}`, 1);
        continue;
      }
      // objek data tanpa kondisi (kunci kategori -> kelas warna): warna kategori = dekoratif -> netral
      const forceDecor = !isClass && !/if|else|return|\?|score|isCorrect|isSelected|[Ee]rror/.test(lineText);
      const edited = transformSegment(text, before, after, rec, forceDecor);
      if (edited !== text && !isClass) fileRec.outside.push(lineText.trim().slice(0, 140));
      outText += src.slice(cursor, s) + edited;
      cursor = e;
    }
    const mapCount = [...fileRec.maps.values()].reduce((a, b) => a + b, 0);
    const dropCount = [...fileRec.drops.values()].reduce((a, b) => a + b, 0);
    if (!mapCount && !dropCount && !fileRec.review.size) continue;
    if (EXCLUDE[rel]) {
      report.excluded.push({ rel, why: EXCLUDE[rel], maps: mapCount, drops: dropCount });
      continue;
    }
    if (fileRec.review.size) report.review.push({ rel, items: fileRec.review });
    if (!mapCount && !dropCount) continue;
    outText += src.slice(cursor);
    totals.files++;
    totals.maps += mapCount;
    totals.drops += dropCount;
    totals.outsideClassName += fileRec.outside.length;
    report.changed.push({ rel, maps: mapCount, drops: dropCount, detail: fileRec });
    if (!DRY) fs.writeFileSync(file, outText);
  }
}

// kelas palet netral (informasi saja)
const neutral = [];
for (const dirName of SCAN_DIRS) {
  if (!fs.existsSync(path.join(ROOT, dirName))) continue;
  for (const file of walk(path.join(ROOT, dirName))) {
    const c = (fs.readFileSync(file, "utf8").match(/\b(?:text|bg|border|ring)-(?:slate|gray|zinc|neutral|stone)-\d{2,3}/g) || []).length;
    if (c) neutral.push([path.relative(ROOT, file).split(path.sep).join("/"), c]);
  }
}

// ---------- laporan ----------
const L = [];
L.push(`# Laporan v4-restyle (${DRY ? "DRY-RUN — tidak ada file diubah" : "diterapkan"})`);
L.push("");
L.push(`Dibuat: ${new Date().toISOString().slice(0, 10)} oleh \`scripts/v4-restyle.mjs\`. Aturan: docs/v4/DESIGN.md §3.4.`);
L.push("");
L.push(`- File berubah: **${totals.files}** · penggantian warna: **${totals.maps}** · kelas dihapus: **${totals.drops}**`);
L.push(`- Penggantian di luar \`className\`/\`cn(...)\` (objek data): **${totals.outsideClassName}** baris`);
L.push(`- File dilewati (warna pembawa informasi): **${report.excluded.length}**`);
L.push("");
L.push("## File berubah (terbanyak dulu)");
L.push("");
for (const f of report.changed.sort((a, b) => b.maps + b.drops - (a.maps + a.drops))) {
  L.push(`### ${f.rel} — ${f.maps} ganti, ${f.drops} hapus`);
  for (const [k, v] of f.detail.maps) L.push(`- ${k} ×${v}`);
  for (const [k, v] of f.detail.drops) L.push(`- ✂ ${k} ×${v}`);
  L.push("");
}
L.push("## Penggantian di luar className (objek data) — tinjau");
L.push("");
for (const f of report.changed) for (const o of f.detail.outside) L.push(`- ${f.rel}: \`${o.replace(/`/g, "'")}\``);
L.push("");
L.push("## Dilewati (pengecualian informasi; tinjau di sub-fase 14, cukup periksa kontras)");
L.push("");
for (const x of report.excluded) L.push(`- ${x.rel} — ${x.why} (${x.maps} kelas warna, ${x.drops} dekoratif tidak disentuh)`);
L.push("");
L.push("## Perlu ditinjau manual (dibiarkan skrip)");
L.push("");
for (const r of report.review) {
  L.push(`- **${r.rel}**`);
  for (const [k, v] of r.items) L.push(`  - ${k} ×${v}`);
}
L.push("");
L.push("## Info: kelas palet netral (slate/gray/zinc/neutral/stone) — tidak diubah");
L.push("");
for (const [f, c] of neutral.sort((a, b) => b[1] - a[1])) L.push(`- ${f}: ${c}`);
L.push("");

fs.writeFileSync(path.join(ROOT, "docs/v4/restyle-report.md"), L.join("\n"));
console.log(
  `${DRY ? "[dry-run] " : ""}file berubah: ${totals.files}, ganti: ${totals.maps}, hapus: ${totals.drops}, di luar className: ${totals.outsideClassName}, dilewati: ${report.excluded.length}`
);
console.log("Laporan: docs/v4/restyle-report.md");
