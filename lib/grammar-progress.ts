// Status selesai topik Grammar Dasar. Disimpan di localStorage (cukup untuk v3; pindah ke DB di Fase 10
// jika dipakai sebagai bukti kemampuan). Semua akses dibungkus try/catch karena storage bisa diblokir.

const PREFIX = "grammar_done_";

export function isTopicDone(slug: string): boolean {
  try {
    return localStorage.getItem(PREFIX + slug) === "1";
  } catch {
    return false;
  }
}

export function setTopicDone(slug: string, done: boolean): void {
  try {
    if (done) localStorage.setItem(PREFIX + slug, "1");
    else localStorage.removeItem(PREFIX + slug);
  } catch {
    // storage tidak tersedia: abaikan
  }
}

export function readDoneSlugs(slugs: string[]): string[] {
  return slugs.filter(isTopicDone);
}
