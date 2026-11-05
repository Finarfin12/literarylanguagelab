import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

const MAX_TITLE = 200;
const MAX_CONTENT = 100000;

/**
 * Menyimpan teks buatan pengguna (dipakai OCR Lens: library/add/ocr). Teks bersifat PRIBADI (Fase 19.1):
 * is_public = false dan owner_id = pengguna; admin yang menerbitkan. Sebelum migrasi 0018 (kolom owner_id belum ada)
 * jatuh ke perilaku lama (langsung publik), sama seperti addText.
 */
export async function POST(req: Request) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const { supabase, user } = auth;

    const body = await req.json().catch(() => null);
    const title = body && typeof body.title === "string" ? body.title.trim() : "";
    const author = body && typeof body.author === "string" ? body.author.trim() : "";
    const content = body && typeof body.content === "string" ? body.content.trim() : "";

    if (!title || !content) {
      return NextResponse.json({ error: "Judul dan isi teks wajib diisi." }, { status: 400 });
    }
    if (title.length > MAX_TITLE || author.length > MAX_TITLE) {
      return NextResponse.json({ error: `Judul/penulis terlalu panjang (maksimum ${MAX_TITLE} karakter).` }, { status: 413 });
    }
    if (content.length > MAX_CONTENT) {
      return NextResponse.json({ error: `Teks terlalu panjang (maksimum ${MAX_CONTENT.toLocaleString("id-ID")} karakter).` }, { status: 413 });
    }

    const base = {
      title,
      author: author || "Unknown",
      content,
      word_count: content.split(/\s+/).filter(Boolean).length,
    };

    let { data, error } = await supabase
      .from("texts")
      .insert({ ...base, is_public: false, owner_id: user.id })
      .select("id")
      .single();
    if (error && (error.code === "42703" || error.code === "PGRST204")) {
      ({ data, error } = await supabase.from("texts").insert({ ...base, is_public: true }).select("id").single());
    }

    if (error || !data) {
      console.error("POST /api/texts error:", error);
      return NextResponse.json({ error: "Gagal menyimpan teks." }, { status: 500 });
    }
    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("POST /api/texts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
