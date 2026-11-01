"use client";

import { HelpCircle } from "lucide-react";
import Link from "next/link";

export default function HelpButton() {
  return (
    <Link
      href="/help"
      className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 p-4 bg-brand-solid text-on-brand rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
      title="Pusat Bantuan"
    >
      <HelpCircle className="w-6 h-6" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap text-sm font-bold">
        Bantuan
      </span>
    </Link>
  );
}
