import AdminShell from "@/components/admin/AdminShell";
import DashboardClient from "@/components/admin/DashboardClient";

export default function DashboardPage() {
  return (
    <AdminShell>
      <DashboardClient />
    </AdminShell>
  );
}
