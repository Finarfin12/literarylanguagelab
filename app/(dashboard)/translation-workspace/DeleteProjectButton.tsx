"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProject } from "./actions";

export default function DeleteProjectButton({ projectId, title }: { projectId: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!window.confirm(`Hapus proyek "${title}" beserta semua segmen dan anotasinya?`)) return;
    startTransition(async () => {
      await deleteProject(projectId);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      aria-label={`Hapus proyek ${title}`}
      className="min-h-[64px] min-w-[56px] flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
