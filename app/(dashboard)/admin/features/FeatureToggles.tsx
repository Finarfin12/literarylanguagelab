"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { Loader2 } from "lucide-react";
import { setFeatureFlag } from "../ops-actions";

export interface FlagView {
  key: string;
  label: string;
  group: string;
  enabled: boolean;
}

function Toggle({ flag, disabled }: { flag: FlagView; disabled: boolean }) {
  const [enabled, setEnabled] = useState(flag.enabled);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    const next = !enabled;
    setPending(true);
    setEnabled(next); // optimistis
    const res = await setFeatureFlag(flag.key, next);
    setPending(false);
    if (!res.ok) {
      setEnabled(!next);
      Swal.fire("Gagal", res.error, "error");
    }
  };

  return (
    <label className="flex items-center justify-between gap-3 px-4 min-h-[56px] cursor-pointer hover:bg-muted/40">
      <span className="min-w-0">
        <span className="block text-sm font-bold text-foreground truncate">{flag.label}</span>
        <span className="block text-xs text-muted-foreground">{flag.key}</span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        {pending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${flag.label} ${enabled ? "aktif" : "nonaktif"}`}
          disabled={disabled || pending}
          onClick={toggle}
          className={`relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${enabled ? "bg-brand" : "bg-muted-foreground/30"}`}
        >
          <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
        </button>
      </span>
    </label>
  );
}

export default function FeatureToggles({ flags, disabled }: { flags: FlagView[]; disabled: boolean }) {
  const groups = [...new Set(flags.map((f) => f.group))];
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group} className="bg-card border border-border rounded-card overflow-hidden">
          <h2 className="px-4 py-3 bg-muted/30 font-bold text-foreground">{group}</h2>
          <div className="divide-y divide-border">
            {flags
              .filter((f) => f.group === group)
              .map((f) => (
                <Toggle key={f.key} flag={f} disabled={disabled} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
