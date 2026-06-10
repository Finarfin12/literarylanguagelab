"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Users, Search, UserPlus, UserCheck, Loader2, Trophy, MessageSquare } from "lucide-react";
import Link from "next/link";
import Swal from 'sweetalert2';

interface PublicProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  level: string;
  xp: number;
  is_following?: boolean;
}

export default function CommunityPage() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function fetchCommunity() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch public profiles
      const { data: publicProfiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, level, xp')
        .eq('is_public', true)
        .neq('id', user?.id || '00000000-0000-0000-0000-000000000000'); // Exclude self

      if (publicProfiles && user) {
        // Fetch follows to see if current user follows them
        const { data: follows } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);
        
        const followingIds = new Set(follows?.map(f => f.following_id) || []);
        
        const enhancedProfiles = publicProfiles.map(p => ({
          ...p,
          is_following: followingIds.has(p.id)
        }));
        setProfiles(enhancedProfiles);
      } else if (publicProfiles) {
        setProfiles(publicProfiles);
      }
      setLoading(false);
    }
    fetchCommunity();
  }, []);

  const handleFollowToggle = async (targetId: string, currentlyFollowing: boolean) => {
    if (!currentUser) {
      Swal.fire({ title: "Oops", text: "Silakan login untuk mengikuti pengguna lain.", icon: "warning" });
      return;
    }

    if (currentlyFollowing) {
      // Unfollow
      await supabase.from('user_follows').delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', targetId);
    } else {
      // Follow
      await supabase.from('user_follows').insert({
        follower_id: currentUser.id,
        following_id: targetId
      });
    }

    // Update local state
    setProfiles(profiles.map(p => 
      p.id === targetId ? { ...p, is_following: !currentlyFollowing } : p
    ));
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-brand animate-pulse"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-brand" />
            Jejaring Pembaca
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Temukan, ikuti, dan belajar bersama polyglot lainnya.</p>
        </div>
        
        <div className="relative max-w-xs w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Cari pembaca..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-foreground/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.map(profile => (
          <div key={profile.id} className="bg-card border border-foreground/10 rounded-3xl p-6 hover:shadow-xl transition-all hover:border-brand/30 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-brand/10 border-2 border-brand/20 overflow-hidden mb-4 flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-brand font-bold text-2xl uppercase">{profile.full_name?.charAt(0) || '?'}</span>
              )}
            </div>
            
            <h3 className="text-lg font-bold text-foreground mb-1">{profile.full_name || 'Anonim'}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 bg-foreground/5 px-3 py-1 rounded-full">
              <Trophy className="w-3.5 h-3.5 text-yellow-500" /> {profile.xp} XP • {profile.level}
            </div>

            <div className="w-full flex gap-2">
              <button 
                onClick={() => handleFollowToggle(profile.id, !!profile.is_following)}
                className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  profile.is_following 
                    ? 'bg-foreground/5 text-foreground hover:bg-red-500/10 hover:text-red-500' 
                    : 'bg-brand text-background hover:bg-brand-hover hover:scale-105'
                }`}
              >
                {profile.is_following ? (
                  <>Unfollow</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Follow</>
                )}
              </button>
              
              <Link
                href={`/messages?user_id=${profile.id}`}
                className="w-12 h-11 flex items-center justify-center bg-brand/10 text-brand hover:bg-brand hover:text-white rounded-xl transition-all shrink-0"
                title="Kirim Pesan"
              >
                <MessageSquare className="w-5 h-5" />
              </Link>
            </div>
          </div>
        ))}
        {filteredProfiles.length === 0 && (
          <div className="col-span-full text-center py-20 text-muted-foreground bg-foreground/5 rounded-3xl border border-dashed border-foreground/10">
            Tidak ada pembaca yang ditemukan dengan kriteria tersebut.
          </div>
        )}
      </div>
    </div>
  );
}
