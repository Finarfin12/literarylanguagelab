import { NextResponse } from "next/server";
import { checkIpRateLimit } from "@/lib/rate-limit";

async function fetchWithRetry(url: string | URL) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    return res;
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

  try {
    const gutendexUrl = new URL("https://gutendex.com/books/");
    gutendexUrl.searchParams.set("search", query);
    // F-06: halaman hasil berikutnya (Gutendex memakai ?page=N, 32 buku per halaman)
    const page = Number(url.searchParams.get("page"));
    if (Number.isInteger(page) && page > 1 && page <= 500) {
      gutendexUrl.searchParams.set("page", String(page));
    }

    const res = await fetchWithRetry(gutendexUrl);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gutendex search failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Gutendex search error:", error);
    return NextResponse.json(
      { error: "Gagal menghubungi Gutendex." },
      { status: 502 }
    );
  }
}
