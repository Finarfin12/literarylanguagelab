import { NextResponse } from "next/server";

const romanNumeralPattern = /^[IVXLCDM]+\.?$/i;
const chapterHeadingPattern =
  /^(chapter|book|part)\s+([ivxlcdm]+|\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i;

type BookBlock = {
  type: "heading" | "paragraph" | "verse";
  text: string;
};

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

function stripProjectGutenbergWrapper(text: string) {
  const normalized = text.replace(/\r\n?/g, "\n");
  const startMatch = normalized.match(/\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i);
  const withoutHeader = startMatch
    ? normalized.slice((startMatch.index || 0) + startMatch[0].length)
    : normalized;
  const endMatch = withoutHeader.match(/\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i);

  return (endMatch ? withoutHeader.slice(0, endMatch.index) : withoutHeader).trim();
}

function isChapterHeading(line: string) {
  const cleaned = line.trim();
  return romanNumeralPattern.test(cleaned) || chapterHeadingPattern.test(cleaned);
}

function trimFrontMatter(text: string) {
  const lines = text.split("\n");
  const nonEmptyIndexes = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.length > 0);

  const firstChapter = nonEmptyIndexes.find(({ line }, position) => {
    const previous = nonEmptyIndexes[position - 1]?.line.toLowerCase() || "";
    const next = nonEmptyIndexes[position + 1]?.line || "";

    return (
      isChapterHeading(line) &&
      !previous.includes("table of contents") &&
      !romanNumeralPattern.test(previous.trim()) &&
      !romanNumeralPattern.test(next.trim())
    );
  });

  return firstChapter ? lines.slice(firstChapter.index).join("\n").trim() : text;
}

function getBlockType(block: string): BookBlock["type"] {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  const joined = lines.join(" ");
  const averageLineLength =
    lines.reduce((total, line) => total + line.length, 0) / Math.max(lines.length, 1);

  if (lines.length === 1 && isChapterHeading(joined)) {
    return "heading";
  }

  if (lines.length > 1 && averageLineLength < 54) {
    return "verse";
  }

  return "paragraph";
}

function buildReadableBlocks(text: string): BookBlock[] {
  const readableText = trimFrontMatter(stripProjectGutenbergWrapper(text));

  return readableText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const type = getBlockType(block);
      const cleanText =
        type === "paragraph"
          ? block.split("\n").map((line) => line.trim()).join(" ")
          : block.split("\n").map((line) => line.trim()).join("\n");

      return { type, text: cleanText };
    });
}

async function fetchWithRetry(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { Accept: "text/plain,*/*;q=0.8" },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
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
    const res = await fetchWithRetry(sourceUrl);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil teks Gutenberg." },
        { status: res.status }
      );
    }

    const text = await res.text();
    const blocks = buildReadableBlocks(text);
    return NextResponse.json({ blocks }, {
      headers: {
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
