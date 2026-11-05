// Kategori halaman /tools (Fase 23.4). Hanya data dan fungsi murni tanpa impor, agar bisa diuji unit
// (tests/tool-categories.test.mts). Nama alat TIDAK diubah; yang berubah hanya kelompok dan label kategorinya.
// Setiap alat di halaman /tools harus punya kategori; alat yang belum terdaftar jatuh ke "Pemahaman & Kosakata"
// (supaya tidak hilang diam-diam), dan uji gagal bila ada alat baru tanpa kategori.

export const ALL_CATEGORY = "semua";

export const TOOL_CATEGORIES = [
  { id: "pemahaman", label: "Pemahaman & Kosakata", blurb: "Memahami arti, struktur, tingkat kesulitan, dan pilihan kata." },
  { id: "kajian", label: "Kajian Sastra & Teori", blurb: "Membedah nada, majas, konflik, citraan, dan teori kritis." },
  { id: "penulisan", label: "Penulisan", blurb: "Menulis, mengubah gaya, dan menyusun karya serta portofolio." },
  { id: "penerjemahan", label: "Bantuan Penerjemahan", blurb: "Mengenali idiom, budaya, dan dialek, serta menilai terjemahan." },
  { id: "latihan", label: "Latihan Interaktif", blurb: "Berlatih langsung: ngobrol, kuis, menulis ulang, dan melafalkan." },
] as const;

export type ToolCategoryId = (typeof TOOL_CATEGORIES)[number]["id"];

const CATEGORY_OF: Record<string, ToolCategoryId> = {
  // Pemahaman & Kosakata
  "difficulty-analyzer": "pemahaman",
  "nuance-detector": "pemahaman",
  "literary-synonyms": "pemahaman",
  "diction-lab": "pemahaman",
  "sentence-architect": "pemahaman",
  "time-traveler": "pemahaman",
  "semantic-map": "pemahaman",
  "semantic-visual": "pemahaman",
  idioms: "pemahaman",
  glossary: "pemahaman",
  // Kajian Sastra & Teori
  "critical-lens": "kajian",
  "rhetorical-spotter": "kajian",
  "conflict-mapper": "kajian",
  "sentiment-spectrum": "kajian",
  "imagery-sketcher": "kajian",
  "poem-to-palette": "kajian",
  // Penulisan
  "mood-transformer": "penulisan",
  "era-translator": "penulisan",
  "vibe-translator": "penulisan",
  "metaphor-generator": "penulisan",
  "plot-twist": "penulisan",
  "character-monologue": "penulisan",
  "academic-outline": "penulisan",
  "essay-auditor": "penulisan",
  "case-study-generator": "penulisan",
  // Bantuan Penerjemahan
  "idiom-detector": "penerjemahan",
  "dialect-diver": "penerjemahan",
  "cultural-context": "penerjemahan",
  "imagery-grader": "penerjemahan",
  // Latihan Interaktif
  "pronunciation-clinic": "latihan",
  paraphrase: "latihan",
  "alter-ego": "latihan",
  "story-quiz": "latihan",
};

/** Kategori sebuah alat; alat yang belum terdaftar masuk "pemahaman". */
export function categoryOf(toolId: string): ToolCategoryId {
  return CATEGORY_OF[toolId] ?? "pemahaman";
}

/** Apakah alat sudah terdaftar eksplisit (dipakai uji agar alat baru tidak lupa dikategorikan). */
export function hasCategory(toolId: string): boolean {
  return toolId in CATEGORY_OF;
}

/** Semua id alat yang terdaftar (untuk uji). */
export function categorizedToolIds(): string[] {
  return Object.keys(CATEGORY_OF);
}

export function categoryLabel(id: string): string {
  return id === ALL_CATEGORY ? "Semua Alat" : TOOL_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export interface ToolLike {
  id: string;
  title: string;
  description: string;
}

/** Pencarian (judul atau deskripsi) dan filter kategori. `category` = ALL_CATEGORY atau id kategori. */
export function filterTools<T extends ToolLike>(tools: readonly T[], opts: { query?: string; category?: string }): T[] {
  const q = (opts.query ?? "").trim().toLowerCase();
  const cat = opts.category ?? ALL_CATEGORY;
  return tools.filter((t) => {
    const matchesSearch = !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    const matchesCategory = cat === ALL_CATEGORY || categoryOf(t.id) === cat;
    return matchesSearch && matchesCategory;
  });
}

/** Alat dikelompokkan per kategori dengan urutan kategori tetap; kategori kosong dibuang. */
export function groupToolsByCategory<T extends ToolLike>(tools: readonly T[]): { id: ToolCategoryId; label: string; blurb: string; tools: T[] }[] {
  return TOOL_CATEGORIES.map((c) => ({ id: c.id, label: c.label, blurb: c.blurb, tools: tools.filter((t) => categoryOf(t.id) === c.id) })).filter((g) => g.tools.length > 0);
}
