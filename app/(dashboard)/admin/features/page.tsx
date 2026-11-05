import { ToggleRight } from "lucide-react";
import { requireAdminPage } from "../_lib/guard";
import { AdminPageHeader, Notice } from "../_lib/ui";
import { AI_FEATURES } from "@/lib/ai/features";
import { getServiceClient } from "@/lib/ai/admin-client";
import { getFeatureFlagStatus, FEATURE_DEFAULTS } from "@/lib/ai/flags";
import FeatureToggles, { type FlagView } from "./FeatureToggles";

export const dynamic = "force-dynamic";

export default async function AdminFeaturesPage() {
  await requireAdminPage();

  const service = getServiceClient();
  const { data, error } = service
    ? await service.from("system_config").select("value").eq("key", "features").maybeSingle()
    : { data: null, error: null };
  const stored = (data?.value || {}) as Record<string, unknown>;
  const status = await getFeatureFlagStatus({ fresh: true });

  const known = new Set(AI_FEATURES.map((f) => f.key));
  const flags: FlagView[] = [
    ...AI_FEATURES.map((f) => ({ key: f.key, label: f.label, group: f.group as string, enabled: stored[f.key] !== false })),
    // Fitur eksperimen yang bawaannya mati (Fase 19.4) selalu tampil agar bisa dinyalakan
    ...Object.keys(FEATURE_DEFAULTS)
      .filter((k) => !known.has(k))
      .map((k) => ({ key: k, label: k.replace(/[_-]/g, " "), group: "Lainnya (non-AI)", enabled: typeof stored[k] === "boolean" ? stored[k] === true : FEATURE_DEFAULTS[k] })),
    // Flag lama di system_config.features yang bukan fitur AI (mis. dari v1)
    ...Object.keys(stored)
      .filter((k) => !known.has(k) && !(k in FEATURE_DEFAULTS))
      .map((k) => ({ key: k, label: k.replace(/[_-]/g, " "), group: "Lainnya (non-AI)", enabled: stored[k] !== false })),
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
      <AdminPageHeader
        icon={<ToggleRight className="w-7 h-7" />}
        title="Fitur"
        description="Nyalakan atau matikan fitur AI. Fitur yang dimatikan membalas pesan 'sedang dinonaktifkan' tanpa memanggil AI."
      />
      {!status.readable && (
        <Notice tone="error">
          Konfigurasi fitur tidak terbaca{status.reason ? ` (${status.reason})` : ""}. Sementara, fitur eksperimen ({Object.keys(FEATURE_DEFAULTS).join(", ")}) tetap <strong>mati</strong> dan fitur lain memakai nilai terakhir yang berhasil dibaca atau tetap aktif.
        </Notice>
      )}
      {!service && (
        <Notice>
          <code>SUPABASE_SERVICE_ROLE_KEY</code> belum diisi, jadi flag tidak bisa dibaca atau diubah. Semua fitur dianggap aktif.
        </Notice>
      )}
      {error && <Notice tone="error">Gagal membaca system_config: {error.message}</Notice>}
      <FeatureToggles flags={flags} disabled={!service} />
    </div>
  );
}
