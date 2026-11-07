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

/** Kursus Dasar (Fase 16). Disembunyikan dari pengguna biasa selama flag `kursus_dasar` mati; tetap terdaftar di ruang agar uji cakupan menu tidak gagal. */
export const COURSE_PATH = "/kursus";

/** Modul Belajar (Fase 24). Disembunyikan dari pengguna biasa selama flag `modul_belajar` mati; tetap terdaftar di ruang agar uji cakupan menu tidak gagal. */
export const STUDY_PATH = "/modul";

export const ROOMS: Room[] = [
  {
    slug: "belajar-dasar",
    eyebrow: "Ruang I",
    title: "Belajar Bahasa Inggris",
    description: "Dari nol sampai level B1: bangun grammar, kosakata, dan keterampilan Inggris sehari-hari selangkah demi selangkah.",
    goal: "umum",
    sections: [
      { title: "Ketahui levelmu", blurb: "Mulai di sini bila belum yakin level CEFR kamu.", paths: ["/english-lab/placement-test", "/english-lab/level-test"] },
      { title: "Kursus Dasar", blurb: "Unit bertema A0–A2: kosakata, grammar, bacaan, dengar, latihan, dan bicara.", paths: [COURSE_PATH] },
      { title: "Frasa harian", blurb: "Kalimat siap pakai per situasi: salam, angka & waktu, belanja, arah, darurat.", paths: ["/frasa-harian"] },
      { title: "Modul Belajar", blurb: "Belajar mandiri bertahap, mulai dari tahap Fondasi.", paths: [STUDY_PATH] },
      { title: "Grammar & kosakata inti", blurb: "Fondasi yang paling sering dipakai.", paths: ["/english-lab/grammar", "/vocabulary/core"] },
      { title: "Khas penutur Indonesia", blurb: "Kesalahan yang sering muncul dan bunyi yang mirip di telinga kita.", paths: ["/kesalahan-umum", "/pasangan-bunyi"] },
      { title: "Bacaan berjenjang", blurb: "Teks yang disaring menurut level, dan latihan membaca cepat.", paths: ["/library", "/latihan-membaca"] },
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
        paths: ["/tools/writing-assistant", "/tools/sentence-architect", "/tools/story-quiz", "/english-lab/slang-decoder"],
      },
    ],
  },
  {
    slug: "baca-sastra",
    eyebrow: "Ruang II",
    title: "Membaca & Sastra",
    description: "Baca karya klasik, pahami konteksnya, bedah gaya dan maknanya, lalu tulis dan berkreasi dari bacaanmu.",
    goal: "sastra",
    sections: [
      { title: "Sumber bacaan", blurb: "Koleksi teks, buku klasik, dan teks dari fotomu sendiri.", paths: ["/library", "/gutenberg", "/library/add/ocr", "/library/add"] },
      {
        title: "Memahami konteks",
        blurb: "Arti kata, latar budaya, tingkat kesulitan, dan tanya jawab dengan AI.",
        paths: [
          "/tools/a-z-dictionary",
          "/tools/lexicon-search",
          "/tools/cultural-context",
          "/tools/difficulty-analyzer",
          "/tools/idiom-detector",
          "/tools/nuance-detector",
          "/tools/literary-synonyms",
          "/lingowise",
        ],
      },
      {
        title: "Bedah sastra & teori",
        blurb: "Nada, majas, konflik, citraan, dan teori kritis.",
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
        ],
      },
      {
        title: "Penulisan & portofolio",
        blurb: "Kerangka esai, menulis ulang, audit argumen, dan studi kasus portofolio.",
        paths: ["/tools/academic-outline", "/tools/writing-assistant", "/tools/essay-auditor", "/tools/paraphrase", "/tools/case-study-generator"],
      },
      {
        title: "Eksperimen kreatif",
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
        ],
      },
      { title: "Modul Belajar", blurb: "Pelajaran lengkap tentang membaca, menulis, bahasa, dan sastra.", paths: [STUDY_PATH] },
      { title: "Catatanmu", paths: ["/tools/annotations"] },
    ],
  },
  {
    slug: "terjemah",
    eyebrow: "Ruang III",
    title: "Menerjemahkan",
    description: "Siapkan teks sebelum diterjemahkan, berlatih menerjemahkan, simpan hasilnya, lalu bandingkan dan nilai.",
    goal: "penerjemahan",
    sections: [
      { title: "Pra-terjemah", blurb: "Kenali idiom, budaya, dan dialek sebelum menerjemahkan.", paths: ["/tools/idiom-detector", "/tools/cultural-context", "/tools/dialect-diver", "/tools/untranslatables"] },
      { title: "Menerjemahkan", blurb: "Latihan bernilai AI, lalu teks panjang per kalimat.", paths: ["/translation-workshop", "/translation-workspace"] },
      { title: "Memori & glosarium", paths: ["/translation-memory", "/glossary"] },
      { title: "Evaluasi & perbandingan", blurb: "Bandingkan pilihan terjemahan dan nilai citraannya.", paths: ["/tools/comparator", "/tools/parallel-text", "/tools/imagery-grader"] },
      { title: "Menelusuri proses", paths: ["/tools/translation-timelapse"] },
      { title: "Modul Belajar", blurb: "Pelajaran lengkap tentang teori dan praktik penerjemahan.", paths: [STUDY_PATH] },
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

/**
 * Tiga pintasan Beranda (Fase 23.3): membuka bagian yang sudah ada, bukan katalog baru.
 * Mulai dari Nol → unit kursus berikutnya (bila kursus boleh tampil) atau Ruang I;
 * Lanjutkan Membaca → bacaan terakhir yang belum selesai atau Ruang II; Mulai Menerjemahkan → Ruang III.
 */
export function homeShortcuts(input: { courseHref?: string | null; readingHref?: string | null }): { label: string; href: string }[] {
  return [
    { label: "Mulai dari Nol", href: input.courseHref || "/ruang/belajar-dasar" },
    { label: "Lanjutkan Membaca", href: input.readingHref || "/ruang/baca-sastra" },
    { label: "Mulai Menerjemahkan", href: "/ruang/terjemah" },
  ];
}

/** Tiga ruang belajar (tanpa Koleksi & Komunitas). */
export const LEARNING_ROOMS = ROOMS.filter((r) => r.goal);

export function getRoom(slug: string): Room | undefined {
  return ROOMS.find((r) => r.slug === slug);
}

/** Item yang tidak ada di lib/menu-config.ts (halaman utama, alat dinamis di luar menu, dll.). */
export const EXTRA_ITEMS: Record<string, { name: string; description: string }> = {
  "/kesalahan-umum": { name: "Kesalahan Umum", description: "Kesalahan khas penutur Indonesia: kalimat salah, perbaikan, penjelasan, dan latihan." },
  "/pasangan-bunyi": { name: "Pasangan Bunyi", description: "Latihan dengar dan ucapkan kata yang bunyinya mirip, seperti ship dan sheep." },
  "/latihan-membaca": { name: "Latihan Skimming & Scanning", description: "Latihan menangkap gambaran umum dan mencari informasi tertentu di teks, dengan timer opsional." },
  "/frasa-harian": { name: "Frasa harian", description: "Kalimat siap pakai per situasi, dengan audio, arti natural, dan arti kata per kata." },
  [STUDY_PATH]: { name: "Modul Belajar", description: "Pelajaran lengkap per mata pelajaran: penjelasan, contoh, latihan, rangkuman, dan tugas. Pendamping belajar mandiri, bukan program resmi lembaga mana pun." },
  [COURSE_PATH]: { name: "Kursus Dasar", description: "Unit bertema A0–A2 dengan langkah berurutan; unit berikutnya disarankan, tidak dikunci." },
  "/dashboard": { name: "Rak bacaan", description: "Lanjutkan membaca dari terakhir kamu berhenti." },
  "/library/add": { name: "Tambah Teks", description: "Tulis teks sendiri atau buat teks bacaan dengan AI." },
  "/lingowise": { name: "LingoWise AI", description: "Asisten AI untuk bertanya soal bahasa dan sastra." },
  "/profile": { name: "Tahap penerjemah", description: "Tahap dan progres penerjemahmu di profil." },
  "/messages": { name: "Pesan", description: "Kotak masuk pesan dari pengguna lain." },
  "/tools/essay-auditor": { name: "Essay Auditor", description: "Audit kekuatan argumen dan kohesi paragraf esai." },
  "/tools/case-study-generator": { name: "Portfolio Case Study Generator", description: "Buat case study profesional untuk portofolio." },
};

/**
 * Path yang disembunyikan menurut flag; `courseVisible` = Kursus Dasar boleh tampil, `studyVisible` = Modul Belajar boleh
 * tampil (flag menyala atau pengguna admin). Bawaan studyVisible = false, jadi pemanggil lama tidak melihat /modul.
 */
export function isPathVisible(path: string, courseVisible: boolean, studyVisible = false): boolean {
  if (path === COURSE_PATH) return courseVisible;
  if (path === STUDY_PATH) return studyVisible;
  return true;
}

/** Bagian ruang tanpa item yang disembunyikan; bagian yang jadi kosong ikut dibuang. */
export function visibleSections(room: Room, courseVisible: boolean, studyVisible = false): RoomSection[] {
  return room.sections
    .map((s) => ({ ...s, paths: s.paths.filter((p) => isPathVisible(p, courseVisible, studyVisible)) }))
    .filter((s) => s.paths.length > 0);
}

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
