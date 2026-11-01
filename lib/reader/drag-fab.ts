// Logika murni tombol Tongkat Ajaib yang bisa digeser (docs/v4/PRD.md §5.4). Tanpa React/DOM supaya bisa diuji unit.
// Komponen: components/reader/MagicWandButton.tsx.
//
// Aturan: ketuk (gerak ≤ ambang) = menyalakan Inspect Mode; geser = memindahkan tombol; saat dilepas tombol menempel
// ke tepi kiri/kanan terdekat. Posisi disimpan sebagai sisi + rasio tinggi (bukan piksel) agar tetap masuk akal saat
// ukuran layar berubah, dan selalu dijepit supaya tetap terlihat.

export interface Point {
  x: number;
  y: number;
}
export interface Size {
  w: number;
  h: number;
}
/** Ruang yang tidak boleh ditutupi tombol: header di atas, bottom nav/navigasi halaman di bawah. */
export interface Insets {
  top: number;
  bottom: number;
}
export type Side = "left" | "right";
export interface StoredPosition {
  side: Side;
  /** 0 = tepi atas area bebas, 1 = tepi bawahnya. */
  yRatio: number;
}

/** Ambang gerak (px) yang membedakan ketuk dari geser. */
export const TAP_THRESHOLD = 6;
/** Jarak tombol dari tepi layar saat menempel. */
export const EDGE_GAP = 12;
export const FAB_SIZE = 56;
export const STORAGE_KEY = "reader-wand-pos";
/** Langkah geser lewat keyboard (Alt+panah), px. */
export const KEY_STEP = 24;

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** True bila gerakan sudah melewati ambang ketuk, yaitu ini geser, bukan ketuk. */
export function isDrag(start: Point, current: Point, threshold = TAP_THRESHOLD): boolean {
  return distance(start, current) > threshold;
}

function clamp(v: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(v, min), max);
}

/** Jepit posisi (sudut kiri-atas tombol) agar seluruh tombol tetap terlihat. */
export function clampPosition(pos: Point, viewport: Size, insets: Insets, size = FAB_SIZE, gap = EDGE_GAP): Point {
  return {
    x: clamp(pos.x, gap, viewport.w - size - gap),
    y: clamp(pos.y, insets.top, viewport.h - size - insets.bottom),
  };
}

/** Sisi terdekat berdasarkan titik tengah tombol. */
export function nearestSide(pos: Point, viewport: Size, size = FAB_SIZE): Side {
  return pos.x + size / 2 < viewport.w / 2 ? "left" : "right";
}

/** Tempel ke tepi kiri/kanan terdekat (y tetap, dijepit). */
export function snapToEdge(pos: Point, viewport: Size, insets: Insets, size = FAB_SIZE, gap = EDGE_GAP): Point {
  const side = nearestSide(pos, viewport, size);
  const clamped = clampPosition(pos, viewport, insets, size, gap);
  return { x: side === "left" ? gap : viewport.w - size - gap, y: clamped.y };
}

/** Piksel → posisi tersimpan. */
export function toStored(pos: Point, viewport: Size, insets: Insets, size = FAB_SIZE): StoredPosition {
  const span = viewport.h - size - insets.bottom - insets.top;
  const yRatio = span > 0 ? clamp((pos.y - insets.top) / span, 0, 1) : 0;
  return { side: nearestSide(pos, viewport, size), yRatio };
}

/** Posisi tersimpan → piksel untuk viewport saat ini. */
export function fromStored(stored: StoredPosition, viewport: Size, insets: Insets, size = FAB_SIZE, gap = EDGE_GAP): Point {
  const span = Math.max(0, viewport.h - size - insets.bottom - insets.top);
  return {
    x: stored.side === "left" ? gap : viewport.w - size - gap,
    y: insets.top + stored.yRatio * span,
  };
}

/** Posisi awal: kanan-bawah di HP, kiri-bawah di desktop (sama seperti tombol lama). */
export function defaultStored(viewport: Size): StoredPosition {
  return { side: viewport.w >= 768 ? "left" : "right", yRatio: 1 };
}

export function serialize(stored: StoredPosition): string {
  return JSON.stringify(stored);
}

/** Baca dari localStorage; nilai rusak/asing → null (pakai posisi awal). */
export function parseStored(raw: string | null | undefined): StoredPosition | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<StoredPosition> | null;
    if (!v || (v.side !== "left" && v.side !== "right")) return null;
    if (typeof v.yRatio !== "number" || !Number.isFinite(v.yRatio)) return null;
    return { side: v.side, yRatio: clamp(v.yRatio, 0, 1) };
  } catch {
    return null;
  }
}

/** Geser lewat keyboard: Alt+panah. Kiri/kanan langsung menempel ke sisi itu; atas/bawah menggeser KEY_STEP. */
export function nudge(
  pos: Point,
  key: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown",
  viewport: Size,
  insets: Insets,
  size = FAB_SIZE,
  gap = EDGE_GAP,
  step = KEY_STEP
): Point {
  const next = { ...pos };
  if (key === "ArrowLeft") next.x = gap;
  else if (key === "ArrowRight") next.x = viewport.w - size - gap;
  else if (key === "ArrowUp") next.y -= step;
  else next.y += step;
  return clampPosition(next, viewport, insets, size, gap);
}
