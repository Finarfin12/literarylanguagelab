import { redirect } from "next/navigation";

// Tab Ringkasan menyusul di Fase 6; sementara arahkan ke Pengguna.
export default function AdminIndexPage() {
  redirect("/admin/users");
}
