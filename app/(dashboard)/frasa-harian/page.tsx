import { MessageSquareQuote } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { Card, EmptyState, Eyebrow } from "@/components/ui/primitives";
import { getRequestUser } from "@/utils/supabase/get-user";
import { groupPhrases, type DailyPhrase } from "@/lib/phrases";
import PhraseList, { type PhraseGroupView } from "./PhraseList";

export const dynamic = "force-dynamic";

const MISSING_CODES = ["42P01", "PGRST205"];

/** Frasa harian (Fase 22.4): frasa siap pakai per situasi dengan audio, arti natural, dan arti kata per kata. */
export default async function DailyPhrasesPage() {
  const { supabase } = await getRequestUser();

  // Pengguna biasa hanya melihat frasa terbit (RLS); admin juga melihat draf untuk pratinjau
  const { data, error } = await supabase
    .from("daily_phrases")
    .select("slug, situation, text_en, text_id, literal_id, sort_order, status")
    .order("sort_order");

  const missing = !!error && !!error.code && MISSING_CODES.includes(error.code);
  const rows = (error ? [] : data || []) as DailyPhrase[];
  const groups: PhraseGroupView[] = groupPhrases(rows).map((g) => ({
    id: g.id,
    label: g.label,
    phrases: g.phrases.map((p) => ({ slug: p.slug, text_en: p.text_en, text_id: p.text_id, literal_id: p.literal_id, status: p.status })),
  }));

  return (
    <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24 lg:pb-12">
      <header className="mb-8">
        <Eyebrow>Ruang I · Belajar Bahasa Inggris</Eyebrow>
        <h1 className="font-serif text-[28px] md:text-4xl font-medium leading-[1.15] text-foreground mt-1 flex items-center gap-3">
          <MessageSquareQuote className="w-7 h-7 text-brand-ink" aria-hidden="true" /> Frasa harian
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Kalimat siap pakai untuk situasi sehari-hari. Dengarkan, pahami artinya, lalu simpan ke Review agar tidak lupa.
        </p>
      </header>

      {missing ? (
        <Card><EmptyState title="Frasa harian belum tersedia" description="Migrasi 0021_daily_phrases.sql belum dijalankan." /></Card>
      ) : error ? (
        <Card><EmptyState title="Gagal memuat frasa" description="Coba muat ulang halaman ini sebentar lagi." /></Card>
      ) : groups.length === 0 ? (
        <Card><EmptyState title="Belum ada frasa" description="Frasa sedang disiapkan dan belum diterbitkan." /></Card>
      ) : (
        <PhraseList groups={groups} />
      )}
    </AnimatedPage>
  );
}
