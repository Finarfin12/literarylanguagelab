import { Library } from "lucide-react";
import { requireAdminPage } from "../../_lib/guard";
import { AdminPageHeader, MigrationNotice } from "../../_lib/ui";
import { MISSING_SCHEMA_CODES } from "../../_lib/content-types";
import type { DailyPhrase } from "@/lib/phrases";
import ContentSubnav from "../ContentSubnav";
import PhraseManager from "./PhraseManager";

export const dynamic = "force-dynamic";

export default async function AdminPhrasesPage() {
  const { supabase } = await requireAdminPage();

  const res = await supabase
    .from("daily_phrases")
    .select("slug, situation, text_en, text_id, literal_id, sort_order, status")
    .order("sort_order");

  const missing = !!res.error && !!res.error.code && MISSING_SCHEMA_CODES.includes(res.error.code);

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
      <AdminPageHeader
        icon={<Library className="w-7 h-7" />}
        title="Konten: Frasa"
        description="Tinjau, ubah, dan terbitkan frasa harian. Hanya frasa yang diterbitkan terlihat oleh pengguna di halaman Frasa harian."
      />
      <ContentSubnav />
      {missing && <MigrationNotice file="0021_daily_phrases.sql" message={res.error?.message} />}
      {res.error && !missing && <p className="text-danger mb-4">Gagal memuat frasa: {res.error.message}</p>}
      <PhraseManager phrases={(res.error ? [] : res.data || []) as DailyPhrase[]} schemaReady={!missing} />
    </div>
  );
}
