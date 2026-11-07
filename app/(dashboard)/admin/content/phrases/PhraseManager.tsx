"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { PHRASE_SITUATIONS, groupPhrases, type DailyPhrase } from "@/lib/phrases";
import { buttonClass, inputClass } from "../../_lib/ui";
import { deletePhrase, savePhrase, setPhrasePublished } from "../../phrase-actions";
import { confirmDialog, useNotice } from "@/lib/swal";

interface FormState {
  isNew: boolean;
  slug: string;
  situation: string;
  text_en: string;
  text_id: string;
  literal_id: string;
  sort_order: number;
}

const EMPTY: FormState = { isNew: true, slug: "", situation: "salam", text_en: "", text_id: "", literal_id: "", sort_order: 0 };

export default function PhraseManager({ phrases, schemaReady }: { phrases: DailyPhrase[]; schemaReady: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const setMessage = useNotice();
  const [form, setForm] = useState<FormState | null>(null);

  const published = phrases.filter((p) => p.status === "published").length;

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

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <p className="text-sm text-muted-foreground flex-1 min-w-[200px]">
          {phrases.length} frasa, {published} terbit. Frasa baru berstatus draft dan baru tampil di <code>/frasa-harian</code> setelah diterbitkan.
        </p>
        <button type="button" disabled={!schemaReady} onClick={() => setForm({ ...EMPTY })} className={`${buttonClass} bg-brand-solid text-on-brand`}>
          Tambah frasa
        </button>
      </div>

      {form && (
        <form
          className="mb-6 p-4 rounded-card border border-border bg-card space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => savePhrase(form), form.isNew ? "Frasa dibuat sebagai draft." : "Frasa disimpan.", () => setForm(null));
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm font-semibold">Slug
              <input className={`${inputClass} mt-1`} value={form.slug} disabled={!form.isNew} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="good-morning" />
            </label>
            <label className="text-sm font-semibold">Situasi
              <select className={`${inputClass} mt-1`} value={form.situation} onChange={(e) => setForm({ ...form, situation: e.target.value })}>
                {PHRASE_SITUATIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
          </div>
          <label className="block text-sm font-semibold">Frasa Inggris
            <input className={`${inputClass} mt-1`} value={form.text_en} onChange={(e) => setForm({ ...form, text_en: e.target.value })} />
          </label>
          <label className="block text-sm font-semibold">Arti natural (Indonesia)
            <input className={`${inputClass} mt-1`} value={form.text_id} onChange={(e) => setForm({ ...form, text_id: e.target.value })} />
          </label>
          <label className="block text-sm font-semibold">Arti kata per kata (opsional)
            <input className={`${inputClass} mt-1`} value={form.literal_id} onChange={(e) => setForm({ ...form, literal_id: e.target.value })} placeholder="Bagaimana · adalah · kamu?" />
          </label>
          <label className="block text-sm font-semibold">Urutan
            <input type="number" className={`${inputClass} mt-1 max-w-[120px]`} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={`${buttonClass} bg-brand-solid text-on-brand`}>Simpan</button>
            <button type="button" onClick={() => setForm(null)} className={`${buttonClass} bg-muted border border-border`}>Batal</button>
          </div>
        </form>
      )}

      {groupPhrases(phrases).map((g) => (
        <section key={g.id} className="mb-6">
          <h2 className="font-bold text-foreground mb-2">{g.label}</h2>
          <ul className="divide-y divide-border border border-border rounded-card bg-card">
            {g.phrases.map((p) => (
              <li key={p.slug} className="p-3 flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p lang="en" className="font-serif text-foreground">{p.text_en}</p>
                  <p className="text-sm text-muted-foreground">{p.text_id}</p>
                  {p.literal_id && <p className="text-xs text-muted-foreground">{p.literal_id}</p>}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.status === "published" ? "bg-brand-tint text-brand-ink" : "bg-warning-tint text-warning-ink"}`}>
                  {p.status === "published" ? "Terbit" : "Draft"}
                </span>
                <div className="flex gap-2">
                  <button type="button" disabled={pending} onClick={() => setForm({ isNew: false, slug: p.slug, situation: p.situation, text_en: p.text_en, text_id: p.text_id, literal_id: p.literal_id ?? "", sort_order: p.sort_order })} className={`${buttonClass} bg-muted border border-border`} aria-label={`Ubah ${p.text_en}`}>
                    <Pencil className="w-4 h-4" aria-hidden="true" /> Ubah
                  </button>
                  <button type="button" disabled={pending} onClick={() => run(() => setPhrasePublished(p.slug, p.status !== "published"), p.status === "published" ? "Frasa dijadikan draft." : "Frasa diterbitkan.")} className={`${buttonClass} bg-muted border border-border`}>
                    {p.status === "published" ? <><EyeOff className="w-4 h-4" aria-hidden="true" /> Tarik</> : <><Eye className="w-4 h-4" aria-hidden="true" /> Terbitkan</>}
                  </button>
                  <button type="button" disabled={pending} onClick={async () => { if ((await confirmDialog({ title: "Hapus?", text: `Hapus frasa "${p.text_en}"?`, confirmText: "Ya, hapus", danger: true }))) run(() => deletePhrase(p.slug), "Frasa dihapus."); }} className={`${buttonClass} bg-danger-tint text-danger border border-danger/30`} aria-label={`Hapus ${p.text_en}`}>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
