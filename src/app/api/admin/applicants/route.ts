import { NextRequest, NextResponse } from "next/server";
import * as applicantRepo from "@/lib/db/repositories/applicant";
import { requireAdmin } from "@/lib/proxy";
import { tzStartOfDay, tzEndOfDay } from "@/lib/dateUtils";

const PAGE_SIZE = 20;

// GET /api/admin/applicants
// Query params: minScore, fitsRoles, dateFrom, dateTo, page
export async function GET(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { searchParams } = request.nextUrl;
  const minScore = searchParams.get("minScore");
  const fitsRoles = searchParams.get("fitsRoles");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const where: {
    minScore?: number;
    fitsRoles?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = {
    ...(minScore ? { minScore: parseInt(minScore, 10) } : {}),
    ...(fitsRoles ? { fitsRoles } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: tzStartOfDay(dateFrom) } : {}),
            ...(dateTo ? { lte: tzEndOfDay(dateTo) } : {}),
          },
        }
      : {}),
  };

  try {
    const { total, applicants } = await applicantRepo.findManyWithApplications({
      where,
      orderBy: { field: "updatedAt", dir: "DESC" },
      skip,
      take: PAGE_SIZE,
    });

    return NextResponse.json({
      data: applicants,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    console.error("[GET /api/admin/applicants]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
