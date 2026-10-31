"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2, Trash2, Eye, EyeOff, Pencil } from "lucide-react";
import { CEFR_LEVELS } from "@/lib/cefr";
import { TEXT_LENGTHS, type AdminTextRow, type GrammarTopicRow } from "../_lib/content-types";
import { buttonClass, inputClass } from "../_lib/ui";
import {
  deleteGrammarTopic,
  estimateTextLevel,
  generateGradedText,
  saveGrammarTopic,
  setTextLevel,
  setTextPublished,
  updateDraftText,
} from "../content-actions";
import { deleteText } from "../../library/actions";

export type EditableText = Omit<AdminTextRow, "created_at"> & { content: string | null };

const SOURCE_LABELS: Record<string, string> = { ai: "AI", admin: "Admin", public_domain: "Domain publik", user: "Pengguna" };

export default function ContentManager({
  texts,
  topics,
  coreCount,
  coreWithDefinition,
  schemaReady,
}: {
  texts: EditableText[];
  topics: GrammarTopicRow[];
  coreCount: number | null;
  coreWithDefinition: number | null;
  schemaReady: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, { cefr: string; explanation: string }>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Form generator
  const [genLevel, setGenLevel] = useState("A2");
  const [genTopic, setGenTopic] = useState("");
  const [genLength, setGenLength] = useState("sedang");

  // Form topik grammar
  const emptyTopic = { slug: "", title: "", cefr_level: "A1", sort_order: topics.length + 1, summary_id: "" };
  const [topicForm, setTopicForm] = useState(emptyTopic);

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

  const estimate = (id: string) => {
    setMessage(null);
    startTransition(async () => {
      const res = await estimateTextLevel(id);
      if (res.ok && res.data) setSuggestions((s) => ({ ...s, [id]: res.data! }));
      else setMessage({ tone: "error", text: (!res.ok && res.error) || "Gagal mengestimasi." });
    });
  };

  const remove = (t: EditableText) => {
    if (!window.confirm(`Hapus teks "${t.title}" secara permanen?`)) return;
    run(async () => {
      const res = await deleteText(t.id);
      return res.success ? { ok: true } : { ok: false, error: res.error };
    }, "Teks dihapus.");
  };

  return (
    <div className="space-y-10">
      {message && (
        <p role="status" className={`text-sm font-bold rounded-xl border p-3 ${message.tone === "ok" ? "border-brand/30 bg-brand/10 text-brand" : "border-red-500/30 bg-red-500/10 text-red-500"}`}>
          {message.text}
        </p>
      )}

      {/* Generator */}
      <section className="bg-card border border-border rounded-2xl p-4 md:p-6">
        <h2 className="text-lg font-bold font-serif mb-1 flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand" /> Buat teks berjenjang dengan AI</h2>
        <p className="text-sm text-muted-foreground mb-4">Hasilnya disimpan sebagai draft. Tinjau dan edit dulu sebelum diterbitkan.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="text-sm font-medium">Level
            <select className={`${inputClass} mt-1`} value={genLevel} onChange={(e) => setGenLevel(e.target.value)}>
              {CEFR_LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium md:col-span-2">Topik
            <input className={`${inputClass} mt-1`} value={genTopic} maxLength={200} onChange={(e) => setGenTopic(e.target.value)} placeholder="Contoh: a trip to the market" />
          </label>
          <label className="text-sm font-medium">Panjang
            <select className={`${inputClass} mt-1`} value={genLength} onChange={(e) => setGenLength(e.target.value)}>
              {Object.entries(TEXT_LENGTHS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
        </div>
        <button
          className={`${buttonClass} mt-4 bg-brand text-background hover:bg-brand-hover`}
          disabled={pending || !schemaReady}
          onClick={() => run(() => generateGradedText({ level: genLevel, topic: genTopic, length: genLength }), "Draft dibuat. Tinjau di daftar di bawah.", () => setGenTopic(""))}
        >
          <Wand2 className="w-4 h-4" /> {pending ? "Memproses..." : "Buat draft"}
        </button>
      </section>

      {/* Daftar teks */}
      <section>
        <h2 className="text-lg font-bold font-serif mb-3">Teks ({texts.length})</h2>
        {texts.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-6 text-center">Tidak ada teks untuk filter ini.</p>
        ) : (
          <ul className="space-y-3">
            {texts.map((t) => (
              <li key={t.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.author} · {t.word_count ?? "?"} kata · {t.source ? SOURCE_LABELS[t.source] || t.source : "sumber tidak dicatat"} ·{" "}
                      <span className={t.status === "draft" ? "text-amber-500 font-bold" : "text-brand font-bold"}>{t.status === "draft" ? "Draft" : "Terbit"}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Level untuk ${t.title}`}
                      className={`${inputClass} !w-auto min-h-[44px]`}
                      value={t.cefr_level ?? ""}
                      disabled={pending || !schemaReady}
                      onChange={(e) => run(() => setTextLevel(t.id, e.target.value || null), "Level disimpan.")}
                    >
                      <option value="">Belum dinilai</option>
                      {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <button className={`${buttonClass} bg-muted border border-border`} disabled={pending} onClick={() => estimate(t.id)}>Estimasi AI</button>
                    {t.status === "draft" && t.content !== null && (
                      <button
                        className={`${buttonClass} bg-muted border border-border`}
                        onClick={() => {
                          setEditingId(editingId === t.id ? null : t.id);
                          setEditTitle(t.title);
                          setEditContent(t.content || "");
                        }}
                      >
                        <Pencil className="w-4 h-4" /> Edit
                      </button>
                    )}
                    <button
                      className={`${buttonClass} bg-muted border border-border`}
                      disabled={pending || !schemaReady}
                      onClick={() => run(() => setTextPublished(t.id, t.status !== "published"), t.status === "published" ? "Teks ditarik ke draft." : "Teks diterbitkan.")}
                    >
                      {t.status === "published" ? <><EyeOff className="w-4 h-4" /> Tarik</> : <><Eye className="w-4 h-4" /> Terbitkan</>}
                    </button>
                    <button className={`${buttonClass} bg-red-500/10 text-red-500 hover:bg-red-500/20`} disabled={pending} onClick={() => remove(t)} aria-label={`Hapus ${t.title}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {suggestions[t.id] && (
                  <div className="mt-3 text-sm bg-brand/5 border border-brand/20 rounded-xl p-3">
                    <p>
                      Saran AI: <strong>{suggestions[t.id].cefr}</strong>. {suggestions[t.id].explanation}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        className={`${buttonClass} bg-brand text-background`}
                        disabled={pending || !schemaReady}
                        onClick={() => run(() => setTextLevel(t.id, suggestions[t.id].cefr), "Level disimpan.", () => setSuggestions((s) => { const n = { ...s }; delete n[t.id]; return n; }))}
                      >
                        Pakai {suggestions[t.id].cefr}
                      </button>
                      <button className={`${buttonClass} bg-muted border border-border`} onClick={() => setSuggestions((s) => { const n = { ...s }; delete n[t.id]; return n; })}>Abaikan</button>
                    </div>
                  </div>
                )}

                {editingId === t.id && (
                  <div className="mt-3 space-y-3">
                    <input className={inputClass} value={editTitle} maxLength={200} onChange={(e) => setEditTitle(e.target.value)} aria-label="Judul" />
                    <textarea className={`${inputClass} min-h-[240px] font-serif`} value={editContent} onChange={(e) => setEditContent(e.target.value)} aria-label="Isi teks" />
                    <button className={`${buttonClass} bg-brand text-background`} disabled={pending} onClick={() => run(() => updateDraftText(t.id, editTitle, editContent), "Draft disimpan.", () => setEditingId(null))}>
                      Simpan perubahan
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Grammar */}
      <section>
        <h2 className="text-lg font-bold font-serif mb-3">Topik grammar dasar ({topics.length})</h2>
        <ul className="divide-y divide-border bg-card border border-border rounded-2xl mb-4">
          {topics.map((tp) => (
            <li key={tp.slug} className="flex items-center gap-3 px-4 min-h-[56px]">
              <span className="text-xs font-bold px-2 py-1 rounded bg-muted">{tp.cefr_level}</span>
              <span className="flex-1 min-w-0 truncate text-sm font-medium">{tp.sort_order}. {tp.title}</span>
              <button className={`${buttonClass} bg-muted border border-border`} onClick={() => setTopicForm({ slug: tp.slug, title: tp.title, cefr_level: tp.cefr_level, sort_order: tp.sort_order, summary_id: tp.summary_id })}>Edit</button>
              <button
                className={`${buttonClass} bg-red-500/10 text-red-500`}
                disabled={pending}
                aria-label={`Hapus ${tp.title}`}
                onClick={() => window.confirm(`Hapus topik "${tp.title}"?`) && run(() => deleteGrammarTopic(tp.slug), "Topik dihapus.")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
          {topics.length === 0 && <li className="p-4 text-sm text-muted-foreground">Belum ada topik (jalankan migrasi 0007).</li>}
        </ul>

        <div className="bg-card border border-border rounded-2xl p-4 md:p-6 space-y-3">
          <h3 className="font-bold">Tambah / ubah topik</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-sm font-medium">Slug
              <input className={`${inputClass} mt-1`} value={topicForm.slug} onChange={(e) => setTopicForm({ ...topicForm, slug: e.target.value })} placeholder="present-simple" />
            </label>
            <label className="text-sm font-medium md:col-span-2">Judul
              <input className={`${inputClass} mt-1`} value={topicForm.title} onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium">Level
                <select className={`${inputClass} mt-1`} value={topicForm.cefr_level} onChange={(e) => setTopicForm({ ...topicForm, cefr_level: e.target.value })}>
                  {CEFR_LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Urutan
                <input type="number" className={`${inputClass} mt-1`} value={topicForm.sort_order} onChange={(e) => setTopicForm({ ...topicForm, sort_order: Number(e.target.value) })} />
              </label>
            </div>
          </div>
          <label className="text-sm font-medium block">Ringkasan (bahasa Indonesia)
            <textarea className={`${inputClass} mt-1 min-h-[100px]`} value={topicForm.summary_id} onChange={(e) => setTopicForm({ ...topicForm, summary_id: e.target.value })} />
          </label>
          <button
            className={`${buttonClass} bg-brand text-background`}
            disabled={pending || !schemaReady}
            onClick={() => run(() => saveGrammarTopic(topicForm), "Topik disimpan.", () => setTopicForm({ ...emptyTopic, sort_order: topics.length + 2 }))}
          >
            Simpan topik
          </button>
        </div>
      </section>

      <section className="text-sm text-muted-foreground space-y-1">
        <p>
          Kosakata inti: {coreCount === null ? "tabel belum ada (migrasi 0007)" : `${coreCount} kata`}
          {coreCount !== null && coreWithDefinition !== null && ` (${coreWithDefinition} punya definisi)`}.
        </p>
        {coreCount !== null && coreCount > 0 && (
          <p>
            Tambah definisi bahasa Inggris dan bentuk kata (setelah migrasi <code>0015</code>):{" "}
            <code>node scripts/enrich-ngsl.mjs --definitions defs.csv --forms teaching.csv --dry-run</code>, lalu ulangi tanpa <code>--dry-run</code>.
            Petunjuk file ada di komentar skrip.
          </p>
        )}
      </section>
    </div>
  );
}
