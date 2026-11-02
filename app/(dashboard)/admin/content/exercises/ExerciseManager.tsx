"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Database, Eye, EyeOff, Pencil, Play, Sparkles, Trash2, Wand2 } from "lucide-react";
import ExerciseRunner from "@/components/exercises/ExerciseRunner";
import { CEFR_LEVELS } from "@/lib/cefr";
import { parseExerciseRow } from "@/lib/exercises/grade";
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS, type ExerciseType } from "@/lib/exercises/types";
import { buttonClass, inputClass } from "../../_lib/ui";
import { EXERCISE_TEMPLATES, exerciseSummary, type AdminExerciseRow } from "../../_lib/exercise-templates";
import { deleteExercise, generateCoreWordExercises, generateExercisesWithAI, saveExercise, setExercisesPublished } from "../../exercise-actions";

interface FormState {
  id?: string;
  type: ExerciseType;
  cefr_level: string;
  topic_slug: string;
  unit_slug: string;
  tags: string;
  prompt: string;
  answer: string;
  explanation_id: string;
}

const pretty = (v: unknown) => JSON.stringify(v, null, 2);

const emptyForm = (type: ExerciseType = "mcq"): FormState => ({
  type,
  cefr_level: "A1",
  topic_slug: "",
  unit_slug: "",
  tags: "",
  prompt: pretty(EXERCISE_TEMPLATES[type].prompt),
  answer: pretty(EXERCISE_TEMPLATES[type].answer),
  explanation_id: "",
});

export default function ExerciseManager({
  rows,
  topics,
  units,
  schemaReady,
  activeTopic,
}: {
  rows: AdminExerciseRow[];
  topics: { slug: string; title: string }[];
  /** Unit Kursus Dasar (Fase 16) untuk mengaitkan soal; kosong bila migrasi 0013 belum dijalankan. */
  units: { slug: string; title: string }[];
  schemaReady: boolean;
  activeTopic: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Generator AI
  const [aiTopic, setAiTopic] = useState(topics[0]?.slug ?? "");
  const [aiType, setAiType] = useState<ExerciseType>("mcq");
  const [aiCount, setAiCount] = useState(5);
  const [aiNote, setAiNote] = useState("");

  // Generator Kosakata Inti (tanpa AI)
  const [coreLevel, setCoreLevel] = useState("A1");
  const [coreMcq, setCoreMcq] = useState(10);
  const [coreMatch, setCoreMatch] = useState(2);

  const [form, setForm] = useState<FormState | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, successText: string | (() => string), after?: () => void) => {
    setMessage(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setMessage({ tone: "ok", text: typeof successText === "function" ? successText() : successText });
        after?.();
        router.refresh();
      } else {
        setMessage({ tone: "error", text: res.error || "Gagal." });
      }
    });
  };

  const parseJson = (label: string, text: string): { ok: true; value: unknown } | { ok: false; error: string } => {
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch {
      return { ok: false, error: `${label} bukan JSON yang valid.` };
    }
  };

  const submitForm = () => {
    if (!form) return;
    const prompt = parseJson("Prompt", form.prompt);
    const answer = parseJson("Jawaban", form.answer);
    if (!prompt.ok) return setMessage({ tone: "error", text: prompt.error });
    if (!answer.ok) return setMessage({ tone: "error", text: answer.error });
    run(
      () =>
        saveExercise({
          id: form.id,
          type: form.type,
          cefr_level: form.cefr_level,
          topic_slug: form.topic_slug || null,
          unit_slug: form.unit_slug || null,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          prompt: prompt.value,
          answer: answer.value,
          explanation_id: form.explanation_id,
        }),
      form.id ? "Soal disimpan sebagai draft. Terbitkan lagi setelah ditinjau." : "Soal dibuat sebagai draft.",
      () => setForm(null)
    );
  };

  const edit = (row: AdminExerciseRow) =>
    setForm({
      id: row.id,
      type: row.type,
      cefr_level: row.cefr_level,
      topic_slug: row.topic_slug ?? "",
      unit_slug: row.unit_slug ?? "",
      tags: (row.tags ?? []).join(", "),
      prompt: pretty(row.prompt),
      answer: pretty(row.answer),
      explanation_id: row.explanation_id,
    });

  const drafts = rows.filter((r) => r.status === "draft");

  const changeTopicFilter = (slug: string) => {
    const sp = new URLSearchParams(window.location.search);
    if (slug) sp.set("topic", slug);
    else sp.delete("topic");
    const qs = sp.toString();
    router.push(`/admin/content/exercises${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="space-y-10">
      {message && (
        <p role="status" className={`text-sm font-bold rounded-control border p-3 ${message.tone === "ok" ? "border-brand/30 bg-brand-tint text-brand-ink" : "border-danger/30 bg-danger-tint text-danger"}`}>
          {message.text}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI */}
        <section className="bg-card border border-border rounded-card p-4 md:p-6">
          <h2 className="text-lg font-medium font-serif mb-1 flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-ink" /> Buat soal dengan AI</h2>
          <p className="text-sm text-muted-foreground mb-4">Hasilnya divalidasi lalu disimpan sebagai <strong>draft</strong>. Tinjau, edit, baru terbitkan. Pengguna tidak memanggil AI saat berlatih.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm font-medium sm:col-span-2">Topik grammar
              <select className={`${inputClass} min-h-[44px] mt-1`} value={aiTopic} onChange={(e) => setAiTopic(e.target.value)}>
                {topics.map((t) => <option key={t.slug} value={t.slug}>{t.title}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">Tipe soal
              <select className={`${inputClass} min-h-[44px] mt-1`} value={aiType} onChange={(e) => setAiType(e.target.value as ExerciseType)}>
                {EXERCISE_TYPES.map((t) => <option key={t} value={t}>{EXERCISE_TYPE_LABELS[t]}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">Jumlah (1-10)
              <input type="number" min={1} max={10} className={`${inputClass} min-h-[44px] mt-1`} value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))} />
            </label>
            <label className="text-sm font-medium sm:col-span-2">Catatan tambahan (opsional)
              <input className={`${inputClass} min-h-[44px] mt-1`} maxLength={300} value={aiNote} onChange={(e) => setAiNote(e.target.value)} placeholder="Contoh: pakai konteks sekolah" />
            </label>
          </div>
          <button
            className={`${buttonClass} mt-4 bg-brand-solid text-on-brand hover:bg-brand-hover`}
            disabled={pending || !schemaReady || !aiTopic}
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                const res = await generateExercisesWithAI({ topic_slug: aiTopic, type: aiType, count: aiCount, note: aiNote });
                if (res.ok && res.data) {
                  const d = res.data;
                  setMessage({ tone: "ok", text: `${d.created} draf dibuat${d.rejected ? `, ${d.rejected} ditolak (${d.reasons[0]})` : ""}. Tinjau di daftar.` });
                  router.refresh();
                } else setMessage({ tone: "error", text: (!res.ok && res.error) || "Gagal." });
              });
            }}
          >
            <Wand2 className="w-4 h-4" /> {pending ? "Memproses..." : "Buat draf"}
          </button>
        </section>

        {/* Kosakata Inti */}
        <section className="bg-card border border-border rounded-card p-4 md:p-6">
          <h2 className="text-lg font-medium font-serif mb-1 flex items-center gap-2"><Database className="w-5 h-5 text-brand-ink" /> Buat soal dari Kosakata Inti</h2>
          <p className="text-sm text-muted-foreground mb-4">Tanpa AI: pilihan ganda &ldquo;apa arti kata ini?&rdquo; dan pasangkan kata ↔ definisi. Pengecoh diambil dari kata di level yang sama; kata yang sudah punya soal dilewati. Butuh definisi dari <code>enrich-ngsl</code>.</p>
          <div className="grid grid-cols-3 gap-3">
            <label className="text-sm font-medium">Level
              <select className={`${inputClass} min-h-[44px] mt-1`} value={coreLevel} onChange={(e) => setCoreLevel(e.target.value)}>
                <option value="">Semua</option>
                {CEFR_LEVELS.slice(0, 4).map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">Pilihan ganda
              <input type="number" min={0} max={30} className={`${inputClass} min-h-[44px] mt-1`} value={coreMcq} onChange={(e) => setCoreMcq(Number(e.target.value))} />
            </label>
            <label className="text-sm font-medium">Pasangkan
              <input type="number" min={0} max={10} className={`${inputClass} min-h-[44px] mt-1`} value={coreMatch} onChange={(e) => setCoreMatch(Number(e.target.value))} />
            </label>
          </div>
          <button
            className={`${buttonClass} mt-4 bg-brand-solid text-on-brand hover:bg-brand-hover`}
            disabled={pending || !schemaReady}
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                const res = await generateCoreWordExercises({ cefr: coreLevel || undefined, mcqCount: coreMcq, matchCount: coreMatch });
                if (res.ok && res.data) {
                  setMessage({ tone: "ok", text: `${res.data.created} draf dibuat dari Kosakata Inti.` });
                  router.refresh();
                } else setMessage({ tone: "error", text: (!res.ok && res.error) || "Gagal." });
              });
            }}
          >
            <Wand2 className="w-4 h-4" /> Buat draf
          </button>
        </section>
      </div>

      {/* Daftar */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-medium font-serif">Soal ({rows.length})</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Filter topik" className={`${inputClass} !w-auto min-h-[44px]`} value={activeTopic} onChange={(e) => changeTopicFilter(e.target.value)}>
              <option value="">Semua topik</option>
              {topics.map((t) => <option key={t.slug} value={t.slug}>{t.title}</option>)}
            </select>
            <button className={`${buttonClass} bg-muted border border-border`} disabled={pending || !schemaReady} onClick={() => setForm(emptyForm())}>Tambah soal manual</button>
            {drafts.length > 0 && (
              <button
                className={`${buttonClass} bg-brand-solid text-on-brand`}
                disabled={pending || !schemaReady}
                onClick={() => {
                  if (!window.confirm(`Terbitkan ${drafts.length} draf yang tampil? Pastikan sudah ditinjau.`)) return;
                  setMessage(null);
                  startTransition(async () => {
                    const res = await setExercisesPublished(drafts.map((d) => d.id), true);
                    if (res.ok && res.data) {
                      setMessage({ tone: "ok", text: `${res.data.changed} soal diterbitkan${res.data.skipped ? `, ${res.data.skipped} dilewati karena tidak valid` : ""}.` });
                      router.refresh();
                    } else setMessage({ tone: "error", text: (!res.ok && res.error) || "Gagal." });
                  });
                }}
              >
                Terbitkan {drafts.length} draf
              </button>
            )}
          </div>
        </div>

        {form && (
          <div className="bg-card border border-border rounded-card p-4 md:p-6 space-y-3 mb-4">
            <h3 className="font-bold">{form.id ? "Edit soal" : "Soal baru"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="text-sm font-medium">Tipe
                <select
                  className={`${inputClass} min-h-[44px] mt-1`}
                  value={form.type}
                  disabled={!!form.id}
                  onChange={(e) => {
                    const t = e.target.value as ExerciseType;
                    setForm({ ...form, type: t, prompt: pretty(EXERCISE_TEMPLATES[t].prompt), answer: pretty(EXERCISE_TEMPLATES[t].answer) });
                  }}
                >
                  {EXERCISE_TYPES.map((t) => <option key={t} value={t}>{EXERCISE_TYPE_LABELS[t]}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Level
                <select className={`${inputClass} min-h-[44px] mt-1`} value={form.cefr_level} onChange={(e) => setForm({ ...form, cefr_level: e.target.value })}>
                  {CEFR_LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium md:col-span-2">Topik grammar
                <select className={`${inputClass} min-h-[44px] mt-1`} value={form.topic_slug} onChange={(e) => setForm({ ...form, topic_slug: e.target.value })}>
                  <option value="">(tanpa topik)</option>
                  {topics.map((t) => <option key={t.slug} value={t.slug}>{t.title}</option>)}
                </select>
              </label>
            </div>
            <label className="text-sm font-medium block">Unit Kursus Dasar (opsional)
              <select className={`${inputClass} min-h-[44px] mt-1`} value={form.unit_slug} onChange={(e) => setForm({ ...form, unit_slug: e.target.value })}>
                <option value="">(tanpa unit)</option>
                {units.map((u) => <option key={u.slug} value={u.slug}>{u.title}</option>)}
                {form.unit_slug && !units.some((u) => u.slug === form.unit_slug) && <option value={form.unit_slug}>{form.unit_slug}</option>}
              </select>
            </label>
            <label className="text-sm font-medium block">Tag (pisahkan dengan koma)
              <input className={`${inputClass} min-h-[44px] mt-1`} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="core-word, l1-error" />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm font-medium">Prompt (JSON)
                <textarea className={`${inputClass} min-h-[44px] mt-1 min-h-[200px] font-mono`} value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} spellCheck={false} />
              </label>
              <label className="text-sm font-medium">Jawaban (JSON)
                <textarea className={`${inputClass} min-h-[44px] mt-1 min-h-[200px] font-mono`} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} spellCheck={false} />
              </label>
            </div>
            <label className="text-sm font-medium block">Penjelasan (bahasa Indonesia)
              <textarea className={`${inputClass} min-h-[44px] mt-1 min-h-[80px]`} value={form.explanation_id} onChange={(e) => setForm({ ...form, explanation_id: e.target.value })} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button className={`${buttonClass} bg-brand-solid text-on-brand`} disabled={pending} onClick={submitForm}>Simpan draf</button>
              <button className={`${buttonClass} bg-muted border border-border`} onClick={() => setForm(null)}>Batal</button>
            </div>
          </div>
        )}

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed border-border rounded-control p-6 text-center">Tidak ada soal untuk filter ini.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => {
              const preview = previewId === row.id ? parseExerciseRow(row) : null;
              return (
                <li key={row.id} className="bg-card border border-border rounded-card p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground line-clamp-2">{exerciseSummary(row) || "(soal kosong)"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {EXERCISE_TYPE_LABELS[row.type]} · {row.cefr_level} · {row.topic_slug ?? "tanpa topik"}{row.unit_slug ? ` · unit ${row.unit_slug}` : ""} · {row.source === "ai" ? "AI" : "Admin"} ·{" "}
                        <span className={row.status === "draft" ? "text-warning-ink font-bold" : "text-brand-ink font-bold"}>{row.status === "draft" ? "Draft" : "Terbit"}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button className={`${buttonClass} bg-muted border border-border`} onClick={() => setPreviewId(previewId === row.id ? null : row.id)}>
                        <Play className="w-4 h-4" /> Pratinjau
                      </button>
                      <button className={`${buttonClass} bg-muted border border-border`} onClick={() => edit(row)}><Pencil className="w-4 h-4" /> Edit</button>
                      <button
                        className={`${buttonClass} bg-muted border border-border`}
                        disabled={pending || !schemaReady}
                        onClick={() =>
                          run(
                            async () => {
                              const res = await setExercisesPublished([row.id], row.status !== "published");
                              return res.ok ? { ok: true } : res;
                            },
                            row.status === "published" ? "Soal ditarik ke draft." : "Soal diterbitkan."
                          )
                        }
                      >
                        {row.status === "published" ? <><EyeOff className="w-4 h-4" /> Tarik</> : <><Eye className="w-4 h-4" /> Terbitkan</>}
                      </button>
                      <button
                        className={`${buttonClass} bg-danger-tint text-danger`}
                        disabled={pending}
                        aria-label="Hapus soal"
                        onClick={() => window.confirm("Hapus soal ini secara permanen?") && run(() => deleteExercise(row.id), "Soal dihapus.")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {previewId === row.id && (
                    <div className="mt-4 border-t border-border pt-4">
                      {preview ? (
                        <>
                          <p className="text-xs text-muted-foreground mb-3">Pratinjau: jawaban di sini tidak dicatat.</p>
                          <ExerciseRunner key={preview.id} exercise={preview} />
                        </>
                      ) : (
                        <p className="text-sm text-danger">Soal ini tidak valid dan tidak bisa ditampilkan. Perbaiki lewat Edit.</p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
