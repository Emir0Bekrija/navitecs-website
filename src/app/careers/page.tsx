import type { Metadata } from "next";
import CareersClient from "../../components/pages/CareersClient";
import * as jobRepo from "@/lib/db/repositories/job";
import { BASE_URL } from "@/lib/baseUrl";
import { cached } from "@/lib/cache";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the NAVITECS engineering team. Browse open positions in BIM coordination, MEP design, and architectural engineering. Apply today and help shape the future of building development.",
  alternates: {
    canonical: `${BASE_URL}/careers`,
  },
  openGraph: {
    title: "Careers | NAVITECS",
    description:
      "Join the NAVITECS engineering team. Browse open positions in BIM coordination, MEP design, and architectural engineering.",
    url: `${BASE_URL}/careers`,
  },
};

export default async function Page() {
  let rows: Awaited<ReturnType<typeof jobRepo.findMany>> = [];
  let generalJob: Awaited<ReturnType<typeof jobRepo.findFirst>> = null;

  try {
    [rows, generalJob] = await Promise.all([
      cached("jobs:active", () =>
        jobRepo.findMany({ active: true, isGeneral: false }, { field: "order", dir: "ASC" }),
      ),
      cached("jobs:general", () =>
        jobRepo.findFirst({ isGeneral: true, active: true }),
      ),
    ]);
  } catch {
    // DB may be unavailable during build — page will regenerate on first request
  }

  const jobs = rows.map((j) => ({
    id: j.id,
    title: j.title,
    department: j.department,
    location: j.location,
    type: j.type,
    description: j.description,
    summary: j.summary,
    active: j.active,
    isGeneral: j.isGeneral,
    createdAt: j.createdAt.toISOString(),
  }));

  const jobPostingSchema = rows
    .filter((j) => !j.isGeneral)
    .map((j) => ({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: j.title,
      description: j.summary || j.description,
      datePosted: j.createdAt.toISOString().split("T")[0],
      employmentType: j.type === "Full-time" ? "FULL_TIME" : j.type === "Part-time" ? "PART_TIME" : j.type,
      jobLocation: {
        "@type": "Place",
        address: j.location,
      },
      hiringOrganization: {
        "@type": "Organization",
        name: "NAVITECS",
        sameAs: BASE_URL,
      },
      directApply: true,
    }));

  return (
    <>
      {jobPostingSchema.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
        />
      )}
      <CareersClient initialJobs={jobs} generalJobId={generalJob?.id ?? null} />
    </>
  );
}
