// Susunan fitur v4: tiga Ruang + Koleksi + Komunitas (docs/v4/PRD.md §5.2, DESIGN.md §6.3).
// File ini hanya berisi PATH dan URUTAN (tanpa impor, agar bisa diuji unit). Nama & keterangan item diambil dari
// lib/menu-config.ts lewat resolveRoomSections() di bawah; item di luar menu lama didaftarkan di EXTRA_ITEMS.
// Satu item boleh muncul di beberapa ruang. tests/menu-coverage.test.mts memastikan tidak ada fitur yang hilang.

export type RoomSlug = "belajar-dasar" | "baca-sastra" | "terjemah" | "koleksi" | "komunitas";

export interface RoomSection {
  title: string;
  /** Keterangan satu baris di bawah judul bagian. */
  blurb?: string;
  paths: string[];
}

export interface Room {
  slug: RoomSlug;
  /** Penomoran gaya daftar isi: "Ruang I"; kosong untuk Koleksi & Komunitas. */
  eyebrow: string;
  title: string;
  description: string;
  /** Tujuan belajar (lib/learning-goals) yang paling cocok; dipakai untuk tanda "Tujuanmu". */
  goal?: "umum" | "sastra" | "penerjemahan";
  sections: RoomSection[];
}

export const ROOMS: Room[] = [
  {
    slug: "belajar-dasar",
    eyebrow: "Ruang I",
    title: "Belajar Dasar",
    description: "Mulai dari level kamu, lalu bangun grammar, kosakata, dan keterampilan Inggris sehari-hari selangkah demi selangkah.",
    goal: "umum",
    sections: [
      { title: "Ketahui levelmu", blurb: "Mulai di sini bila belum yakin level CEFR kamu.", paths: ["/english-lab/placement-test", "/english-lab/level-test"] },
      { title: "Grammar & kosakata inti", blurb: "Fondasi yang paling sering dipakai.", paths: ["/english-lab/grammar", "/vocabulary/core"] },
      { title: "Bacaan berjenjang", blurb: "Teks yang disaring menurut level.", paths: ["/library"] },
      {
        title: "Latihan keterampilan",
        blurb: "Menyimak, berbicara, dan grammar dalam praktik.",
        paths: [
          "/english-lab/listening-test",
          "/tools/pronunciation-clinic",
          "/english-lab/dialogue-simulator",
          "/english-lab/grammar-clinic",
          "/english-lab/flashcard",
        ],
      },
      {
        title: "Latihan lanjutan",
        blurb: "Menulis ulang, menyusun kalimat, dan bahasa informal.",
        paths: ["/tools/paraphrase", "/tools/writing-assistant", "/tools/sentence-architect", "/tools/story-quiz", "/english-lab/slang-decoder"],
      },
    ],
  },
  {
    slug: "baca-sastra",
    eyebrow: "Ruang II",
    title: "Baca & Kajian Sastra",
    description: "Baca karya klasik, pahami teksnya, lalu bedah gaya dan maknanya.",
    goal: "sastra",
    sections: [
      { title: "Bacaan", blurb: "Koleksi teks, buku klasik, dan teks dari fotomu sendiri.", paths: ["/library", "/gutenberg", "/library/add/ocr", "/library/add"] },
      {
        title: "Alat memahami teks",
        blurb: "Arti kata, latar budaya, dan tingkat kesulitan.",
        paths: [
          "/tools/a-z-dictionary",
          "/tools/lexicon-search",
          "/tools/cultural-context",
          "/tools/difficulty-analyzer",
          "/tools/idiom-detector",
          "/tools/nuance-detector",
          "/tools/literary-synonyms",
        ],
      },
      { title: "LingoWise AI", blurb: "Tanya AI soal bahasa dan sastra (8 mode).", paths: ["/lingowise"] },
      {
        title: "Analisis sastra",
        blurb: "Nada, majas, konflik, dan teori kritis.",
        paths: [
          "/tools/tone-analyzer",
          "/tools/rhetorical-spotter",
          "/tools/critical-lens",
          "/tools/conflict-mapper",
          "/tools/dialect-diver",
          "/tools/diction-lab",
          "/tools/sentiment-spectrum",
          "/tools/imagery-grader",
          "/tools/semantic-map",
          "/tools/semantic-visual",
          "/tools/academic-outline",
          "/tools/essay-auditor",
        ],
      },
      {
        title: "Kreatif",
        blurb: "Mengubah gaya, suasana, dan sudut pandang.",
        paths: [
          "/tools/alter-ego",
          "/tools/vibe-translator",
          "/tools/mood-transformer",
          "/tools/era-translator",
          "/tools/metaphor-generator",
          "/tools/imagery-sketcher",
          "/tools/poem-to-palette",
          "/tools/time-traveler",
          "/tools/character-monologue",
          "/tools/plot-twist",
          "/tools/case-study-generator",
        ],
      },
      { title: "Catatanmu", paths: ["/tools/annotations"] },
    ],
  },
  {
    slug: "terjemah",
    eyebrow: "Ruang III",
    title: "Ruang Terjemah",
    description: "Berlatih menerjemahkan, menyimpan hasilnya, dan membandingkan pilihan terjemahan.",
    goal: "penerjemahan",
    sections: [
      { title: "Menerjemahkan", blurb: "Latihan bernilai AI, lalu teks panjang per kalimat.", paths: ["/translation-workshop", "/translation-workspace"] },
      { title: "Memori & glosarium", paths: ["/translation-memory", "/glossary"] },
      { title: "Membandingkan & memadankan", paths: ["/tools/comparator", "/tools/parallel-text", "/tools/untranslatables"] },
      { title: "Menelusuri proses", paths: ["/tools/translation-timelapse"] },
      { title: "Tahap penerjemah", blurb: "Lihat tahapmu di profil.", paths: ["/profile"] },
    ],
  },
  {
    slug: "koleksi",
    eyebrow: "Koleksi saya",
    title: "Koleksi saya",
    description: "Semua yang sudah kamu simpan, ulangi, dan baca.",
    sections: [
      { title: "Kata & ulangan", paths: ["/vocabulary", "/review", "/english-lab/flashcard", "/idioms", "/glossary", "/tools/lexicon-search"] },
      { title: "Bacaan & catatan", paths: ["/dashboard", "/library", "/tools/annotations", "/history"] },
    ],
  },
  {
    slug: "komunitas",
    eyebrow: "Komunitas",
    title: "Komunitas",
    description: "Berdiskusi, membaca bersama, dan berbagi catatan dengan pembaca lain.",
    sections: [{ title: "Bersama pembaca lain", paths: ["/forum", "/clubs", "/community", "/community-annotations", "/messages"] }],
  },
];

/** Tiga ruang belajar (tanpa Koleksi & Komunitas). */
export const LEARNING_ROOMS = ROOMS.filter((r) => r.goal);

export function getRoom(slug: string): Room | undefined {
  return ROOMS.find((r) => r.slug === slug);
}

/** Item yang tidak ada di lib/menu-config.ts (halaman utama, alat dinamis di luar menu, dll.). */
export const EXTRA_ITEMS: Record<string, { name: string; description: string }> = {
  "/dashboard": { name: "Rak bacaan", description: "Lanjutkan membaca dari terakhir kamu berhenti." },
  "/library/add": { name: "Tambah Teks", description: "Tulis teks sendiri atau buat teks bacaan dengan AI." },
  "/lingowise": { name: "LingoWise AI", description: "Asisten AI untuk bertanya soal bahasa dan sastra." },
  "/profile": { name: "Tahap penerjemah", description: "Tahap dan progres penerjemahmu di profil." },
  "/messages": { name: "Pesan", description: "Kotak masuk pesan dari pengguna lain." },
  "/tools/essay-auditor": { name: "Essay Auditor", description: "Audit kekuatan argumen dan kohesi paragraf esai." },
  "/tools/case-study-generator": { name: "Portfolio Case Study Generator", description: "Buat case study profesional untuk portofolio." },
};

/** Semua path yang terjangkau lewat ruang (untuk uji cakupan). */
export function allRoomPaths(): Set<string> {
  return new Set(ROOMS.flatMap((r) => r.sections.flatMap((s) => s.paths)));
}

export interface ResolvedItem {
  name: string;
  path: string;
  description: string;
}

/** Cari nama & keterangan tiap path; path yang tak dikenal tetap tampil dengan path-nya agar tidak hilang diam-diam. */
export function resolveItem(path: string, menu: { name: string; path: string; description: string }[]): ResolvedItem {
  const hit = menu.find((m) => m.path === path);
  if (hit) return { name: hit.name, path, description: hit.description };
  const extra = EXTRA_ITEMS[path];
  if (extra) return { path, ...extra };
  return { name: path, path, description: "" };
}
