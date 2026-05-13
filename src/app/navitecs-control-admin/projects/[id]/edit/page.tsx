import AdminShell from "@/components/admin/AdminShell";
import ProjectFormClient from "@/components/admin/ProjectFormClient";

type Props = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  return (
    <AdminShell>
      <ProjectFormClient projectId={id} />
    </AdminShell>
  );
}
