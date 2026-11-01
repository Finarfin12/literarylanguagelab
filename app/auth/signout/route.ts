import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ONBOARDED_COOKIE } from "@/lib/onboarding-cookie";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(ONBOARDED_COOKIE);
  redirect("/login");
}
