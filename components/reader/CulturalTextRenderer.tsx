"use client";

import React, { useRef, useState } from "react";
import { BookOpen, BookmarkPlus, Check } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export interface CulturalReference {
  id: string;
  phrase: string;
  origin: string;
  explanation: string;
  indonesian_equivalent?: string;
}

/** Idiom yang sudah dideteksi (lib/idioms) untuk satu blok; index relatif terhadap `text` blok itu. */
export interface IdiomMark {
  phrase: string;
  meaning: string;
  indonesian: string;
  index: number;
  length: number;
}

interface CulturalTextRendererProps {
  text: string;
  references: CulturalReference[];
  /** Penanda idiom hasil /api/detect-idioms (opsional; tanpa ini perilaku lama). */
  idioms?: IdiomMark[];
}

// Satu regex gabungan per daftar referensi, dikompilasi sekali lalu dipakai ulang oleh
// semua paragraf. Sebelumnya setiap paragraf membuat satu regex per referensi di setiap render.
type CompiledRefs = { regex: RegExp; byPhrase: Map<string, CulturalReference> };
const compiledCache = new WeakMap<CulturalReference[], CompiledRefs | null>();

function compileReferences(references: CulturalReference[]): CompiledRefs | null {
  if (compiledCache.has(references)) return compiledCache.get(references)!;
  const usable = references.filter((r) => r.phrase && r.phrase.trim());
  let compiled: CompiledRefs | null = null;
  if (usable.length > 0) {
    // Frasa terpanjang lebih dulu agar kecocokan paling panjang yang menang
    const sorted = [...usable].sort((a, b) => b.phrase.length - a.phrase.length);
    compiled = {
      regex: new RegExp(`\\b(?:${sorted.map((r) => escapeRegExp(r.phrase)).join("|")})\\b`, "gi"),
      byPhrase: new Map(sorted.map((r) => [r.phrase.toLowerCase(), r])),
    };
  }
  compiledCache.set(references, compiled);
  return compiled;
}

export default function CulturalTextRenderer({ text, references, idioms }: CulturalTextRendererProps) {
  const compiled = references && references.length > 0 ? compileReferences(references) : null;
  const hasIdioms = !!idioms && idioms.length > 0;
  if (!compiled && !hasIdioms) return <>{text}</>;

  // Kumpulkan semua penanda (referensi budaya + idiom), urut menurut posisi; referensi budaya menang bila tumpang tindih
  type Mark = { start: number; end: number; node: (key: string) => React.ReactNode };
  const marks: Mark[] = [];
  if (compiled) {
    for (const match of text.matchAll(compiled.regex)) {
      const ref = compiled.byPhrase.get(match[0].toLowerCase());
      if (!ref || match.index === undefined) continue;
      marks.push({ start: match.index, end: match.index + match[0].length, node: (key) => <CulturalTooltip key={key} reference={ref} text={match[0]} /> });
    }
  }
  if (hasIdioms) {
    for (const idiom of idioms!) {
      const start = idiom.index;
      const end = idiom.index + idiom.length;
      if (start < 0 || end > text.length) continue;
      if (marks.some((m) => start < m.end && end > m.start)) continue;
      marks.push({ start, end, node: (key) => <IdiomTooltip key={key} idiom={idiom} text={text.substring(start, end)} /> });
    }
  }
  if (marks.length === 0) return <>{text}</>;
  marks.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  for (const m of marks) {
    if (m.start < lastIndex) continue;
    if (m.start > lastIndex) parts.push(text.substring(lastIndex, m.start));
    parts.push(m.node(`mark-${m.start}`));
    lastIndex = m.end;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return <>{parts}</>;
}

// Penanda idiom: garis bawah putus-putus hijau (beda dari referensi budaya yang amber), tooltip arti + padanan Indonesia,
// dan tombol simpan ke Idiom Library (tabel `idioms`, sama seperti halaman /idioms).
function IdiomTooltip({ idiom, text }: { idiom: IdiomMark; text: string }) {
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  // Hover membuka tooltip; klik yang menyusul hover tidak boleh langsung menutupnya (mouse), tetapi ketukan kedua menutup (sentuh)
  const openedByHover = useRef(false);

  const save = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saving || saved) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("idioms").insert({
      idiom: idiom.phrase,
      meaning: `${idiom.meaning}${idiom.indonesian ? ` (${idiom.indonesian})` : ""}`,
      origin: "",
      example_sentence: text,
    });
    setSaving(false);
    if (!error) setSaved(true);
  };

  return (
    <span
      className="relative"
      onMouseEnter={() => {
        openedByHover.current = true;
        setShow(true);
      }}
      onMouseLeave={() => {
        openedByHover.current = false;
        setShow(false);
      }}
    >
      <span
        role="button"
        tabIndex={0}
        aria-expanded={show}
        onClick={() => {
          if (openedByHover.current) {
            openedByHover.current = false;
            return;
          }
          setShow((s) => !s);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShow((s) => !s);
          }
        }}
        className="cursor-help border-b-2 border-dashed border-brand-solid hover:bg-brand-tint transition-colors"
      >
        {text}
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 max-w-[85vw] z-[100] font-sans text-left">
          <span className="block bg-card text-foreground text-sm border border-border shadow-[0_4px_16px_rgba(31,36,32,0.18)] rounded-card p-4 leading-relaxed [text-indent:0]">
            <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-brand-ink mb-1">Idiom</span>
            <span className="block font-serif text-base font-medium mb-1">{idiom.phrase}</span>
            <span className="block mb-2">{idiom.meaning}</span>
            {idiom.indonesian && (
              <span className="block pt-2 border-t border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Padanan Indonesia</span>
                <span className="font-medium text-brand-ink">&ldquo;{idiom.indonesian}&rdquo;</span>
              </span>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving || saved}
              className="mt-3 w-full min-h-[44px] rounded-control bg-brand-tint text-brand-ink font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {saved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
              {saved ? "Tersimpan di Idiom Library" : saving ? "Menyimpan..." : "Simpan ke Idiom Library"}
            </button>
          </span>
        </span>
      )}
    </span>
  );
}

function CulturalTooltip({ reference, text }: { reference: CulturalReference, text: string }) {
  const [show, setShow] = useState(false);

  return (
    <span 
      className="relative inline-block cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(!show)}
    >
      <span className="text-amber-600 dark:text-amber-500 font-medium border-b-2 border-dashed border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
        {text}
      </span>
      
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 max-w-[85vw] z-[100] animate-in fade-in zoom-in-95 duration-200">
          <span className="block bg-background dark:bg-zinc-900 text-foreground text-sm border border-border shadow-2xl rounded-2xl p-5 text-left leading-relaxed font-sans">
            <span className="flex items-center gap-2 mb-2 text-amber-600 font-bold">
              <BookOpen className="w-4 h-4" /> Cultural Context
            </span>
            <span className="block mb-2 font-serif text-base">{reference.explanation}</span>
            {reference.indonesian_equivalent && (
              <span className="block pt-3 mt-3 border-t border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Padanan Indonesia</span>
                <span className="font-medium text-emerald-600">"{reference.indonesian_equivalent}"</span>
              </span>
            )}
            <span className="block mt-3 text-xs text-muted-foreground italic">Origin: {reference.origin}</span>
          </span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-[10px] border-transparent border-t-border border-b-0" />
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-[10px] border-transparent border-t-background dark:border-t-zinc-900 border-b-0" />
        </span>
      )}
    </span>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
