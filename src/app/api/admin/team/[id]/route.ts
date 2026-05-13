import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as teamMemberRepo from "@/lib/db/repositories/teamMember";
import { requireAdmin } from "@/lib/proxy";
import { invalidate } from "@/lib/cache";
import fs from "fs/promises";
import path from "path";

const IMAGE_DIR = path.resolve(process.cwd(), "uploads", "images");

function extractImageFilename(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/^\/api\/images\/([0-9a-f-]+\.webp)$/i);
  return match ? match[1] : null;
}

type Params = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.string().min(1).max(255).optional(),
  bio: z.string().max(2000).optional(),
  imageUrl: z.string().max(500).optional(),
  featured: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
});

// GET /api/admin/team/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;
  const member = await teamMemberRepo.findUnique(id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(member);
}

// PUT /api/admin/team/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;
  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const oldMember = await teamMemberRepo.findUnique(id);

    const member = await teamMemberRepo.update(id, parsed.data);

    // Delete old image file if it was replaced or cleared
    if (oldMember && oldMember.imageUrl !== member.imageUrl) {
      const oldFile = extractImageFilename(oldMember.imageUrl);
      if (oldFile) {
        await fs.unlink(path.join(IMAGE_DIR, oldFile)).catch(() => {});
      }
    }

    invalidate("team:active");
    return NextResponse.json(member);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

// DELETE /api/admin/team/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;
  const member = await teamMemberRepo.findUnique(id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await teamMemberRepo.remove(id);
  await teamMemberRepo.updateManyDecrement(member.order);

  // Delete image file from disk
  const filename = extractImageFilename(member.imageUrl);
  if (filename) {
    await fs.unlink(path.join(IMAGE_DIR, filename)).catch(() => {});
  }

  invalidate("team:active");
  return NextResponse.json({ ok: true });
}
