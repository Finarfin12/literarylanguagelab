"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, ExternalLink, Pencil, Sparkles, Trash2 } from "lucide-react";
import { STAGE_LABELS, formatSourceLines, isStage, parseSourceLines, type LessonSource } from "@/lib/study";
import { buttonClass, inputClass } from "../../_lib/ui";
import { deleteLesson, generateLessonDraft, markLessonReviewed, publishStudyDrafts, saveLesson, setLessonPublished, setSubjectPublished } from "../../study-actions";

export interface AdminSubject {
  slug: string;
  stage: string;
  title: string;
  sort_order: number;
  status: "draft" | "published";
  quizCount: number;
}

export interface AdminLesson {
  slug: string;
  subject_slug: string;
  sort_order: number;
  title: string;
  objectives: string[];
  body_md: string;
  summary_md: string;
  task: string;
  tool_paths: string[];
  sources: LessonSource[];
  status: "draft" | "published";
  origin: "claude" | "manual" | "ai";
  edited_at: string | null;
  reviewed_at: string | null;
  exercises: number;
  wordCount: number;
  problems: string[];
}

interface FormState {
  isNew: boolean;
  slug: string;
  subject_slug: string;
  sort_order: number;
  title: string;
  objectives: string;
  body_md: string;
  summary_md: string;
  task: string;
  tool_paths: string;
  sources: string;
}

const ORIGIN_LABEL = { claude: "Draf Claude", manual: "Manual", ai: "Draf AI" } as const;

export default function ModuleManager({ subjects, lessons, schemaReady }: { subjects: AdminSubject[]; lessons: AdminLesson[]; schemaReady: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [aiSubject, setAiSubject] = useState(subjects[0]?.slug ?? "");
  const [aiTopic, setAiTopic] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string, after?: () => void) => {
    setMessage(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setMessage({ tone: "ok", text: success });
        after?.();
        router.refresh();
      } else setMessage({ tone: "error", text: res.error || "Gagal." });
    });
  };

  const draftLessons = lessons.filter((l) => l.status === "draft").length;
  const draftSubjects = subjects.filter((s) => s.status === "draft").length;

  const publishAll = (subject?: string, label?: string) => {
    const scope = label ? `semua draft "${label}"` : "SEMUA draft modul";
    if (!window.confirm(`Terbitkan ${scope}? Mata pelajaran, pelajaran (ditandai ditinjau), dan soalnya yang valid ikut terbit. Pemeriksaan di bawah tiap pelajaran hanya informasi.`)) return;
    setMessage(null);
    startTransition(async () => {
      const res = await publishStudyDrafts({ subject_slug: subject });
      if (!res.ok) setMessage({ tone: "error", text: res.error || "Gagal menerbitkan." });
      else if (res.data) {
        const d = res.data;
        setMessage({ tone: "ok", text: `Diterbitkan: ${d.subjects} mata pelajaran, ${d.lessons} pelajaran, ${d.exercises} soal.${d.skipped ? ` ${d.skipped} soal dilewati karena tidak valid (periksa di tab Latihan).` : ""}` });
        router.refresh();
      }
    });
  };

  const newForm = (subject: string): FormState => {
    const own = lessons.filter((l) => l.subject_slug === subject);
    return {
      isNew: true,
      slug: "",
      subject_slug: subject,
      sort_order: own.length ? Math.max(...own.map((l) => l.sort_order)) + 1 : 1,
      title: "",
      objectives: "",
      body_md: "",
      summary_md: "",
      task: "",
      tool_paths: "",
      sources: "",
    };
  };

  const editForm = (l: AdminLesson): FormState => ({
    isNew: false,
    slug: l.slug,
    subject_slug: l.subject_slug,
    sort_order: l.sort_order,
    title: l.title,
    objectives: l.objectives.join("\n"),
    body_md: l.body_md,
    summary_md: l.summary_md,
    task: l.task,
    tool_paths: l.tool_paths.join(", "),
    sources: formatSourceLines(l.sources),
  });

  const generate = async () => {
    setMessage(null);
    setAiBusy(true);
    const own = lessons.filter((l) => l.subject_slug === aiSubject);
    const order = own.length ? Math.max(...own.map((l) => l.sort_order)) + 1 : 1;
    const res = await generateLessonDraft({ subject_slug: aiSubject, topic: aiTopic, sort_order: order });
    setAiBusy(false);
    if (res.ok) {
      setMessage({ tone: "ok", text: "Draf pelajaran dibuat dengan AI. Periksa isinya dengan teliti, tambahkan sumber yang sudah dicek dan soal latihan, lalu tinjau sebelum menerbitkan." });
      setAiTopic("");
      router.refresh();
    } else setMessage({ tone: "error", text: res.error || "Gagal membuat draf." });
  };

  return (
    <div>
      {message && <p role="status" className={`mb-4 text-sm ${message.tone === "ok" ? "text-brand-ink" : "text-danger"}`}>{message.text}</p>}

      <div className="mb-6 p-4 rounded-card border border-border bg-card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={!schemaReady || subjects.length === 0} onClick={() => setForm(newForm(subjects[0]?.slug ?? ""))} className={`${buttonClass} bg-brand-solid text-on-brand`}>
            Tulis pelajaran manual
          </button>
          <span className="text-sm text-muted-foreground">atau</span>
          <select aria-label="Mata pelajaran untuk draf AI" className={`${inputClass} max-w-[260px]`} value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} disabled={!schemaReady}>
            {subjects.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
          </select>
          <input aria-label="Topik pelajaran untuk draf AI" className={`${inputClass} flex-1 min-w-[200px]`} value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="Topik pelajaran, mis. Membaca kata kunci" disabled={!schemaReady} maxLength={200} />
          <button type="button" disabled={!schemaReady || aiBusy || aiTopic.trim().length < 5} onClick={generate} className={`${buttonClass} bg-muted border border-border`}>
            <Sparkles className="w-4 h-4" aria-hidden="true" /> {aiBusy ? "Membuat..." : "Buat draf dengan AI"}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
          <button type="button" disabled={!schemaReady || pending || (draftLessons === 0 && draftSubjects === 0)} onClick={() => publishAll()} className={`${buttonClass} bg-brand-solid text-on-brand`}>
            <Eye className="w-4 h-4" aria-hidden="true" /> Terbitkan semua draft
          </button>
          <span className="text-sm text-muted-foreground">{draftSubjects} mata pelajaran dan {draftLessons} pelajaran masih draft. Soal valid ikut terbit.</span>
        </div>
        <p className="text-xs text-muted-foreground">Draf AI tanpa sumber dan soal, dan selalu perlu ditinjau manusia. Tidak ada yang terlihat pengguna sebelum diterbitkan.</p>
      </div>

      {form && (
        <form
          className="mb-8 p-4 rounded-card border border-border bg-card space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveLesson({ ...form, sources: parseSourceLines(form.sources) }), form.isNew ? "Pelajaran dibuat sebagai draft." : "Pelajaran disimpan. Tinjauan sebelumnya dibatalkan.", () => setForm(null));
          }}
        >
          <h2 className="font-bold text-foreground">{form.isNew ? "Pelajaran baru" : `Sunting: ${form.title}`}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm font-semibold md:col-span-1">Slug
              <input className={`${inputClass} mt-1`} value={form.slug} disabled={!form.isNew} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="membaca-cepat-6-contoh" />
            </label>
            <label className="text-sm font-semibold">Mata pelajaran
              <select className={`${inputClass} mt-1`} value={form.subject_slug} disabled={!form.isNew} onChange={(e) => setForm({ ...form, subject_slug: e.target.value })}>
                {subjects.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Urutan
              <input type="number" className={`${inputClass} mt-1`} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </label>
          </div>
          <label className="block text-sm font-semibold">Judul
            <input className={`${inputClass} mt-1`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="block text-sm font-semibold">Tujuan (satu per baris)
            <textarea className={`${inputClass} mt-1 min-h-[88px]`} value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} />
          </label>
          <label className="block text-sm font-semibold">Isi pelajaran (Markdown: penjelasan, contoh, pembahasan)
            <textarea className={`${inputClass} mt-1 min-h-[320px] font-mono text-sm`} value={form.body_md} onChange={(e) => setForm({ ...form, body_md: e.target.value })} />
          </label>
          <label className="block text-sm font-semibold">Rangkuman (Markdown)
            <textarea className={`${inputClass} mt-1 min-h-[120px] font-mono text-sm`} value={form.summary_md} onChange={(e) => setForm({ ...form, summary_md: e.target.value })} />
          </label>
          <label className="block text-sm font-semibold">Tugas (opsional)
            <textarea className={`${inputClass} mt-1 min-h-[88px]`} value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} />
          </label>
          <label className="block text-sm font-semibold">Alat praktik (path dipisah koma, opsional)
            <input className={`${inputClass} mt-1`} value={form.tool_paths} onChange={(e) => setForm({ ...form, tool_paths: e.target.value })} placeholder="/library, /tools/nuance-detector" />
          </label>
          <label className="block text-sm font-semibold">Sumber (satu per baris: Judul | alamat | ok atau perlu-cek)
            <textarea className={`${inputClass} mt-1 min-h-[88px] font-mono text-sm`} value={form.sources} onChange={(e) => setForm({ ...form, sources: e.target.value })} />
          </label>
          <p className="text-xs text-muted-foreground">Soal latihan dibuat di tab Latihan dan dikaitkan ke pelajaran ini lewat impor berkas. Menyimpan membatalkan tinjauan sebelumnya.</p>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={`${buttonClass} bg-brand-solid text-on-brand`}>Simpan</button>
            <button type="button" onClick={() => setForm(null)} className={`${buttonClass} bg-muted border border-border`}>Batal</button>
          </div>
        </form>
      )}

      {subjects.length === 0 && schemaReady && <p className="text-sm text-muted-foreground">Belum ada mata pelajaran. Impor dari berkas: <code>node scripts/import-modules.mjs</code>.</p>}

      {subjects.map((s) => {
        const own = lessons.filter((l) => l.subject_slug === s.slug).sort((a, b) => a.sort_order - b.sort_order);
        return (
          <section key={s.slug} className="mb-8" aria-labelledby={`sub-${s.slug}`}>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 id={`sub-${s.slug}`} className="font-serif text-xl font-medium text-foreground">{s.sort_order}. {s.title}</h2>
              <span className="text-xs text-muted-foreground">{isStage(s.stage) ? STAGE_LABELS[s.stage] : s.stage}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.status === "published" ? "bg-brand-tint text-brand-ink" : "bg-warning-tint text-warning-ink"}`}>{s.status === "published" ? "Terbit" : "Draft"}</span>
              <div className="flex-1" />
              <Link href={`/admin/content/exercises?subject=${s.slug}`} className={`${buttonClass} bg-muted border border-border`}>Kuis akhir ({s.quizCount})</Link>
              <button type="button" disabled={pending} onClick={() => run(() => setSubjectPublished(s.slug, s.status !== "published"), s.status === "published" ? "Mata pelajaran dijadikan draft." : "Mata pelajaran diterbitkan.")} className={`${buttonClass} bg-muted border border-border`}>
                {s.status === "published" ? <><EyeOff className="w-4 h-4" aria-hidden="true" /> Tarik</> : <><Eye className="w-4 h-4" aria-hidden="true" /> Terbitkan</>}
              </button>
              {(s.status === "draft" || own.some((l) => l.status === "draft")) && (
                <button type="button" disabled={pending} onClick={() => publishAll(s.slug, s.title)} className={`${buttonClass} bg-brand-solid text-on-brand`}>
                  <Eye className="w-4 h-4" aria-hidden="true" /> Terbitkan semua
                </button>
              )}
              <button type="button" disabled={!schemaReady} onClick={() => setForm(newForm(s.slug))} className={`${buttonClass} bg-muted border border-border`}>Tambah pelajaran</button>
            </div>
            {own.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada pelajaran.</p>
            ) : (
              <ul className="divide-y divide-border border border-border rounded-card bg-card">
                {own.map((l) => (
                  <li key={l.slug} className="p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground">{l.sort_order}. {l.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ORIGIN_LABEL[l.origin]} · {l.wordCount} kata · {l.exercises} soal
                          {l.reviewed_at ? " · ditinjau" : l.edited_at ? " · disunting, belum ditinjau" : " · belum ditinjau"}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.status === "published" ? "bg-brand-tint text-brand-ink" : "bg-warning-tint text-warning-ink"}`}>{l.status === "published" ? "Terbit" : "Draft"}</span>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/modul/${l.subject_slug}/${l.slug}`} className={`${buttonClass} bg-muted border border-border`}>
                          <ExternalLink className="w-4 h-4" aria-hidden="true" /> Buka
                        </Link>
                        <Link href={`/admin/content/exercises?lesson=${l.slug}`} className={`${buttonClass} bg-muted border border-border`}>Soal</Link>
                        <button type="button" disabled={pending} onClick={() => setForm(editForm(l))} className={`${buttonClass} bg-muted border border-border`} aria-label={`Sunting ${l.title}`}>
                          <Pencil className="w-4 h-4" aria-hidden="true" /> Sunting
                        </button>
                        {!l.reviewed_at && (
                          <button type="button" disabled={pending} onClick={() => run(() => markLessonReviewed(l.slug), "Ditandai sudah ditinjau.")} className={`${buttonClass} bg-muted border border-border`}>
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Tandai ditinjau
                          </button>
                        )}
                        <button type="button" disabled={pending} onClick={() => run(() => setLessonPublished(l.slug, l.status !== "published"), l.status === "published" ? "Pelajaran dijadikan draft." : "Pelajaran diterbitkan.")} className={`${buttonClass} bg-muted border border-border`}>
                          {l.status === "published" ? <><EyeOff className="w-4 h-4" aria-hidden="true" /> Tarik</> : <><Eye className="w-4 h-4" aria-hidden="true" /> Terbitkan</>}
                        </button>
                        <button type="button" disabled={pending} onClick={() => { if (window.confirm(`Hapus pelajaran "${l.title}"?`)) run(() => deleteLesson(l.slug), "Pelajaran dihapus."); }} className={`${buttonClass} bg-danger-tint text-danger border border-danger/30`} aria-label={`Hapus ${l.title}`}>
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {l.problems.length > 0 && (
                      <p className="mt-2 flex items-start gap-2 text-xs text-warning-ink">
                        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Pemeriksaan (hanya informasi): {l.problems.join("; ")}</span>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
