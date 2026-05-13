import { NextResponse } from "next/server";
import * as applicationRepo from "@/lib/db/repositories/application";
import * as applicantRepo from "@/lib/db/repositories/applicant";
import { requireAdmin } from "@/lib/proxy";

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

// GET /api/admin/applications/stale-count
// Returns the count of applications and applicants older than 12 months.
export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const cutoff = new Date(Date.now() - TWELVE_MONTHS_MS);

  const [staleApplications, recentApplicantIdsList] = await Promise.all([
    // All applications older than 12 months
    applicationRepo.count({ submittedAt: { lt: cutoff } }),
    // Applicants who have at least one RECENT application (should NOT be deleted)
    applicationRepo.findDistinctApplicantIds({
      submittedAt: { gte: cutoff },
      applicantId: { not: null },
    }),
  ]);

  const recentIds = new Set(recentApplicantIdsList);

  // Applicants whose every application is stale (no recent activity)
  const staleApplicants = await applicantRepo.countWithApplicationCondition(
    { notInIds: [...recentIds] },
    { submittedAt: { lt: cutoff } },
  );

  return NextResponse.json({ staleApplications, staleApplicants });
}
