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
    const res = await fetch(sourceUrl, {
      headers: { Accept: "text/plain,*/*;q=0.8" },
    });

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
        "Cache-Control": "public, max-age=3600",
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
