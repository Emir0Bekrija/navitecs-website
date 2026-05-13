import { NextResponse } from "next/server";
import * as jobRepo from "@/lib/db/repositories/job";
import * as projectRepo from "@/lib/db/repositories/project";
import * as applicantRepo from "@/lib/db/repositories/applicant";
import * as companyContactRepo from "@/lib/db/repositories/companyContact";
import { requireAdmin } from "@/lib/proxy";

// GET /api/admin/dashboard/totals — static counts, not date-range dependent
export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    const [totalJobs, activeJobs, totalProjects, totalApplicants, totalCompanyContacts] =
      await Promise.all([
        jobRepo.count(),
        jobRepo.count({ active: true }),
        projectRepo.count(),
        applicantRepo.count(),
        companyContactRepo.count(),
      ]);

    return NextResponse.json({ totalJobs, activeJobs, totalProjects, totalApplicants, totalCompanyContacts });
  } catch (err) {
    console.error("[GET /api/admin/dashboard/totals]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
