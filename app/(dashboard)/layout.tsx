import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { HelpCircle } from "lucide-react";

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

  // Update login-based streak
  await supabase.rpc("update_login_streak", { target_user_id: user.id });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        userEmail={user?.email} 
        userName={user?.user_metadata?.full_name} 
        userAvatar={user?.user_metadata?.avatar_url} 
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Bantuan button - top right, non-floating */}
        <div className="absolute top-4 right-4 z-30">
          <Link
            href="/help"
            className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-brand/50 hover:bg-muted transition-all text-sm font-medium shadow-sm"
            title="Pusat Bantuan"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Bantuan</span>
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
