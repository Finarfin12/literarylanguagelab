import Link from "next/link";
import { ChevronRight, Columns3 } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import AnimatedPage from "@/components/AnimatedPage";
import { Card, CardTitle, EmptyState } from "@/components/ui/primitives";
import { MISSING_SCHEMA_CODES } from "./_lib/types";
import NewProjectForm from "./NewProjectForm";
import DeleteProjectButton from "./DeleteProjectButton";

export const dynamic = "force-dynamic";

export default async function TranslationWorkspacePage() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("translation_projects")
    .select("id, title, brief, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  const notReady = !!error && !!error.code && MISSING_SCHEMA_CODES.includes(error.code);

  return (
    <AnimatedPage className="p-4 lg:p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <Columns3 className="w-7 h-7 text-brand" /> Ruang Kerja Segmen
        </h1>
        <p className="text-muted-foreground mt-2">
          Terjemahkan teks panjang kalimat demi kalimat dengan bantuan Translation Memory, glosarium, pemeriksaan otomatis, anotasi teknik, dan penilaian rubrik.
        </p>
      </div>

      {notReady ? (
        <EmptyState
          icon={<Columns3 className="w-8 h-8" />}
          title="Ruang Kerja belum aktif"
          description="Migrasi 0010_translation_academic.sql belum dijalankan di database."
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardTitle>Proyek baru</CardTitle>
            <NewProjectForm />
          </Card>

          <section aria-labelledby="proyek-saya">
            <h2 id="proyek-saya" className="text-lg font-bold font-serif mb-3">Proyek saya</h2>
            {error ? (
              <p className="text-sm text-danger">Gagal memuat proyek.</p>
            ) : !projects || projects.length === 0 ? (
              <p className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-6 text-center">Belum ada proyek. Buat yang pertama di atas.</p>
            ) : (
              <ul className="divide-y divide-border bg-card border border-border rounded-2xl overflow-hidden">
                {projects.map((p) => (
                  <li key={p.id} className="flex items-center">
                    <Link href={`/translation-workspace/${p.id}`} className="flex-1 min-w-0 flex items-center gap-3 px-4 min-h-[64px] py-2 hover:bg-muted transition-colors">
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-foreground truncate">{p.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          Diubah {new Date(p.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </Link>
                    <DeleteProjectButton projectId={p.id} title={p.title} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AnimatedPage>
  );
}
