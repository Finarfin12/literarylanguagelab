"use client";

// Menu pencarian fitur: Ctrl/Cmd+K, tombol "/" atau tombol Cari di bilah atas dan sidebar.
// Mencari nama, keterangan, dan kata kunci semua fitur (lib/feature-search.ts), menghormati flag Kursus/Modul.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, X } from "lucide-react";
import { buildFeatureIndex, searchFeatures, visibilityFilter } from "@/lib/feature-search";
import { useCourseVisible, useStudyVisible } from "@/components/CourseVisibility";

export const OPEN_SEARCH_EVENT = "lll:open-search";

/** Dipanggil tombol mana pun untuk membuka menu pencarian. */
export function openFeatureSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

const SUGGESTED_PATHS = ["/gutenberg", "/tools/a-z-dictionary", "/review", "/kursus", "/modul", "/translation-workspace", "/latihan-membaca", "/help"];

function isTypingTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

export default function FeatureSearch() {
  const router = useRouter();
  const courseVisible = useCourseVisible();
  const studyVisible = useStudyVisible();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const index = useMemo(() => buildFeatureIndex(), []);
  const isVisible = useMemo(() => visibilityFilter(courseVisible, studyVisible), [courseVisible, studyVisible]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return SUGGESTED_PATHS.map((p) => index.find((e) => e.path === p)).filter((e): e is NonNullable<typeof e> => !!e && isVisible(e.path));
    }
    return searchFeatures(query, index, { limit: 8, isVisible });
  }, [query, index, isVisible]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const go = (path: string) => {
    close();
    router.push(path);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (results.length ? (a + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active].path);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[10vh]" role="presentation">
      <div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Cari fitur" className="relative w-full max-w-xl bg-card text-foreground border border-border rounded-card shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            role="combobox"
            aria-expanded="true"
            aria-controls="feature-search-results"
            aria-activedescendant={results[active] ? `feature-search-${active}` : undefined}
            placeholder="Cari fitur, misalnya: kamus, skimming, terjemahan…"
            className="flex-1 min-h-[52px] bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <button type="button" onClick={close} aria-label="Tutup pencarian" className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <ul id="feature-search-results" role="listbox" aria-label="Hasil pencarian" className="max-h-[55vh] overflow-y-auto p-2">
          {!query.trim() && <li className="px-3 pt-1 pb-2 text-xs font-bold text-muted-foreground" role="presentation">Sering dibuka</li>}
          {results.map((r, i) => (
            <li key={r.path} role="presentation">
              <button
                type="button"
                id={`feature-search-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.path)}
                className={`w-full text-left min-h-[48px] px-3 py-2 rounded-control flex items-center gap-3 ${i === active ? "bg-brand-tint text-foreground" : "hover:bg-muted"}`}
              >
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-sm truncate">{r.name}</span>
                  {r.description && <span className="block text-xs text-muted-foreground line-clamp-1">{r.description}</span>}
                </span>
                <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:block">{r.section}</span>
                {i === active && <CornerDownLeft className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />}
              </button>
            </li>
          ))}
          {query.trim() && results.length === 0 && (
            <li role="presentation" className="px-3 py-6 text-sm text-muted-foreground text-center">
              Tidak ada fitur yang cocok dengan &ldquo;{query}&rdquo;.{" "}
              <button type="button" onClick={() => go("/help")} className="underline text-brand-ink font-semibold min-h-[44px]">
                Tanya Liter AI di Pusat Bantuan
              </button>
            </li>
          )}
        </ul>

        <p className="px-4 py-2 border-t border-border text-[11px] text-muted-foreground hidden sm:block">
          ↑ ↓ pilih · Enter buka · Esc tutup · Ctrl+K atau / kapan saja
        </p>
      </div>
    </div>
  );
}
