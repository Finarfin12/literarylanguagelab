"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import { CEFR_LEVELS } from "@/lib/cefr";
import { countWords, LEVEL_RULES } from "@/lib/graded-check";
import { buttonClass, inputClass } from "../_lib/ui";
import { createOwnText } from "../content-actions";
import { useNotice } from "@/lib/swal";

/** Jalur 3 (Fase 18): "Tulis teks sendiri" -> draf (opsional langsung dikaitkan ke langkah baca sebuah unit). */
export default function OwnTextForm({ units, schemaReady }: { units: { slug: string; title: string }[]; schemaReady: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("A1");
  const [unit, setUnit] = useState("");
  const [content, setContent] = useState("");
  const setMessage = useNotice();

  const words = countWords(content);
  const rule = LEVEL_RULES[level];
  const hint = rule && rule.min !== null && rule.max !== null ? `Level ${level}: sebaiknya ${rule.min}–${rule.max} kata.` : "";

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await createOwnText({ title, level, content, unitSlug: unit || undefined });
      if (res.ok) {
        setMessage({ tone: "ok", text: "Draf tersimpan. Tinjau di daftar teks (ada pemeriksaan otomatis), lalu Terbitkan." });
        setTitle("");
        setContent("");
        router.refresh();
      } else setMessage({ tone: "error", text: res.error || "Gagal." });
    });
  };

  return (
    <section className="bg-card border border-border rounded-card p-4 md:p-6">
      <h2 className="text-lg font-medium font-serif mb-1 flex items-center gap-2"><PenLine className="w-5 h-5 text-brand-ink" /> Tulis teks sendiri</h2>
      <p className="text-sm text-muted-foreground mb-4">Tulis bacaan berjenjang tanpa AI. Disimpan sebagai draf; bisa diedit lagi dengan tombol Edit di daftar.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="text-sm font-medium md:col-span-2">Judul
          <input className={`${inputClass} min-h-[44px] mt-1`} value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="text-sm font-medium">Level
          <select className={`${inputClass} min-h-[44px] mt-1`} value={level} onChange={(e) => setLevel(e.target.value)}>
            {CEFR_LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Unit tujuan (opsional)
          <select className={`${inputClass} min-h-[44px] mt-1`} value={unit} onChange={(e) => setUnit(e.target.value)} disabled={units.length === 0}>
            <option value="">(tidak dikaitkan)</option>
            {units.map((u) => <option key={u.slug} value={u.slug}>{u.title}</option>)}
          </select>
        </label>
      </div>
      <label className="text-sm font-medium block mt-3">Isi (pisahkan paragraf dengan baris kosong)
        <textarea className={`${inputClass} mt-1 min-h-[220px] font-serif`} value={content} onChange={(e) => setContent(e.target.value)} />
      </label>
      <p className="text-xs text-muted-foreground mt-1">{words} kata. {hint}</p>
      <button className={`${buttonClass} mt-3 bg-brand-solid text-on-brand`} disabled={pending || !schemaReady || !title.trim() || content.trim().length < 20} onClick={submit}>
        Simpan sebagai draf
      </button>
    </section>
  );
}
