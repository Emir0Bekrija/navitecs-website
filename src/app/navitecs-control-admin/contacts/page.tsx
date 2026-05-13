import AdminShell from "@/components/admin/AdminShell";
import ContactsClient from "@/components/admin/ContactsClient";

export default function ContactsPage() {
  return (
    <AdminShell>
      <ContactsClient />
    </AdminShell>
  );
}
