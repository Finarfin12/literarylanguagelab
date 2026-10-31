import { GraduationCap } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import AnimatedPage from "@/components/AnimatedPage";
import { EmptyState } from "@/components/ui/primitives";
import TopicList, { type TopicSummary } from "./TopicList";

export const dynamic = "force-dynamic";

export default async function GrammarTopicsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grammar_topics")
    .select("slug, title, cefr_level, sort_order, summary_id")
    .order("sort_order", { ascending: true });

  const topics = (data || []) as TopicSummary[];
  const notReady = error && (error.code === "42P01" || error.code === "PGRST205");

  return (
    <AnimatedPage className="p-4 lg:p-8 max-w-3xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <GraduationCap className="w-7 h-7 text-brand" /> Grammar Dasar
        </h1>
        <p className="text-muted-foreground mt-2">
          Topik grammar A1 sampai B1 yang disusun berurutan. Mulai dari atas, centang yang sudah kamu kuasai.
        </p>
      </div>

      {notReady || topics.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-8 h-8" />}
          title="Topik grammar belum tersedia"
          description={notReady ? "Migrasi 0007 belum dijalankan." : "Admin dapat menambah topik di Admin → Konten."}
        />
      ) : (
        <TopicList topics={topics} />
      )}
    </AnimatedPage>
  );
}
