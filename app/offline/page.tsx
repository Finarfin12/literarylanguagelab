import { WifiOff } from "lucide-react";

// Halaman cadangan PWA: ditampilkan service worker (public/sw.js) saat navigasi gagal karena tidak ada jaringan.
// Sengaja statis dan tanpa login/data agar aman disimpan di cache.

export const metadata = { title: "Offline · Literary Language Lab" };

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="max-w-md text-center">
        <WifiOff className="w-10 h-10 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
        <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Tidak ada koneksi</p>
        <h1 className="font-serif text-[28px] md:text-4xl font-medium leading-[1.15] text-foreground mt-1">Kamu sedang offline</h1>
        <p className="text-muted-foreground mt-3">
          Halaman ini perlu internet. Sambungkan kembali perangkatmu, lalu muat ulang untuk melanjutkan membaca dan belajar.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center min-h-[48px] px-6 mt-6 rounded-control bg-brand-solid text-on-brand font-semibold hover:bg-brand-hover transition-colors"
        >
          Coba lagi
        </a>
      </div>
    </main>
  );
}
