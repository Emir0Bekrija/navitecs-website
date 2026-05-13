import AdminShell from "@/components/admin/AdminShell";
import TeamFormClient from "@/components/admin/TeamFormClient";

type Props = { params: Promise<{ id: string }> };

export default async function EditTeamMemberPage({ params }: Props) {
  const { id } = await params;
  return (
    <AdminShell>
      <TeamFormClient memberId={id} />
    </AdminShell>
  );
}
