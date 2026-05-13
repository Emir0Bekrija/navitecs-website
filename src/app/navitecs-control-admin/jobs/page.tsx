import AdminShell from "@/components/admin/AdminShell";
import JobsClient from "@/components/admin/JobsClient";

export default function JobsPage() {
  return (
    <AdminShell>
      <JobsClient />
    </AdminShell>
  );
}
