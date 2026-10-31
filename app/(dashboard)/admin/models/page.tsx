import { Cpu } from "lucide-react";
import { requireAdminPage } from "../_lib/guard";
import { AdminPageHeader, MissingMigrationNotice } from "../_lib/ui";
import ModelManager, { type ModelView, type ProviderOption } from "./ModelManager";

export const dynamic = "force-dynamic";

export default async function AdminModelsPage() {
  const { supabase } = await requireAdminPage();

  const [providersRes, modelsRes] = await Promise.all([
    supabase.from("ai_providers").select("id, name").order("created_at", { ascending: true }),
    supabase
      .from("ai_models")
      .select("id, provider_id, model_id, label, capabilities, default_temperature, default_max_tokens, is_active")
      .order("model_id", { ascending: true }),
  ]);
  const error = providersRes.error || modelsRes.error;

  const providers: ProviderOption[] = (providersRes.data || []).map((p) => ({ id: p.id, name: p.name }));
  const models: ModelView[] = (modelsRes.data || []).map((m) => ({
    id: m.id,
    providerId: m.provider_id,
    modelId: m.model_id,
    label: m.label,
    capabilities: m.capabilities || [],
    defaultTemperature: m.default_temperature,
    defaultMaxTokens: m.default_max_tokens,
    isActive: m.is_active,
  }));

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
      <AdminPageHeader
        icon={<Cpu className="w-7 h-7" />}
        title="Model"
        description="Daftar model per provider beserta kemampuannya. Kemampuan dipakai untuk menyaring pilihan di Routing Fitur (mis. OCR hanya model vision)."
      />
      {error ? <MissingMigrationNotice message={error.message} /> : <ModelManager providers={providers} models={models} />}
    </div>
  );
}
