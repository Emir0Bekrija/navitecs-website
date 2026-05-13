import { NextRequest, NextResponse } from "next/server";
import * as contactRepo from "@/lib/db/repositories/contact";
import { requireAdmin } from "@/lib/proxy";
import { tzStartOfDay, tzEndOfDay } from "@/lib/dateUtils";

// GET /api/admin/contacts
// Query params: email, name, projectType, service, dateFrom, dateTo
export async function GET(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { searchParams } = request.nextUrl;
  const email = searchParams.get("email");
  const name = searchParams.get("name");
  const projectType = searchParams.get("projectType");
  const service = searchParams.get("service");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const contacts = await contactRepo.findMany({
    where: {
      ...(email ? { email } : {}),
      ...(name ? { name } : {}),
      ...(projectType ? { projectType } : {}),
      ...(service ? { service } : {}),
      ...(searchParams.get("projectServices")
        ? { projectServices: searchParams.get("projectServices")! }
        : {}),
      ...(dateFrom || dateTo
        ? {
            submittedAt: {
              ...(dateFrom ? { gte: tzStartOfDay(dateFrom) } : {}),
              ...(dateTo ? { lte: tzEndOfDay(dateTo) } : {}),
            },
          }
        : {}),
    },
    includeCompanyContact: true,
    orderBy: { field: "submittedAt", dir: "DESC" },
  });

  return NextResponse.json(contacts);
}
