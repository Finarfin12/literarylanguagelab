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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const gutendexUrl = new URL("https://gutendex.com/books/");
    gutendexUrl.searchParams.set("search", query);

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
