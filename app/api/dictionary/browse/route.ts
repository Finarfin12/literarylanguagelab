import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

// Daftar kata berawalan satu huruf untuk A-Z Dictionary Browser. Dipanggil lewat server (bukan langsung dari
// browser ke Datamuse) agar tidak terhalang jaringan/ekstensi di sisi pengguna, dan hasilnya di-cache sehari
// karena daftar ini hampir tidak berubah dan layanan Datamuse bisa lambat (beberapa detik).
export const maxDuration = 30;

const REVALIDATE_SECONDS = 24 * 60 * 60;

type DatamuseWord = { word: string; defs?: string[] };

export async function GET(req: Request) {
  const authResult = await requireUser();
  if (authResult instanceof NextResponse) return authResult;

  const letter = new URL(req.url).searchParams.get("letter") ?? "";
  if (!/^[a-zA-Z]$/.test(letter)) return NextResponse.json({ error: "Huruf tidak valid." }, { status: 400 });

  try {
    const res = await fetch(`https://api.datamuse.com/words?sp=${letter.toLowerCase()}*&max=200&md=d`, {
      signal: AbortSignal.timeout(20000),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return NextResponse.json({ error: "Layanan kamus tidak merespons." }, { status: 502 });

    const data = (await res.json()) as DatamuseWord[];
    // Hanya kata tunggal (tanpa spasi/tanda hubung), dengan satu definisi pendek
    const words = data
      .filter((item) => /^[a-zA-Z]+$/.test(item.word))
      .map((item) => ({ word: item.word, defs: item.defs?.slice(0, 1) ?? [] }));
    return NextResponse.json({ words }, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch (error) {
    console.error("Dictionary browse error:", error);
    return NextResponse.json({ error: "Layanan kamus tidak dapat dihubungi." }, { status: 502 });
  }
}
