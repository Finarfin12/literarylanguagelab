import { NextResponse } from "next/server";

function isAllowedGutenbergUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const isGutenbergHost =
      hostname === "gutenberg.org" || hostname.endsWith(".gutenberg.org");

    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      isGutenbergHost
    );
  } catch {
    return false;
  }
}

async function fetchWithRetry(url: string, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(url, {
        headers: { Accept: "text/plain,*/*;q=0.8" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error("Retry exhausted");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sourceUrl = url.searchParams.get("url");

  if (!sourceUrl || !isAllowedGutenbergUrl(sourceUrl)) {
    return NextResponse.json(
      { error: "URL teks Gutenberg tidak valid." },
      { status: 400 }
    );
  }

  try {
    const res = await fetchWithRetry(sourceUrl);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil teks Gutenberg." },
        { status: res.status }
      );
    }

    const text = await res.text();
    return new Response(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Gutenberg text proxy error:", error);
    return NextResponse.json(
      { error: "Gagal menghubungi Project Gutenberg." },
      { status: 502 }
    );
  }
}
