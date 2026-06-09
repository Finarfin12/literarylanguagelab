"use client";

import Swal from 'sweetalert2';
import { useState } from "react";
import { Camera, Upload, Loader2, Save, FileText, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OCRLensPage() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultText(data.result);
    } catch (error: any) {
      Swal.fire({ title: "Informasi", text: String("Gagal melakukan scan: " + error.message), icon: "warning", confirmButtonColor: "#2fa16b" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title || !resultText) {
      Swal.fire({ title: "Perhatian", text: "Judul dan teks hasil scan harus diisi!", icon: "info", confirmButtonColor: "#2fa16b" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author: author || "Unknown",
          content: resultText,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan teks");
      
      router.push("/library");
    } catch (error: any) {
      Swal.fire({ title: "Informasi", text: String(error.message), icon: "warning", confirmButtonColor: "#2fa16b" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <Camera className="w-8 h-8 text-brand" />
          OCR Lens
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Scan halaman buku fisik atau jurnal cetak menjadi teks digital untuk dianalisis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl relative flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 opacity-50" />
          <h2 className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-wider">Gambar Sumber</h2>
          
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl p-6 bg-background/30 mb-6 relative overflow-hidden group">
            {image ? (
              <img src={image} alt="Preview" className="w-full h-full object-contain max-h-[300px]" />
            ) : (
              <div className="text-center text-muted-foreground">
                <Upload className="w-12 h-12 mx-auto mb-4 opacity-50 group-hover:text-blue-400 group-hover:opacity-100 transition-colors" />
                <p>Klik atau drop gambar halaman buku di sini</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <button
            onClick={handleScan}
            disabled={!image || loading}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            {loading ? "Memindai Gambar..." : "Mulai Scan"}
          </button>
        </div>

        {/* Result Section */}
        <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl relative flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand/0 via-brand to-brand/0 opacity-50" />
          <h2 className="text-sm font-bold text-brand mb-4 uppercase tracking-wider flex justify-between items-center">
            <span>Teks Terekstrak</span>
            {resultText && <span className="text-xs text-brand/70 bg-brand/10 px-2 py-1 rounded-full">{resultText.split(' ').length} words</span>}
          </h2>

          <textarea
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            placeholder="Hasil scan akan muncul di sini. Anda bisa mengeditnya jika ada salah baca..."
            className="flex-1 w-full bg-background/50 border border-white/10 rounded-2xl p-5 text-foreground font-serif focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none resize-none mb-6 min-h-[300px]"
          ></textarea>

          <div className="space-y-4 border-t border-white/10 pt-6">
            <input 
              type="text" 
              placeholder="Judul Teks / Buku"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-xl p-3 text-foreground focus:ring-1 focus:ring-brand focus:outline-none"
            />
            <input 
              type="text" 
              placeholder="Penulis (Opsional)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-xl p-3 text-foreground focus:ring-1 focus:ring-brand focus:outline-none"
            />
            <button
              onClick={handleSave}
              disabled={saving || !resultText || !title}
              className="w-full py-4 bg-brand hover:bg-brand-hover text-background font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan ke Library <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
