"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { Button, Card, CardTitle } from "@/components/ui/primitives";
import Markdown from "@/components/ui/Markdown";
import { smallButtonClass } from "@/components/exercises/shared";
import { saveLessonTask, setLessonCompleted } from "@/app/(dashboard)/modul/actions";

/** Tugas pribadi: jawaban disimpan hanya untuk pemilik, tanpa penilaian AI. */
export function TaskBox({ lessonSlug, prompt, initial }: { lessonSlug: string; prompt: string; initial: string }) {
  const [text, setText] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const dirty = text !== initial || message === null;

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await saveLessonTask(lessonSlug, text);
      setMessage(res.ok ? { tone: "ok", text: "Jawabanmu tersimpan." } : { tone: "error", text: res.error });
    });
  };

  return (
    <Card>
      <CardTitle>Tugas</CardTitle>
      <p className="text-foreground leading-relaxed whitespace-pre-line">{prompt}</p>
      <label className="block mt-4 text-sm font-semibold text-foreground" htmlFor={`tugas-${lessonSlug}`}>Jawabanmu</label>
      <textarea
        id={`tugas-${lessonSlug}`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setMessage(null);
        }}
        rows={7}
        className="mt-1 w-full rounded-control border border-border bg-card p-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <p className="mt-1 text-xs text-muted-foreground">Tugas ini tidak dinilai dan hanya bisa kamu lihat. Bandingkan dengan rangkuman dan contoh di pelajaran.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button onClick={save} loading={pending} disabled={!text.trim() && !initial}>Simpan jawaban</Button>
        {message && (
          <p role={message.tone === "error" ? "alert" : "status"} className={`text-sm ${message.tone === "ok" ? "text-brand-ink" : "text-danger"}`}>
            {message.tone === "ok" && <Check className="inline w-4 h-4 mr-1" aria-hidden="true" />}
            {message.text}
          </p>
        )}
        {dirty && !message && text !== initial && <span className="text-xs text-muted-foreground">Belum disimpan</span>}
      </div>
    </Card>
  );
}

/** Tombol selesai (tindakan jelas) dan tautan pelajaran berikutnya. Tidak ada yang dikunci. */
export function LessonFooter({
  lessonSlug,
  completed,
  next,
  subjectHref,
}: {
  lessonSlug: string;
  completed: boolean;
  next: { href: string; title: string } | null;
  subjectHref: string;
}) {
  const router = useRouter();
  const [done, setDone] = useState(completed);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const toggle = () => {
    setError("");
    startTransition(async () => {
      const res = await setLessonCompleted(lessonSlug, !done);
      if (res.ok) {
        setDone(!done);
        router.refresh();
      } else setError(res.error);
    });
  };

  return (
    <div className="rounded-card border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={toggle} loading={pending} variant={done ? "secondary" : "primary"}>
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {done ? "Selesai. Batalkan tanda" : "Tandai pelajaran selesai"}
        </Button>
        {next ? (
          <Link href={next.href} className="inline-flex items-center gap-2 min-h-[44px] font-semibold text-brand-ink">
            Pelajaran berikutnya: {next.title} <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        ) : (
          <Link href={subjectHref} className="inline-flex items-center gap-2 min-h-[44px] font-semibold text-brand-ink">
            Kembali ke daftar pelajaran <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      <p className="mt-3 text-xs text-muted-foreground">Urutan hanya saran: kamu boleh membuka pelajaran mana pun.</p>
    </div>
  );
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Pendamping AI (opsional): versi sederhana (dibuat sekali, disimpan) dan tanya jawab. Pelajaran utuh tanpa ini. */
export function LessonCompanion({ lessonSlug }: { lessonSlug: string }) {
  const [simple, setSimple] = useState<string | null>(null);
  const [simpleState, setSimpleState] = useState<"idle" | "loading" | "error">("idle");
  const [simpleError, setSimpleError] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const loadSimple = async () => {
    setSimpleState("loading");
    setSimpleError("");
    try {
      const res = await fetch("/api/modul/simplify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lesson_slug: lessonSlug }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat penjelasan sederhana.");
      setSimple(data.content);
      setSimpleState("idle");
    } catch (e) {
      setSimpleState("error");
      setSimpleError(e instanceof Error ? e.message : "Gagal membuat penjelasan sederhana.");
    }
  };

  const ask = async () => {
    const q = input.trim();
    if (!q || chatLoading) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setChatLoading(true);
    setChatError("");
    try {
      const res = await fetch("/api/modul/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lesson_slug: lessonSlug, messages: next }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mendapat jawaban.");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "Gagal mendapat jawaban.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <Card>
      <CardTitle icon={<Sparkles className="w-5 h-5 text-brand-ink" />}>Butuh bantuan memahami?</CardTitle>
      <p className="text-sm text-muted-foreground -mt-2 mb-4">Opsional. Dibuat AI, jadi periksa kembali dengan isi pelajaran di atas.</p>

      <div className="space-y-5">
        <div>
          {simple ? (
            <div className="rounded-control border border-border bg-muted/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Penjelasan lebih sederhana · Dibuat AI, periksa kembali</p>
              <div className="text-foreground leading-relaxed"><Markdown>{simple}</Markdown></div>
            </div>
          ) : (
            <button type="button" onClick={loadSimple} disabled={simpleState === "loading"} className={smallButtonClass}>
              {simpleState === "loading" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Sparkles className="w-4 h-4" aria-hidden="true" />}
              {simpleState === "loading" ? "Menyusun..." : simpleState === "error" ? "Coba lagi" : "Jelaskan lebih sederhana"}
            </button>
          )}
          {simpleError && <p role="alert" className="mt-2 text-sm text-danger">{simpleError}</p>}
        </div>

        <div>
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><MessageCircle className="w-4 h-4" aria-hidden="true" /> Tanya seputar pelajaran ini</p>
          {messages.length > 0 && (
            <ul className="space-y-3 mb-3" aria-live="polite">
              {messages.map((m, i) => (
                <li key={i} className={`rounded-control p-3 text-sm ${m.role === "user" ? "bg-brand-tint text-foreground" : "bg-muted/40 border border-border text-foreground"}`}>
                  <span className="block text-xs font-bold text-muted-foreground mb-1">{m.role === "user" ? "Kamu" : "Pendamping (dibuat AI, periksa kembali)"}</span>
                  <Markdown>{m.content}</Markdown>
                </li>
              ))}
            </ul>
          )}
          {chatError && <p role="alert" className="mb-2 text-sm text-danger">{chatError}</p>}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") ask();
              }}
              placeholder="Tulis pertanyaanmu"
              aria-label="Pertanyaan tentang pelajaran"
              maxLength={500}
              className="flex-1 min-h-[44px] rounded-control border border-border bg-card px-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <Button onClick={ask} loading={chatLoading} disabled={!input.trim()} aria-label="Kirim pertanyaan">
              <Send className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
