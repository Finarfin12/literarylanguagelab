// Progres dan filter daftar topik Grammar (Fase 23.5). Fungsi murni tanpa impor (tests/tool-categories.test.mts).

export type TopicFilter = "semua" | "belum" | "selesai";

export const TOPIC_FILTERS: { id: TopicFilter; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "belum", label: "Belum" },
  { id: "selesai", label: "Selesai" },
];

/** Topik yang lolos filter; `done` berisi slug topik yang sudah selesai. */
export function filterTopics<T extends { slug: string }>(topics: readonly T[], done: ReadonlySet<string>, filter: TopicFilter): T[] {
  if (filter === "belum") return topics.filter((t) => !done.has(t.slug));
  if (filter === "selesai") return topics.filter((t) => done.has(t.slug));
  return topics.slice();
}

/** Ringkasan progres: jumlah selesai, total, persen (0-100), dan kalimat yang mudah dibaca pembaca layar. */
export function topicProgress(topics: readonly { slug: string }[], done: ReadonlySet<string>): { done: number; total: number; percent: number; text: string } {
  const total = topics.length;
  const count = topics.filter((t) => done.has(t.slug)).length;
  return { done: count, total, percent: total ? Math.round((count / total) * 100) : 0, text: `${count} dari ${total} topik selesai` };
}

/** Teks jumlah per level untuk pembaca layar ("3 dari 10 topik selesai"), ditulis lengkap, bukan "3/10". */
export function levelProgressText(done: number, total: number): string {
  return `${done} dari ${total} topik selesai`;
}
