import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as jobRepo from "@/lib/db/repositories/job";
import { requireAdmin } from "@/lib/proxy";
import { invalidatePrefix } from "@/lib/cache";
import { revalidatePath } from "next/cache";

const JobSchema = z.object({
  title: z.string().min(1).max(255),
  summary: z.string().min(1).max(500),
  department: z.string().min(1).max(100),
  location: z.string().min(1).max(100),
  type: z.string().min(1).max(50),
  description: z.string().min(1),
  requirements: z.array(z.string().max(200)).optional().default([]),
  active: z.coerce.boolean().optional().default(true),
  isGeneral: z.coerce.boolean().optional().default(false),
});

// GET /api/admin/jobs
export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const jobs = await jobRepo.findMany(undefined, { field: "order", dir: "ASC" });
  return NextResponse.json(jobs);
}

// POST /api/admin/jobs
export async function POST(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const body = await request.json();
  const parsed = JobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const maxOrder = await jobRepo.aggregateMaxOrder();
  const nextOrder = (maxOrder ?? -1) + 1;

  const id = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 36);

  const job = await jobRepo.create({ ...data, id, order: nextOrder });
  invalidatePrefix("jobs");
  revalidatePath("/careers");
  revalidatePath("/careers/apply");
  return NextResponse.json(job, { status: 201 });
}
