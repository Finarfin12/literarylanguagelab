import { createClient } from "@/utils/supabase/server";
import { createClub, joinClub } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";
import { Users, BookOpen, PlusCircle } from "lucide-react";
import Link from "next/link";

export default async function ClubsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: clubs } = await supabase
    .from("clubs")
    .select(`
      *,
      owner:owner_id ( full_name, username ),
      members:club_members ( user_id )
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
         <div>
            <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-full mb-6 md:hidden">
              <BookOpen className="w-12 h-12 text-emerald-500" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-foreground flex items-center justify-center md:justify-start gap-3">
              <BookOpen className="w-8 h-8 text-emerald-500 hidden md:block" />
              Reading Clubs
            </h1>
            <p className="text-muted-foreground mt-2 text-lg max-w-2xl">Bentuk grup baca bersama teman atau kelas Anda, tetapkan tenggat waktu, dan diskusikan terjemahan bab demi bab.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Club Form */}
        <div className="lg:col-span-1">
          <div className="bg-card shadow-sm border border-border p-6 rounded-3xl sticky top-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><PlusCircle className="w-5 h-5 text-emerald-500" /> Buat Klub Baru</h2>
            <form action={createClub} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Klub</label>
                <input type="text" name="name" required placeholder="Contoh: English Lit 101" className="w-full mt-1 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deskripsi</label>
                <textarea name="description" required placeholder="Tujuan membaca..." className="w-full mt-1 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 min-h-[100px] resize-none"></textarea>
              </div>
              <SubmitButton className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">
                Dirikan Klub
              </SubmitButton>
            </form>
          </div>
        </div>

        {/* List of Clubs */}
        <div className="lg:col-span-2 space-y-6">
          {clubs?.length === 0 ? (
            <div className="bg-card shadow-sm border border-dashed border-border rounded-3xl p-12 text-center text-muted-foreground">
              <p>Belum ada klub membaca yang didirikan.</p>
            </div>
          ) : (
            clubs?.map((club: any) => {
              const isMember = club.members.some((m: any) => m.user_id === user?.id);
              
              return (
                <div key={club.id} className="bg-card shadow-sm border border-border rounded-3xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <h3 className="font-serif font-bold text-2xl text-foreground mb-2">{club.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{club.description}</p>
                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {club.members.length} Members</span>
                      <span className="text-emerald-500">Owner: @{club.owner.username}</span>
                    </div>
                  </div>
                  
                  <div className="shrink-0 w-full md:w-auto mt-4 md:mt-0">
                    {isMember ? (
                      <Link href={`/clubs/${club.id}`} className="block w-full text-center px-6 py-3 bg-muted text-foreground border border-border font-bold rounded-xl hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors">
                        Masuk Ruangan
                      </Link>
                    ) : (
                      <form action={async () => { "use server"; await joinClub(club.id); }}>
                        <SubmitButton className="w-full md:w-auto px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">
                          Gabung Klub
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
