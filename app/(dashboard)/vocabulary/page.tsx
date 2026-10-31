import { createClient } from "@/utils/supabase/server";
import VocabularyBankClient from "@/components/vocabulary/VocabularyBankClient";

export default async function VocabularyPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: vocab, error } = await supabase
    .from("vocabulary")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <VocabularyBankClient initialVocab={vocab || []} />
    </div>
  );
}
