"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Lightbulb, PenLine } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, Card, CardTitle } from "@/components/ui/primitives";
import { isTopicDone, setTopicDone } from "@/lib/grammar-progress";

type QuizItem = { sentence: string; answer: string; options: string[] };
type Lesson = { title?: string; lesson_text?: string; quiz?: QuizItem[] };
type Correction = { original: string; corrected: string; explanation_id?: string };
type ClinicResult = { score?: number; corrections?: Correction[]; corrected_text?: string; tips?: string[] };

export default function TopicPractice({ slug, title, summary }: { slug: string; title: string; summary: string }) {
  const [done, setDone] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [picked, setPicked] = useState<Record<number, string>>({});
  const [text, setText] = useState("");
  const [clinic, setClinic] = useState<ClinicResult | null>(null);
  const [clinicLoading, setClinicLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // localStorage hanya ada di browser
    // eslint-disable-next-line react-hooks/set-state-in-effect -- membaca penyimpanan setelah mount
    setDone(isTopicDone(slug));
  }, [slug]);

  const toggleDone = () => {
    const next = !done;
    setTopicDone(slug, next);
    setDone(next);
  };

  const loadLesson = async () => {
    setError("");
    setLessonLoading(true);
    try {
      const res = await fetch("/api/grammar-clinic/mini-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: title, summary }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat penjelasan.");
      setLesson(data);
      setPicked({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat penjelasan.");
    } finally {
      setLessonLoading(false);
    }
  };

  const checkSentences = async () => {
    setError("");
    setClinicLoading(true);
    setClinic(null);
    try {
      const res = await fetch("/api/grammar-clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memeriksa kalimat.");
      setClinic(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memeriksa kalimat.");
    } finally {
      setClinicLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      <Card>
        <CardTitle icon={<Lightbulb className="w-5 h-5 text-brand" />}>Penjelasan lebih detail</CardTitle>
        {!lesson ? (
          <Button variant="secondary" onClick={loadLesson} loading={lessonLoading}>Jelaskan lebih detail</Button>
        ) : (
          <div className="space-y-4">
            <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.lesson_text || ""}</ReactMarkdown>
            </div>
            {(lesson.quiz || []).length > 0 && (
              <div>
                <h3 className="font-bold mb-2">Latihan singkat</h3>
                <ol className="space-y-4">
                  {(lesson.quiz || []).map((q, i) => {
                    const choice = picked[i];
                    return (
                      <li key={i}>
                        <p className="font-serif mb-2">{i + 1}. {q.sentence}</p>
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((opt) => {
                            const chosen = choice === opt;
                            const right = choice !== undefined && opt === q.answer;
                            const wrong = chosen && opt !== q.answer;
                            return (
                              <button
                                key={opt}
                                type="button"
                                disabled={choice !== undefined}
                                onClick={() => setPicked((p) => ({ ...p, [i]: opt }))}
                                className={`min-h-[44px] px-4 rounded-control border text-sm font-bold ${right ? "border-brand bg-brand/10 text-brand" : wrong ? "border-danger bg-danger/10 text-danger" : "border-border bg-card hover:bg-muted"}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
            <Button variant="ghost" onClick={loadLesson} loading={lessonLoading}>Buat latihan baru</Button>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle icon={<PenLine className="w-5 h-5 text-brand" />}>Coba tulis sendiri</CardTitle>
        <p className="text-sm text-muted-foreground mb-3">Tulis 2-3 kalimat yang memakai topik ini. Grammar Clinic akan memeriksanya.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={800}
          aria-label="Kalimat latihan"
          className="w-full bg-background border border-border rounded-control p-3 text-foreground focus:outline-none focus:border-brand"
        />
        <div className="mt-3">
          <Button onClick={checkSentences} loading={clinicLoading} disabled={!text.trim()}>Periksa kalimat</Button>
        </div>
        {clinic && (
          <div className="mt-4 space-y-3 text-sm">
            <p className="font-bold">Skor: {clinic.score ?? 0}/100</p>
            {(clinic.corrections || []).length === 0 && <p className="text-brand font-bold">Tidak ada kesalahan. Bagus!</p>}
            {(clinic.corrections || []).map((c, i) => (
              <div key={i} className="border-l-4 border-amber-500/50 pl-3">
                <p><span className="line-through text-muted-foreground">{c.original}</span> → <strong>{c.corrected}</strong></p>
                {c.explanation_id && <p className="text-muted-foreground">{c.explanation_id}</p>}
              </div>
            ))}
            {clinic.corrected_text && <p className="text-muted-foreground">Versi benar: <span className="text-foreground font-serif">{clinic.corrected_text}</span></p>}
          </div>
        )}
      </Card>

      <Button variant={done ? "secondary" : "primary"} onClick={toggleDone} className="w-full">
        <CheckCircle2 className="w-4 h-4" /> {done ? "Selesai — ketuk untuk membatalkan" : "Tandai topik ini selesai"}
      </Button>
    </div>
  );
}
