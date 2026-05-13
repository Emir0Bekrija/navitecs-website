import AdminShell from "@/components/admin/AdminShell";
import AuditLogClient from "@/components/admin/AuditLogClient";

export const metadata = { title: "Audit Log" };

export default function AuditLogPage() {
  return (
    <AdminShell>
      <AuditLogClient />
    </AdminShell>
  );
}
