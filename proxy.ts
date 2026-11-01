import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { ONBOARDED_COOKIE, isOnboardedCookie, onboardedCookieOptions } from "@/lib/onboarding-cookie";

const PUBLIC_API_ROUTES = [
  "/api/gutenberg",
  "/api/wotd",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Diteruskan ke layout (server component) yang perlu tahu path saat ini, mis. redirect onboarding.
  // Selalu ditimpa di sini, jadi nilai kiriman klien tidak dipercaya.
  request.headers.set("x-pathname", pathname);
  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Protect /api/* endpoints with 401 if not authenticated and not public
  if (pathname.startsWith("/api/")) {
    if (!isPublicRoute(pathname) && !user) {
      return NextResponse.json(
        { error: "Unauthorized: Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }
  }

  // Cookie onboarding (Fase 13.5): pengguna yang sudah onboarding diberi cookie sekali, lalu layout dashboard
  // tidak perlu query `profiles` lagi. Hanya untuk permintaan halaman; error (mis. migrasi 0006 belum ada) diabaikan.
  const isPage = !pathname.startsWith("/api/") && !pathname.startsWith("/auth/");
  if (isPage && user && !isOnboardedCookie(request.cookies.get(ONBOARDED_COOKIE)?.value, user.id)) {
    const { data, error } = await supabase.from("profiles").select("onboarded_at").eq("id", user.id).maybeSingle();
    if (!error && data?.onboarded_at) {
      supabaseResponse.cookies.set(ONBOARDED_COOKIE, user.id, onboardedCookieOptions());
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

