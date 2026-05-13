import { NextRequest, NextResponse } from "next/server";
import * as applicationRepo from "@/lib/db/repositories/application";
import { requireAdmin } from "@/lib/proxy";
import { tzStartOfDay, tzEndOfDay } from "@/lib/dateUtils";

const PAGE_SIZE = 20;

// GET /api/admin/applications
// Returns applicants grouped with their applications, ordered by most recent submission.
// Query params: jobId, dateFrom, dateTo, minScore, hasScore, page
export async function GET(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { searchParams } = request.nextUrl;
  const jobId    = searchParams.get("jobId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo   = searchParams.get("dateTo");
  const minScore = searchParams.get("minScore");
  // "yes" = must have a score, "no" = must not have a score, null = any
  const hasScore = searchParams.get("hasScore");
  // "yes" = application has a CV file, "no" = no CV file
  const hasCV    = searchParams.get("hasCV");
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  // Build dynamic WHERE conditions for raw SQL (to get applicants ordered by most recent submittedAt)
  const conditions: string[] = ["app.applicantId IS NOT NULL"];
  const condParams: unknown[] = [];

  if (jobId) { conditions.push("app.jobId = ?"); condParams.push(jobId); }
  if (dateFrom) { conditions.push("app.submittedAt >= ?"); condParams.push(tzStartOfDay(dateFrom)); }
  if (dateTo) { conditions.push("app.submittedAt <= ?"); condParams.push(tzEndOfDay(dateTo)); }
  if (minScore) { conditions.push("a.score >= ?"); condParams.push(parseInt(minScore, 10)); }
  if (hasScore === "yes") { conditions.push("a.score IS NOT NULL"); }
  if (hasScore === "no") { conditions.push("a.score IS NULL"); }
  if (hasCV === "yes") { conditions.push("app.cvPath IS NOT NULL"); }
  if (hasCV === "no") { conditions.push("app.cvPath IS NULL"); }
  if (hasCV === "deletable") { conditions.push("app.cvDeletable = 1 AND app.cvPath IS NOT NULL"); }

  try {
  // Get total count and ordered IDs in one raw query
  const { total, ids: orderedIds } = await applicationRepo.findApplicantIdsByApplications({
    conditions: { sql: conditions.join(" AND "), params: condParams },
    skip,
    take: PAGE_SIZE,
  });

  // Build application-level conditions (without applicant-level conditions like score)
  const appConditions: string[] = [];
  const appParams: unknown[] = [];
  if (jobId) { appConditions.push("app.`jobId` = ?"); appParams.push(jobId); }
  if (dateFrom) { appConditions.push("app.`submittedAt` >= ?"); appParams.push(tzStartOfDay(dateFrom)); }
  if (dateTo) { appConditions.push("app.`submittedAt` <= ?"); appParams.push(tzEndOfDay(dateTo)); }
  if (hasCV === "yes") { appConditions.push("app.`cvPath` IS NOT NULL"); }
  if (hasCV === "no") { appConditions.push("app.`cvPath` IS NULL"); }
  if (hasCV === "deletable") { appConditions.push("app.`cvDeletable` = 1 AND app.`cvPath` IS NOT NULL"); }

  // Fetch full applicant data for this page, preserving the SQL-determined order
  const applicantsMap = await applicationRepo.findApplicantsWithFilteredApplications(
    orderedIds,
    { sql: appConditions.join(" AND "), params: appParams },
  );

  // Restore the order from the raw query
  const applicantsById = new Map(applicantsMap.map((a) => [a.id, a]));
  const applicants = orderedIds.map((id) => applicantsById.get(id)).filter(Boolean);

  return NextResponse.json({
    data: applicants,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
  } catch (err) {
    console.error("[GET /api/admin/applications]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
