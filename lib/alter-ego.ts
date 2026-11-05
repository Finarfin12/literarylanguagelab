// Alter Ego (Fase 20): daftar penulis, validasi permintaan, dan prompt persona.
// Semua penulis di daftar sudah meninggal. Penulis yang masih hidup tidak boleh ditambahkan
// (meniru orang hidup berisiko menaruh kata-kata di mulut mereka). Fungsi murni, diuji di tests/alter-ego.test.mts.

export interface AuthorGroup {
  label: string;
  authors: readonly string[];
}

export const AUTHOR_GROUPS: readonly AuthorGroup[] = [
  {
    label: "Klasik & Modern",
    authors: [
      "William Shakespeare",
      "Jane Austen",
      "Edgar Allan Poe",
      "Ernest Hemingway",
      "Virginia Woolf",
      "Chinua Achebe",
      "Pramoedya Ananta Toer",
    ],
  },
  {
    label: "Fantasi",
    authors: [
      "J.R.R. Tolkien",
      "C.S. Lewis",
      "Ursula K. Le Guin",
      "Terry Pratchett",
      "Diana Wynne Jones",
      "George MacDonald",
      "Lord Dunsany",
      "Mervyn Peake",
    ],
  },
];

export const AUTHORS: readonly string[] = AUTHOR_GROUPS.flatMap((g) => g.authors);

export const DEFAULT_AUTHOR = AUTHORS[0];

/** Hanya pesan terakhir sebanyak ini yang dikirim ke AI; riwayat lama yang lebih panjang tidak ditolak. */
export const MAX_MESSAGES = 30;
/** Batas pesan pengguna terakhir. Pesan lama dipotong diam-diam agar riwayat panjang tetap bisa dilanjutkan. */
export const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_LENGTH = 6000;

export const SIMULATION_NOTE = "Ini simulasi AI, bukan kata-kata asli penulisnya.";

export function isKnownAuthor(name: unknown): name is string {
  return typeof name === "string" && AUTHORS.includes(name);
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export type ParseResult =
  | { ok: true; author: string; messages: ChatTurn[] }
  | { ok: false; error: string };

/** Memeriksa badan permintaan dari browser; tidak pernah memercayai nama penulis atau peran pesan. */
export function parseAlterEgoRequest(body: unknown): ParseResult {
  if (body === null || typeof body !== "object") return { ok: false, error: "Missing parameters" };
  const { author, messages } = body as { author?: unknown; messages?: unknown };

  if (!isKnownAuthor(author)) return { ok: false, error: "Unknown author" };
  if (!Array.isArray(messages) || messages.length === 0) return { ok: false, error: "Missing parameters" };

  const turns: ChatTurn[] = [];
  for (const m of messages.slice(-MAX_MESSAGES)) {
    if (m === null || typeof m !== "object") return { ok: false, error: "Invalid message" };
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return { ok: false, error: "Invalid message role" };
    if (typeof content !== "string" || content.trim() === "") return { ok: false, error: "Invalid message" };
    turns.push({ role, content: content.slice(0, MAX_HISTORY_LENGTH) });
  }
  const last = turns[turns.length - 1];
  if (last.role !== "user") return { ok: false, error: "Last message must be from user" };
  if (last.content.length > MAX_MESSAGE_LENGTH) return { ok: false, error: "Message too long" };
  return { ok: true, author, messages: turns };
}

export function buildSystemPrompt(author: string): string {
  return `You are playing the role of ${author} in a chat on a language-learning app. This is an AI simulation, not the real author.
Imitate the author's style, diction, era, and outlook in the present-day conversation, in your own words.
Do NOT copy quotations or long passages from the author's works. If the user asks what a work says, summarize it in your own words. Never present your reply as the author's genuine words.
If asked about something the author could not have known, answer in character but stay honest about the limits.
Respond ENTIRELY in English. You MUST NOT use Indonesian.
Keep replies short enough for a chat interface (max 2-3 short paragraphs).`;
}
