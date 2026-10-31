import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import RoleDropdown from "@/components/admin/RoleDropdown";
import { ShieldAlert, Users, CalendarDays, BookOpen } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // 1. Verify Admin Access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (currentUserProfile?.role !== 'admin') {
    redirect("/dashboard");
  }

  // 2. Fetch all users
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-4 md:p-8 text-center text-red-500">
        <p>Error loading users: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
        <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Kelola peran, pangkat, dan akses pengguna di Literary Language Lab.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50 flex justify-between items-center">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <Users className="w-5 h-5 text-brand" />
            Total Pengguna: {users?.length || 0}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4 font-bold">Pengguna</th>
                <th className="px-6 py-4 font-bold">Level CEFR</th>
                <th className="px-6 py-4 font-bold">Statistik</th>
                <th className="px-6 py-4 font-bold text-center">Bergabung</th>
                <th className="px-6 py-4 font-bold text-right">Role Akses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users?.map((profile) => {
                const joinDate = new Date(profile.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <tr key={profile.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center overflow-hidden shrink-0">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name || 'Avatar'} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-brand">{profile.full_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || '?'}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{profile.full_name || 'Tanpa Nama'}</p>
                          <p className="text-xs text-muted-foreground">@{profile.username || profile.id.split('-')[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="bg-brand/10 border border-brand/20 rounded-md px-2 py-0.5 inline-block w-fit">
                        <span className="text-[10px] font-bold text-brand uppercase tracking-wider">{profile.cefr_level || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5" title="Kosakata Disimpan">
                          <BookOpen className="w-3.5 h-3.5" /> {profile.vocab_count || 0} Kata
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground" title={new Date(profile.created_at).toLocaleString()}>
                        <CalendarDays className="w-3.5 h-3.5" /> {joinDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <RoleDropdown 
                        userId={profile.id} 
                        userName={profile.full_name || profile.username || 'User'} 
                        currentRole={profile.role || 'user'} 
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
