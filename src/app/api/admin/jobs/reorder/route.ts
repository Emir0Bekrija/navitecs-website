import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as jobRepo from "@/lib/db/repositories/job";
import { requireAdmin } from "@/lib/proxy";
import { invalidatePrefix } from "@/lib/cache";
import { revalidatePath } from "next/cache";

const ReorderSchema = z.object({
  ids: z.array(z.string()).min(1),
});

// POST /api/admin/jobs/reorder
// Body: { ids: string[] } — full ordered list of job IDs
export async function POST(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const body = await request.json();
  const parsed = ReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  }

  const { ids } = parsed.data;

  await jobRepo.reorder(ids);

  invalidatePrefix("jobs");
  revalidatePath("/careers");
  revalidatePath("/careers/apply");
  return NextResponse.json({ ok: true });
}
