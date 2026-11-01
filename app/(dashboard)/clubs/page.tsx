import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Users, BookOpen, Shield, Globe, Lock, Search } from "lucide-react";
import CreateClubModal from "@/components/clubs/CreateClubModal";
import { joinClub } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

export const metadata = {
  title: "Reading Clubs - Literary Language Lab",
};

export default async function ClubsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all public clubs and clubs where user is a member
  // First, get the IDs of clubs the user is a member of
  let joinedGroupIds = new Set<string>();
  if (user) {
    const { data: userMemberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);
    
    joinedGroupIds = new Set(userMemberships?.map(m => m.group_id) || []);
  }

  // Fetch all clubs that are public OR the user is a member of
  let query = supabase
    .from("study_groups")
    .select(`
      *,
      creator:profiles!study_groups_creator_id_fkey(name, avatar_url),
      members:group_members(count)
    `)
    .order('created_at', { ascending: false });

  // If user is logged in, show public OR joined. If not, only public.
  // Note: RLS already restricts this, but we can be explicit if we want.
  
  const { data: allClubs, error } = await query;

  if (error) {
    console.error("Error fetching clubs:", error);
  }

  const clubs = allClubs || [];
  const myClubs = clubs.filter(club => joinedGroupIds.has(club.id));
  const publicClubs = clubs.filter(club => !joinedGroupIds.has(club.id) && club.is_public);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground">Reading Clubs</h1>
            <p className="text-muted-foreground mt-2 text-lg">Bergabunglah dalam grup diskusi dan bedah literatur bersama.</p>
          </div>
        </div>
        
        {user && <CreateClubModal />}
      </div>

      {/* My Clubs Section */}
      {myClubs.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand" /> Klub Saya
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myClubs.map(club => (
              <ClubCard key={club.id} club={club} isMember={true} />
            ))}
          </div>
        </div>
      )}

      {/* Discover Clubs Section */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
          <Globe className="w-6 h-6 text-brand-ink" /> Jelajahi Klub Publik
        </h2>
        
        {publicClubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicClubs.map(club => (
              <ClubCard key={club.id} club={club} isMember={false} />
            ))}
          </div>
        ) : (
          <div className="bg-muted/50 rounded-3xl p-6 md:p-12 border border-border border-dashed text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground font-medium">Belum ada klub publik baru yang tersedia.</p>
            <p className="text-muted-foreground mt-1">Jadilah yang pertama untuk membuat ruang diskusimu sendiri!</p>
          </div>
        )}
      </div>

    </div>
  );
}

function ClubCard({ club, isMember }: { club: any, isMember: boolean }) {
  // @ts-ignore - Supabase count returns array with count object
  const memberCount = club.members?.[0]?.count || 0;
  
  const CardContent = () => (
    <div className="bg-card shadow-sm border border-border rounded-3xl p-6 h-full flex flex-col hover:shadow-xl hover:border-brand/30 transition-all duration-300 relative overflow-hidden group">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <Users className="w-24 h-24 text-brand transform translate-x-4 -translate-y-4" />
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${club.is_public ? 'bg-brand-tint text-brand-ink border border-brand/30' : 'bg-danger-tint text-danger border border-danger/30'}`}>
          {club.is_public ? <><Globe className="w-3 h-3" /> Public</> : <><Lock className="w-3 h-3" /> Private</>}
        </div>
        
        <div className="flex items-center gap-1.5 bg-muted px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground">
          <Users className="w-3 h-3" />
          {memberCount} / {club.max_members}
        </div>
      </div>

      <h3 className="text-xl font-bold font-serif text-foreground mb-2 line-clamp-1 relative z-10 group-hover:text-brand transition-colors">
        {club.name}
      </h3>
      
      <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1 relative z-10">
        {club.description || "Tidak ada deskripsi."}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-border mt-auto relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border border-border shrink-0">
            <img src={club.creator?.avatar_url || "/default-avatar.png"} alt="Creator" className="w-full h-full object-cover" />
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
            {club.creator?.name || "Unknown"}
          </span>
        </div>
        
        {isMember ? (
          <span className="text-sm font-bold flex items-center gap-1 text-brand">
            Masuk Ruangan <Search className="w-4 h-4" />
          </span>
        ) : (
          <form action={async () => { "use server"; await joinClub(club.id); }}>
            <SubmitButton className="px-4 py-2 bg-brand text-brand-foreground rounded-lg text-sm font-bold hover:bg-brand/90 transition-colors">
              Gabung
            </SubmitButton>
          </form>
        )}
      </div>
    </div>
  );

  if (isMember) {
    return (
      <Link href={`/clubs/${club.id}`} className="block h-full">
        <CardContent />
      </Link>
    );
  }

  return (
    <div className="h-full">
      <CardContent />
    </div>
  );
}
