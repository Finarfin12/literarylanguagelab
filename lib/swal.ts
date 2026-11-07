"use client";

// Pembungkus SweetAlert2 untuk konfirmasi dan pemberitahuan singkat (toast). Gaya mengikuti token di app/globals.css (.swal2-*).
import Swal from "sweetalert2";

type ConfirmOptions = {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  /** Tindakan merusak (hapus): tombol konfirmasi berwarna bahaya dan fokus awal di "Batal". */
  danger?: boolean;
};

/** Pengganti window.confirm: true bila pengguna menekan tombol konfirmasi. */
export async function confirmDialog({ title, text, confirmText = "Ya", cancelText = "Batal", danger = false }: ConfirmOptions): Promise<boolean> {
  const res = await Swal.fire({
    title,
    text,
    icon: danger ? "warning" : "question",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    // Nilai ini ditimpa token tema di globals.css; warna merah dikenali oleh aturan .swal2-confirm[style*="239, 68, 68"].
    confirmButtonColor: danger ? "#ef4444" : "#22804f",
    focusCancel: danger,
    reverseButtons: true,
  });
  return res.isConfirmed;
}

/** Pemberitahuan singkat di pojok layar (hasil aksi). Menghilang sendiri; tidak memblokir. */
export function notify(tone: "ok" | "error" | "info", text: string) {
  void Swal.fire({
    toast: true,
    position: "top-end",
    icon: tone === "ok" ? "success" : tone,
    title: text,
    showConfirmButton: false,
    timer: Math.max(tone === "error" ? 6000 : 3500, text.length * 70),
    timerProgressBar: true,
  });
}

type NoticeValue = { tone: "ok" | "error"; text: string } | null;

/** Pengganti useState untuk pesan hasil aksi: setMessage({tone,text}) menampilkan toast; setMessage(null) tidak melakukan apa pun. */
export function useNotice(): (value: NoticeValue) => void {
  return (value) => {
    if (value) notify(value.tone, value.text);
  };
}
