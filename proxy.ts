import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

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
  const { supabaseResponse, user } = await updateSession(request);

  // Protect /api/* endpoints with 401 if not authenticated and not public
  if (pathname.startsWith("/api/")) {
    if (!isPublicRoute(pathname) && !user) {
      return NextResponse.json(
        { error: "Unauthorized: Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

