import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { LogOut, BookOpen, Library, BookMarked, RefreshCcw } from "lucide-react";

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
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-serif font-bold text-brand">Literary Lab</h2>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:bg-white/5 hover:text-brand transition-colors">
            <BookOpen className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/library" className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:bg-white/5 hover:text-brand transition-colors">
            <Library className="w-5 h-5" />
            <span>Library</span>
          </Link>
          <Link href="/vocabulary" className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:bg-white/5 hover:text-brand transition-colors">
            <BookMarked className="w-5 h-5" />
            <span>Vocabulary Bank</span>
          </Link>
          <Link href="/review" className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:bg-white/5 hover:text-brand transition-colors">
            <RefreshCcw className="w-5 h-5" />
            <span>Review</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm truncate text-muted-foreground">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="p-2 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}
