import AdminShell from "@/components/admin/AdminShell";
import UsersClient from "@/components/admin/UsersClient";

export const metadata = { title: "Users" };

export default function UsersPage() {
  return (
    <AdminShell>
      <UsersClient />
    </AdminShell>
  );
}
