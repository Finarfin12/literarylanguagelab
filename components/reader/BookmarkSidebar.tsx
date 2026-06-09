"use client";

import { X, BookmarkPlus, Trash2, Highlighter } from "lucide-react";

type Bookmark = {
  id: string;
  position: number;
  quoteText?: string;
  note?: string;
  color?: string;
  type: "highlight" | "bookmark";
  label?: string;
};

interface BookmarkSidebarProps {
  bookmarks: Bookmark[];
  onGoTo: (position: number) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function BookmarkSidebar({ bookmarks, onGoTo, onDelete, onClose }: BookmarkSidebarProps) {
  const highlights = bookmarks.filter((b) => b.type === "highlight");
  const bookmarksOnly = bookmarks.filter((b) => b.type === "bookmark");

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <BookmarkPlus className="w-4 h-4 text-brand" />
          Bookmarks
        </h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {bookmarksOnly.length === 0 && highlights.length === 0 && (
          <p className="text-sm text-muted-foreground text-center mt-10">
            Belum ada bookmark. Pilih teks lalu klik bookmark untuk menandai.
          </p>
        )}

        {bookmarksOnly.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Bookmark</h4>
            <div className="space-y-2">
              {bookmarksOnly.map((b) => (
                <div
                  key={b.id}
                  className="bg-muted rounded-xl p-3 cursor-pointer hover:bg-brand/10 transition-colors group"
                  onClick={() => onGoTo(b.position)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{b.label || `Posisi ${b.position}`}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(b.id); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {highlights.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Highlight</h4>
            <div className="space-y-2">
              {highlights.map((h) => (
                <div
                  key={h.id}
                  className="rounded-xl p-3 cursor-pointer hover:bg-brand/10 transition-colors group border-l-4"
                  style={{ borderLeftColor: h.color || "#FFEB3B", backgroundColor: `${h.color || "#FFEB3B"}10` }}
                  onClick={() => onGoTo(h.position)}
                >
                  <p className="text-sm text-foreground italic line-clamp-3 mb-1">"{h.quoteText}"</p>
                  {h.note && <p className="text-xs text-muted-foreground">{h.note}</p>}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(h.id); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
