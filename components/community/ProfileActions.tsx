"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { UserPlus, UserMinus, MessageSquare } from "lucide-react";
import Link from "next/link";
import Swal from 'sweetalert2';
import { useRouter } from "next/navigation";

interface ProfileActionsProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
}

export default function ProfileActions({ targetUserId, initialIsFollowing, isOwnProfile, isLoggedIn }: ProfileActionsProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  if (isOwnProfile) return null;

  const handleFollowToggle = async () => {
    if (!isLoggedIn) {
      Swal.fire({ title: "Oops", text: "Silakan login untuk mengikuti pengguna lain.", icon: "warning" });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    if (isFollowing) {
      await supabase.from('user_follows').delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
    } else {
      await supabase.from('user_follows').insert({
        follower_id: user.id,
        following_id: targetUserId
      });
    }

    setIsFollowing(!isFollowing);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex gap-3 w-full md:w-auto">
      <button 
        onClick={handleFollowToggle}
        disabled={loading}
        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
          isFollowing 
            ? 'bg-foreground/5 text-foreground hover:bg-danger-tint hover:text-danger' 
            : 'bg-brand text-background hover:bg-brand-hover'
        }`}
      >
        {isFollowing ? (
          <><UserMinus className="w-4 h-4" /> Unfollow</>
        ) : (
          <><UserPlus className="w-4 h-4" /> Follow</>
        )}
      </button>
      
      <Link
        href={isLoggedIn ? `/messages?user_id=${targetUserId}` : "/login"}
        className="px-6 py-2.5 flex items-center justify-center bg-brand/10 text-brand hover:bg-brand hover:text-white rounded-xl font-bold transition-all gap-2"
        onClick={(e) => {
          if (!isLoggedIn) {
            e.preventDefault();
            Swal.fire({ title: "Oops", text: "Silakan login untuk mengirim pesan.", icon: "warning" });
          }
        }}
      >
        <MessageSquare className="w-4 h-4" /> Message
      </Link>
    </div>
  );
}
