import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as teamMemberRepo from "@/lib/db/repositories/teamMember";
import { requireAdmin } from "@/lib/proxy";
import { invalidate } from "@/lib/cache";

const ReorderSchema = z.object({
  ids: z.array(z.string()).min(1),
});

// POST /api/admin/team/reorder
export async function POST(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const body = await request.json();
  const parsed = ReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  }

  const { ids } = parsed.data;

  await teamMemberRepo.reorder(ids);

  invalidate("team:active");
  return NextResponse.json({ ok: true });
}
