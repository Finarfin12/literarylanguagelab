"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { addNextCoreWords } from "./actions";
import { useToastOn } from "@/lib/swal";

export default function AddWordsButton({ level }: { level: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  useToastOn(message, "info");

  const add = () => {
    setMessage("");
    startTransition(async () => {
      const res = await addNextCoreWords(level);
      if (!res.ok) setMessage(res.error);
      else if (res.added === 0) setMessage("Semua kata di level ini sudah ada di Bank Kosakata kamu.");
      else setMessage(`${res.added} kata ditambahkan ke Review.`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={add} loading={pending}>
        <Plus className="w-4 h-4" /> Tambah 10 kata berikutnya ke Review
      </Button>
    </div>
  );
}
