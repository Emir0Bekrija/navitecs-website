import { NextRequest, NextResponse } from "next/server";
import * as teamMemberRepo from "@/lib/db/repositories/teamMember";

// GET /api/team — public, returns active team members
export async function GET(request: NextRequest) {
  const featured = request.nextUrl.searchParams.get("featured");

  const members = await teamMemberRepo.findMany(
    { active: true, ...(featured === "true" ? { featured: true } : {}) },
    { field: "order", dir: "ASC" },
  );

  return NextResponse.json(members);
}
