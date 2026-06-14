"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { updateUserRole } from "@/app/(dashboard)/admin/users/actions";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface RoleDropdownProps {
  userId: string;
  userName: string;
  currentRole: string;
}

export default function RoleDropdown({ userId, userName, currentRole }: RoleDropdownProps) {
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    if (newRole === currentRole) return;

    const actionText = newRole === 'banned' ? 'BANNED (Non-aktifkan)' : newRole.toUpperCase();
    const result = await Swal.fire({
      title: 'Ubah Status Akun?',
      text: `Anda yakin ingin mengubah status "${userName}" menjadi ${actionText}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newRole === 'banned' ? '#ef4444' : '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Ubah!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      setUpdating(true);
      try {
        if (newRole === 'banned') {
          await fetch('/api/admin/users/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ban', targetUserId: userId })
          });
        } else if (currentRole === 'banned' && newRole !== 'banned') {
          await fetch('/api/admin/users/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'unban', targetUserId: userId })
          });
          await updateUserRole(userId, newRole);
        } else {
          await updateUserRole(userId, newRole);
        }

        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: `Status untuk ${userName} telah diperbarui.`,
          timer: 2000,
          showConfirmButton: false
        });
        router.refresh();
      } catch (error: any) {
        Swal.fire('Gagal!', error.message || "Terjadi kesalahan", 'error');
      } finally {
        setUpdating(false);
      }
    } else {
      e.target.value = currentRole;
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Hapus Permanen?',
      text: `Data akun "${userName}" akan dihapus SELAMANYA dan tidak dapat dipulihkan. Lanjutkan?`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus Permanen!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      setUpdating(true);
      try {
        const res = await fetch('/api/admin/users/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', targetUserId: userId })
        });
        if (!res.ok) throw new Error("Gagal menghapus akun");

        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: `Akun ${userName} berhasil dihapus permanen.`,
          timer: 2000,
          showConfirmButton: false
        });
        router.refresh();
      } catch (error: any) {
        Swal.fire('Gagal!', error.message || "Terjadi kesalahan", 'error');
        setUpdating(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="relative inline-flex items-center">
        <select
          defaultValue={currentRole}
          onChange={handleChange}
          disabled={updating}
          className={`appearance-none bg-background border rounded-lg px-3 py-1.5 pr-8 text-[11px] font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 transition-colors cursor-pointer ${
            currentRole === 'admin' 
              ? 'text-red-500 border-red-500/50 hover:bg-red-500/10' 
              : currentRole === 'banned'
              ? 'text-gray-500 border-gray-500/50 hover:bg-gray-500/10 bg-gray-500/5'
              : currentRole === 'curator'
              ? 'text-purple-500 border-purple-500/50 hover:bg-purple-500/10'
              : currentRole === 'moderator'
              ? 'text-blue-500 border-blue-500/50 hover:bg-blue-500/10'
              : 'text-foreground border-border hover:bg-muted'
          }`}
        >
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="curator">Curator</option>
          <option value="admin">Admin</option>
          <option value="banned">Banned</option>
        </select>
        <div className="pointer-events-none absolute right-2 flex items-center">
          {updating ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : (
            <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
      
      <button 
        onClick={handleDelete}
        disabled={updating}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-500/70 hover:text-red-500 transition-colors px-2"
      >
        <Trash2 className="w-3 h-3" /> Hapus
      </button>
    </div>
  );
}
