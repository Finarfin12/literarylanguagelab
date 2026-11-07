// Indeks dan pencarian fitur (menu pencarian, Ctrl+K). Fungsi murni, tanpa React, supaya bisa diuji unit dan dipakai
// juga oleh Liter AI (daftar halaman di prompt selalu mengikuti menu, tidak perlu disalin tangan).
import { MENU_GROUPS } from "./menu-config.ts";
import { ROOMS, EXTRA_ITEMS, isPathVisible, resolveItem } from "./rooms.ts";

export interface FeatureEntry {
  name: string;
  path: string;
  description: string;
  /** Tempat fitur ini ditemukan (nama grup menu atau ruang), untuk label hasil. */
  section: string;
  /** Kata kunci tambahan (bahasa sehari-hari) agar pencarian "kamus" atau "skimming" menemukan fiturnya. */
  keywords: string;
}

/** Kata kunci tambahan per path. Hanya untuk istilah yang tidak muncul di nama/keterangan. */
const KEYWORDS: Record<string, string> = {
  "/tools/a-z-dictionary": "kamus arti kata dictionary cari kata",
  "/review": "ulangan hafalan flashcard spaced repetition srs ingat kata",
  "/vocabulary": "kosakata kosa kata bank kata simpan kata",
  "/gutenberg": "buku novel baca gratis gutenberg perpustakaan",
  "/library": "teks bacaan koleksi tambah teks ocr",
  "/latihan-membaca": "skimming scanning membaca cepat ide pokok timer",
  "/modul": "pelajaran mata pelajaran kuis belajar mandiri",
  "/kursus": "kursus dasar pemula nol unit a0 a1 a2",
  "/translation-workspace": "proyek terjemahan segmen ringkasan statistik saran penyuntingan bahasa indonesia",
  "/translation-workshop": "latihan terjemahan evaluasi ai umpan balik",
  "/translation-memory": "memori terjemahan simpan padanan",
  "/kesalahan-umum": "salah umum koreksi kalimat penutur indonesia",
  "/pasangan-bunyi": "bunyi lafal pelafalan dengar ucap ship sheep",
  "/frasa-harian": "frasa kalimat siap pakai percakapan audio",
  "/lingowise": "tanya ai asisten bedah teks analisis sastra",
  "/tools/alter-ego": "chat penulis persona shakespeare austen",
  "/english-lab/grammar": "tata bahasa grammar topik b2 c1 inversi subjunctive",
  "/english-lab/placement-test": "tes level cefr penempatan",
  "/settings": "pengaturan akun tema gelap terang ekspor hapus akun privasi",
  "/help": "bantuan faq panduan tanya liter ai",
  "/dashboard": "beranda rak bacaan lanjut membaca",
  "/profile": "profil progres tahap penerjemah",
};

const STATIC_ITEMS: { name: string; path: string; description: string }[] = [
  { name: "Pusat Bantuan", path: "/help", description: "Pertanyaan umum, panduan fitur, dan tanya Liter AI." },
  { name: "Pengaturan", path: "/settings", description: "Profil, tema, tujuan belajar, ekspor data, dan privasi." },
  { name: "Menu lengkap", path: "/menu", description: "Daftar semua menu aplikasi dengan kotak pencarian." },
];

/** Satu entri per path (path pertama menang). Daftar ruang ikut masuk sebagai entri tersendiri. */
export function buildFeatureIndex(): FeatureEntry[] {
  const menuItems = MENU_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));
  const out = new Map<string, FeatureEntry>();
  const add = (e: Omit<FeatureEntry, "keywords">) => {
    if (!out.has(e.path)) out.set(e.path, { ...e, keywords: KEYWORDS[e.path] ?? "" });
  };

  for (const room of ROOMS) {
    add({ name: room.title, path: `/ruang/${room.slug}`, description: room.description, section: "Ruang belajar" });
  }
  for (const room of ROOMS) {
    for (const path of new Set(room.sections.flatMap((s) => s.paths))) {
      const r = resolveItem(path, menuItems);
      add({ name: r.name, path, description: r.description, section: room.title });
    }
  }
  for (const item of menuItems) add({ name: item.name, path: item.path, description: item.description, section: item.group });
  for (const [path, v] of Object.entries(EXTRA_ITEMS)) add({ name: v.name, path, description: v.description, section: "Lainnya" });
  for (const s of STATIC_ITEMS) add({ ...s, section: "Umum" });
  return [...out.values()];
}

/** Huruf kecil, tanpa aksen, hanya huruf/angka/spasi. */
export function normalizeQuery(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreToken(entry: FeatureEntry, token: string): number {
  const name = normalizeQuery(entry.name);
  if (name === token) return 120;
  if (name.startsWith(token)) return 100;
  if (name.split(" ").some((w) => w.startsWith(token))) return 70;
  if (name.includes(token)) return 45;
  if (normalizeQuery(entry.keywords).split(" ").some((w) => w.startsWith(token))) return 35;
  if (normalizeQuery(entry.description).includes(token)) return 20;
  if (normalizeQuery(entry.section).includes(token)) return 10;
  if (normalizeQuery(entry.path).includes(token)) return 8;
  return 0;
}

/**
 * Cari fitur. Semua kata pencarian harus cocok (AND); urutan menurut skor, lalu urutan menu.
 * `isVisible` menyaring fitur yang disembunyikan flag (Kursus, Modul Belajar).
 */
export function searchFeatures(
  query: string,
  index: FeatureEntry[],
  opts: { limit?: number; isVisible?: (path: string) => boolean } = {},
): FeatureEntry[] {
  const tokens = normalizeQuery(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return [];
  const visible = opts.isVisible ?? (() => true);
  const scored: { e: FeatureEntry; score: number; i: number }[] = [];
  index.forEach((e, i) => {
    if (!visible(e.path)) return;
    let total = 0;
    for (const t of tokens) {
      const s = scoreToken(e, t);
      if (s === 0) return;
      total += s;
    }
    scored.push({ e, score: total, i });
  });
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.slice(0, opts.limit ?? 8).map((x) => x.e);
}

/** Pemfilter visibilitas standar menurut flag Kursus Dasar dan Modul Belajar. */
export function visibilityFilter(courseVisible: boolean, studyVisible: boolean) {
  return (path: string) => isPathVisible(path, courseVisible, studyVisible);
}

/** Daftar halaman untuk prompt Liter AI: satu baris per fitur, tautan memakai path yang benar-benar ada. */
export function featureListForAI(index: FeatureEntry[] = buildFeatureIndex()): string {
  return index.map((e) => `- ${e.name} (${e.path}): ${e.description}`).join("\n");
}
