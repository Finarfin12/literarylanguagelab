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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitRes = await checkIpRateLimit(ip);
  if (rateLimitRes) {
    return rateLimitRes;
  }

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "ID buku tidak valid." }, { status: 400 });
  }

  try {
    const res = await fetchWithRetry(`https://gutendex.com/books/${id}`);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Buku tidak ditemukan di Gutenberg." },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Gutendex book error:", error);
    return NextResponse.json(
      { error: "Gagal menghubungi Gutendex." },
      { status: 502 }
    );
  }
}
