import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const { action, targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing target user ID" }, { status: 400 });
    }

    // B-10: Admin cannot ban or delete themselves
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "Tidak dapat mengubah status atau menghapus akun Anda sendiri." },
        { status: 400 }
      );
    }

    // Initialize Supabase Admin API
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (action === "delete") {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      if (error) throw error;
      return NextResponse.json({ success: true, message: "User permanently deleted." });
    }

    if (action === "ban") {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        ban_duration: "87600h",
      });
      if (error) throw error;

      await supabaseAdmin.from("profiles").update({ role: "banned" }).eq("id", targetUserId);
      return NextResponse.json({ success: true, message: "User banned." });
    }

    if (action === "unban") {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        ban_duration: "none",
      });
      if (error) throw error;

      await supabaseAdmin.from("profiles").update({ role: "user" }).eq("id", targetUserId);
      return NextResponse.json({ success: true, message: "User unbanned." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Admin User Action Error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
