import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkIpRateLimit } from "@/lib/rate-limit";
import { detectIdiomsInText } from "@/lib/idioms/detect";
import { MAX_TEXT_LENGTH } from "@/lib/idioms";

// Deteksi idiom ±180 frasa TANPA AI (pencocokan pola lokal, lib/idioms). Karena tidak memanggil AI, limiter-nya ringan
// dan tidak menulis ai_usage_logs / memakan kuota AI pengguna.
export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const limited = await checkIpRateLimit(`user:${user.id}`, 120);
    if (limited) return limited;

    const body = await req.json().catch(() => null);
    const text = body && typeof body.text === "string" ? body.text : "";
    if (!text.trim()) return NextResponse.json({ error: "Text is required" }, { status: 400 });
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: `Teks terlalu panjang (maksimum ${MAX_TEXT_LENGTH} karakter).` }, { status: 413 });
    }

    return NextResponse.json({ idioms: detectIdiomsInText(text) });
  } catch (err: unknown) {
    console.error("Idiom detection error:", err);
    return NextResponse.json({ error: "Detection failed" }, { status: 500 });
  }
}
