import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import * as applicationRepo from "@/lib/db/repositories/application";
import { requireAdmin } from "@/lib/proxy";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/applications/[id] — update cvDeletable flag
export async function PATCH(request: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;

  const body = await request.json();
  const parsed = z.object({ cvDeletable: z.coerce.boolean() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await applicationRepo.update(id, { cvDeletable: parsed.data.cvDeletable });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

// DELETE /api/admin/applications/[id] — delete full application record + CV file
export async function DELETE(_req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;

  const application = await applicationRepo.findUnique(id, ["cvPath"]);

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await applicationRepo.remove(id);

  if (application.cvPath) {
    const filePath = path.resolve(UPLOADS_DIR, application.cvPath);
    // Path traversal guard — ensure it stays inside uploads/
    if (filePath.startsWith(UPLOADS_DIR + path.sep)) {
      await fs.unlink(filePath).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
