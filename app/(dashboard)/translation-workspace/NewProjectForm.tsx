"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import { splitSentences } from "@/lib/translation/segment";
import { createProject } from "./actions";
import { useToastOn } from "@/lib/swal";

const fieldClass = "w-full bg-background border border-border rounded-control p-3 text-foreground focus:outline-none focus:border-brand";

export default function NewProjectForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [error, setError] = useState("");
  useToastOn(error, "error");
  const [pending, startTransition] = useTransition();

  const segmentCount = sourceText.trim() ? splitSentences(sourceText).length : 0;

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await createProject({ title, brief, sourceText });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/translation-workspace/${res.data?.id}`);
    });
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Judul
        <input className={`${fieldClass} mt-1 min-h-[44px]`} value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Bab 1 The Old Man and the Sea" />
      </label>
      <label className="block text-sm font-medium">Tujuan dan pembaca sasaran (opsional)
        <input className={`${fieldClass} mt-1 min-h-[44px]`} value={brief} maxLength={1000} onChange={(e) => setBrief(e.target.value)} placeholder="Contoh: terjemahan sastra untuk pembaca umum, gaya naratif" />
      </label>
      <label className="block text-sm font-medium">Teks sumber (bahasa Inggris)
        <textarea className={`${fieldClass} mt-1 min-h-[180px] font-serif`} value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Tempel teks sumber di sini..." />
      </label>
      <p className="text-xs text-muted-foreground">
        {segmentCount > 0 ? `Akan dipecah menjadi ${segmentCount} segmen (kalimat).` : "Teks dipecah otomatis per kalimat."}
      </p>
      <Button onClick={submit} loading={pending} disabled={!title.trim() || !sourceText.trim()}>Buat proyek</Button>
    </div>
  );
}
