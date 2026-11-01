"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Loader2, Save, Search } from "lucide-react";
import type { AIFeature } from "@/lib/ai/features";
import { saveRoute } from "../ai-actions";
import { buttonClass, inputClass } from "../_lib/ui";

export interface ModelOption {
  id: string;
  name: string;
  providerName: string;
  capabilities: string[];
  available: boolean;
}

export interface RouteView {
  modelId: string | null;
  fallbackModelId: string | null;
  temperature: number | null;
  maxTokens: number | null;
}

function FeatureRow({ feature, models, route }: { feature: AIFeature; models: ModelOption[]; route?: RouteView }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const eligible = models.filter((m) => m.capabilities.includes(feature.requires));

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const res = await saveRoute(formData);
      if (!res.ok) {
        Swal.fire("Gagal", res.error, "error");
        return;
      }
      Swal.fire({ icon: "success", title: "Tersimpan", text: feature.label, timer: 1200, showConfirmButton: false });
      router.refresh();
    });
  };

  const options = (
    <>
      {eligible.map((m) => (
        <option key={m.id} value={m.id} disabled={!m.available}>
          {m.name} · {m.providerName}
          {!m.available ? " (nonaktif)" : ""}
        </option>
      ))}
    </>
  );

  return (
    <form action={submit} className="p-4 border-t border-border grid grid-cols-1 lg:grid-cols-[1.2fr_1.5fr_1.5fr_0.6fr_0.7fr_auto] gap-3 lg:items-end">
      <input type="hidden" name="feature_key" value={feature.key} />
      <div>
        <p className="font-bold text-foreground text-sm">{feature.label}</p>
        <p className="text-xs text-muted-foreground">
          {feature.key}
          {feature.requires !== "text" && <span className="ml-1 text-brand-ink font-bold uppercase">· butuh {feature.requires}</span>}
        </p>
      </div>
      <label className="space-y-1 block">
        <span className="text-xs text-muted-foreground lg:sr-only">Model utama</span>
        <select name="model_id" defaultValue={route?.modelId ?? ""} className={inputClass} aria-label="Model utama">
          <option value="">Default (GROQ_API_KEY)</option>
          {options}
        </select>
      </label>
      <label className="space-y-1 block">
        <span className="text-xs text-muted-foreground lg:sr-only">Model cadangan</span>
        <select name="fallback_model_id" defaultValue={route?.fallbackModelId ?? ""} className={inputClass} aria-label="Model cadangan">
          <option value="">Tanpa cadangan</option>
          {options}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3 lg:contents">
        <label className="space-y-1 block">
          <span className="text-xs text-muted-foreground lg:sr-only">Temperature</span>
          <input name="temperature" type="number" step="0.1" min="0" max="2" defaultValue={route?.temperature ?? ""} placeholder="auto" className={inputClass} aria-label="Temperature" />
        </label>
        <label className="space-y-1 block">
          <span className="text-xs text-muted-foreground lg:sr-only">Max tokens</span>
          <input name="max_tokens" type="number" min="1" defaultValue={route?.maxTokens ?? ""} placeholder="auto" className={inputClass} aria-label="Max tokens" />
        </label>
      </div>
      <button type="submit" disabled={pending} className={`${buttonClass} bg-brand-solid text-on-brand`}>
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span className="lg:sr-only">Simpan</span>
      </button>
    </form>
  );
}

export default function RoutingTable({
  features,
  models,
  routes,
}: {
  features: AIFeature[];
  models: ModelOption[];
  routes: Record<string, RouteView>;
}) {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase();
  const shown = features.filter((f) => f.label.toLowerCase().includes(q) || f.key.includes(q));
  const groups = [...new Set(shown.map((f) => f.group))];

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari fitur..." className={`${inputClass} pl-9`} />
      </div>
      <p className="text-xs text-muted-foreground">
        Temperature / max tokens kosong (&quot;auto&quot;) berarti memakai nilai bawaan route, lalu nilai default model.
      </p>

      {groups.map((group) => (
        <section key={group} className="bg-card border border-border rounded-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/30">
            <h2 className="font-bold text-foreground">{group}</h2>
            <div className="hidden lg:grid grid-cols-[1.2fr_1.5fr_1.5fr_0.6fr_0.7fr_auto] gap-3 mt-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              <span>Fitur</span>
              <span>Model utama</span>
              <span>Model cadangan</span>
              <span>Temp</span>
              <span>Max tokens</span>
              <span className="w-11" />
            </div>
          </div>
          {shown
            .filter((f) => f.group === group)
            .map((f) => (
              <FeatureRow key={f.key} feature={f} models={models} route={routes[f.key]} />
            ))}
        </section>
      ))}
    </div>
  );
}
