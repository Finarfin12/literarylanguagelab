import { AudioLines } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { Card, EmptyState, Eyebrow } from "@/components/ui/primitives";
import { createClient } from "@/utils/supabase/server";
import PairsDrill from "@/components/l1/PairsDrill";
import { parseMinimalPair, type MinimalPair } from "@/lib/l1";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pasangan Bunyi · Literary Language Lab" };

export default async function PasanganBunyiPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("minimal_pairs")
    .select("slug, word_a, word_b, ipa_a, ipa_b, note_id, sort_order")
    .order("sort_order", { ascending: true });
  const pairs = (error ? [] : data || []).map(parseMinimalPair).filter((p): p is MinimalPair => p !== null);

  return (
    <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24 lg:pb-12">
      <header className="mb-8">
        <Eyebrow>Ruang I</Eyebrow>
        <h1 className="font-serif text-[28px] md:text-4xl font-medium leading-[1.15] text-foreground mt-1">Pasangan Bunyi</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Kata yang bunyinya mirip bagi telinga kita, seperti ship dan sheep. Dengarkan, pilih yang kamu dengar, lalu ucapkan sendiri.
        </p>
      </header>
      {pairs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<AudioLines className="w-8 h-8" aria-hidden="true" />}
            title="Belum tersedia"
            description={error ? "Migrasi 0014_l1_modules.sql belum dijalankan di Supabase." : "Admin belum menambahkan pasangan bunyi."}
          />
        </Card>
      ) : (
        <PairsDrill pairs={pairs} />
      )}
    </AnimatedPage>
  );
}
