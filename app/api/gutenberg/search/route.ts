import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const gutendexUrl = new URL("https://gutendex.com/books/");
    gutendexUrl.searchParams.set("search", query);

    const res = await fetch(gutendexUrl, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gutendex search failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Gutendex search error:", error);
    return NextResponse.json(
      { error: "Gagal menghubungi Gutendex." },
      { status: 502 }
    );
  }
}
