"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Penampil markdown ringan untuk teks hasil AI yang pendek (definisi kata, umpan balik, penjelasan).
// Tidak memakai `prose`: warna dan ukuran huruf mengikuti elemen pembungkus, jadi bisa dipasang di mana saja.
// HTML mentah tidak dirender (default react-markdown), jadi aman untuk teks dari AI atau pengguna.

const blockComponents: Components = {
  p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-1.5 list-disc pl-5 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 list-decimal pl-5 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
      {children}
    </a>
  ),
  code: ({ children }) => <code className="px-1 py-0.5 rounded bg-muted text-[0.9em] font-mono">{children}</code>,
  pre: ({ children }) => <pre className="my-2 p-3 rounded-control bg-muted overflow-x-auto text-sm">{children}</pre>,
  blockquote: ({ children }) => <blockquote className="my-2 pl-3 border-l-4 border-border opacity-90">{children}</blockquote>,
  h1: ({ children }) => <p className="my-2 font-bold">{children}</p>,
  h2: ({ children }) => <p className="my-2 font-bold">{children}</p>,
  h3: ({ children }) => <p className="my-2 font-bold">{children}</p>,
  h4: ({ children }) => <p className="my-2 font-bold">{children}</p>,
  hr: () => <hr className="my-3 border-border" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full text-left border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-border px-2 py-1 font-bold">{children}</th>,
  td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
};

// Mode inline: paragraf tidak membungkus teks (aman di dalam <span>, <li>, tombol)
const inlineComponents: Components = {
  ...blockComponents,
  p: ({ children }) => <>{children}</>,
};

/**
 * Render teks markdown. `inline` untuk string pendek di dalam <span>/<li>/tombol (tanpa pembungkus paragraf);
 * tanpa `inline` hasilnya blok (paragraf, daftar, tabel).
 */
export default function Markdown({ children, inline = false }: { children: string | null | undefined; inline?: boolean }) {
  const text = children ?? "";
  if (!text) return null;
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={inline ? inlineComponents : blockComponents}>
      {text}
    </ReactMarkdown>
  );
}
