import type { Metadata } from "next";
import * as jobRepo from "@/lib/db/repositories/job";
import ApplyClient from "../../../components/pages/ApplyClient";
import { BASE_URL } from "@/lib/baseUrl";
import { cached } from "@/lib/cache";

export const metadata: Metadata = {
  title: "Apply Now",
  description: "Submit your application to join NAVITECS. We are looking for talented engineers, BIM coordinators, and design professionals to join our growing team in Sarajevo.",
  alternates: { canonical: `${BASE_URL}/careers/apply` },
  openGraph: {
    title: "Apply Now | NAVITECS",
    description: "Submit your application to join NAVITECS. We are looking for talented engineers, BIM coordinators, and design professionals.",
    url: `${BASE_URL}/careers/apply`,
  },
};

type Props = { searchParams: Promise<{ role?: string; jobId?: string }> };

export type JobDetails = {
  title: string;
  summary: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
};

export default async function Page({ searchParams }: Props) {
  const { role, jobId } = await searchParams;

  let jobDetails: JobDetails | null = null;
  if (jobId) {
    const job = await cached(`jobs:detail:${jobId}`, () =>
      jobRepo.findUnique(jobId, ["title", "summary", "department", "location", "type", "description", "requirements"]),
    );
    if (job) jobDetails = { ...job, requirements: (job.requirements as string[]) ?? [] };
  }

  return (
    <ApplyClient
      initialRole={role ?? ""}
      initialJobId={jobId ?? ""}
      jobDetails={jobDetails}
    />
  );
}
