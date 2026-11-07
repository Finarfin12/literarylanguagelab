import { cookies, headers } from "next/headers";
import { ONBOARDED_COOKIE, isOnboardedCookie } from "@/lib/onboarding-cookie";
import { redirect } from "next/navigation";
import { getRequestUser } from "@/utils/supabase/get-user";
import Sidebar from "@/components/Sidebar";
import TopActions from "@/components/TopActions";
import MobileBottomNav from "@/components/MobileBottomNav";
import FeatureSearch from "@/components/FeatureSearch";
import PresenceTracker from "@/components/PresenceTracker";
import { CourseVisibilityProvider, StudyVisibilityProvider } from "@/components/CourseVisibility";
import { getStudyAccess } from "@/lib/study-access";
import { getCourseAccess } from "@/lib/course-access";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await getRequestUser();

  if (!user) {
    redirect("/login");
  }

  // Onboarding: pengguna yang belum menjawab diarahkan sekali ke /onboarding.
  // Jika kolom belum ada (migrasi 0006 belum dijalankan) query error → jangan redirect.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const skipOnboarding = pathname.startsWith("/onboarding") || pathname.startsWith("/english-lab/placement-test");
  // Cookie lll_onboarded (diset proxy.ts / onboarding) melewati query; tanpa cookie, perilaku lama.
  const onboardedCookie = (await cookies()).get(ONBOARDED_COOKIE)?.value;
  if (!skipOnboarding && !isOnboardedCookie(onboardedCookie, user.id)) {
    const { data: profile, error } = await supabase.from("profiles").select("onboarded_at").eq("id", user.id).maybeSingle();
    if (!error && profile && !profile.onboarded_at) {
      redirect("/onboarding");
    }
  }

  // Fase 16: Kursus Dasar tersembunyi dari menu sampai flag `kursus_dasar` menyala (admin selalu melihatnya)
  const courseAccess = await getCourseAccess(supabase, user.id);
  // Fase 24: Modul Belajar tersembunyi sampai flag `modul_belajar` menyala (admin selalu melihatnya)
  const studyAccess = await getStudyAccess(supabase, user.id);

  return (
    <CourseVisibilityProvider visible={courseAccess.visible}>
    <StudyVisibilityProvider visible={studyAccess.visible}>
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
      <PresenceTracker />
      <FeatureSearch />
    </div>
    </StudyVisibilityProvider>
    </CourseVisibilityProvider>
  );
}
