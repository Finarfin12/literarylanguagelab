import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Users, BookOpen, MessageSquare, Shield, Clock, Search, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { postDiscussion } from "../actions";
import SubmitButton from "@/components/ui/SubmitButton";

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch group data
  const { data: group, error } = await supabase
    .from("study_groups")
    .select(`
      *,
      creator:profiles!study_groups_creator_id_fkey(name, avatar_url),
      members:group_members(
        role,
        joined_at,
        user:profiles(id, name, avatar_url, username)
      ),
      readings:group_readings(
        *,
        text:texts(id, title, author, cover_image)
      ),
      discussions:group_discussions(
        *,
        user:profiles(id, name, avatar_url)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !group) {
    return notFound();
  }

  const isMember = user ? group.members.some((m: any) => m.user.id === user.id) : false;
  const isAdmin = user ? group.members.some((m: any) => m.user.id === user.id && m.role === 'admin') : false;

  // Sorting discussions
  const discussions = group.discussions?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Navigation & Header */}
      <Link href="/clubs" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-brand-ink transition-colors mb-6">
        <ChevronLeft className="w-4 h-4" /> Kembali ke Direktori Klub
      </Link>
      
      <div className="bg-card border border-border rounded-card p-4 md:p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 pointer-events-none">
          <BookOpen className="w-48 h-48 text-brand-ink transform translate-x-8 -translate-y-8" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${group.is_public ? 'bg-brand-tint text-brand-ink border border-brand/30' : 'bg-danger-tint text-danger border border-danger/30'}`}>
                {group.is_public ? 'Public Group' : 'Private Group'}
              </span>
              <span className="flex items-center gap-1.5 bg-muted px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground border border-border">
                <Users className="w-3 h-3" /> {group.members.length} / {group.max_members} Members
              </span>
            </div>
            
            <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground mb-4">{group.name}</h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">{group.description}</p>
          </div>
          
          <div className="shrink-0 flex items-center gap-3">
            <div className="text-right mr-2 hidden md:block">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Group Admin</p>
              <p className="text-sm font-bold text-foreground">{group.creator?.name}</p>
            </div>
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand bg-muted">
              <img src={group.creator?.avatar_url || "/default-avatar.png"} alt="Creator" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>

      {!isMember && (
        <div className="bg-brand-tint border border-brand/20 rounded-card p-4 md:p-8 text-center mb-8">
          <Shield className="w-12 h-12 text-brand-ink mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-medium text-foreground mb-2">Anda Belum Bergabung</h2>
          <p className="text-muted-foreground mb-6">Bergabung dengan grup ini untuk melihat bacaan, berpartisipasi dalam diskusi, dan belajar bersama.</p>
          
          <form action={async () => { "use server"; const { joinClub } = await import("../actions"); await joinClub(group.id); }}>
            <SubmitButton className="px-4 md:px-8 py-3 bg-brand text-brand-foreground font-bold rounded-control hover:bg-brand/90 transition-colors ">
              Gabung Sekarang
            </SubmitButton>
          </form>
        </div>
      )}

      {isMember && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area (Left: 2 columns) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Discussion Board */}
            <div className="bg-card border border-border rounded-card p-6 md:p-8">
              <h2 className="text-2xl font-serif font-medium text-foreground mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-brand-ink" /> Papan Diskusi
              </h2>
              
              <form action={postDiscussion.bind(null, group.id)} className="mb-8">
                <div className="bg-muted rounded-card p-4 border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <input 
                      type="text" 
                      name="chapter_or_paragraph" 
                      placeholder="Bab/Paragraf (Opsional)" 
                      className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand w-full md:w-1/3"
                    />
                  </div>
                  <textarea 
                    name="message" 
                    required 
                    placeholder="Tulis pendapat atau pertanyaanmu mengenai teks..." 
                    className="w-full bg-background border border-border rounded-control p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent min-h-[100px] resize-none transition-all mb-3"
                  ></textarea>
                  <div className="flex justify-end">
                    <SubmitButton className="px-6 py-2 bg-brand text-brand-foreground font-bold rounded-lg hover:bg-brand/90 transition-colors">
                      Kirim Pesan
                    </SubmitButton>
                  </div>
                </div>
              </form>
              
              <div className="space-y-6">
                {discussions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p>Belum ada diskusi. Jadilah yang pertama memulai obrolan!</p>
                  </div>
                ) : (
                  discussions.map((msg: any) => (
                    <div key={msg.id} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0 border border-border">
                        <img src={msg.user?.avatar_url || "/default-avatar.png"} alt={msg.user?.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 bg-muted rounded-card rounded-tl-none p-4 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-foreground text-sm">{msg.user?.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(msg.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {msg.chapter_or_paragraph && (
                          <div className="inline-block px-2 py-0.5 bg-brand-tint text-brand-ink text-xs font-bold rounded mb-2 border border-brand/20">
                            Ref: {msg.chapter_or_paragraph}
                          </div>
                        )}
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm md:text-base">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>

          {/* Sidebar Area (Right: 1 column) */}
          <div className="space-y-8">
            
            {/* Current Reading */}
            <div className="bg-card border border-border rounded-card p-6">
              <h2 className="text-lg font-serif font-medium text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-ink" /> Current Reading
              </h2>
              
              {group.readings && group.readings.length > 0 ? (
                <div className="space-y-4">
                  {group.readings.filter((r: any) => r.is_active).map((reading: any) => (
                    <div key={reading.id} className="flex gap-4">
                      <div className="w-16 h-24 bg-muted rounded-lg border border-border overflow-hidden shrink-0">
                        {reading.text?.cover_image ? (
                           <img src={reading.text.cover_image} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center bg-muted text-brand-ink"><BookOpen className="w-6 h-6" /></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground line-clamp-2">{reading.text?.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">by {reading.text?.author}</p>
                        
                        <Link href={`/read/${reading.text?.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors">
                          Mulai Membaca <Search className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted rounded-control p-4 text-center border border-dashed border-border text-muted-foreground text-sm">
                  Belum ada buku yang dibaca saat ini.
                  {isAdmin && <button className="mt-2 text-brand-ink font-bold block w-full hover:underline">Pilih Buku</button>}
                </div>
              )}
            </div>

            {/* Members List */}
            <div className="bg-card border border-border rounded-card p-6">
              <h2 className="text-lg font-serif font-medium text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-ink" /> Anggota Klub ({group.members.length})
              </h2>
              
              <div className="space-y-3">
                {group.members.map((member: any) => (
                  <div key={member.user.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                      <img src={member.user.avatar_url || "/default-avatar.png"} alt={member.user.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{member.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{member.user.username}</p>
                    </div>
                    {member.role === 'admin' && (
                      <Shield className="w-4 h-4 text-brand-ink shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
