"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserRole(targetUserId: string, newRole: string) {
  const supabase = await createClient();
  
  // 1. Get current logged in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  // 2. Verify current user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profile?.role !== 'admin') {
    throw new Error("Admin privileges required to perform this action.");
  }

  // 3. Prevent admin from demoting themselves (optional safeguard)
  if (user.id === targetUserId && newRole !== 'admin') {
    throw new Error("You cannot change your own admin role.");
  }

  // 4. Update the role
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId);

  if (error) {
    console.error("updateUserRole error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
  return { success: true };
}
