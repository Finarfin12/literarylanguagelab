"use client";

import Swal from 'sweetalert2';
import { useRef, useState } from "react";
import { Camera, Upload, Loader2, Save, ArrowRight, ImagePlus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

// Batas di server 4 MB; gambar dikecilkan dulu di browser agar upload cepat di jaringan HP.
const MAX_SIDE = 2000;
const JPEG_QUALITY = 0.85;
const MAX_BYTES = 4 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gambar tidak bisa dibaca. Gunakan JPEG, PNG, atau WebP."));
    };
    img.src = url;
  });
}

async function compressImage(file: File): Promise<string> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung pemrosesan gambar.");
  ctx.fillStyle = "#ffffff"; // latar putih untuk PNG transparan
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let quality = JPEG_QUALITY;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length * 0.75 > MAX_BYTES && quality > 0.4) {
    quality -= 0.15;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

export default function OCRLensPage() {
  const [image, setImage] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [pagesScanned, setPagesScanned] = useState(0);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [saving, setSaving] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // agar file yang sama bisa dipilih lagi
    if (!file) return;

    setPreparing(true);
    try {
      setImage(await compressImage(file));
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : "Gambar tidak bisa diproses.";
      Swal.fire({ title: "Informasi", text, icon: "warning", confirmButtonColor: "#2fa16b" });
    } finally {
      setPreparing(false);
    }
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
      // Halaman berikutnya disambung ke hasil sebelumnya
      setResultText((prev) => (prev.trim() ? `${prev.trimEnd()}\n\n${data.result}` : data.result));
      setPagesScanned((n) => n + 1);
      setImage(null);
    } catch (error: any) {
      Swal.fire({ title: "Informasi", text: String("Gagal melakukan scan: " + error.message), icon: "warning", confirmButtonColor: "#2fa16b" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const confirm = await Swal.fire({
      title: "Mulai dari awal?",
      text: "Teks hasil scan akan dihapus.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;
    setResultText("");
    setPagesScanned(0);
    setImage(null);
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

  const wordCount = resultText.trim() ? resultText.trim().split(/\s+/).length : 0;
  const busy = preparing || loading;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-full pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 md:mb-10">
        <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground flex items-center gap-3">
          <Camera className="w-7 h-7 md:w-8 md:h-8 text-brand-ink" />
          OCR Lens
        </h1>
        <p className="text-muted-foreground mt-2 md:text-lg">Foto halaman buku atau jurnal cetak, lalu ubah menjadi teks digital. Bisa beberapa halaman sekaligus.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Upload Section */}
        <div className="bg-card border border-border rounded-card p-4 md:p-6 relative flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted opacity-50" />
          <h2 className="text-sm font-bold text-brand-ink mb-4 uppercase tracking-wider flex justify-between">
            <span>Gambar Sumber</span>
            {pagesScanned > 0 && <span className="text-xs normal-case tracking-normal text-muted-foreground">{pagesScanned} halaman terscan</span>}
          </h2>

          <button
            type="button"
            onClick={() => galleryInput.current?.click()}
            disabled={busy}
            className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-card p-6 bg-background mb-4 min-h-[220px] hover:border-border transition-colors"
          >
            {preparing ? (
              <Loader2 className="w-8 h-8 animate-spin text-brand-ink" />
            ) : image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="Pratinjau halaman" className="w-full h-full object-contain max-h-[300px]" />
            ) : (
              <div className="text-center text-muted-foreground">
                <Upload className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>{pagesScanned > 0 ? "Pilih halaman berikutnya" : "Pilih gambar halaman buku"}</p>
                <p className="text-xs mt-1">JPEG, PNG, atau WebP. Gambar otomatis dikecilkan.</p>
              </div>
            )}
          </button>

          <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={handleImage} className="hidden" />
          <input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} className="hidden" />

          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              type="button"
              onClick={() => cameraInput.current?.click()}
              disabled={busy}
              className="min-h-[44px] py-3 bg-muted hover:bg-muted/80 border border-border font-bold rounded-control flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Camera className="w-5 h-5" /> Kamera
            </button>
            <button
              type="button"
              onClick={() => galleryInput.current?.click()}
              disabled={busy}
              className="min-h-[44px] py-3 bg-muted hover:bg-muted/80 border border-border font-bold rounded-control flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ImagePlus className="w-5 h-5" /> Galeri
            </button>
          </div>

          <button
            onClick={handleScan}
            disabled={!image || busy}
            className="w-full min-h-[44px] py-4 bg-brand-solid hover:bg-brand-hover text-on-brand font-bold rounded-control transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            {loading ? "Memindai Gambar..." : pagesScanned > 0 ? "Scan & Sambung" : "Mulai Scan"}
          </button>
        </div>

        {/* Result Section */}
        <div className="bg-card border border-border rounded-card p-4 md:p-6 relative flex flex-col">
          <h2 className="text-sm font-bold text-brand-ink mb-4 uppercase tracking-wider flex justify-between items-center gap-2">
            <span>Teks Terekstrak</span>
            <span className="flex items-center gap-2">
              {wordCount > 0 && <span className="text-xs text-brand/70 bg-brand-tint px-2 py-1 rounded-full">{wordCount} kata</span>}
              {resultText && (
                <button onClick={handleReset} className="p-2 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger-tint" aria-label="Mulai dari awal">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </span>
          </h2>

          <textarea
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            placeholder="Hasil scan akan muncul di sini. Anda bisa mengeditnya jika ada salah baca..."
            className="flex-1 w-full bg-background border border-border rounded-card p-4 md:p-5 text-foreground font-serif text-base focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none resize-y mb-6 min-h-[260px] md:min-h-[300px]"
          ></textarea>

          <div className="space-y-4 border-t border-border pt-6">
            <input
              type="text"
              placeholder="Judul Teks / Buku"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-control p-3 text-base text-foreground focus:ring-1 focus:ring-brand focus:outline-none"
            />
            <input
              type="text"
              placeholder="Penulis (Opsional)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-background border border-border rounded-control p-3 text-base text-foreground focus:ring-1 focus:ring-brand focus:outline-none"
            />
            <button
              onClick={handleSave}
              disabled={saving || !resultText || !title}
              className="w-full min-h-[44px] py-4 bg-brand-solid hover:bg-brand-hover text-on-brand font-bold rounded-control transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
