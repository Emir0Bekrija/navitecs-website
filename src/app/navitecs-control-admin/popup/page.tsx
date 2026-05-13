import AdminShell from "@/components/admin/AdminShell";
import PopupSettingsClient from "@/components/admin/PopupSettingsClient";

export const metadata = { title: "Popup Settings" };

export default function PopupPage() {
  return (
    <AdminShell>
      <PopupSettingsClient />
    </AdminShell>
  );
}
