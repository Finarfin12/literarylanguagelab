"use client";

import Markdown from "@/components/ui/Markdown";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Volume2, XCircle } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { Button, ButtonLink, Card, CardTitle } from "@/components/ui/primitives";
import type { LevelSummary } from "@/components/profile/LevelProgressCard";

type Question = {
  index: number;
  section: "reading" | "grammar" | "vocabulary" | "listening";
  passage?: string;
  audio_text?: string;
  question: string;
  options: string[];
};

type Result = {
  passed: boolean;
  totalPct: number;
  sectionPct: Record<string, number>;
  weakSections: string[];
  newLevel: string;
  target: string;
  review: { index: number; section: string; yourAnswer: string | null; correct: string; isCorrect: boolean; explanation_id: string | null }[];
  retryAt: string | null;
  passRules: { totalPct: number; minSectionPct: number };
};

const SECTION_LABELS: Record<string, string> = { reading: "Membaca", grammar: "Grammar", vocabulary: "Kosakata", listening: "Menyimak" };

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export default function LevelTestPage() {
  const [summary, setSummary] = useState<LevelSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/levels/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setSummary(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const start = async () => {
    setError("");
    setStarting(true);
    try {
      const res = await fetch("/api/level-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start" }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memulai tes.");
      setSessionId(data.sessionId);
      setTarget(data.target);
      setQuestions(data.questions);
      setAnswers({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memulai tes.");
    } finally {
      setStarting(false);
    }
  };

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/level-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", sessionId, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyerahkan jawaban.");
      setResult(data);
      setQuestions([]);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyerahkan jawaban.");
    } finally {
      setSubmitting(false);
    }
  };

  const answeredAll = questions.length > 0 && questions.every((q) => answers[q.index]);

  return (
    <AnimatedPage className="p-4 lg:p-8 max-w-3xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground">Tes Naik Level</h1>
        <p className="text-muted-foreground mt-2">
          Tes singkat (10-15 menit) pada level berikutnya. Gagal tidak menurunkan levelmu dan kamu bisa mencoba lagi setelah 14 hari.
        </p>
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}

      {/* Hasil */}
      {result && (
        <div className="space-y-4">
          <Card className={result.passed ? "border-brand/40 bg-brand/5" : ""}>
            <CardTitle>{result.passed ? `Selamat! Levelmu naik ke ${result.newLevel}` : "Belum lulus kali ini"}</CardTitle>
            <p className="text-foreground">Nilai total: <strong>{result.totalPct}%</strong> (syarat {result.passRules.totalPct}%, tiap bagian minimal {result.passRules.minSectionPct}%).</p>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {Object.entries(result.sectionPct).map(([k, v]) => (
                <li key={k} className={`rounded-control border p-3 ${result.weakSections.includes(k) ? "border-danger/50 bg-danger/5" : "border-border"}`}>
                  <span className="block text-muted-foreground">{SECTION_LABELS[k] ?? k}</span>
                  <span className="font-bold text-foreground">{v}%</span>
                </li>
              ))}
            </ul>
            {!result.passed && (
              <p className="text-sm text-muted-foreground mt-4">
                {result.weakSections.length > 0
                  ? `Perlu dilatih: ${result.weakSections.map((s) => SECTION_LABELS[s] ?? s).join(", ")}. `
                  : "Latih lagi beberapa keterampilan. "}
                Tes ulang tersedia {result.retryAt ? `mulai ${new Date(result.retryAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}` : "setelah 14 hari"}.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink href="/profile">Lihat profil</ButtonLink>
              <ButtonLink href="/dashboard" variant="secondary">Ke beranda</ButtonLink>
            </div>
          </Card>

          <Card>
            <CardTitle>Pembahasan</CardTitle>
            <ol className="space-y-3 text-sm">
              {result.review.map((r) => (
                <li key={r.index} className="flex items-start gap-2">
                  {r.isCorrect ? <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" aria-label="Benar" /> : <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" aria-label="Salah" />}
                  <span>
                    <span className="text-muted-foreground">{SECTION_LABELS[r.section] ?? r.section}: </span>
                    jawabanmu {r.yourAnswer ?? "-"}, yang benar <strong>{r.correct}</strong>.
                    {r.explanation_id && <div className="text-muted-foreground"><Markdown>{r.explanation_id}</Markdown></div>}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}

      {/* Soal */}
      {!result && questions.length > 0 && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">Tes level {target}. Jawab semua {questions.length} soal, lalu serahkan.</p>
          {questions.map((q, i) => (
            <Card key={q.index}>
              <p className="text-xs font-bold text-brand mb-2">{i + 1}. {SECTION_LABELS[q.section]}</p>
              {q.passage && <p className="mb-3 font-serif text-foreground leading-relaxed">{q.passage}</p>}
              {q.audio_text && (
                <Button type="button" variant="secondary" className="mb-3" onClick={() => speak(q.audio_text as string)}>
                  <Volume2 className="w-4 h-4" /> Putar audio
                </Button>
              )}
              <p className="font-medium text-foreground mb-3">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const letter = opt.trim().charAt(0).toUpperCase();
                  const selected = answers[q.index] === letter;
                  return (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setAnswers((a) => ({ ...a, [q.index]: letter }))}
                      className={`w-full min-h-[48px] px-4 py-2 rounded-control border text-left text-sm ${selected ? "border-brand bg-brand/10 font-bold" : "border-border bg-card hover:bg-muted"}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
          <Button onClick={submit} loading={submitting} disabled={!answeredAll} className="w-full">
            Serahkan jawaban
          </Button>
        </div>
      )}

      {/* Pintu masuk */}
      {!result && questions.length === 0 && (
        <Card>
          {summaryLoading ? (
            <p className="text-muted-foreground">Memeriksa syarat...</p>
          ) : !summary || !summary.schemaReady ? (
            <p className="text-muted-foreground">Fitur ini belum aktif (migrasi 0008 belum dijalankan).</p>
          ) : !summary.level ? (
            <p className="text-muted-foreground">
              Tentukan levelmu dulu lewat <Link href="/english-lab/placement-test" className="text-brand underline">Placement Test</Link>.
            </p>
          ) : summary.test?.canStart ? (
            <>
              <CardTitle>Siap naik ke {summary.readiness?.target}</CardTitle>
              <p className="text-sm text-muted-foreground mb-4">12 soal: membaca, grammar, kosakata, dan menyimak. Lulus jika nilai total ≥ 70% dan tidak ada bagian di bawah 50%.</p>
              <Button onClick={start} loading={starting}>Mulai tes</Button>
            </>
          ) : summary.readiness?.ready && summary.test && !summary.test.allowed ? (
            <p className="text-muted-foreground">Tes ulang tersedia dalam {summary.test.daysLeft} hari.</p>
          ) : (
            <>
              <CardTitle>Syarat belum terpenuhi</CardTitle>
              <ul className="space-y-1 text-sm text-muted-foreground mb-4">
                {summary.readiness?.criteria.filter((c) => !c.met).map((c) => (
                  <li key={c.key}>{c.label} <span className="block">{c.progressText}</span></li>
                ))}
              </ul>
              <ButtonLink href="/profile" variant="secondary">Lihat progres di profil</ButtonLink>
            </>
          )}
        </Card>
      )}
    </AnimatedPage>
  );
}
