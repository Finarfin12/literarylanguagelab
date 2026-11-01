"use client";

import { useEffect } from "react";

// Mendaftarkan public/sw.js (service worker manual, Fase 14e). Jika event "load" sudah lewat sebelum komponen ini
// aktif (hidrasi biasanya selesai setelah load), pendaftaran dilakukan langsung; kalau tidak, listener tidak pernah terpanggil.
export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("Service Worker gagal didaftarkan:", err);
      });
    };
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
