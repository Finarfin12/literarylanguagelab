import { NextResponse } from "next/server";

async function fetchWithRetry(url: string | URL, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
