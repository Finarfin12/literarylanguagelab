import { slugsToMigrate, type DueRow } from "./exercises/review";
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

// --- Fase 15: status selesai dipindah ke database (tabel grammar_progress, migrasi 0012) ---
// localStorage tetap ditulis sebagai cadangan dan menjadi satu-satunya sumber selama migrasi belum dijalankan.

export type GrammarProgressRows = DueRow[];

const MIGRATED_KEY = "grammar_migrated_v1";

/**
 * Memuat status dari database dan, sekali saja, memindahkan status dari localStorage. Mengembalikan null bila
 * database belum siap atau gagal; pemanggil lalu memakai localStorage seperti sebelum Fase 15.
 */
export async function loadGrammarProgressSynced(allSlugs: string[]): Promise<GrammarProgressRows | null> {
  try {
    const res = await fetch("/api/grammar/progress");
    if (!res.ok) return null;
    const data = (await res.json()) as { available?: boolean; rows?: GrammarProgressRows };
    if (!data.available) return null;
    let rows = data.rows ?? [];

    let migrated = false;
    try {
      migrated = localStorage.getItem(MIGRATED_KEY) === "1";
    } catch {
      migrated = true; // storage tidak bisa dibaca: tidak ada yang dimigrasikan
    }
    if (!migrated) {
      const pending = slugsToMigrate(rows, readDoneSlugs(allSlugs));
      if (pending.length > 0) {
        const mig = await fetch("/api/grammar/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "migrate", slugs: pending }),
        });
        if (!mig.ok) return rows;
        const migData = (await mig.json()) as { available?: boolean; rows?: GrammarProgressRows };
        if (migData.available && migData.rows) rows = migData.rows;
      }
      try {
        localStorage.setItem(MIGRATED_KEY, "1");
      } catch {
        // abaikan
      }
    }
    return rows;
  } catch {
    return null;
  }
}

/** Menyimpan status selesai: ke localStorage (cadangan) dan database. Mengembalikan baris terbaru, atau null bila database tidak tersedia. */
export async function saveTopicDone(slug: string, done: boolean): Promise<GrammarProgressRows | null> {
  setTopicDone(slug, done);
  try {
    const res = await fetch("/api/grammar/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", slug, done }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { available?: boolean; rows?: GrammarProgressRows };
    return data.available ? data.rows ?? [] : null;
  } catch {
    return null;
  }
}
