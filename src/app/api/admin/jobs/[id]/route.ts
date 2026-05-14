import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as jobRepo from "@/lib/db/repositories/job";
import { requireAdmin } from "@/lib/proxy";
import { invalidatePrefix } from "@/lib/cache";
import { revalidatePath } from "next/cache";

type Params = { params: Promise<{ id: string }> };

const JobUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  summary: z.string().min(1).max(500).optional(),
  department: z.string().min(1).max(100).optional(),
  location: z.string().min(1).max(100).optional(),
  type: z.string().min(1).max(50).optional(),
  description: z.string().min(1).optional(),
  requirements: z.array(z.string().max(200)).optional(),
  active: z.coerce.boolean().optional(),
  isGeneral: z.coerce.boolean().optional(),
});

// GET /api/admin/jobs/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;
  const job = await jobRepo.findUnique(id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}

// PUT /api/admin/jobs/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;
  const body = await request.json();
  const parsed = JobUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const job = await jobRepo.update(id, parsed.data);
    invalidatePrefix("jobs");
    revalidatePath("/careers");
    revalidatePath("/careers/apply");
    return NextResponse.json(job);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

// DELETE /api/admin/jobs/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;
  const job = await jobRepo.findUnique(id, ["order"]);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await jobRepo.remove(id);
  await jobRepo.updateManyDecrement(job.order);

  invalidatePrefix("jobs");
  revalidatePath("/careers");
  revalidatePath("/careers/apply");
  return NextResponse.json({ ok: true });
}
