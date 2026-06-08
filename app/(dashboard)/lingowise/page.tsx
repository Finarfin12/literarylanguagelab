import LingoWiseClient from "@/components/lingowise/LingoWiseClient";

export default function LingoWisePage() {
  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          LingoWise AI 
          <span className="text-xs font-sans font-bold bg-brand/20 text-brand px-3 py-1 rounded-full uppercase tracking-wider border border-brand/30">Beta</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Laboratorium kecerdasan buatan untuk membedah, menganalisis, dan memodifikasi teks sastra secara mendalam.</p>
      </div>

      <LingoWiseClient />
    </div>
  );
}
