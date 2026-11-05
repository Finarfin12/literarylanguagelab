import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { BookOpen, Plus, Sparkles, Search, Library as LibraryIcon } from "lucide-react";
import TopActions from "@/components/TopActions";
import DeleteTextButton from "@/components/library/DeleteTextButton";
import { CEFR_LEVELS, isCefrLevel, neighborLevels } from "@/lib/cefr";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ q?: string; level?: string }> }) {
  const supabase = await createClient();
  const query = await searchParams;
  const searchTerm = query?.q || "";

  const { data: { user } } = await supabase.auth.getUser();
  let userLevel: string | null = null;
  if (user) {
    const { data: lvl } = await supabase.from("profiles").select("cefr_level").eq("id", user.id).maybeSingle();
    userLevel = (lvl?.cefr_level as string | null) ?? null;
  }

  // Filter level: ?level=all (semua) | ?level=B1 (satu level) | default = level pengguna dan satu di bawahnya.
  // Default juga menyertakan teks yang belum diberi level, supaya teks lama tidak hilang.
  const levelParam = query?.level;
  const explicitLevel = isCefrLevel(levelParam) ? levelParam : null;
  const showAll = levelParam === "all";
  const defaultLevels = neighborLevels(userLevel, 1, 0);
  const useDefault = !explicitLevel && !showAll && defaultLevels.length > 0;
  const activeChip = explicitLevel ?? (showAll || !useDefault ? "all" : "default");

  // Teks pribadi milik pengguna (kolom owner_id dari migrasi 0018) ikut tampil bagi pemiliknya
  const buildQuery = (withLevel: boolean, withOwner: boolean) => {
    let qb = supabase.from("texts").select("*", { count: "exact" });
    qb = withOwner && user ? qb.or(`is_public.eq.true,owner_id.eq.${user.id}`) : qb.eq("is_public", true);
    qb = qb.order("created_at", { ascending: false });
    if (searchTerm) qb = qb.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`);
    if (withLevel) {
      if (explicitLevel) qb = qb.eq("cefr_level", explicitLevel);
      else if (useDefault) qb = qb.or(`cefr_level.in.(${defaultLevels.join(",")}),cefr_level.is.null`);
    }
    return qb;
  };

  let { data: texts, error, count } = await buildQuery(true, true);
  // Kolom owner_id belum ada (migrasi 0018 belum dijalankan): hanya teks publik
  if (error) ({ data: texts, error, count } = await buildQuery(true, false));
  // Kolom cefr_level belum ada (migrasi 0007 belum dijalankan): tampilkan tanpa filter level
  const levelsReady = !error;
  if (error) ({ data: texts, error, count } = await buildQuery(false, false));

  const chipHref = (level: string) => {
    const p = new URLSearchParams();
    if (searchTerm) p.set("q", searchTerm);
    p.set("level", level);
    return `/library?${p.toString()}`;
  };

  let isAdmin = false;
  let enablePreview = true; // default to true
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role, preferences').eq('id', user.id).single();
    if (profile) {
      if (profile.role === 'admin') isAdmin = true;
      if (profile.preferences?.reading?.enable_vocab_preview === false) enablePreview = false;
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground">Library Teks</h1>
          <p className="text-muted-foreground mt-2">Pilih teks sastra untuk mulai membaca dan belajar. ({count ?? "?"} teks)</p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <TopActions className="flex items-center gap-3 shrink-0 self-end sm:self-auto" />
            <form className="relative flex-1 w-full sm:min-w-[250px]">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            {explicitLevel && <input type="hidden" name="level" value={explicitLevel} />}
            {showAll && <input type="hidden" name="level" value="all" />}
            <input 
              name="q"
              defaultValue={searchTerm}
              placeholder="Cari judul atau penulis..." 
              className="w-full bg-card border border-foreground/20 rounded-control pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-foreground "
            />
            </form>
          </div>
          <Link
            href="/library/add"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-solid text-on-brand font-bold rounded-control hover:bg-brand-hover active:scale-95 transition-all shadow-brand/20 whitespace-nowrap"
          >
            <Sparkles className="w-5 h-5" />
            <span>Buat &amp; Tambah Teks</span>
          </Link>
        </div>
      </div>

      {levelsReady && (
        <nav aria-label="Filter level" className="flex flex-wrap items-center gap-2 mb-8">
          {useDefault || activeChip === "default" ? (
            <span className="min-h-[44px] inline-flex items-center px-4 rounded-full text-sm font-bold bg-brand-solid text-on-brand">
              Level kamu ({defaultLevels.join(", ")})
            </span>
          ) : null}
          <Link href={chipHref("all")} className={`min-h-[44px] inline-flex items-center px-4 rounded-full text-sm font-bold border ${activeChip === "all" ? "bg-brand-solid text-on-brand border-brand" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>
            Semua
          </Link>
          {CEFR_LEVELS.map((l) => (
            <Link key={l} href={chipHref(l)} className={`min-h-[44px] inline-flex items-center px-4 rounded-full text-sm font-bold border ${activeChip === l ? "bg-brand-solid text-on-brand border-brand" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>
              {l}
            </Link>
          ))}
        </nav>
      )}

      {error && (
        <div className="p-4 bg-danger-tint border border-danger/30 rounded-lg text-danger mb-8">
          <p className="font-bold">Gagal memuat data:</p>
          <pre className="text-xs mt-2 whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {texts?.length === 0 ? (
        <div className="text-center p-6 md:p-12 border border-dashed border-border rounded-control">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-serif font-medium text-foreground mb-2">Belum ada teks tersedia</h3>
          <p className="text-muted-foreground">Coba pilih &quot;Semua&quot; pada filter level, atau klik &quot;Buat &amp; Tambah Teks&quot; di atas untuk membuat teks dengan AI.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {texts?.map((text) => (
            <div key={text.id} className="relative group">
              {isAdmin && <DeleteTextButton textId={text.id} title={text.title} />}
              <Link href={enablePreview ? `/preview/${text.id}` : `/read/${text.id}`} className="block h-full">
                <div className="bg-card border border-border rounded-card p-6 hover:bg-card hover:shadow-brand/10 transition-all duration-500 relative overflow-hidden flex flex-col h-full">
                  <div className="relative z-10 flex-1 flex flex-col">
                    <h2 className="text-2xl font-serif font-medium text-foreground group-hover:text-brand-ink transition-colors line-clamp-2 pr-10">{text.title}</h2>
                  <p className="text-muted-foreground mt-2 italic flex-1">{text.author}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {text.era && <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-muted border border-border rounded-md text-muted-foreground">{text.era}</span>}
                    {text.genre && <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-muted border border-border rounded-md text-muted-foreground">{text.genre}</span>}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-medium px-3 py-1 bg-brand-tint text-brand-ink rounded-full border border-brand/20">
                      {text.cefr_level ? `Level ${text.cefr_level}` : `Level ${text.difficulty}`}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors">
                      <BookOpen className="w-3 h-3" /> {enablePreview ? "Pratinjau" : "Baca"}
                    </span>
                  </div>
                </div>
              </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
