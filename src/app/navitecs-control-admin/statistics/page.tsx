import AdminShell from "@/components/admin/AdminShell";
import StatisticsClient from "@/components/admin/StatisticsClient";

export const metadata = { title: "Statistics" };

export default function StatisticsPage() {
  return (
    <AdminShell>
      <StatisticsClient />
    </AdminShell>
  );
}
