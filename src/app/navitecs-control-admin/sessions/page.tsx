import AdminShell from "@/components/admin/AdminShell";
import SessionsClient from "@/components/admin/SessionsClient";

export const metadata = { title: "Sessions" };

export default function SessionsPage() {
  return (
    <AdminShell>
      <SessionsClient />
    </AdminShell>
  );
}
