"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";
import { deleteText } from "@/app/(dashboard)/library/actions";

export default function DeleteTextButton({ textId, title }: { textId: string, title: string }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await Swal.fire({
      title: 'Hapus Teks?',
      text: `Anda yakin ingin menghapus "${title}" dari Library? Ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      setDeleting(true);
      try {
        const res = await deleteText(textId);
        if (res?.error) {
          Swal.fire('Gagal!', res.error, 'error');
        } else {
          Swal.fire('Terhapus!', 'Teks telah dihapus.', 'success');
        }
      } catch (error: any) {
        Swal.fire('Gagal!', error.message || "Terjadi kesalahan", 'error');
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={deleting}
      className="absolute top-4 right-4 p-2 bg-danger-tint text-danger rounded-full hover:bg-danger/90 hover:text-white transition-all z-20 disabled:opacity-50"
      title="Hapus (Admin Only)"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
