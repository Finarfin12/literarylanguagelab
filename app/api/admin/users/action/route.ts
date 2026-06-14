import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { action, targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing target user ID" }, { status: 400 });
    }

    // Initialize Supabase Admin API
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (action === 'delete') {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      if (error) throw error;
      return NextResponse.json({ success: true, message: "User permanently deleted." });
    }

    if (action === 'ban') {
      // Supabase ban (87600h = 10 years)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { ban_duration: '87600h' });
      if (error) throw error;
      
      // Also update role to banned in profiles for easy UI identification if we want
      await supabaseAdmin.from('profiles').update({ role: 'banned' }).eq('id', targetUserId);
      
      return NextResponse.json({ success: true, message: "User banned." });
    }

    if (action === 'unban') {
      // Remove ban duration
      const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { ban_duration: 'none' });
      if (error) throw error;
      
      // Revert role to user
      await supabaseAdmin.from('profiles').update({ role: 'user' }).eq('id', targetUserId);
      
      return NextResponse.json({ success: true, message: "User unbanned." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin User Action Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
