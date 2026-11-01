import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/ai/admin-client";

// Hapus akun sendiri lewat Admin API setelah konfirmasi email. Dipanggil dari Pengaturan → Hapus akun.
// Butuh SUPABASE_SERVICE_ROLE_KEY di server dan FK profiles.id -> auth.users ON DELETE CASCADE (migrasi 0011).
export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const body = await req.json().catch(() => null);
    const email = body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email !== (user.email ?? "").trim().toLowerCase()) {
      return NextResponse.json({ error: "Email konfirmasi tidak cocok" }, { status: 400 });
    }

    const admin = getServiceClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Penghapusan akun belum aktif di server ini (kunci layanan belum diatur). Hubungi admin." },
        { status: 503 }
      );
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("Gagal menghapus user:", error);
      return NextResponse.json(
        { error: "Gagal menghapus akun. Jika masalah berlanjut, hubungi admin (migrasi 0011 mungkin belum dijalankan)." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Akun berhasil dihapus secara permanen." });
  } catch (error: unknown) {
    console.error("Delete Account Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
