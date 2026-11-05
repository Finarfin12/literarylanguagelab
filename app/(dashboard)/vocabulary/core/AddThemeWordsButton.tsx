"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { addThemeWords } from "./actions";

/** Tambahkan kata satu tema ke Review (kata yang sudah dimiliki dilewati). */
export default function AddThemeWordsButton({ theme }: { theme: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const add = () => {
    setMessage("");
    startTransition(async () => {
      const res = await addThemeWords(theme);
      if (!res.ok) setMessage(res.error);
      else if (res.added === 0) setMessage("Semua kata di tema ini sudah ada di Bank Kosakata kamu.");
      else setMessage(`${res.added} kata ditambahkan ke Review.`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={add} loading={pending}>
        <Plus className="w-4 h-4" /> Tambah kata tema ini ke Review
      </Button>
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
