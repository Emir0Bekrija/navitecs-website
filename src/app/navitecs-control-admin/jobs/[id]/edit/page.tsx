import AdminShell from "@/components/admin/AdminShell";
import JobFormClient from "@/components/admin/JobFormClient";

type Props = { params: Promise<{ id: string }> };

export default async function EditJobPage({ params }: Props) {
  const { id } = await params;
  return (
    <AdminShell>
      <JobFormClient jobId={id} />
    </AdminShell>
  );
}
