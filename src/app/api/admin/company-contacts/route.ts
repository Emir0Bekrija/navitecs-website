import { NextRequest, NextResponse } from "next/server";
import * as companyContactRepo from "@/lib/db/repositories/companyContact";
import { requireAdmin } from "@/lib/proxy";

const PAGE_SIZE = 20;

// GET /api/admin/company-contacts
// Query params: name, email, company, minScore, dateFrom, dateTo, page
export async function GET(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name");
  const email = searchParams.get("email");
  const minScore = searchParams.get("minScore");
  const hasScore = searchParams.get("hasScore");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  try {
    const { total, companyContacts } = await companyContactRepo.findManyWithContacts({
      where: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        ...(minScore ? { minScore: parseInt(minScore, 10) } : {}),
        ...(hasScore ? { hasScore } : {}),
      },
      orderBy: { field: "updatedAt", dir: "DESC" },
      skip,
      take: PAGE_SIZE,
    });

    return NextResponse.json({
      data: companyContacts,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    console.error("[GET /api/admin/company-contacts]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
