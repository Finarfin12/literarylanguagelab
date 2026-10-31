import { requireAdminPage } from "./_lib/guard";
import AdminTabs from "./AdminTabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();

  return (
    <div className="flex flex-col min-h-full">
      <AdminTabs />
      <div className="flex-1">{children}</div>
    </div>
  );
}
