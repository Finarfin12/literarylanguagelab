"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, RotateCcw, Search, Timer, XCircle, Zap } from "lucide-react";
import { Badge, Button, Card, CardTitle } from "@/components/ui/primitives";
import { choiceClass } from "@/components/exercises/shared";
import {
  READING_TEXTS,
  SCAN_TARGET_SECONDS,
  SKIM_TARGET_SECONDS,
  formatElapsed,
  getReadingText,
  gradeScan,
  gradeSkim,
  summarizeScan,
  textWordCount,
  timerStatus,
  wordsPerMinute,
  type ReadingText,
  type ScanResult,
} from "@/lib/reading-drill";

type Mode = "skim" | "scan";

/** Stopwatch sederhana: hanya menghitung waktu, tidak pernah menghentikan latihan atau menyembunyikan teks. */
function useStopwatch() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAt = useRef<number | null>(null);
  const base = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const since = startedAt.current === null ? 0 : (Date.now() - startedAt.current) / 1000;
      setSeconds(Math.floor(base.current + since));
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  const start = () => {
    startedAt.current = Date.now();
    setRunning(true);
  };
  /** Menghentikan dan mengembalikan total detik (pecahan). */
  const stop = (): number => {
    if (running && startedAt.current !== null) {
      base.current += (Date.now() - startedAt.current) / 1000;
      startedAt.current = null;
      setSeconds(Math.floor(base.current));
      setRunning(false);
    }
    return base.current;
  };
  const reset = () => {
    base.current = 0;
    startedAt.current = null;
    setSeconds(0);
    setRunning(false);
  };
  return { seconds, running, start, stop, reset };
}

function TimerLabel({ seconds, target }: { seconds: number; target: number }) {
  const over = timerStatus(seconds, target) === "melewati-target";
  return (
    <span role="timer" className={`inline-flex items-center gap-2 text-sm font-semibold ${over ? "text-warning-ink" : "text-brand-ink"}`}>
      <Timer className="w-4 h-4" aria-hidden="true" />
      {formatElapsed(seconds)}
      <span className="font-normal text-muted-foreground">
        dari target {formatElapsed(target)}
        {over ? ", sudah melewati target (tidak apa-apa, lanjutkan saja)" : ""}
      </span>
    </span>
  );
}

/** Menandai jawaban di dalam paragraf (tanpa HTML mentah). */
function Highlighted({ text, phrase }: { text: string; phrase: string }) {
  const i = text.toLowerCase().indexOf(phrase.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-warning-tint text-warning-ink rounded-sm px-0.5">{text.slice(i, i + phrase.length)}</mark>
      {text.slice(i + phrase.length)}
    </>
  );
}

function TextBlock({ t }: { t: ReadingText }) {
  return (
    <div className="space-y-3 text-base leading-relaxed text-foreground" lang="en">
      {t.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function SkimSession({ t, useTimer, onAgain }: { t: ReadingText; useTimer: boolean; onAgain: () => void }) {
  const clock = useStopwatch();
  const [phase, setPhase] = useState<"baca" | "jawab" | "hasil">("baca");
  const [readSeconds, setReadSeconds] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const words = textWordCount(t);

  const finishReading = () => {
    const total = clock.stop();
    setReadSeconds(useTimer && total > 0 ? Math.max(1, Math.round(total)) : null);
    setPhase("jawab");
  };
  const allAnswered = t.skim.every((_, i) => answers[i] !== undefined);
  const score = t.skim.filter((q, i) => answers[i] !== undefined && gradeSkim(q, answers[i])).length;
  const wpm = readSeconds === null ? null : wordsPerMinute(words, readSeconds);

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle icon={<Zap className="w-5 h-5 text-brand-ink" />}>
          {phase === "baca" ? "1. Baca sekilas" : phase === "jawab" ? "2. Jawab tanpa membaca ulang" : "3. Hasil"}
        </CardTitle>
        {phase === "baca" && (
          <p className="text-sm text-muted-foreground mb-4">
            Lihat judul, kalimat pertama tiap paragraf, dan kata yang menonjol. Kamu tidak perlu membaca setiap kata. Targetnya sekitar satu menit untuk gambaran umum.
          </p>
        )}
        {phase === "jawab" && <p className="text-sm text-muted-foreground mb-4">Cobalah menjawab dari ingatan gambaran umum. Teks tetap terbuka bila kamu perlu memeriksanya.</p>}
        {useTimer && phase === "baca" && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <TimerLabel seconds={clock.seconds} target={SKIM_TARGET_SECONDS} />
            {!clock.running && clock.seconds === 0 && <Button variant="secondary" onClick={clock.start}>Mulai timer</Button>}
          </div>
        )}
        <h2 className="font-serif text-xl font-medium text-foreground mb-3" lang="en">{t.title}</h2>
        <TextBlock t={t} />
        {phase === "baca" && (
          <div className="mt-5">
            <Button onClick={finishReading}>Selesai membaca sekilas</Button>
          </div>
        )}
      </Card>

      {phase !== "baca" && (
        <Card>
          <CardTitle>Soal gambaran umum</CardTitle>
          <div className="space-y-6">
            {t.skim.map((q, qi) => {
              const picked = answers[qi];
              const done = phase === "hasil";
              return (
                <fieldset key={qi}>
                  <legend className="font-semibold text-foreground mb-2" lang="en">{qi + 1}. {q.question}</legend>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const state = done ? (oi === q.correct ? "correct" : oi === picked ? "wrong" : "muted") : oi === picked ? "selected" : "idle";
                      return (
                        <button
                          key={oi}
                          type="button"
                          disabled={done}
                          aria-pressed={oi === picked}
                          onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                          className={choiceClass(state)}
                          lang="en"
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {done && (
                    <p className="mt-2 text-sm text-muted-foreground flex items-start gap-2">
                      {gradeSkim(q, picked) ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-brand-ink shrink-0" aria-hidden="true" /> : <XCircle className="w-4 h-4 mt-0.5 text-danger shrink-0" aria-hidden="true" />}
                      <span>
                        <strong>{gradeSkim(q, picked) ? "Tepat. " : "Belum tepat. "}</strong>
                        {q.explanation_id}
                      </span>
                    </p>
                  )}
                </fieldset>
              );
            })}
          </div>
          {phase === "jawab" && (
            <div className="mt-5">
              <Button disabled={!allAnswered} onClick={() => setPhase("hasil")}>Lihat hasil</Button>
            </div>
          )}
        </Card>
      )}

      {phase === "hasil" && (
        <Card>
          <CardTitle>Ringkasan</CardTitle>
          <p className="text-foreground">Benar {score} dari {t.skim.length} soal.</p>
          {readSeconds !== null && (
            <p className="text-sm text-muted-foreground mt-2">
              Waktu baca sekilas: {formatElapsed(readSeconds)}
              {wpm !== null ? `, setara sekitar ${wpm} kata per menit untuk teks ${words} kata` : ""}. Skimming memang tidak membaca semua kata, jadi angka ini hanya gambaran kasar, bukan nilai.
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Bila jawabanmu belum tepat, ulangi dan perhatikan kalimat pertama serta terakhir tiap paragraf: di sanalah gagasan utama sering berada.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={onAgain}>
              <RotateCcw className="w-4 h-4" aria-hidden="true" /> Latihan lagi
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function ScanSession({ t, useTimer, onAgain }: { t: ReadingText; useTimer: boolean; onAgain: () => void }) {
  const clock = useStopwatch();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [lastSeconds, setLastSeconds] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const q = t.scan[index];
  const answered = picked !== null;

  // Timer per soal mulai otomatis saat soal tampil (pengguna sudah memilih memakai timer).
  useEffect(() => {
    if (!useTimer) return;
    clock.reset();
    clock.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, useTimer]);

  const choose = (pi: number) => {
    if (answered || finished) return;
    const secs = useTimer ? Math.max(1, Math.round(clock.stop())) : null;
    setLastSeconds(secs);
    setPicked(pi);
    setResults((r) => [...r, { correct: gradeScan(q, pi), seconds: secs }]);
  };
  const next = () => {
    if (index + 1 < t.scan.length) {
      setIndex(index + 1);
      setPicked(null);
      setLastSeconds(null);
    } else {
      setFinished(true);
    }
  };
  const summary = summarizeScan(results);

  return (
    <div className="space-y-5">
      {!finished && q && (
        <Card>
          <CardTitle icon={<Search className="w-5 h-5 text-brand-ink" />}>Soal {index + 1} dari {t.scan.length}</CardTitle>
          <p className="font-semibold text-foreground" lang="en">{q.question}</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Jangan membaca semuanya. Cari kata kunci (angka, nama, atau kata dari pertanyaan), lalu pilih paragraf yang memuat jawabannya.
          </p>
          {useTimer && !answered && (
            <div className="mb-4">
              <TimerLabel seconds={clock.seconds} target={SCAN_TARGET_SECONDS} />
            </div>
          )}
          <h2 className="font-serif text-lg font-medium text-foreground mb-3" lang="en">{t.title}</h2>
          <div className="space-y-2">
            {t.paragraphs.map((p, pi) => {
              const state = !answered ? "idle" : pi === q.paragraph ? "correct" : pi === picked ? "wrong" : "muted";
              return (
                <button key={pi} type="button" disabled={answered} onClick={() => choose(pi)} className={`${choiceClass(state)} leading-relaxed`} lang="en" aria-label={`Paragraf ${pi + 1}: ${p}`}>
                  <span className="block text-xs font-semibold text-muted-foreground mb-1" aria-hidden="true">Paragraf {pi + 1}</span>
                  {answered && pi === q.paragraph ? <Highlighted text={p} phrase={q.answer} /> : p}
                </button>
              );
            })}
          </div>
          {answered && (
            <div className="mt-4 space-y-2">
              <p className="text-sm flex items-start gap-2">
                {gradeScan(q, picked) ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-brand-ink shrink-0" aria-hidden="true" /> : <XCircle className="w-4 h-4 mt-0.5 text-danger shrink-0" aria-hidden="true" />}
                <span>
                  <strong>{gradeScan(q, picked) ? "Tepat. " : `Belum tepat; jawabannya ada di paragraf ${q.paragraph + 1}. `}</strong>
                  Jawaban: <span lang="en">{q.answer}</span>.
                  {lastSeconds !== null ? ` Waktumu ${formatElapsed(lastSeconds)}${timerStatus(lastSeconds, SCAN_TARGET_SECONDS) === "melewati-target" ? " (melewati target, tidak apa-apa)." : "."}` : ""}
                </span>
              </p>
              <Button onClick={next}>{index + 1 < t.scan.length ? "Soal berikutnya" : "Lihat hasil"}</Button>
            </div>
          )}
        </Card>
      )}

      {finished && (
        <Card>
          <CardTitle>Ringkasan</CardTitle>
          <p className="text-foreground">Benar {summary.correct} dari {summary.total} soal.</p>
          {summary.avgSeconds !== null && (
            <p className="text-sm text-muted-foreground mt-2">
              Rata-rata waktu per soal: {formatElapsed(summary.avgSeconds)} (target {formatElapsed(SCAN_TARGET_SECONDS)}). Fokuslah pada ketepatan dulu; kecepatan datang dari latihan.
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Kebiasaan yang membantu: baca pertanyaan dulu, tentukan kata kunci, lalu biarkan mata menyapu teks mencarinya tanpa membaca kalimat penuh.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={onAgain}>
              <RotateCcw className="w-4 h-4" aria-hidden="true" /> Latihan lagi
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

/** Latihan skimming dan scanning (Fase 29, item 1): tanpa AI dan tanpa jaringan; timer opsional dan teks selalu terbuka. */
export default function ReadingDrill() {
  const [textId, setTextId] = useState(READING_TEXTS[0].id);
  const [mode, setMode] = useState<Mode>("skim");
  const [useTimer, setUseTimer] = useState(false);
  const [run, setRun] = useState(0);
  const t = getReadingText(textId) ?? READING_TEXTS[0];

  const restart = () => setRun((n) => n + 1);

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Pilih latihan</CardTitle>
        <div role="group" aria-label="Jenis latihan" className="flex flex-wrap gap-2 mb-5">
          <Button variant={mode === "skim" ? "primary" : "secondary"} aria-pressed={mode === "skim"} onClick={() => { setMode("skim"); restart(); }}>
            <Zap className="w-4 h-4" aria-hidden="true" /> Skimming: gambaran umum
          </Button>
          <Button variant={mode === "scan" ? "primary" : "secondary"} aria-pressed={mode === "scan"} onClick={() => { setMode("scan"); restart(); }}>
            <Search className="w-4 h-4" aria-hidden="true" /> Scanning: cari informasi
          </Button>
        </div>

        <p className="text-sm font-semibold text-foreground mb-2">Teks</p>
        <div role="group" aria-label="Pilih teks" className="grid gap-2 sm:grid-cols-2">
          {READING_TEXTS.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={x.id === textId}
              onClick={() => { setTextId(x.id); restart(); }}
              className={choiceClass(x.id === textId ? "selected" : "idle")}
            >
              <span className="block" lang="en">{x.title}</span>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-xs font-normal text-muted-foreground">
                <Badge tone="muted">{x.level}</Badge> {x.topic} · {textWordCount(x)} kata
              </span>
            </button>
          ))}
        </div>

        <label className="mt-5 flex min-h-[44px] items-center gap-3 text-sm text-foreground cursor-pointer">
          <input type="checkbox" className="w-5 h-5" checked={useTimer} onChange={(e) => { setUseTimer(e.target.checked); restart(); }} />
          <span>
            Pakai timer (opsional)
            <span className="block text-xs text-muted-foreground">Timer hanya menampilkan waktu. Teks tidak disembunyikan dan latihan tidak dihentikan.</span>
          </span>
        </label>
      </Card>

      {mode === "skim" ? (
        <SkimSession key={`skim-${t.id}-${useTimer}-${run}`} t={t} useTimer={useTimer} onAgain={restart} />
      ) : (
        <ScanSession key={`scan-${t.id}-${useTimer}-${run}`} t={t} useTimer={useTimer} onAgain={restart} />
      )}
    </div>
  );
}
