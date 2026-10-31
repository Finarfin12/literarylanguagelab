import Link from "next/link";
import RoleDropdown from "@/components/admin/RoleDropdown";
import { ShieldAlert, Users, CalendarDays, BookOpen, BarChart3, Search } from "lucide-react";
import { requireAdminPage } from "../_lib/guard";
import { AdminPageHeader, buttonClass, inputClass } from "../_lib/ui";

export const dynamic = 'force-dynamic';

const ROLES = ["user", "curator", "moderator", "admin", "banned"];
const PAGE_SIZE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const { supabase } = await requireAdminPage();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  // Karakter yang bermakna di filter PostgREST dibuang
  const q = (params.q || "").replace(/[,()*%\\]/g, " ").trim().slice(0, 64);
  const role = ROLES.includes(params.role || "") ? params.role : "";

  let query = supabase
    .from('profiles')
    .select('*', { count: "exact" })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.or(`full_name.ilike.%${q}%,username.ilike.%${q}%`);
  if (role) query = query.eq('role', role);

  const { data: users, count, error } = await query;

  if (error) {
    return (
      <div className="p-4 md:p-8 text-center text-red-500">
        <p>Error loading users: {error.message}</p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
  const pageLink = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (role) sp.set("role", role);
    sp.set("page", String(p));
    return `/admin/users?${sp.toString()}`;
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
      <AdminPageHeader
        icon={<ShieldAlert className="w-7 h-7" />}
        title="Pengguna"
        description="Kelola peran dan akses pengguna Literary Language Lab."
      />

      <form method="get" className="grid grid-cols-1 sm:grid-cols-[1fr_200px_auto] gap-3 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Cari nama atau username" className={`${inputClass} pl-9`} aria-label="Cari pengguna" />
        </div>
        <select name="role" defaultValue={role} className={inputClass} aria-label="Filter role">
          <option value="">Semua role</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button type="submit" className={`${buttonClass} bg-brand text-background`}>Cari</button>
      </form>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50 flex items-center gap-2 text-foreground font-bold">
          <Users className="w-5 h-5 text-brand" />
          {count || 0} pengguna{q || role ? " cocok" : ""}
        </div>

        <div className="hidden lg:grid grid-cols-[2fr_0.7fr_0.8fr_0.9fr_auto] gap-4 px-6 py-3 border-b border-border bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground font-bold">
          <span>Pengguna</span>
          <span>Level CEFR</span>
          <span>Kosakata</span>
          <span>Bergabung</span>
          <span className="text-right">Role Akses</span>
        </div>

        <ul className="divide-y divide-border">
          {users?.map((profile) => {
            const joinDate = new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <li key={profile.id} className="p-4 lg:px-6 grid grid-cols-1 lg:grid-cols-[2fr_0.7fr_0.8fr_0.9fr_auto] gap-3 lg:gap-4 lg:items-center hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center overflow-hidden shrink-0">
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-brand">{profile.full_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || '?'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{profile.full_name || 'Tanpa Nama'}</p>
                    <p className="text-xs text-muted-foreground truncate">@{profile.username || profile.id.split('-')[0]}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground lg:contents">
                  <span className="bg-brand/10 border border-brand/20 rounded-md px-2 py-0.5 w-fit text-[10px] font-bold text-brand uppercase tracking-wider">
                    {profile.cefr_level || '—'}
                  </span>
                  <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {profile.vocab_count || 0} kata</span>
                  <span className="flex items-center gap-1.5" title={new Date(profile.created_at).toLocaleString()}>
                    <CalendarDays className="w-3.5 h-3.5" /> {joinDate}
                  </span>
                </div>
                <div className="flex items-center gap-2 lg:justify-end">
                  <Link
                    href={`/admin/usage?user=${profile.id}`}
                    className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:text-brand"
                    title="Lihat pemakaian AI"
                    aria-label={`Pemakaian AI ${profile.full_name || ''}`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Link>
                  <RoleDropdown
                    userId={profile.id}
                    userName={profile.full_name || profile.username || 'User'}
                    currentRole={profile.role || 'user'}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        {users?.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Tidak ada pengguna yang cocok.</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          {page > 1 ? <Link href={pageLink(page - 1)} className={`${buttonClass} bg-muted text-foreground`}>Sebelumnya</Link> : <span />}
          <span className="text-muted-foreground">Halaman {page} / {totalPages}</span>
          {page < totalPages ? <Link href={pageLink(page + 1)} className={`${buttonClass} bg-muted text-foreground`}>Berikutnya</Link> : <span />}
        </div>
      )}
    </div>
  );
}
