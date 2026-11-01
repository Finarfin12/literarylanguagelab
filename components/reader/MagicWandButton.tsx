"use client";

// Tombol Tongkat Ajaib (Inspect Mode) yang bisa digeser: PRD §5.4, DESIGN.md §7. Logika posisi ada di
// lib/reader/drag-fab.ts (diuji unit). Ketuk = menyalakan/mematikan; geser = memindahkan lalu menempel ke tepi.

import { useCallback, useEffect, useRef, useState } from "react";
import { Wand2 } from "lucide-react";
import {
  FAB_SIZE,
  STORAGE_KEY,
  clampPosition,
  defaultStored,
  fromStored,
  isDrag,
  nudge,
  parseStored,
  serialize,
  snapToEdge,
  toStored,
  type Insets,
  type Point,
  type Size,
  type StoredPosition,
} from "@/lib/reader/drag-fab";

function viewportSize(): Size {
  return { w: window.innerWidth, h: window.innerHeight };
}

/** Header di atas; di HP bottom nav + ruang navigasi halaman di bawah. */
function currentInsets(): Insets {
  return window.innerWidth < 1024 ? { top: 64, bottom: 96 } : { top: 64, bottom: 24 };
}

function readStored(): StoredPosition {
  try {
    return parseStored(window.localStorage.getItem(STORAGE_KEY)) ?? defaultStored(viewportSize());
  } catch {
    return defaultStored(viewportSize());
  }
}

function writeStored(stored: StoredPosition) {
  try {
    window.localStorage.setItem(STORAGE_KEY, serialize(stored));
  } catch {
    // localStorage bisa diblokir (mode privat): posisi hanya berlaku sementara
  }
}

export default function MagicWandButton({
  active,
  onToggle,
  hidden = false,
}: {
  active: boolean;
  onToggle: () => void;
  /** Disembunyikan sementara, mis. saat panel Word Lookup terbuka agar tidak menutupi panel. */
  hidden?: boolean;
}) {
  const [pos, setPos] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);
  // Animasi menempel hanya setelah dilepas/digeser lewat keyboard; penempatan awal & resize langsung (tanpa meluncur dari 0,0)
  const [animate, setAnimate] = useState(false);
  const stored = useRef<StoredPosition | null>(null);
  const drag = useRef<{ pointerId: number; start: Point; origin: Point; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  // Pulihkan posisi setelah mount (localStorage hanya ada di browser) dan ikuti perubahan ukuran layar
  useEffect(() => {
    const place = () => {
      stored.current = stored.current ?? readStored();
      setAnimate(false);
      setPos(fromStored(stored.current, viewportSize(), currentInsets()));
    };
    // membaca localStorage hanya mungkin setelah mount
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!pos) return;
    setAnimate(false);
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointerId: e.pointerId, start: { x: e.clientX, y: e.clientY }, origin: pos, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const here = { x: e.clientX, y: e.clientY };
    if (!d.moved) {
      if (!isDrag(d.start, here)) return;
      d.moved = true;
      setDragging(true);
    }
    setPos(clampPosition({ x: d.origin.x + here.x - d.start.x, y: d.origin.y + here.y - d.start.y }, viewportSize(), currentInsets()));
  };

  const finish = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (!d.moved) return; // ketuk: ditangani onClick
    suppressClick.current = true; // geser: jangan ikut menyalakan Inspect Mode
    setDragging(false);
    const vp = viewportSize();
    const ins = currentInsets();
    const snapped = snapToEdge(pos ?? d.origin, vp, ins);
    stored.current = toStored(snapped, vp, ins);
    writeStored(stored.current);
    setAnimate(true);
    setPos(snapped);
  };

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!e.altKey || !pos) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const vp = viewportSize();
      const ins = currentInsets();
      const next = nudge(pos, e.key, vp, ins);
      stored.current = toStored(next, vp, ins);
      writeStored(stored.current);
      setAnimate(true);
      setPos(next);
    },
    [pos]
  );

  return (
    <button
      type="button"
      onClick={() => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        onToggle();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onKeyDown={onKeyDown}
      aria-pressed={active}
      aria-label={active ? "Matikan Tongkat Ajaib" : "Aktifkan Tongkat Ajaib"}
      aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Alt+ArrowUp Alt+ArrowDown"
      title={`${active ? "Matikan" : "Aktifkan"} Tongkat Ajaib (geser untuk memindahkan)`}
      style={{
        left: pos?.x ?? 0,
        top: pos?.y ?? 0,
        width: FAB_SIZE,
        height: FAB_SIZE,
        touchAction: "none",
        display: hidden ? "none" : undefined,
        visibility: pos ? "visible" : "hidden",
      }}
      className={`fixed z-[90] rounded-full flex items-center justify-center select-none shadow-[0_4px_16px_rgba(31,36,32,0.18)] ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      } ${animate && !dragging ? "transition-[left,top] duration-200 ease-out" : ""} ${
        active
          ? "bg-brand-solid text-on-brand ring-4 ring-brand-solid/25"
          : "bg-card border border-border text-foreground hover:bg-muted"
      }`}
    >
      <Wand2 className="w-6 h-6" aria-hidden="true" />
    </button>
  );
}
