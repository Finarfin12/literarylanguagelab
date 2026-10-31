import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { User, GraduationCap, Library, Quote, Users } from "lucide-react";
import ProfileActions from "@/components/community/ProfileActions";

export default async function PublicPortfolioPage({ params }: { params: { username: string } }) {
  const supabase = await createClient();
  const { username } = await params;
  
  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) return notFound();

  // Get user's translation memories
  const { data: memories } = await supabase
    .from("translation_memory")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get social stats
  const { count: followersCount } = await supabase
    .from("user_follows")
    .select("*", { count: 'exact', head: true })
    .eq("following_id", profile.id);

  const { count: followingCount } = await supabase
    .from("user_follows")
    .select("*", { count: 'exact', head: true })
    .eq("follower_id", profile.id);

  // Check current user status
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  const isOwnProfile = user?.id === profile.id;
  let isFollowing = false;

  if (user && !isOwnProfile) {
    const { data: followData } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .single();
    if (followData) isFollowing = true;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* We need the sidebar structure for the public layout too, or just a standalone view */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Profile Header */}
          <div className="bg-card shadow-sm border border-border rounded-3xl p-4 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-8 text-center md:text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5">
              <User className="w-64 h-64 text-brand" />
            </div>
            
            <div className="relative z-10 shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-32 h-32 rounded-full object-cover border-4 border-brand/20 shadow-xl" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-brand/10 flex items-center justify-center border-4 border-brand/20 shadow-xl">
                  <User className="w-16 h-16 text-brand" />
                </div>
              )}
            </div>
            
            <div className="relative z-10 flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-1">{profile.full_name || "Anon Translator"}</h1>
                  <p className="text-xl text-muted-foreground">@{profile.username}</p>
                </div>
                
                <ProfileActions 
                  targetUserId={profile.id} 
                  initialIsFollowing={isFollowing} 
                  isOwnProfile={isOwnProfile}
                  isLoggedIn={isLoggedIn}
                />
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="bg-muted px-4 py-2 rounded-xl flex items-center gap-3">
                  <Users className="w-5 h-5 text-brand" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Followers</p>
                    <p className="font-bold text-lg">{followersCount || 0}</p>
                  </div>
                </div>
                <div className="bg-muted px-4 py-2 rounded-xl flex items-center gap-3">
                  <Users className="w-5 h-5 text-brand" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Following</p>
                    <p className="font-bold text-lg">{followingCount || 0}</p>
                  </div>
                </div>
                {profile.cefr_level && (
                  <div className="bg-muted px-4 py-2 rounded-xl flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Level CEFR</p>
                      <p className="font-bold text-lg">{profile.cefr_level}</p>
                    </div>
                  </div>
                )}
                <div className="bg-muted px-4 py-2 rounded-xl flex items-center gap-3">
                  <Library className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Vocab Bank</p>
                    <p className="font-bold text-lg">{profile.vocab_count}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Showcase */}
          <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
            <Quote className="w-6 h-6 text-brand" /> Translation Showcase
          </h2>
          
          {memories?.length === 0 ? (
            <div className="bg-muted/50 border border-dashed border-border rounded-3xl p-6 md:p-12 text-center text-muted-foreground">
              <p>Belum ada memori terjemahan yang dibagikan secara publik.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {memories?.map(mem => (
                <div key={mem.id} className="bg-card shadow-sm border border-border rounded-3xl p-6 hover:shadow-lg transition-shadow">
                  <p className="font-serif text-lg font-bold text-blue-400 mb-2">{mem.source_phrase}</p>
                  <p className="font-serif text-lg text-foreground mb-4">{mem.translated_phrase}</p>
                  {mem.context && <p className="text-sm text-muted-foreground italic pl-4 border-l-2 border-brand/50">" {mem.context} "</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
