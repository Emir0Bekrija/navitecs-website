import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import * as applicationRepo from "@/lib/db/repositories/application";
import { requireAdmin } from "@/lib/proxy";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

/**
 * DELETE /api/admin/cv/bulk
 *
 * Deletes all CV files on disk where cvDeletable = true and cvPath is set,
 * then clears cvPath / cvFileName / cvDeletable in the DB.
 * Returns { deleted: number } — the count of files removed.
 */
export async function DELETE() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const applications = await applicationRepo.findDeletableCvs();

  let deleted = 0;

  await Promise.all(
    applications.map(async (app) => {
      if (!app.cvPath) return;

      const filePath = path.resolve(UPLOADS_DIR, app.cvPath);
      // Path traversal guard
      if (filePath.startsWith(UPLOADS_DIR + path.sep)) {
        await fs.unlink(filePath).catch(() => {});
      }
      deleted++;
    }),
  );

  // Clear all CV fields in one batch update
  if (applications.length > 0) {
    await applicationRepo.clearCvMany(applications.map((a) => a.id));
  }

  return NextResponse.json({ deleted });
}
