"use client";

import { useRef, useState } from "react";
import { ListChecks, RotateCcw } from "lucide-react";
import { Button, Card, CardTitle, ProgressBar } from "@/components/ui/primitives";
import { EXERCISE_TYPE_LABELS, type Exercise, type ExerciseResponse, type GradeResult } from "@/lib/exercises/types";
import ExerciseRunner from "./ExerciseRunner";

type Phase = "idle" | "loading" | "running" | "done";
interface Answered { exercise: Exercise; result: GradeResult }
interface FinishInfo { scorePct: number; review: { next_review_at: string; interval: number } | null }

/**
 * Sesi latihan terstruktur untuk satu topik (atau unit, Fase 16): ambil beberapa soal terbit, kerjakan satu per satu
 * dengan umpan balik langsung, lalu ringkasan. Jawaban dinilai ulang dan dicatat di server; tidak ada AI di sini.
 */
export default function ExerciseSession({
  topicSlug,
  unitSlug,
  tag,
  lessonSlug,
  subjectSlug,
  quiz,
  count = 8,
  title = "Latihan terstruktur",
  onFinished,
}: {
  topicSlug?: string;
  unitSlug?: string;
  /** Fase 17: hanya soal bertanda ini (mis. "l1-error", "minimal-pair"). */
  tag?: string;
  /** Fase 24: soal satu pelajaran Modul Belajar. */
  lessonSlug?: string;
  /** Fase 24: bersama `quiz`, kuis akhir mata pelajaran. */
  subjectSlug?: string;
  quiz?: boolean;
  count?: number;
  title?: string;
  /** Dipanggil setelah sesi ditutup (mis. untuk memuat ulang jadwal review). */
  onFinished?: (info: { scorePct: number }) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [queue, setQueue] = useState<Exercise[]>([]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<Answered[]>([]);
  const [error, setError] = useState("");
  const [finish, setFinish] = useState<FinishInfo | null>(null);
  // Jawaban yang sudah dikirim ke server: hanya tutup sesi setelah semuanya terkirim
  const pending = useRef<Promise<unknown>[]>([]);

  const start = async () => {
    setError("");
    setPhase("loading");
    try {
      const res = await fetch("/api/exercises/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_slug: topicSlug, unit_slug: unitSlug, tag, lesson_slug: lessonSlug, subject_slug: subjectSlug, quiz, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat soal.");
      if (!data.available || !data.exercises?.length) {
        setPhase("idle");
        setError(data.available ? "Belum ada soal terbit untuk bagian ini." : "Latihan terstruktur belum aktif.");
        return;
      }
      pending.current = [];
      setQueue(data.exercises);
      setIndex(0);
      setAnswered([]);
      setFinish(null);
      setPhase("running");
    } catch (e) {
      setPhase("idle");
      setError(e instanceof Error ? e.message : "Gagal memuat soal.");
    }
  };

  const onAnswered = (exercise: Exercise, response: ExerciseResponse, result: GradeResult) => {
    setAnswered((a) => [...a, { exercise, result }]);
    // Server menilai ulang dan mencatat; kegagalan tidak menghalangi umpan balik di layar
    pending.current.push(
      fetch("/api/exercises/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise_id: exercise.id, response }),
      }).catch(() => null)
    );
  };

  const next = async () => {
    if (index + 1 < queue.length) {
      setIndex(index + 1);
      return;
    }
    setPhase("done");
    await Promise.all(pending.current);
    try {
      const res = await fetch("/api/exercises/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise_ids: queue.map((q) => q.id), topic_slug: topicSlug }),
      });
      if (res.ok) {
        const info = (await res.json()) as FinishInfo;
        setFinish(info);
        onFinished?.({ scorePct: info.scorePct });
      }
    } catch {
      // ringkasan lokal tetap tampil
    }
  };

  const correct = answered.filter((a) => a.result.correct).length;
  const current = queue[index];

  return (
    <Card>
      <CardTitle icon={<ListChecks className="w-5 h-5 text-brand-ink" />}>{title}</CardTitle>

      {phase === "idle" && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Soal pilihan ganda, isian, susun kalimat, pasangkan, dan dikte dengan umpan balik langsung. Soal yang pernah salah muncul lebih dulu.
          </p>
          {error && <p role="alert" className="text-sm text-danger mb-3">{error}</p>}
          <Button onClick={start}>Mulai latihan ({count} soal)</Button>
        </div>
      )}

      {phase === "loading" && <p className="text-sm text-muted-foreground" role="status">Memuat soal...</p>}

      {phase === "running" && current && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-2 text-xs font-bold text-muted-foreground">
            <span>Soal {index + 1} dari {queue.length}</span>
            <span>{EXERCISE_TYPE_LABELS[current.type]}</span>
          </div>
          <ProgressBar value={(index / queue.length) * 100} label="Kemajuan sesi latihan" className="mb-5" />
          <ExerciseRunner
            key={current.id}
            exercise={current}
            onAnswered={(response, result) => onAnswered(current, response, result)}
            onNext={next}
            nextLabel={index + 1 < queue.length ? "Berikutnya" : "Lihat hasil"}
          />
        </div>
      )}

      {phase === "done" && (
        <div className="space-y-4">
          <div>
            <p className="font-serif text-[32px] leading-none font-medium text-foreground nums">
              {correct} <span className="text-base font-sans font-normal text-muted-foreground">dari {answered.length} benar</span>
            </p>
            <ProgressBar value={answered.length ? (correct / answered.length) * 100 : 0} label="Skor sesi" className="mt-3" />
          </div>
          {finish?.review && (
            <p className="text-sm text-foreground">
              Review topik ini dijadwalkan lagi dalam {finish.review.interval} hari.
            </p>
          )}
          {answered.some((a) => !a.result.correct) && (
            <div>
              <p className="text-sm font-bold mb-2">Yang perlu diulang</p>
              <ul className="space-y-2 text-sm">
                {answered.filter((a) => !a.result.correct).map((a) => (
                  <li key={a.exercise.id} className="border-l-4 border-danger/40 pl-3">
                    <span className="text-muted-foreground">{EXERCISE_TYPE_LABELS[a.exercise.type]}: </span>
                    <span className="font-serif text-foreground whitespace-pre-line">{a.result.expected}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button variant="secondary" onClick={start}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Latihan lagi
          </Button>
        </div>
      )}
    </Card>
  );
}
