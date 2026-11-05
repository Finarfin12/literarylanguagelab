import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import TextDisplay from "@/components/reader/TextDisplay";

export default async function ReadTextPage({ params }: { params: Promise<{ textId: string }> }) {
  const supabase = await createClient();
  const { textId } = await params;

  // Fetch text
  const { data: text, error } = await supabase
    .from("texts")
    .select("*")
    .eq("id", textId)
    .single();

  if (error || !text) {
    notFound();
  }

  return (
    <div className="h-full bg-background">
      <TextDisplay 
        textId={text.id}
        title={text.title}
        author={text.author}
        content={text.content}
      />
    </div>
  );
}
