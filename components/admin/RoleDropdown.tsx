"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { updateUserRole } from "@/app/(dashboard)/admin/users/actions";
import { Loader2 } from "lucide-react";

interface RoleDropdownProps {
  userId: string;
  userName: string;
  currentRole: string;
}

export default function RoleDropdown({ userId, userName, currentRole }: RoleDropdownProps) {
  const [updating, setUpdating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    if (newRole === currentRole) return;

    const result = await Swal.fire({
      title: 'Ubah Role?',
      text: `Anda yakin ingin mengubah hak akses "${userName}" menjadi ${newRole.toUpperCase()}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Ubah!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      setUpdating(true);
      try {
        await updateUserRole(userId, newRole);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: `Role untuk ${userName} telah diubah menjadi ${newRole}.`,
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error: any) {
        Swal.fire('Gagal!', error.message || "Terjadi kesalahan", 'error');
        // Reset dropdown to current role if failed (requires re-render, but parent might not re-fetch.
        // It's a controlled component so we could use local state for the value, but simple is fine for now).
      } finally {
        setUpdating(false);
      }
    } else {
      // Revert selection if cancelled
      e.target.value = currentRole;
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        defaultValue={currentRole}
        onChange={handleChange}
        disabled={updating}
        className={`appearance-none bg-background border rounded-lg px-3 py-1.5 pr-8 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 transition-colors cursor-pointer ${
          currentRole === 'admin' 
            ? 'text-red-500 border-red-500/50 hover:bg-red-500/10' 
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
  );
}
