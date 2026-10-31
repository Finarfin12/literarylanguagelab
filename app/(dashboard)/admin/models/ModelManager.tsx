"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2, Loader2, DownloadCloud } from "lucide-react";
import { deleteModel, fetchProviderModels, importModels, saveModel } from "../ai-actions";
import { buttonClass, inputClass } from "../_lib/ui";

export interface ProviderOption {
  id: string;
  name: string;
}

export interface ModelView {
  id: string;
  providerId: string;
  modelId: string;
  label: string | null;
  capabilities: string[];
  defaultTemperature: number | null;
  defaultMaxTokens: number | null;
  isActive: boolean;
  priceIn: number | null;
  priceOut: number | null;
}

const CAPABILITIES = [
  { key: "text", label: "Teks" },
  { key: "vision", label: "Vision (gambar)" },
  { key: "tools", label: "Tool use" },
  { key: "stt", label: "Speech-to-text" },
  { key: "tts", label: "Text-to-speech" },
];

function ModelForm({ providerId, model, pricingReady, onDone }: { providerId: string; model?: ModelView; pricingReady: boolean; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const res = await saveModel(formData);
      if (!res.ok) {
        Swal.fire("Gagal", res.error, "error");
        return;
      }
      onDone();
      router.refresh();
    });
  };

  return (
    <form action={submit} className="space-y-3">
      {model && <input type="hidden" name="id" value={model.id} />}
      <input type="hidden" name="provider_id" value={providerId} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="space-y-1 block">
          <span className="text-sm font-medium">ID model</span>
          <input name="model_id" required defaultValue={model?.modelId} placeholder="meta-llama/llama-4-scout" className={inputClass} />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm font-medium">Label (opsional)</span>
          <input name="label" defaultValue={model?.label ?? ""} placeholder="Llama 4 Scout" className={inputClass} />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm font-medium">Temperature default</span>
          <input name="default_temperature" type="number" step="0.1" min="0" max="2" defaultValue={model?.defaultTemperature ?? 0.7} className={inputClass} />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm font-medium">Max tokens default</span>
          <input name="default_max_tokens" type="number" min="1" defaultValue={model?.defaultMaxTokens ?? 1500} className={inputClass} />
        </label>
        {pricingReady && (
          <>
            <label className="space-y-1 block">
              <span className="text-sm font-medium">Harga input (USD / 1 juta token)</span>
              <input name="price_in" type="number" step="0.0001" min="0" defaultValue={model?.priceIn ?? ""} placeholder="opsional" className={inputClass} />
            </label>
            <label className="space-y-1 block">
              <span className="text-sm font-medium">Harga output (USD / 1 juta token)</span>
              <input name="price_out" type="number" step="0.0001" min="0" defaultValue={model?.priceOut ?? ""} placeholder="opsional" className={inputClass} />
            </label>
          </>
        )}
      </div>
      <fieldset>
        <legend className="text-sm font-medium mb-1">Kemampuan</legend>
        <div className="flex flex-wrap gap-x-5">
          {CAPABILITIES.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm min-h-[44px]">
              <input
                type="checkbox"
                name="capabilities"
                value={c.key}
                defaultChecked={model ? model.capabilities.includes(c.key) : c.key === "text"}
                className="w-4 h-4 accent-brand"
              />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm min-h-[44px]">
        <input type="checkbox" name="is_active" defaultChecked={model?.isActive ?? true} className="w-4 h-4 accent-brand" />
        Aktif
      </label>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onDone} className={`${buttonClass} bg-muted text-foreground hover:bg-muted/80`}>
          Batal
        </button>
        <button type="submit" disabled={pending} className={`${buttonClass} bg-brand text-background`}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
        </button>
      </div>
    </form>
  );
}

function ModelRow({ model, pricingReady }: { model: ModelView; pricingReady: boolean }) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  const remove = async () => {
    const confirm = await Swal.fire({
      title: "Hapus model?",
      text: `Fitur yang memakai "${model.modelId}" akan kembali ke model bawaan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;
    const res = await deleteModel(model.id);
    if (!res.ok) Swal.fire("Gagal", res.error, "error");
    else router.refresh();
  };

  if (editing) {
    return (
      <div className="p-4 border-t border-border">
        <ModelForm providerId={model.providerId} model={model} pricingReady={pricingReady} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground break-all">
          {model.label || model.modelId}
          {!model.isActive && <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">Nonaktif</span>}
        </p>
        {model.label && <p className="text-xs text-muted-foreground break-all">{model.modelId}</p>}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {model.capabilities.map((c) => (
            <span key={c} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand/10 text-brand">
              {c}
            </span>
          ))}
          <span className="text-[10px] text-muted-foreground px-1 py-0.5">
            temp {model.defaultTemperature ?? "-"} · max {model.defaultMaxTokens ?? "-"}
            {model.priceIn !== null && ` · $${model.priceIn}/$${model.priceOut ?? 0} per 1M`}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className={`${buttonClass} bg-muted hover:bg-muted/80 text-foreground`} aria-label="Edit">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={remove} className={`${buttonClass} bg-red-500/10 text-red-500 hover:bg-red-500/20`} aria-label="Hapus">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ImportPanel({ provider, existing, onDone }: { provider: ProviderOption; existing: Set<string>; onDone: () => void }) {
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetchProviderModels(provider.id).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        Swal.fire("Gagal mengambil model", res.error, "error");
        onDone();
        return;
      }
      setAvailable((res.data || []).filter((m) => !existing.has(m)));
    });
    return () => {
      cancelled = true;
    };
    // Hanya sekali saat panel dibuka
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider.id]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const save = async () => {
    setSaving(true);
    const res = await importModels(provider.id, [...selected]);
    setSaving(false);
    if (!res.ok) {
      Swal.fire("Gagal", res.error, "error");
      return;
    }
    Swal.fire({ icon: "success", title: `${res.data} model ditambahkan`, text: "Atur kemampuan (vision, tools) lewat tombol edit.", timer: 2500, showConfirmButton: false });
    onDone();
    router.refresh();
  };

  const shown = available.filter((m) => m.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="p-4 border-t border-border space-y-3">
      {loading ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Mengambil daftar model...
        </p>
      ) : available.length === 0 ? (
        <p className="text-sm text-muted-foreground">Semua model dari provider ini sudah terdaftar.</p>
      ) : (
        <>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Cari model..." className={inputClass} />
          <div className="max-h-64 overflow-y-auto border border-border rounded-xl divide-y divide-border">
            {shown.map((m) => (
              <label key={m} className="flex items-center gap-3 px-3 min-h-[44px] text-sm cursor-pointer hover:bg-muted/40">
                <input type="checkbox" checked={selected.has(m)} onChange={() => toggle(m)} className="w-4 h-4 accent-brand" />
                <span className="break-all">{m}</span>
              </label>
            ))}
          </div>
        </>
      )}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onDone} className={`${buttonClass} bg-muted text-foreground hover:bg-muted/80`}>
          Tutup
        </button>
        {available.length > 0 && (
          <button onClick={save} disabled={saving || selected.size === 0} className={`${buttonClass} bg-brand text-background`}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Tambahkan {selected.size || ""}
          </button>
        )}
      </div>
    </div>
  );
}

function ProviderSection({ provider, models, pricingReady }: { provider: ProviderOption; models: ModelView[]; pricingReady: boolean }) {
  const [mode, setMode] = useState<"idle" | "add" | "import">("idle");

  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 bg-muted/30">
        <h2 className="font-bold text-foreground flex-1">
          {provider.name} <span className="text-sm font-normal text-muted-foreground">({models.length} model)</span>
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setMode("import")} className={`${buttonClass} bg-muted hover:bg-muted/80 text-foreground`}>
            <DownloadCloud className="w-4 h-4" /> Ambil dari provider
          </button>
          <button onClick={() => setMode("add")} className={`${buttonClass} bg-brand text-background`}>
            <Plus className="w-4 h-4" /> Model
          </button>
        </div>
      </div>
      {mode === "add" && (
        <div className="p-4 border-t border-border">
          <ModelForm providerId={provider.id} pricingReady={pricingReady} onDone={() => setMode("idle")} />
        </div>
      )}
      {mode === "import" && (
        <ImportPanel provider={provider} existing={new Set(models.map((m) => m.modelId))} onDone={() => setMode("idle")} />
      )}
      {models.map((m) => (
        <ModelRow key={m.id} model={m} pricingReady={pricingReady} />
      ))}
    </section>
  );
}

export default function ModelManager({ providers, models, pricingReady }: { providers: ProviderOption[]; models: ModelView[]; pricingReady: boolean }) {
  if (providers.length === 0) {
    return <p className="text-muted-foreground text-sm">Tambahkan provider terlebih dahulu di tab Provider AI.</p>;
  }
  return (
    <div className="space-y-6">
      {providers.map((p) => (
        <ProviderSection key={p.id} provider={p} models={models.filter((m) => m.providerId === p.id)} pricingReady={pricingReady} />
      ))}
    </div>
  );
}
