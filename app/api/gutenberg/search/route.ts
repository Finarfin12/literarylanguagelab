import { NextResponse } from "next/server";
import { checkIpRateLimit } from "@/lib/rate-limit";

// Opsi ketiga pencarian Buku Klasik ("Gutenberg (server)"): proxy Gutendex dengan rate limit per IP dan cache di server.
// OpenLibrary & Gutendex di halaman pencarian tetap memanggil sumbernya langsung (tidak lewat route ini).

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 200;
const cache = new Map<string, { at: number; data: unknown }>();

function cacheGet(key: string): unknown | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function cacheSet(key: string, data: unknown) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), data });
}

async function fetchWithTimeout(url: string | URL) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitRes = await checkIpRateLimit(ip);
  if (rateLimitRes) {
    return rateLimitRes;
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }
  if (query.length > 200) {
    return NextResponse.json({ error: "Kata kunci terlalu panjang." }, { status: 400 });
  }

  // F-06: halaman hasil berikutnya (Gutendex memakai ?page=N, 32 buku per halaman)
  const pageParam = Number(url.searchParams.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 1 && pageParam <= 500 ? pageParam : 1;
  const cacheKey = `${query.toLowerCase()}|${page}`;

  const cached = cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600", "X-Cache": "HIT" } });
  }

  try {
    // Spasi harus %20 (sama seperti pemanggilan langsung dari browser). URLSearchParams menulis spasi sebagai "+",
    // dan Gutendex menggantung untuk kata kunci berspasi seperti "pride+and+prejudice".
    const gutendexUrl = `https://gutendex.com/books/?search=${encodeURIComponent(query)}${page > 1 ? `&page=${page}` : ""}`;

    const res = await fetchWithTimeout(gutendexUrl);

    if (!res.ok) {
      // Pesan ramah; status upstream (mis. 404 untuk halaman di luar jangkauan) tidak diteruskan mentah
      const message =
        res.status === 404
          ? "Tidak ada hasil lagi untuk pencarian ini."
          : "Layanan Gutendex sedang bermasalah. Coba lagi sebentar atau pakai OpenLibrary.";
      return NextResponse.json({ error: message }, { status: res.status === 404 ? 404 : 502 });
    }

    const data = await res.json();
    cacheSet(cacheKey, data);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Gutendex search error:", error);
    return NextResponse.json(
      { error: "Gagal menghubungi Gutendex. Coba lagi sebentar atau pakai OpenLibrary." },
      { status: 502 }
    );
  }
}
