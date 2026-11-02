import { MessageSquareWarning } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { Card, EmptyState, Eyebrow } from "@/components/ui/primitives";
import { createClient } from "@/utils/supabase/server";
import ErrorCards from "@/components/l1/ErrorCards";
import { parseL1Error, type L1Error } from "@/lib/l1";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kesalahan Umum · Literary Language Lab" };

export default async function KesalahanUmumPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("l1_errors")
    .select("slug, title, wrong, right, explanation_id, cefr_level, sort_order")
    .order("sort_order", { ascending: true });
  const errors = (error ? [] : data || []).map(parseL1Error).filter((e): e is L1Error => e !== null);

  return (
    <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24 lg:pb-12">
      <header className="mb-8">
        <Eyebrow>Ruang I</Eyebrow>
        <h1 className="font-serif text-[28px] md:text-4xl font-medium leading-[1.15] text-foreground mt-1">Kesalahan Umum</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Kesalahan yang sering muncul pada penutur bahasa Indonesia, karena pola bahasa kita berbeda. Baca penjelasannya, lalu latih dengan soal yang dinilai otomatis.
        </p>
      </header>
      {errors.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MessageSquareWarning className="w-8 h-8" aria-hidden="true" />}
            title="Belum tersedia"
            description={error ? "Migrasi 0014_l1_modules.sql belum dijalankan di Supabase." : "Admin belum menambahkan kesalahan umum."}
          />
        </Card>
      ) : (
        <ErrorCards errors={errors} />
      )}
    </AnimatedPage>
  );
}
