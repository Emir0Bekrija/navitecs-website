import { NextResponse } from "next/server";
import * as contactRepo from "@/lib/db/repositories/contact";
import * as companyContactRepo from "@/lib/db/repositories/companyContact";
import { requireAdmin } from "@/lib/proxy";

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

// GET /api/admin/contacts/stale-count
// Returns the count of contacts and company contacts older than 12 months.
export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const cutoff = new Date(Date.now() - TWELVE_MONTHS_MS);

  const [staleContacts, recentCompanyContactIds] = await Promise.all([
    // All contacts older than 12 months
    contactRepo.count({ submittedAt: { lt: cutoff } }),
    // Company contacts with at least one RECENT contact submission
    contactRepo.findDistinctCompanyContactIds({
      submittedAt: { gte: cutoff },
      companyContactId: { not: null },
    }),
  ]);

  const recentIds = new Set(recentCompanyContactIds);

  // Company contacts with only stale submissions
  const staleCompanyContacts = await companyContactRepo.countWithContactCondition(
    [...recentIds],
    { submittedAt: { lt: cutoff } },
  );

  return NextResponse.json({ staleContacts, staleCompanyContacts });
}
