import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Sidebar from "@/components/Sidebar";
import HelpButton from "@/components/HelpButton";

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        userEmail={user?.email} 
        userName={user?.user_metadata?.full_name} 
        userAvatar={user?.user_metadata?.avatar_url} 
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
        <HelpButton />
      </main>
    </div>
  );
}
