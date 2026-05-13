import AdminShell from "@/components/admin/AdminShell";
import CompanyContactsClient from "@/components/admin/CompanyContactsClient";

export const metadata = { title: "Company Contacts — NAVITECS Admin" };

export default function CompanyContactsPage() {
  return (
    <AdminShell>
      <CompanyContactsClient />
    </AdminShell>
  );
}
