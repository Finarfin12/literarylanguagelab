"use client";

import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/primitives";

/** Tombol "Coba dengan contoh": mengisi input lewat `onFill`. Tidak mengirim apa pun ke AI. */
export default function TryExampleButton({
  example,
  onFill,
  className,
}: {
  example: string | undefined;
  onFill: (example: string) => void;
  className?: string;
}) {
  if (!example) return null;
  return (
    <Button type="button" variant="secondary" className={className} onClick={() => onFill(example)}>
      <Lightbulb className="w-4 h-4" /> Coba dengan contoh
    </Button>
  );
}
