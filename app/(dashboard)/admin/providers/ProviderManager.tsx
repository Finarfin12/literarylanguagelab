"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2, PlugZap, Loader2, KeyRound, Globe } from "lucide-react";
import { deleteProvider, saveProvider, testProvider } from "../ai-actions";
import { buttonClass, inputClass } from "../_lib/ui";

export interface ProviderView {
  id: string;
  name: string;
  baseUrl: string;
  keyHint: string | null;
  envKeyName: string | null;
  allowPrivateNetwork: boolean;
  isActive: boolean;
}

function ProviderForm({ provider, onDone }: { provider?: ProviderView; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const res = await saveProvider(formData);
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
      {provider && <input type="hidden" name="id" value={provider.id} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="space-y-1 block">
          <span className="text-sm font-medium">Nama</span>
          <input name="name" required defaultValue={provider?.name} placeholder="OpenRouter" className={inputClass} />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm font-medium">Base URL</span>
          <input name="base_url" required defaultValue={provider?.baseUrl} placeholder="https://openrouter.ai/api/v1" className={inputClass} />
        </label>
      </div>
      <label className="space-y-1 block">
        <span className="text-sm font-medium">API key {provider && "(kosongkan jika tidak diganti)"}</span>
        <input
          name="api_key"
          type="password"
          autoComplete="off"
          placeholder={provider?.envKeyName ? `Kosong = pakai env ${provider.envKeyName}` : "sk-..."}
          className={inputClass}
        />
      </label>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
        <label className="flex items-center gap-2 text-sm min-h-[44px]">
          <input type="checkbox" name="is_active" defaultChecked={provider?.isActive ?? true} className="w-4 h-4 accent-brand" />
          Aktif
        </label>
        <label className="flex items-center gap-2 text-sm min-h-[44px]">
          <input type="checkbox" name="allow_private_network" defaultChecked={provider?.allowPrivateNetwork ?? false} className="w-4 h-4 accent-brand" />
          Izinkan endpoint lokal (Ollama / LM Studio)
        </label>
      </div>
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

function ProviderCard({ provider }: { provider: ProviderView }) {
  const [editing, setEditing] = useState(false);
  const [testing, setTesting] = useState(false);
  const router = useRouter();

  const runTest = async () => {
    setTesting(true);
    const res = await testProvider(provider.id);
    setTesting(false);
    if (!res.ok) {
      Swal.fire("Tes koneksi gagal", res.error, "error");
      return;
    }
    const d = res.data!;
    const esc = (v: string) => v.replace(/[<>&"']/g, "");
    Swal.fire({
      icon: "success",
      title: "Koneksi berhasil",
      html: `${d.modelCount} model tersedia.<br/>Model uji: <b>${esc(d.testedModel ?? "-")}</b><br/>Latensi: ${d.latencyMs} ms<br/>Balasan: <i>${esc(d.reply || "-")}</i>`,
    });
  };

  const remove = async () => {
    const confirm = await Swal.fire({
      title: "Hapus provider?",
      text: `Semua model milik "${provider.name}" juga akan terhapus, dan fitur yang memakainya kembali ke model bawaan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;
    const res = await deleteProvider(provider.id);
    if (!res.ok) Swal.fire("Gagal", res.error, "error");
    else router.refresh();
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-5">
      {editing ? (
        <ProviderForm provider={provider} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-foreground">{provider.name}</h3>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${provider.isActive ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"}`}>
                {provider.isActive ? "Aktif" : "Nonaktif"}
              </span>
              {provider.envKeyName && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-brand-ink">Bawaan</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 break-all">
              <Globe className="w-3.5 h-3.5 shrink-0" /> {provider.baseUrl}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              {provider.keyHint ?? (provider.envKeyName ? `env ${provider.envKeyName}` : "Tanpa API key")}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={runTest} disabled={testing} className={`${buttonClass} bg-muted hover:bg-muted/80 text-foreground`}>
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />} Tes koneksi
            </button>
            <button onClick={() => setEditing(true)} className={`${buttonClass} bg-muted hover:bg-muted/80 text-foreground`} aria-label="Edit">
              <Pencil className="w-4 h-4" />
            </button>
            {!provider.envKeyName && (
              <button onClick={remove} className={`${buttonClass} bg-danger-tint text-danger hover:bg-danger-tint`} aria-label="Hapus">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProviderManager({ providers }: { providers: ProviderView[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      {providers.map((p) => (
        <ProviderCard key={p.id} provider={p} />
      ))}
      {providers.length === 0 && <p className="text-muted-foreground text-sm">Belum ada provider.</p>}

      {adding ? (
        <div className="bg-card border border-brand/30 rounded-2xl p-4 md:p-5">
          <h3 className="font-bold mb-3">Provider baru</h3>
          <ProviderForm onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className={`${buttonClass} w-full sm:w-auto bg-brand text-background`}>
          <Plus className="w-4 h-4" /> Tambah provider
        </button>
      )}
    </div>
  );
}
