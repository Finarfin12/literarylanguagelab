import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Sidebar from "@/components/Sidebar";
import TopActions from "@/components/TopActions";

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
        <TopActions />
        {children}
      </main>
    </div>
  );
}
