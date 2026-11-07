// Latihan skimming dan scanning (Fase 29, item 1). Data teks latihan dan fungsi murni tanpa impor runtime agar bisa diuji unit
// (tests/reading-drill.test.mts). Semua teks ditulis sendiri untuk latihan. Tanpa AI, tanpa database, tanpa migrasi.
// Timer bersifat opsional dan HANYA menampilkan waktu: teks tidak pernah disembunyikan paksa dan latihan tidak dihentikan timer.

export type ReadingLevel = "B1" | "B2" | "C1";

export interface SkimQuestion {
  question: string;
  options: string[];
  /** Indeks pilihan yang benar. */
  correct: number;
  explanation_id: string;
}

export interface ScanQuestion {
  question: string;
  /** Indeks paragraf yang memuat jawaban. */
  paragraph: number;
  /** Jawaban singkat; HARUS muncul harfiah di paragraf tersebut (diperiksa uji). */
  answer: string;
}

export interface ReadingText {
  id: string;
  title: string;
  level: ReadingLevel;
  topic: string;
  paragraphs: string[];
  skim: SkimQuestion[];
  scan: ScanQuestion[];
}

/** Target waktu yang disarankan (hanya penanda, bukan batas). */
export const SKIM_TARGET_SECONDS = 60;
export const SCAN_TARGET_SECONDS = 20;

export const READING_TEXTS: ReadingText[] = [
  {
    id: "night-market",
    title: "The Night Market on Lantern Street",
    level: "B1",
    topic: "Kehidupan kota",
    paragraphs: [
      "Every Friday and Saturday evening, Lantern Street changes. By six o'clock the traffic is gone, and about sixty stalls appear along the road. The market has been running for eleven years, and it began when three neighbours started selling home-made snacks from folding tables.",
      "The food is the main attraction. Most dishes cost between two and six dollars, although the grilled corn is cheaper at one dollar fifty. Visitors often queue for the sweet pancakes, which a retired teacher called Mrs Salim makes on a small iron pan. She says the secret is a pinch of salt.",
      "Not everything is food. Near the old fountain, a local band plays from seven thirty until nine, and a small table sells second-hand books for a dollar each. Children like the paper-lantern workshop, where they can make a lamp to take home.",
      "The market closes at eleven, and volunteers clean the street before midnight. On days with heavy rain the organisers cancel the event and post a notice on the community noticeboard. Visitors are asked to bring their own bags to reduce plastic waste.",
    ],
    skim: [
      {
        question: "What is the text mainly about?",
        options: [
          "A weekly street market and what visitors can do there",
          "The history of grilled corn",
          "How to cook sweet pancakes at home",
          "New traffic rules for city streets",
        ],
        correct: 0,
        explanation_id: "Setiap paragraf membahas pasar malam: gambaran umum, makanan, hiburan, dan aturan. Teks tidak membahas sejarah jagung, resep, atau aturan lalu lintas.",
      },
      {
        question: "What is the writer's main purpose?",
        options: ["To describe and inform", "To complain about noise", "To advertise one stall only", "To argue against street markets"],
        correct: 0,
        explanation_id: "Nada teks netral dan bersifat memberi gambaran. Tidak ada keluhan, iklan satu kios, atau argumen menentang pasar.",
      },
    ],
    scan: [
      { question: "How many stalls appear on the street?", paragraph: 0, answer: "about sixty" },
      { question: "How much is the grilled corn?", paragraph: 1, answer: "one dollar fifty" },
      { question: "At what time does the band stop playing?", paragraph: 2, answer: "nine" },
      { question: "What happens on days with heavy rain?", paragraph: 3, answer: "cancel the event" },
    ],
  },
  {
    id: "quiet-libraries",
    title: "How Libraries Learned to Be Loud",
    level: "B2",
    topic: "Budaya dan masyarakat",
    paragraphs: [
      "For most of the twentieth century, a library was a place of enforced silence. Readers walked on tiptoe, librarians shushed, and the rules were pinned to the wall in capital letters. In recent years, however, many libraries have started to encourage conversation, and the change has surprised some of their oldest visitors.",
      "The Harbour Library, reopened in 2019 after a two-year renovation, is a good example. Its architects removed a third of the shelving from the ground floor to make room for a cafe, a children's corner and a studio where visitors can record podcasts. Borrowing figures fell slightly in the first year, but the number of people entering the building rose by nearly forty percent.",
      "Supporters argue that the building now serves more people than before. Students use the long tables for group work, job seekers attend free workshops, and older residents come for the weekly reading circle. Critics reply that readers who want to concentrate have lost their refuge, and they point to the single silent room on the top floor, which is often full.",
      "The library's director, Amina Torres, accepts part of this criticism. She says the next stage of the project will add a second quiet room and install soundproof glass around the cafe. \"We never wanted noise for its own sake,\" she explains. \"We wanted people to feel that the building belongs to them.\"",
      "Whether the experiment succeeds will depend on balance. Other cities are watching Harbour closely, because many of them are weighing the same choice between the silent reading room and the lively public square.",
    ],
    skim: [
      {
        question: "What is the text mainly about?",
        options: [
          "Libraries changing from silent places to lively public spaces",
          "The best way to record a podcast",
          "A ban on borrowing books",
          "The architecture of twentieth-century buildings",
        ],
        correct: 0,
        explanation_id: "Paragraf pertama menyatakan perubahan, paragraf berikutnya memberi contoh, pendukung, dan pengkritik. Podcast hanya salah satu contoh fasilitas.",
      },
      {
        question: "Which description fits the writer's approach best?",
        options: [
          "A balanced account that gives both supporters' and critics' views",
          "A one-sided attack on the new library",
          "A set of instructions for library staff",
          "A personal memory of childhood visits",
        ],
        correct: 0,
        explanation_id: "Teks menyebut pendukung dan pengkritik, lalu tanggapan direktur. Itu ciri pemaparan seimbang.",
      },
    ],
    scan: [
      { question: "When did the Harbour Library reopen?", paragraph: 1, answer: "2019" },
      { question: "By roughly what percentage did the number of visitors rise?", paragraph: 1, answer: "forty percent" },
      { question: "Where is the silent room?", paragraph: 2, answer: "top floor" },
      { question: "Who is the library's director?", paragraph: 3, answer: "Amina Torres" },
    ],
  },
  {
    id: "why-we-forget",
    title: "Why We Forget What We Just Read",
    level: "B2",
    topic: "Ilmu dan belajar",
    paragraphs: [
      "Most readers know the feeling: you finish a page, look up, and realise you cannot say what it was about. Psychologists call this mind wandering, and studies suggest that it can occupy a surprising share of our reading time, particularly when a text is long or difficult.",
      "One explanation concerns attention. Reading demands that we hold several things in mind at once, such as the meaning of the sentence, the thread of the argument and the question we began with. When working memory is crowded, attention slips, and the eyes keep moving while the mind has gone elsewhere.",
      "Researchers have tested a few simple remedies. Reading with a question in mind seems to help, because the question gives attention a target. Pausing after each section to say the main point in one sentence also appears to improve recall, and so do short breaks of about five minutes after a long stretch of reading.",
      "These methods are not magic. Their effects are usually modest, and they work best when they become habits rather than occasional tricks. Still, for students facing a long reading list, even a small gain may add up over a term.",
    ],
    skim: [
      {
        question: "What is the text mainly about?",
        options: [
          "Why readers lose track of what they read and what may help",
          "How to read faster than anyone else",
          "Why long books are better than short ones",
          "A new machine that stores memories",
        ],
        correct: 0,
        explanation_id: "Paragraf 1 menyebut masalah, paragraf 2 penjelasannya, paragraf 3 cara mengatasinya, dan paragraf 4 menyimpulkan.",
      },
      {
        question: "How certain is the writer about the remedies?",
        options: [
          "Cautious: they may help, but the effects are modest",
          "Completely certain they always work",
          "Certain they never work",
          "The writer gives no opinion at all",
        ],
        correct: 0,
        explanation_id: "Kata seperti seems, appears, dan usually modest menandai kehati-hatian. Penulis tidak mengklaim cara itu pasti berhasil.",
      },
    ],
    scan: [
      { question: "What do psychologists call losing track while reading?", paragraph: 0, answer: "mind wandering" },
      { question: "What does a question in mind give attention?", paragraph: 2, answer: "a target" },
      { question: "How long should the short breaks be?", paragraph: 2, answer: "five minutes" },
      { question: "According to the text, when do the methods work best?", paragraph: 3, answer: "habits" },
    ],
  },
  {
    id: "joke-translation",
    title: "The Joke That Would Not Travel",
    level: "C1",
    topic: "Penerjemahan",
    paragraphs: [
      "Translators often say that humour is the first thing to go missing when a text crosses a border. A joke depends on a coincidence of sound, a shared reference or an expectation that the audience already holds, and none of these travels reliably from one language to another.",
      "Consider a pun. In the source language, a single word may carry two meanings, and the pleasure lies in seeing both at once. If the target language has no such word, a literal translation keeps the meaning but loses the pleasure, and the reader is left with a sentence that is correct and dead.",
      "Several strategies are available. A translator may look for a different pun that does similar work, even if it changes the detail of the sentence. Or the joke may be moved to another place in the text, where the target language offers a better opportunity. As a last resort, a short note can explain the original, although explanations rarely make anyone laugh.",
      "None of these choices is free of cost. Replacing a joke changes what the characters say; moving it changes the rhythm of the scene; explaining it interrupts the story. The translator's skill lies less in finding a perfect solution than in deciding, consciously, which loss the text can best afford.",
    ],
    skim: [
      {
        question: "What is the central idea of the text?",
        options: [
          "Translating humour forces the translator to choose which loss to accept",
          "Jokes should never be translated",
          "Puns are easy to translate when the translator is skilled",
          "Translators dislike humour in books",
        ],
        correct: 0,
        explanation_id: "Paragraf terakhir menyatakan inti: penerjemah memilih kerugian yang paling dapat diterima. Teks tidak melarang menerjemahkan lelucon.",
      },
      {
        question: "What kind of text is this?",
        options: ["An explanatory essay with a reflective conclusion", "A news report", "A set of instructions", "A short story"],
        correct: 0,
        explanation_id: "Teks menjelaskan masalah, merinci strategi, lalu merenung di akhir. Itu ciri esai penjelasan.",
      },
    ],
    scan: [
      { question: "What does a literal translation of a pun keep?", paragraph: 1, answer: "meaning" },
      { question: "What is described as the last resort?", paragraph: 2, answer: "a short note" },
      { question: "Which choice changes the rhythm of the scene?", paragraph: 3, answer: "moving it" },
      { question: "Besides a coincidence of sound, what else can a joke depend on?", paragraph: 0, answer: "a shared reference" },
    ],
  },
];

export function getReadingText(id: string): ReadingText | undefined {
  return READING_TEXTS.find((t) => t.id === id);
}

/** Jumlah kata sebuah teks (dipisah spasi, tanda baca tidak dihitung sebagai kata). */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function textWordCount(t: ReadingText): number {
  return t.paragraphs.reduce((n, p) => n + countWords(p), 0);
}

export function gradeSkim(q: SkimQuestion, optionIndex: number): boolean {
  return Number.isInteger(optionIndex) && optionIndex === q.correct;
}

export function gradeScan(q: ScanQuestion, paragraphIndex: number): boolean {
  return Number.isInteger(paragraphIndex) && paragraphIndex === q.paragraph;
}

/** "m:ss"; detik negatif atau bukan angka dianggap 0. */
export function formatElapsed(seconds: number): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Perkiraan kasar kecepatan baca (kata per menit); null bila waktu tidak sah. Hanya untuk gambaran, bukan nilai. */
export function wordsPerMinute(words: number, seconds: number): number | null {
  if (!Number.isFinite(words) || !Number.isFinite(seconds) || seconds <= 0 || words <= 0) return null;
  return Math.round((words / seconds) * 60);
}

export type TimerStatus = "dalam-target" | "melewati-target";

/** Timer tidak pernah menghentikan latihan; ia hanya menandai apakah target sudah terlewati. */
export function timerStatus(elapsedSeconds: number, targetSeconds: number): TimerStatus {
  return elapsedSeconds > targetSeconds ? "melewati-target" : "dalam-target";
}

export interface ScanResult {
  correct: boolean;
  seconds: number | null;
}

export function summarizeScan(results: ScanResult[]): { correct: number; total: number; avgSeconds: number | null } {
  const correct = results.filter((r) => r.correct).length;
  const timed = results.filter((r): r is { correct: boolean; seconds: number } => r.seconds !== null && Number.isFinite(r.seconds));
  const avgSeconds = timed.length === 0 ? null : Math.round(timed.reduce((n, r) => n + r.seconds, 0) / timed.length);
  return { correct, total: results.length, avgSeconds };
}
