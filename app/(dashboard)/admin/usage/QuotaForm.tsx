"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Loader2, Gauge } from "lucide-react";
import { saveRateLimits } from "../ops-actions";
import { buttonClass, inputClass } from "../_lib/ui";

export default function QuotaForm({
  limits,
  canSave,
}: {
  limits: { key: string; label: string; perMinute: number; perHour: number }[];
  canSave: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const res = await saveRateLimits(formData);
      if (!res.ok) {
        Swal.fire("Gagal", res.error, "error");
        return;
      }
      Swal.fire({ icon: "success", title: "Kuota tersimpan", timer: 1200, showConfirmButton: false });
      router.refresh();
    });
  };

  return (
    <form action={submit} className="bg-card border border-border rounded-card p-4 md:p-6">
      <h2 className="font-bold text-foreground flex items-center gap-2 mb-1">
        <Gauge className="w-5 h-5 text-brand-ink" /> Kuota per pengguna
      </h2>
      <p className="text-xs text-muted-foreground mb-4">Berlaku untuk setiap pengguna. Request di atas batas dibalas 429.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {limits.map((l) => (
          <fieldset key={l.key} className="border border-border rounded-control p-3">
            <legend className="text-sm font-bold px-1">{l.label}</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 block">
                <span className="text-xs text-muted-foreground">Per menit</span>
                <input name={`${l.key}_minute`} type="number" min="1" max="1000" required defaultValue={l.perMinute} className={inputClass} />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs text-muted-foreground">Per jam</span>
                <input name={`${l.key}_hour`} type="number" min="1" max="100000" required defaultValue={l.perHour} className={inputClass} />
              </label>
            </div>
          </fieldset>
        ))}
      </div>
      <div className="flex justify-end mt-4">
        <button type="submit" disabled={pending || !canSave} className={`${buttonClass} bg-brand-solid text-on-brand`}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />} Simpan kuota
        </button>
      </div>
      {!canSave && <p className="text-xs text-warning-ink mt-2">SUPABASE_SERVICE_ROLE_KEY belum diisi, kuota tidak bisa disimpan.</p>}
    </form>
  );
}
