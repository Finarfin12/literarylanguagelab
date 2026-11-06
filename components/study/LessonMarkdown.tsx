"use client";

import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Penampil isi pelajaran (Fase 24.3): gaya bacaan DESIGN.md: serif untuk isi, lebar nyaman, tema gelap lewat token.
// HTML mentah TIDAK dirender (default react-markdown), jadi aman untuk isi dari file, admin, maupun AI.
// Konvensi teks Inggris: kutipan blok (>) dan blok kode berbahasa "en" diberi lang="en".

const components: Components = {
  h2: ({ children }) => <h2 className="font-serif text-[24px] md:text-[28px] font-medium leading-[1.2] text-foreground mt-10 mb-3 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="font-serif text-xl md:text-[22px] font-medium leading-[1.25] text-foreground mt-7 mb-2">{children}</h3>,
  h4: ({ children }) => <h4 className="font-bold text-foreground mt-5 mb-1">{children}</h4>,
  p: ({ children }) => <p className="my-4 leading-[1.75]">{children}</p>,
  ul: ({ children }) => <ul className="my-4 list-disc pl-6 space-y-1.5 leading-[1.7]">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 list-decimal pl-6 space-y-1.5 leading-[1.7]">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-ink underline underline-offset-2">
      {children}
    </a>
  ),
  code: ({ children }) => <code className="px-1 py-0.5 rounded bg-muted text-[0.9em] font-mono">{children}</code>,
  pre: ({ children }) => {
    const child = Children.toArray(children)[0];
    if (isValidElement(child)) {
      const props = (child as ReactElement<{ className?: string; children?: ReactNode }>).props;
      if (props.className?.includes("language-en")) {
        return (
          <div lang="en" className="my-5 rounded-control border border-border bg-muted/50 p-4 whitespace-pre-wrap leading-[1.75] text-foreground">
            {props.children}
          </div>
        );
      }
    }
    return <pre className="my-4 p-3 rounded-control bg-muted overflow-x-auto text-sm">{children}</pre>;
  },
  blockquote: ({ children }) => (
    <blockquote lang="en" className="my-5 border-l-4 border-brand/40 pl-4 text-foreground/90 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-border" />,
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto">
      <table className="w-full text-left border-collapse text-[0.95em]">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-border bg-muted px-3 py-2 font-bold align-top">{children}</th>,
  td: ({ children }) => <td className="border border-border px-3 py-2 align-top">{children}</td>,
};

export default function LessonMarkdown({ children }: { children: string | null | undefined }) {
  const text = children ?? "";
  if (!text.trim()) return null;
  return (
    <div className="font-serif text-[18px] md:text-[19px] text-foreground max-w-[68ch]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
