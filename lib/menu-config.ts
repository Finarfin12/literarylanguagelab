import {
  BookOpen, BookMarked, Headphones, Languages, Users, BrainCircuit, Shapes,
  type LucideIcon,
} from "lucide-react";
import type { LearningGoal } from "@/lib/learning-goals";

export interface MenuItem {
  /** Nama fitur (merek, boleh bahasa Inggris). */
  name: string;
  path: string;
  /** Keterangan satu baris, bahasa Indonesia. */
  description: string;
  /** Tujuan belajar yang paling cocok; dipakai blok "Alat untuk kamu" di beranda. */
  goals?: LearningGoal[];
  /** Alat jarang dipakai: ditampilkan terlipat di grup "Lainnya". */
  advanced?: true;
}

/** Halaman utama yang tampil sebagai tombol tersendiri di atas Sidebar dan grup "Utama" di HP. */
export const PINNED_PATHS = ["/library", "/gutenberg", "/tools/a-z-dictionary"];

export interface MenuGroup {
  title: string;
  icon: LucideIcon;
  color: string;
  items: MenuItem[];
  /** Grup terlipat secara default. */
  collapsedByDefault?: true;
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    title: "Baca & Pahami",
    icon: BookOpen,
    color: "text-blue-400",
    items: [
      { name: "Text Library", path: "/library", description: "Koleksi teks bacaan dengan filter level.", goals: ["umum", "sastra", "penerjemahan"] },
      { name: "Buku Klasik", path: "/gutenberg", description: "Ribuan karya sastra domain publik dari Project Gutenberg.", goals: ["sastra"] },
      { name: "OCR Lens", path: "/library/add/ocr", description: "Foto halaman buku, ubah jadi teks yang bisa dibaca." },
      { name: "Word Lookup (A-Z)", path: "/tools/a-z-dictionary", description: "Cari arti dan contoh kata dengan cepat.", goals: ["umum"] },
      { name: "Cultural Context", path: "/tools/cultural-context", description: "Referensi mitologi dan sejarah di balik sebuah teks.", goals: ["sastra"] },
      { name: "Difficulty Predictor", path: "/tools/difficulty-analyzer", description: "Perkirakan tingkat kesulitan sebuah teks." },
      { name: "My Annotations", path: "/tools/annotations", description: "Catatan dan sorotan yang kamu buat saat membaca." },
      { name: "Archive & Insights", path: "/history", description: "Riwayat bacaan dan aktivitas belajarmu." },
    ],
  },
  {
    title: "Kuasai Kosakata",
    icon: BookMarked,
    color: "text-amber-400",
    items: [
      { name: "Vocabulary Bank", path: "/vocabulary", description: "Semua kata yang kamu simpan dari bacaan.", goals: ["umum", "sastra", "penerjemahan"] },
      { name: "Kosakata Inti", path: "/vocabulary/core", description: "Kata paling sering dipakai, dari level A1, siap ditambah ke Review.", goals: ["umum"] },
      { name: "Review (SRS)", path: "/review", description: "Ulangi kata pada waktu yang tepat agar tidak lupa.", goals: ["umum", "sastra", "penerjemahan"] },
      { name: "Flashcard SRS", path: "/english-lab/flashcard", description: "Latihan kartu kosakata bergaya flashcard.", goals: ["umum"] },
      { name: "Idiom Library", path: "/idioms", description: "Daftar idiom Inggris beserta arti dan terjemahannya.", goals: ["umum"] },
      { name: "Glossary Builder", path: "/glossary", description: "Susun glosarium istilah per buku atau proyek.", goals: ["penerjemahan"] },
      { name: "Lexicon Search", path: "/tools/lexicon-search", description: "Cari kata dan padanannya di seluruh koleksimu." },
      { name: "Literary Synonyms", path: "/tools/literary-synonyms", description: "Sinonim bernuansa sastra untuk sebuah kata.", goals: ["sastra"] },
      { name: "Nuance Detector", path: "/tools/nuance-detector", description: "Bedakan nuansa kata-kata yang mirip artinya." },
      { name: "Idiom & Metaphor Detector", path: "/tools/idiom-detector", description: "Temukan idiom dan metafora di dalam teks." },
      { name: "Story Quiz", path: "/tools/story-quiz", description: "Kuis cerita pendek dari kosakata koleksimu." },
    ],
  },
  {
    title: "Latih Bahasa Inggris",
    icon: Headphones,
    color: "text-emerald-400",
    items: [
      { name: "Placement Test", path: "/english-lab/placement-test", description: "Tes singkat untuk mengetahui level CEFR kamu.", goals: ["umum"] },
      { name: "Tes Naik Level", path: "/english-lab/level-test", description: "Tes singkat untuk naik ke level CEFR berikutnya.", goals: ["umum"] },
      { name: "Grammar Dasar", path: "/english-lab/grammar", description: "20 topik grammar A1-B1 yang disusun berurutan.", goals: ["umum"] },
      { name: "Grammar Clinic", path: "/english-lab/grammar-clinic", description: "Latihan dan penjelasan tata bahasa.", goals: ["umum", "penerjemahan"] },
      { name: "Dialogue Simulator", path: "/english-lab/dialogue-simulator", description: "Latihan percakapan dengan lawan bicara AI.", goals: ["umum"] },
      { name: "Listening Test", path: "/english-lab/listening-test", description: "Latihan menyimak dengan soal pemahaman.", goals: ["umum"] },
      { name: "Pronunciation Clinic", path: "/tools/pronunciation-clinic", description: "Cek pelafalan kata atau kalimatmu.", goals: ["umum"] },
      { name: "Slang Decoder", path: "/english-lab/slang-decoder", description: "Pahami bahasa gaul dan ungkapan informal." },
      { name: "Paraphrase Challenge", path: "/tools/paraphrase", description: "Latih menulis ulang kalimat tanpa mengubah maknanya.", goals: ["penerjemahan"] },
      { name: "AI Writing Assistant", path: "/tools/writing-assistant", description: "Bantuan memperbaiki dan mengembangkan tulisanmu.", goals: ["umum"] },
      { name: "Sentence Architect", path: "/tools/sentence-architect", description: "Susun kalimat yang lebih kuat dan bervariasi." },
    ],
  },
  {
    title: "Analisis Sastra",
    icon: BrainCircuit,
    color: "text-purple-400",
    items: [
      { name: "Tone & Gaya", path: "/tools/tone-analyzer", description: "Deteksi nada sebuah teks, atau ubah ke nada lain.", goals: ["sastra"] },
      { name: "Rhetorical Spotter", path: "/tools/rhetorical-spotter", description: "Temukan majas dan efeknya pada pembaca.", goals: ["sastra"] },
      { name: "Critical Lens", path: "/tools/critical-lens", description: "Bedah teks lewat teori kritis (feminisme, Marxis, dll.).", goals: ["sastra"] },
      { name: "Conflict Mapper", path: "/tools/conflict-mapper", description: "Petakan konflik dan tokoh dalam sebuah cerita.", goals: ["sastra"] },
      { name: "Dialect Diver", path: "/tools/dialect-diver", description: "Terjemahkan dialek atau slang tokoh ke Inggris baku." },
      { name: "Diction Lab", path: "/tools/diction-lab", description: "Telaah pilihan kata dan dampaknya." },
      { name: "Vibe Translator", path: "/tools/vibe-translator", description: "Ringkas nada, kata kunci, dan parafrase sederhana." },
      { name: "Mood Transformer", path: "/tools/mood-transformer", description: "Ubah suasana sebuah kalimat (puitis, kelam, dll.)." },
      { name: "Era Translator", path: "/tools/era-translator", description: "Tulis ulang teks dengan gaya era sastra tertentu." },
      { name: "Alter Ego Chat", path: "/tools/alter-ego", description: "Mengobrol dengan penulis atau tokoh klasik." },
      { name: "Sentiment Spectrum", path: "/tools/sentiment-spectrum", description: "Lihat sebaran sentimen sepanjang teks." },
      { name: "Metaphor Generator", path: "/tools/metaphor-generator", description: "Buat metafora dari sebuah ide." },
      { name: "Academic Outline", path: "/tools/academic-outline", description: "Susun kerangka esai atau makalah akademik.", goals: ["sastra"] },
      { name: "Imagery Sketcher", path: "/tools/imagery-sketcher", description: "Ubah citraan dalam teks menjadi sketsa.", advanced: true },
      { name: "Imagery Grader", path: "/tools/imagery-grader", description: "Nilai kekuatan citraan dari deskripsimu.", advanced: true },
      { name: "Semantic Visual", path: "/tools/semantic-visual", description: "Visualisasi hubungan makna antar kata." },
      { name: "Semantic Map", path: "/tools/semantic-map", description: "Peta makna berbentuk jaringan kata." },
      { name: "Poem to Palette", path: "/tools/poem-to-palette", description: "Ubah suasana puisi menjadi palet warna.", advanced: true },
      { name: "Time Traveler", path: "/tools/time-traveler", description: "Lihat bagaimana sebuah kata berubah makna dari masa ke masa.", advanced: true },
      { name: "Character Monologue", path: "/tools/character-monologue", description: "Tulis monolog dari sudut pandang seorang tokoh.", advanced: true },
      { name: "Plot Twist", path: "/tools/plot-twist", description: "Cari kemungkinan kejutan alur untuk sebuah cerita.", advanced: true },
    ],
  },
  {
    title: "Latih Menerjemahkan",
    icon: Languages,
    color: "text-cyan-400",
    items: [
      { name: "Translation Workshop", path: "/translation-workshop", description: "Terjemahkan teks dan dapatkan penilaian dari AI.", goals: ["penerjemahan"] },
      { name: "Ruang Kerja Segmen", path: "/translation-workspace", description: "Terjemahkan teks panjang per kalimat dengan TM, glosarium, dan rubrik.", goals: ["penerjemahan"] },
      { name: "Translation Memory", path: "/translation-memory", description: "Simpan dan cari ulang terjemahan yang pernah kamu buat.", goals: ["penerjemahan"] },
      { name: "Side-by-Side Comparator", path: "/tools/comparator", description: "Bandingkan dua terjemahan berdampingan.", goals: ["penerjemahan"] },
      { name: "Untranslatables", path: "/tools/untranslatables", description: "Kata yang sulit dipadankan dan cara menyiasatinya.", goals: ["penerjemahan"] },
      { name: "Parallel Text Mode", path: "/tools/parallel-text", description: "Baca teks sumber dan terjemahannya sejajar.", goals: ["penerjemahan"] },
      { name: "Translation Timelapse", path: "/tools/translation-timelapse", description: "Putar ulang proses revisi terjemahanmu." },
    ],
  },
  {
    title: "Komunitas",
    icon: Users,
    color: "text-rose-400",
    items: [
      { name: "Discussion Board", path: "/forum", description: "Forum diskusi tentang bacaan dan bahasa." },
      { name: "Jejaring Pembaca", path: "/community", description: "Temukan pembaca lain dengan minat serupa." },
      { name: "Shared Annotations", path: "/community-annotations", description: "Catatan bacaan yang dibagikan pengguna lain." },
      { name: "Reading Clubs", path: "/clubs", description: "Klub baca bersama." },
    ],
  },
  // Grup "Lainnya": diisi otomatis oleh getMenuGroups() dari item bertanda `advanced: true`
  // (daftar disetujui pemilik, Q5).
  {
    title: "Lainnya",
    icon: Shapes,
    color: "text-muted-foreground",
    collapsedByDefault: true,
    items: [],
  },
];

/** Item yang tampil sebagai tombol tersendiri (PINNED_PATHS) tidak diulang di dalam grup. */
export function getGroupedMenu(): MenuGroup[] {
  return getMenuGroups()
    .map((g) => ({ ...g, items: g.items.filter((i) => !PINNED_PATHS.includes(i.path)) }))
    .filter((g) => g.items.length > 0);
}

/** Gabungan item yang ditandai `advanced` dari semua grup, untuk grup "Lainnya". */
export function getMenuGroups(): MenuGroup[] {
  const advanced = MENU_GROUPS.flatMap((g) => g.items.filter((i) => i.advanced));
  return MENU_GROUPS.map((g) => {
    if (g.title === "Lainnya") return { ...g, items: [...g.items, ...advanced] };
    return { ...g, items: g.items.filter((i) => !i.advanced) };
  }).filter((g) => g.items.length > 0);
}

/** Alat yang cocok dengan tujuan belajar (urutan menu), maksimal `limit`. */
export function toolsForGoal(goal: LearningGoal, limit = 6): (MenuItem & { group: string })[] {
  const out: (MenuItem & { group: string })[] = [];
  for (const g of MENU_GROUPS) {
    for (const item of g.items) {
      if (item.goals?.includes(goal) && !item.advanced) out.push({ ...item, group: g.title });
    }
  }
  return out.slice(0, limit);
}
