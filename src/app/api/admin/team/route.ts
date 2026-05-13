import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as teamMemberRepo from "@/lib/db/repositories/teamMember";
import { requireAdmin } from "@/lib/proxy";
import { invalidate } from "@/lib/cache";

const TeamMemberSchema = z.object({
  name: z.string().min(1).max(255),
  role: z.string().min(1).max(255),
  bio: z.string().max(2000).optional().default(""),
  imageUrl: z.string().max(500).optional().default(""),
  featured: z.coerce.boolean().optional().default(false),
  active: z.coerce.boolean().optional().default(true),
});

// GET /api/admin/team
export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const members = await teamMemberRepo.findMany(undefined, { field: "order", dir: "ASC" });
  return NextResponse.json(members);
}

// POST /api/admin/team
export async function POST(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const body = await request.json();
  const parsed = TeamMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const maxOrder = await teamMemberRepo.aggregateMaxOrder();
  const nextOrder = (maxOrder ?? -1) + 1;

  const member = await teamMemberRepo.create({ ...parsed.data, order: nextOrder });
  invalidate("team:active");
  return NextResponse.json(member, { status: 201 });
}
