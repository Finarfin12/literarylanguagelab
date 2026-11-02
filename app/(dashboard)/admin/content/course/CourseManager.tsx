"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { COURSE_LEVELS, parseSteps, readySteps } from "@/lib/course";
import { buttonClass, inputClass } from "../../_lib/ui";
import { deleteCourseUnit, saveCourseUnit, setCourseUnitPublished } from "../../course-actions";
import StepEditor, { fromEditStep, toEditStep, type EditStep } from "./StepEditor";

export interface AdminUnit {
  slug: string;
  title: string;
  cefr_level: string;
  sort_order: number;
  theme_id: string | null;
  intro_id: string;
  steps: unknown;
  status: "draft" | "published";
  exercises_published: number;
  exercises_draft: number;
}

interface FormState {
  isNew: boolean;
  slug: string;
  title: string;
  cefr_level: string;
  sort_order: number;
  theme_id: string;
  intro_id: string;
  steps: EditStep[];
}

export default function CourseManager({
  units,
  topics,
  texts,
  schemaReady,
}: {
  units: AdminUnit[];
  topics: { slug: string; title: string }[];
  texts: { id: string; title: string; cefr_level: string | null }[];
  schemaReady: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, successText: string, after?: () => void) => {
    setMessage(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setMessage({ tone: "ok", text: successText });
        after?.();
        router.refresh();
      } else {
        setMessage({ tone: "error", text: res.error || "Gagal." });
      }
    });
  };

  const newUnit = (): FormState => ({
    isNew: true,
    slug: "",
    title: "",
    cefr_level: "A1",
    sort_order: units.length ? Math.max(...units.map((u) => u.sort_order)) + 1 : 0,
    theme_id: "",
    intro_id: "",
    steps: [],
  });

  const edit = (u: AdminUnit) =>
    setForm({
      isNew: false,
      slug: u.slug,
      title: u.title,
      cefr_level: u.cefr_level,
      sort_order: u.sort_order,
      theme_id: u.theme_id ?? "",
      intro_id: u.intro_id,
      steps: parseSteps(u.steps).map(toEditStep),
    });

  const save = () => {
    if (!form) return;
    run(
      () =>
        saveCourseUnit({
          slug: form.slug,
          isNew: form.isNew,
          title: form.title,
          cefr_level: form.cefr_level,
          sort_order: form.sort_order,
          theme_id: form.theme_id,
          intro_id: form.intro_id,
          steps: form.steps.map(fromEditStep),
        }),
      "Unit disimpan.",
      () => setForm(null)
    );
  };

  return (
    <div className="space-y-6">
      {message && (
        <p role="status" className={`text-sm font-bold rounded-control border p-3 ${message.tone === "ok" ? "border-brand/30 bg-brand-tint text-brand-ink" : "border-danger/30 bg-danger-tint text-danger"}`}>
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium font-serif">Unit ({units.length})</h2>
        <button className={`${buttonClass} bg-brand-solid text-on-brand`} disabled={pending || !schemaReady} onClick={() => setForm(newUnit())}>Tambah unit</button>
      </div>

      {form && (
        <div className="bg-card border border-border rounded-card p-4 md:p-6 space-y-4">
          <h3 className="font-bold">{form.isNew ? "Unit baru" : `Edit unit: ${form.slug}`}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-sm font-medium">Slug
              <input className={`${inputClass} min-h-[44px] mt-1`} value={form.slug} disabled={!form.isNew} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="salam-perkenalan" />
            </label>
            <label className="text-sm font-medium md:col-span-2">Judul
              <input className={`${inputClass} min-h-[44px] mt-1`} value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium">Level
                <select className={`${inputClass} min-h-[44px] mt-1`} value={form.cefr_level} onChange={(e) => setForm({ ...form, cefr_level: e.target.value })}>
                  {COURSE_LEVELS.slice(0, 4).map((l) => <option key={l}>{l}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Urutan
                <input type="number" className={`${inputClass} min-h-[44px] mt-1`} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </label>
            </div>
          </div>
          <label className="text-sm font-medium block">Tema (kunci singkat, opsional)
            <input className={`${inputClass} min-h-[44px] mt-1`} value={form.theme_id} maxLength={40} onChange={(e) => setForm({ ...form, theme_id: e.target.value })} placeholder="sapaan" />
          </label>
          <label className="text-sm font-medium block">Pengantar (bahasa Indonesia)
            <textarea className={`${inputClass} mt-1 min-h-[80px]`} value={form.intro_id} maxLength={600} onChange={(e) => setForm({ ...form, intro_id: e.target.value })} />
          </label>

          <div>
            <h4 className="font-bold mb-2">Langkah</h4>
            <StepEditor steps={form.steps} onChange={(steps) => setForm({ ...form, steps })} topics={topics} texts={texts} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button className={`${buttonClass} bg-brand-solid text-on-brand`} disabled={pending} onClick={save}>Simpan unit</button>
            <button className={`${buttonClass} bg-muted border border-border`} onClick={() => setForm(null)}>Batal</button>
          </div>
        </div>
      )}

      {units.length === 0 ? (
        <p className="text-sm text-muted-foreground border border-dashed border-border rounded-control p-6 text-center">
          {schemaReady ? "Belum ada unit." : "Jalankan migrasi 0013 untuk membuat 12 unit awal."}
        </p>
      ) : (
        <ul className="space-y-3">
          {units.map((u) => {
            const steps = parseSteps(u.steps);
            const ready = readySteps(steps);
            return (
              <li key={u.slug} className="bg-card border border-border rounded-card p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground">{u.sort_order}. {u.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {u.cefr_level} · {ready}/{steps.length} langkah berisi · soal: {u.exercises_published} terbit, {u.exercises_draft} draft ·{" "}
                      <span className={u.status === "draft" ? "text-warning-ink font-bold" : "text-brand-ink font-bold"}>{u.status === "draft" ? "Draft" : "Terbit"}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/kursus/${u.slug}`} className={`${buttonClass} bg-muted border border-border`}><ExternalLink className="w-4 h-4" /> Buka</Link>
                    <Link href={`/admin/content/exercises?unit=${u.slug}`} className={`${buttonClass} bg-muted border border-border`}>Soal</Link>
                    <button className={`${buttonClass} bg-muted border border-border`} onClick={() => edit(u)}><Pencil className="w-4 h-4" /> Edit</button>
                    <button
                      className={`${buttonClass} bg-muted border border-border`}
                      disabled={pending}
                      onClick={() => run(() => setCourseUnitPublished(u.slug, u.status !== "published"), u.status === "published" ? "Unit ditarik ke draft." : "Unit diterbitkan.")}
                    >
                      {u.status === "published" ? <><EyeOff className="w-4 h-4" /> Tarik</> : <><Eye className="w-4 h-4" /> Terbitkan</>}
                    </button>
                    <button
                      className={`${buttonClass} bg-danger-tint text-danger`}
                      disabled={pending}
                      aria-label={`Hapus ${u.title}`}
                      onClick={() => window.confirm(`Hapus unit "${u.title}" beserta kemajuan pengguna di unit ini?`) && run(() => deleteCourseUnit(u.slug), "Unit dihapus.")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
