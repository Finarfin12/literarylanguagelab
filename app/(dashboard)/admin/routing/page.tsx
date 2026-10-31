import { Route } from "lucide-react";
import { requireAdminPage } from "../_lib/guard";
import { AdminPageHeader, MissingMigrationNotice } from "../_lib/ui";
import { AI_FEATURES } from "@/lib/ai/features";
import RoutingTable, { type ModelOption, type RouteView } from "./RoutingTable";

export const dynamic = "force-dynamic";

export default async function AdminRoutingPage() {
  const { supabase } = await requireAdminPage();

  const [modelsRes, routesRes] = await Promise.all([
    supabase
      .from("ai_models")
      .select("id, model_id, label, capabilities, is_active, provider:ai_providers(name, is_active)")
      .order("model_id", { ascending: true }),
    supabase.from("ai_feature_routes").select("feature_key, model_id, fallback_model_id, temperature, max_tokens"),
  ]);
  const error = modelsRes.error || routesRes.error;

  const models: ModelOption[] = (modelsRes.data || []).map((m) => {
    const provider = (Array.isArray(m.provider) ? m.provider[0] : m.provider) as { name: string; is_active: boolean } | null;
    return {
      id: m.id,
      name: m.label || m.model_id,
      providerName: provider?.name ?? "?",
      capabilities: m.capabilities || [],
      available: m.is_active && (provider?.is_active ?? false),
    };
  });

  const routes: Record<string, RouteView> = {};
  for (const r of routesRes.data || []) {
    routes[r.feature_key] = {
      modelId: r.model_id,
      fallbackModelId: r.fallback_model_id,
      temperature: r.temperature,
      maxTokens: r.max_tokens,
    };
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
      <AdminPageHeader
        icon={<Route className="w-7 h-7" />}
        title="Routing Fitur"
        description="Pilih model utama dan cadangan untuk setiap fitur. Perubahan berlaku tanpa deploy ulang (paling lambat 1 menit di semua server)."
      />
      {error ? <MissingMigrationNotice message={error.message} /> : <RoutingTable features={AI_FEATURES} models={models} routes={routes} />}
    </div>
  );
}
