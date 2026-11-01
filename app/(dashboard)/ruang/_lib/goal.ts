import { getRequestUser } from "@/utils/supabase/get-user";
import { isLearningGoal, type LearningGoal } from "@/lib/learning-goals";

/** Tujuan belajar pengguna untuk menandai ruang "Tujuanmu". Kolom dari migrasi 0006: jika belum ada, hasilnya null. */
export async function loadLearningGoal(): Promise<LearningGoal | null> {
  const { supabase, user } = await getRequestUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("learning_goal").eq("id", user.id).maybeSingle();
  if (error) return null;
  return isLearningGoal(data?.learning_goal) ? data.learning_goal : null;
}
