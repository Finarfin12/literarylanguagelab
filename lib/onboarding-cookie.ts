// Cookie penanda onboarding selesai (Fase 13.5). Nilainya id pengguna, bukan "1", supaya pengguna lain di
// browser yang sama tidak ikut melewati onboarding. httpOnly: hanya dibaca server. Hanya mengurangi satu query
// `profiles` per halaman; tanpa cookie perilaku lama (query) tetap berjalan.

export const ONBOARDED_COOKIE = "lll_onboarded";

export function onboardedCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

/** True bila cookie berisi id pengguna yang sedang masuk. */
export function isOnboardedCookie(value: string | undefined, userId: string | undefined): boolean {
  return !!value && !!userId && value === userId;
}
