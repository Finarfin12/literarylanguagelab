// Pemeriksaan kualitas otomatis (tanpa AI) untuk Ruang Kerja Segmen. Fungsi murni, tanpa import.

export interface QaSegment {
  idx: number;
  source: string;
  target: string | null;
  status: "draft" | "done" | string;
}

export interface QaGlossaryEntry {
  term: string;
  preferred: string;
}

export type QaType = "empty" | "numbers" | "glossary" | "inconsistent";

export interface QaWarning {
  idx: number;
  type: QaType;
  message: string;
}

export interface QaOptions {
  /** true: segmen draft yang masih kosong juga diperingatkan. Default hanya segmen berstatus selesai. */
  includeDraftEmpty?: boolean;
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Angka dalam teks, dinormalkan tanpa pemisah ribuan/desimal: "3.14", "3,14" → "314"; "1,000" dan "1.000" → "1000". */
export function extractNumbers(text: string): string[] {
  const found = text.match(/\d+(?:[.,]\d+)*/g) ?? [];
  return found.map((n) => n.replace(/[.,]/g, ""));
}

function sameMultiset(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const count = new Map<string, number>();
  for (const x of a) count.set(x, (count.get(x) ?? 0) + 1);
  for (const x of b) {
    const c = count.get(x);
    if (!c) return false;
    count.set(x, c - 1);
  }
  return true;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Apakah `term` muncul sebagai kata utuh di `text` (tanpa membedakan huruf besar/kecil). */
export function containsTerm(text: string, term: string): boolean {
  const t = term.trim();
  if (!t) return false;
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(t)}(?![\\p{L}\\p{N}])`, "iu").test(text);
}

export function runQaChecks(segments: QaSegment[], glossary: QaGlossaryEntry[] = [], options: QaOptions = {}): QaWarning[] {
  const warnings: QaWarning[] = [];

  for (const seg of segments) {
    const target = (seg.target ?? "").trim();

    if (!target) {
      if (seg.status === "done" || options.includeDraftEmpty) {
        warnings.push({ idx: seg.idx, type: "empty", message: seg.status === "done" ? "Segmen ditandai selesai tetapi terjemahannya kosong." : "Terjemahan segmen ini masih kosong." });
      }
      continue; // pemeriksaan lain tidak bermakna untuk segmen kosong
    }

    const srcNumbers = extractNumbers(seg.source);
    const tgtNumbers = extractNumbers(target);
    if (!sameMultiset(srcNumbers, tgtNumbers)) {
      warnings.push({
        idx: seg.idx,
        type: "numbers",
        message: `Angka berbeda. Sumber: ${srcNumbers.join(", ") || "tidak ada"}; terjemahan: ${tgtNumbers.join(", ") || "tidak ada"}.`,
      });
    }

    for (const entry of glossary) {
      if (containsTerm(seg.source, entry.term) && !target.toLowerCase().includes(entry.preferred.trim().toLowerCase())) {
        warnings.push({ idx: seg.idx, type: "glossary", message: `Istilah glosarium "${entry.term}" sebaiknya diterjemahkan "${entry.preferred}".` });
      }
    }
  }

  // Sumber identik tetapi terjemahan berbeda
  const groups = new Map<string, QaSegment[]>();
  for (const seg of segments) {
    if (!(seg.target ?? "").trim()) continue;
    const key = norm(seg.source);
    const list = groups.get(key);
    if (list) list.push(seg);
    else groups.set(key, [seg]);
  }
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const targets = new Set(list.map((s) => norm(s.target as string)));
    if (targets.size < 2) continue;
    for (const seg of list) {
      const others = list.filter((s) => s.idx !== seg.idx).map((s) => s.idx + 1).join(", ");
      warnings.push({ idx: seg.idx, type: "inconsistent", message: `Sumber yang sama diterjemahkan berbeda (lihat segmen ${others}).` });
    }
  }

  return warnings.sort((a, b) => a.idx - b.idx);
}
