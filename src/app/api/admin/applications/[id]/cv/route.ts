import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import * as applicationRepo from "@/lib/db/repositories/application";
import { requireAdmin } from "@/lib/proxy";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

type Params = { params: Promise<{ id: string }> };

/**
 * DELETE /api/admin/applications/[id]/cv
 *
 * Deletes the CV file from disk and clears cvPath + cvFileName in the DB.
 * The application record itself is kept intact.
 * Only allowed when cvDeletable = true.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;

  const application = await applicationRepo.findUnique(id, ["cvPath", "cvDeletable"]);

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!application.cvDeletable) {
    return NextResponse.json(
      { error: "CV deletion not enabled for this application" },
      { status: 403 },
    );
  }

  if (!application.cvPath) {
    return NextResponse.json({ error: "No CV file to delete" }, { status: 404 });
  }

  // Delete from disk — path traversal guard
  const filePath = path.resolve(UPLOADS_DIR, application.cvPath);
  if (filePath.startsWith(UPLOADS_DIR + path.sep)) {
    await fs.unlink(filePath).catch(() => {
      // File may already be missing — not an error
    });
  }

  // Clear CV fields in DB — application record stays
  await applicationRepo.update(id, { cvPath: null, cvFileName: null, cvDeletable: false });

  return NextResponse.json({ ok: true });
}
