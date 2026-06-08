import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { LogOut, BookOpen, Library, BookMarked, RefreshCcw, Sparkles } from "lucide-react";

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
      <aside className="w-72 border-r border-white/5 bg-background/50 backdrop-blur-2xl flex flex-col shadow-2xl relative z-10 transition-all">
        <div className="p-6">
          <h2 className="text-xl font-serif font-bold text-brand">Literary Lab</h2>
        </div>

        <nav className="flex-1 px-6 space-y-3 mt-6">
          <Link href="/dashboard" className="flex items-center space-x-4 px-4 py-3 rounded-xl text-foreground/80 hover:bg-white/5 hover:text-brand hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/lingowise" className="flex items-center space-x-4 px-4 py-3 rounded-xl text-foreground/80 hover:bg-white/5 hover:text-brand hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 bg-brand/5 border border-brand/10">
            <Sparkles className="w-5 h-5 text-brand" />
            <span className="font-medium text-brand">LingoWise AI</span>
          </Link>
          <Link href="/library" className="flex items-center space-x-4 px-4 py-3 rounded-xl text-foreground/80 hover:bg-white/5 hover:text-brand hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <Library className="w-5 h-5" />
            <span className="font-medium">Library</span>
          </Link>
          <Link href="/vocabulary" className="flex items-center space-x-4 px-4 py-3 rounded-xl text-foreground/80 hover:bg-white/5 hover:text-brand hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <BookMarked className="w-5 h-5" />
            <span className="font-medium">Vocabulary Bank</span>
          </Link>
          <Link href="/review" className="flex items-center space-x-4 px-4 py-3 rounded-xl text-foreground/80 hover:bg-white/5 hover:text-brand hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <RefreshCcw className="w-5 h-5" />
            <span className="font-medium">Review</span>
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
