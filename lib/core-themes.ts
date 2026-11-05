// Kosakata Inti per tema (Fase 22.5): label dan penghitungan tema. Fungsi murni tanpa impor (tests/a0-enrich.test.mts).

/** "makanan-minuman" → "Makanan minuman" (cukup untuk daftar tema buatan pemilik). */
export function themeLabel(slug: string): string {
  const words = slug.replace(/-/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : slug;
}

/** Tema berikut jumlah katanya dari baris { theme }; urut jumlah terbanyak lalu abjad. */
export function countThemes(rows: readonly { theme: string | null }[]): { slug: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of rows) if (r.theme) counts.set(r.theme, (counts.get(r.theme) ?? 0) + 1);
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, label: themeLabel(slug), count }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

export const THEME_SLUG = /^[a-z0-9-]{2,40}$/;
