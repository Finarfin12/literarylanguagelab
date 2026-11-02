"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { STEP_LABELS, STEP_TYPES, type CourseStep, type StepType } from "@/lib/course";
import { DIALOGUE_SCENARIOS } from "@/lib/dialogue-scenarios";
import { buttonClass, inputClass } from "../../_lib/ui";

/** Bentuk langkah di formulir (semua bidang berupa teks); diubah ke/dari CourseStep di bawah. */
export interface EditStep {
  type: StepType;
  title: string;
  vocab: string; // satu kata per baris: kata | arti Indonesia | definisi Inggris (opsional)
  topic_slug: string;
  text_id: string;
  content: string;
  note_id: string;
  text: string;
  count: string;
  sentences: string; // satu kalimat per baris
  scenario_id: string;
}

export const emptyEditStep = (type: StepType): EditStep => ({
  type, title: "", vocab: "", topic_slug: "", text_id: "", content: "", note_id: "", text: "", count: "", sentences: "", scenario_id: "",
});

export function toEditStep(step: CourseStep): EditStep {
  const e = emptyEditStep(step.type);
  e.title = step.title ?? "";
  switch (step.type) {
    case "vocab":
      e.vocab = step.items.map((i) => [i.word, i.meaning_id ?? "", i.definition_en ?? ""].join(" | ").replace(/( \| )+$/, "")).join("\n");
      break;
    case "grammar":
      e.topic_slug = step.topic_slug;
      break;
    case "read":
      e.text_id = step.text_id ?? "";
      e.content = step.content ?? "";
      e.note_id = step.note_id ?? "";
      break;
    case "listen":
      e.text = step.text;
      e.note_id = step.note_id ?? "";
      break;
    case "exercise":
      e.count = step.count ? String(step.count) : "";
      break;
    case "speak":
      e.sentences = step.sentences.join("\n");
      e.scenario_id = step.scenario_id ?? "";
      break;
  }
  return e;
}

/** Ke bentuk mentah yang diperiksa validateSteps() di server. */
export function fromEditStep(e: EditStep): Record<string, unknown> {
  const base: Record<string, unknown> = { type: e.type };
  if (e.title.trim()) base.title = e.title.trim();
  switch (e.type) {
    case "vocab":
      base.items = e.vocab
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const [word, meaning, definition] = l.split("|").map((p) => p.trim());
          return { word, ...(meaning ? { meaning_id: meaning } : {}), ...(definition ? { definition_en: definition } : {}) };
        });
      break;
    case "grammar":
      base.topic_slug = e.topic_slug;
      break;
    case "read":
      if (e.text_id) base.text_id = e.text_id;
      if (e.content.trim()) base.content = e.content.trim();
      if (e.note_id.trim()) base.note_id = e.note_id.trim();
      break;
    case "listen":
      base.text = e.text.trim();
      if (e.note_id.trim()) base.note_id = e.note_id.trim();
      break;
    case "exercise":
      if (e.count.trim()) base.count = Number(e.count);
      break;
    case "speak":
      base.sentences = e.sentences.split("\n").map((l) => l.trim()).filter(Boolean);
      if (e.scenario_id) base.scenario_id = e.scenario_id;
      break;
  }
  return base;
}

export default function StepEditor({
  steps,
  onChange,
  topics,
  texts,
}: {
  steps: EditStep[];
  onChange: (next: EditStep[]) => void;
  topics: { slug: string; title: string }[];
  texts: { id: string; title: string; cefr_level: string | null }[];
}) {
  const update = (i: number, patch: Partial<EditStep>) => onChange(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= steps.length) return;
    const next = steps.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const field = "text-sm font-medium block";
  const input = `${inputClass} min-h-[44px] mt-1`;

  return (
    <div className="space-y-4">
      {steps.length === 0 && <p className="text-sm text-muted-foreground border border-dashed border-border rounded-control p-4 text-center">Belum ada langkah. Tambahkan di bawah.</p>}
      {steps.map((s, i) => (
        <fieldset key={i} className="border border-border rounded-control p-4 space-y-3">
          <legend className="px-2 text-sm font-bold">{i + 1}. {STEP_LABELS[s.type]}</legend>
          <label className={field}>Judul langkah (opsional)
            <input className={input} value={s.title} maxLength={120} onChange={(e) => update(i, { title: e.target.value })} />
          </label>

          {s.type === "vocab" && (
            <label className={field}>Kata (satu per baris: <code>kata | arti Indonesia | definisi Inggris</code>; dua yang terakhir opsional, definisi kosong diambil dari Kosakata Inti)
              <textarea className={`${input} min-h-[140px] font-mono`} value={s.vocab} onChange={(e) => update(i, { vocab: e.target.value })} spellCheck={false} />
            </label>
          )}
          {s.type === "grammar" && (
            <label className={field}>Topik grammar
              <select className={input} value={s.topic_slug} onChange={(e) => update(i, { topic_slug: e.target.value })}>
                <option value="">(belum dipilih: placeholder)</option>
                {topics.map((t) => <option key={t.slug} value={t.slug}>{t.title}</option>)}
              </select>
            </label>
          )}
          {s.type === "read" && (
            <>
              <label className={field}>Teks dari Library (terbit)
                <select className={input} value={s.text_id} onChange={(e) => update(i, { text_id: e.target.value })}>
                  <option value="">(tidak dipakai: tulis langsung di bawah)</option>
                  {texts.map((t) => <option key={t.id} value={t.id}>{t.title}{t.cefr_level ? ` (${t.cefr_level})` : ""}</option>)}
                </select>
              </label>
              <label className={field}>Atau tulis bacaan langsung (pisahkan paragraf dengan baris kosong)
                <textarea className={`${input} min-h-[120px] font-serif`} value={s.content} onChange={(e) => update(i, { content: e.target.value })} />
              </label>
              <label className={field}>Catatan Indonesia (opsional)
                <textarea className={`${input} min-h-[60px]`} value={s.note_id} onChange={(e) => update(i, { note_id: e.target.value })} />
              </label>
            </>
          )}
          {s.type === "listen" && (
            <>
              <label className={field}>Teks yang dibacakan (TTS)
                <textarea className={`${input} min-h-[80px]`} value={s.text} maxLength={600} onChange={(e) => update(i, { text: e.target.value })} />
              </label>
              <label className={field}>Catatan Indonesia (opsional)
                <textarea className={`${input} min-h-[60px]`} value={s.note_id} onChange={(e) => update(i, { note_id: e.target.value })} />
              </label>
            </>
          )}
          {s.type === "exercise" && (
            <label className={field}>Jumlah soal per sesi (1-20, kosong = 6)
              <input type="number" min={1} max={20} className={input} value={s.count} onChange={(e) => update(i, { count: e.target.value })} />
              <span className="block text-xs text-muted-foreground mt-1">Soal diambil dari soal terbit yang bertanda unit ini (atur di tab Latihan).</span>
            </label>
          )}
          {s.type === "speak" && (
            <>
              <label className={field}>Kalimat untuk diucapkan (satu per baris)
                <textarea className={`${input} min-h-[100px]`} value={s.sentences} onChange={(e) => update(i, { sentences: e.target.value })} />
              </label>
              <label className={field}>Skenario Dialogue Simulator (opsional)
                <select className={input} value={s.scenario_id} onChange={(e) => update(i, { scenario_id: e.target.value })}>
                  <option value="">(tanpa skenario)</option>
                  {DIALOGUE_SCENARIOS.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </label>
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" className={`${buttonClass} bg-muted border border-border`} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Pindah ke atas"><ArrowUp className="w-4 h-4" /></button>
            <button type="button" className={`${buttonClass} bg-muted border border-border`} onClick={() => move(i, 1)} disabled={i === steps.length - 1} aria-label="Pindah ke bawah"><ArrowDown className="w-4 h-4" /></button>
            <button type="button" className={`${buttonClass} bg-danger-tint text-danger`} onClick={() => onChange(steps.filter((_, idx) => idx !== i))} aria-label={`Hapus langkah ${i + 1}`}><Trash2 className="w-4 h-4" /></button>
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap gap-2" aria-label="Tambah langkah">
        {STEP_TYPES.map((t) => (
          <button key={t} type="button" className={`${buttonClass} bg-muted border border-border`} onClick={() => onChange([...steps, emptyEditStep(t)])}>
            <Plus className="w-4 h-4" /> {STEP_LABELS[t]}
          </button>
        ))}
      </div>
    </div>
  );
}
