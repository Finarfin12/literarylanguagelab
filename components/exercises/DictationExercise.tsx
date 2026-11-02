"use client";

import { useEffect, useRef, useState } from "react";
import { Turtle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import type { DictationResponse } from "@/lib/exercises/types";
import { smallButtonClass, type TypeProps } from "./shared";

/**
 * Dikte: kalimat dibacakan (TTS), pengguna mengetik yang didengar. Memakai mesin TTS pilihan pengguna
 * (`tts_engine` di localStorage, sama dengan Listening Test): Groq lewat /api/tts atau suara peramban.
 */
export default function DictationExercise({ exercise, locked, onSubmit }: TypeProps<"dictation", DictationResponse>) {
  const [text, setText] = useState("");
  const [playing, setPlaying] = useState(false);
  const [problem, setProblem] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    },
    []
  );

  const speakWithBrowser = (slow: boolean): boolean => {
    if (typeof window === "undefined" || !window.speechSynthesis) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(exercise.prompt.text);
    u.lang = "en-US";
    u.rate = slow ? 0.65 : 0.9;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    setPlaying(true);
    window.speechSynthesis.speak(u);
    return true;
  };

  const play = async (slow: boolean) => {
    setProblem("");
    let engine = "browser";
    try {
      engine = localStorage.getItem("tts_engine") || "browser";
    } catch {
      // storage diblokir: pakai suara peramban
    }
    if (engine === "groq") {
      try {
        setPlaying(true);
        const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: exercise.prompt.text }) });
        if (res.ok) {
          const blob = await res.blob();
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
          urlRef.current = URL.createObjectURL(blob);
          const audio = new Audio(urlRef.current);
          audio.playbackRate = slow ? 0.8 : 1;
          audio.onended = () => setPlaying(false);
          audioRef.current = audio;
          await audio.play();
          return;
        }
      } catch {
        // jatuh ke suara peramban
      }
    }
    if (!speakWithBrowser(slow)) {
      setPlaying(false);
      setProblem("Perangkatmu tidak mendukung suara. Coba peramban lain atau pilih mesin suara di Pengaturan.");
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!locked && text.trim()) onSubmit({ text });
      }}
    >
      <p className="font-serif text-xl text-foreground mb-3">Dengarkan, lalu ketik kalimat yang kamu dengar.</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <button type="button" onClick={() => play(false)} disabled={playing} className={smallButtonClass}>
          <Volume2 className="w-4 h-4" aria-hidden="true" /> {playing ? "Memutar..." : "Putar"}
        </button>
        <button type="button" onClick={() => play(true)} disabled={playing} className={smallButtonClass}>
          <Turtle className="w-4 h-4" aria-hidden="true" /> Putar pelan
        </button>
      </div>
      {problem && <p role="alert" className="text-sm text-danger mb-2">{problem}</p>}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={locked}
        rows={2}
        maxLength={300}
        aria-label="Ketik kalimat yang kamu dengar"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="w-full bg-background border border-border rounded-control p-3 text-base text-foreground focus:outline-none focus:border-brand"
      />
      {!locked && (
        <Button type="submit" className="mt-3 w-full sm:w-auto" disabled={!text.trim()}>
          Periksa
        </Button>
      )}
    </form>
  );
}
