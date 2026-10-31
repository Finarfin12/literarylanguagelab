import { Server } from "lucide-react";
import { requireAdminPage } from "../_lib/guard";
import { AdminPageHeader, MissingMigrationNotice, Notice } from "../_lib/ui";
import { isSecretsKeyConfigured } from "@/lib/ai/crypto";
import ProviderManager, { type ProviderView } from "./ProviderManager";

export const dynamic = "force-dynamic";

export default async function AdminProvidersPage() {
  const { supabase } = await requireAdminPage();

  // api_key_encrypted tidak pernah di-select di sini; UI cukup memakai api_key_hint.
  const { data, error } = await supabase
    .from("ai_providers")
    .select("id, name, type, base_url, api_key_hint, env_key_name, allow_private_network, is_active, created_at")
    .order("created_at", { ascending: true });

  const providers: ProviderView[] = (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    baseUrl: p.base_url,
    keyHint: p.api_key_hint,
    envKeyName: p.env_key_name,
    allowPrivateNetwork: p.allow_private_network,
    isActive: p.is_active,
  }));

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
      <AdminPageHeader
        icon={<Server className="w-7 h-7" />}
        title="Provider AI"
        description="Tambahkan endpoint OpenAI-compatible (Groq, OpenRouter, Together, DeepSeek, Mistral, OpenAI, Ollama) lewat base URL + API key."
      />

      {error && <MissingMigrationNotice message={error.message} />}
      {!isSecretsKeyConfigured() && (
        <Notice>
          <p className="font-bold">AI_SECRETS_KEY belum diisi.</p>
          <p>
            API key provider baru tidak bisa disimpan sampai env <code>AI_SECRETS_KEY</code> (32 byte, base64) diisi di server.
            Provider bawaan Groq tetap jalan memakai <code>GROQ_API_KEY</code>.
          </p>
        </Notice>
      )}

      {!error && <ProviderManager providers={providers} />}
    </div>
  );
}
