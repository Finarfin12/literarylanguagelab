"use client";

// Kartu Word of the Day: kata lokal (tanpa AI saat halaman dibuka) + tombol "Pelajari" yang memuat /api/wotd saat diklik
// (mini-lesson, kolokasi, kuis 1 soal, simpan kata). Hasil di-cache di localStorage `wotd:<tanggal>` agar AI tidak dipanggil dua kali sehari.
// Dipakai di Sidebar (desktop) dan Beranda (HP & desktop).

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, GraduationCap, Loader2, X, XCircle, BookmarkPlus } from "lucide-react";
import ResponsivePanel from "@/components/ui/ResponsivePanel";
import Markdown from "@/components/ui/Markdown";
import { localWordOfTheDay, type WotdLesson } from "@/lib/wotd";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readCache(key: string): WotdLesson | null {
  try {
    const raw = localStorage.getItem(`wotd:${key}`);
    return raw ? (JSON.parse(raw) as WotdLesson) : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, lesson: WotdLesson) {
  try {
    // hanya simpan satu hari: buang kunci hari lain
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("wotd:") && k !== `wotd:${key}`) localStorage.removeItem(k);
    }
    localStorage.setItem(`wotd:${key}`, JSON.stringify(lesson));
  } catch {
    // localStorage bisa diblokir: pelajaran tetap tampil, hanya tidak di-cache
  }
}

export default function WotdCard({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [lesson, setLesson] = useState<WotdLesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- tanggal perangkat hanya tersedia setelah mount
  useEffect(() => setMounted(true), []);

  const load = async () => {
    const key = todayKey();
    const cached = readCache(key);
    if (cached) {
      setLesson(cached);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/wotd");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Gagal memuat pelajaran.");
      writeCache(key, data as WotdLesson);
      setLesson(data as WotdLesson);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat pelajaran.");
    } finally {
      setLoading(false);
    }
  };

  const openPanel = () => {
    setOpen(true);
    if (!lesson && !loading) void load();
  };

  const saveWord = async () => {
    if (!lesson || saving || saved) return;
    setSaving(true);
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: lesson.word, definition: lesson.lesson.slice(0, 300), contextSource: "Word of the Day" }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;
  const w = localWordOfTheDay(new Date());

  return (
    <>
      <div className={`bg-card border border-border p-4 rounded-card ${className}`}>
        <p className="text-[11px] font-bold text-brand-ink uppercase tracking-[0.14em] mb-1">Word of the Day</p>
        <p className="text-lg font-serif font-medium text-foreground">{w.word}</p>
        <p className="text-sm text-muted-foreground italic mt-1">&ldquo;{w.def}&rdquo;</p>
        <button
          type="button"
          onClick={openPanel}
          className="mt-3 w-full min-h-[44px] rounded-control bg-brand-tint text-brand-ink font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-tint/70 transition-colors"
        >
          <GraduationCap className="w-4 h-4" aria-hidden="true" /> Pelajari
        </button>
      </div>

      {createPortal(
        <ResponsivePanel open={open} onClose={() => setOpen(false)} label="Word of the Day: pelajari" width="420px">
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
            <div>
              <p className="text-[11px] font-bold text-brand-ink uppercase tracking-[0.14em]">Word of the Day</p>
              <h2 className="font-serif text-xl font-medium text-foreground">{lesson?.word ?? "Pelajari kata hari ini"}</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup" className="w-11 h-11 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Menyiapkan pelajaran...
              </div>
            )}
            {error && (
              <div role="alert" className="rounded-card border border-danger/30 bg-danger-tint p-4 text-sm text-danger">
                {error}
                <button type="button" onClick={() => void load()} className="block mt-2 underline font-semibold min-h-[44px]">
                  Coba lagi
                </button>
              </div>
            )}
            {lesson && (
              <>
                <div className="text-sm text-foreground leading-relaxed">
                  <Markdown>{lesson.lesson}</Markdown>
                </div>
                {lesson.collocations.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.14em] mb-2">Kolokasi</p>
                    <div className="flex flex-wrap gap-2">
                      {lesson.collocations.map((c) => (
                        <span key={c} className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="rounded-card border border-border p-4">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.14em] mb-2">Kuis singkat</p>
                  <p className="font-serif text-base font-medium text-foreground mb-3">{lesson.quiz.question}</p>
                  <div className="space-y-2">
                    {lesson.quiz.options.map((opt, i) => {
                      const answered = picked !== null;
                      const correct = i === lesson.quiz.answer;
                      const isPicked = picked === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={answered}
                          onClick={() => setPicked(i)}
                          className={`w-full min-h-[48px] px-4 py-2 rounded-control border text-left text-sm flex items-center gap-2 transition-colors ${
                            answered && correct
                              ? "border-brand-solid bg-brand-tint text-brand-ink"
                              : answered && isPicked
                                ? "border-danger/40 bg-danger-tint text-danger"
                                : "border-border bg-card hover:bg-muted text-foreground"
                          }`}
                        >
                          <span className="flex-1">{opt}</span>
                          {answered && correct && <Check className="w-4 h-4 shrink-0" aria-label="Jawaban benar" />}
                          {answered && isPicked && !correct && <XCircle className="w-4 h-4 shrink-0" aria-label="Jawaban salah" />}
                        </button>
                      );
                    })}
                  </div>
                  {picked !== null && (
                    <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
                      {picked === lesson.quiz.answer ? "Benar! Kata ini sudah kamu kuasai." : `Belum tepat. Jawaban yang benar: ${lesson.quiz.options[lesson.quiz.answer]}.`}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {lesson && (
            <div className="p-4 border-t border-border shrink-0">
              <button
                type="button"
                onClick={saveWord}
                disabled={saving || saved}
                className="w-full min-h-[48px] rounded-control bg-brand-solid text-on-brand font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saved ? <Check className="w-4 h-4" /> : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
                {saved ? "Tersimpan di Vocabulary Bank" : "Simpan kata"}
              </button>
            </div>
          )}
        </ResponsivePanel>,
        document.body
      )}
    </>
  );
}
