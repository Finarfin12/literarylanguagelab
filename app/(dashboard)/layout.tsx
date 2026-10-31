import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Sidebar from "@/components/Sidebar";
import TopActions from "@/components/TopActions";
import MobileBottomNav from "@/components/MobileBottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Onboarding: pengguna yang belum menjawab diarahkan sekali ke /onboarding.
  // Jika kolom belum ada (migrasi 0006 belum dijalankan) query error → jangan redirect.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const skipOnboarding = pathname.startsWith("/onboarding") || pathname.startsWith("/english-lab/placement-test");
  if (!skipOnboarding) {
    const { data: profile, error } = await supabase.from("profiles").select("onboarded_at").eq("id", user.id).maybeSingle();
    if (!error && profile && !profile.onboarded_at) {
      redirect("/onboarding");
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        userEmail={user?.email} 
        userName={user?.user_metadata?.full_name} 
        userAvatar={user?.user_metadata?.avatar_url} 
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pb-16 lg:pb-0">
        <TopActions />
        {children}
      </main>
      
      <MobileBottomNav />
    </div>
  );
}
