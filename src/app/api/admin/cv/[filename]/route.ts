import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import * as applicationRepo from "@/lib/db/repositories/application";
import { requireAdmin } from "@/lib/proxy";

// Base directory where CVs are stored — outside web root, never served statically
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
const CV_DIR = path.join(UPLOADS_DIR, "cvs");

// PDF magic bytes
const PDF_MAGIC = Buffer.from("%PDF-", "ascii");

type Params = { params: Promise<{ filename: string }> };

/**
 * GET /api/admin/cv/[appId]
 *
 * Serves a CV by application ID — the disk path is looked up from the DB,
 * so no disk filename is ever exposed in URLs or guessable by an attacker.
 *
 * Security layers:
 *  - Admin session required
 *  - Application ID looked up in DB (no user-controlled path)
 *  - cvPath verified to be within UPLOADS_DIR (path traversal guard)
 *  - Magic bytes re-verified on every serve (belt + suspenders)
 *  - Headers: nosniff, no-store, X-Frame-Options: DENY, CSP: sandbox, Content-Disposition: attachment
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { filename: appId } = await params;

  // Validate the ID is a plausible cuid/uuid — reject obviously wrong values early
  if (!appId || !/^[a-zA-Z0-9_-]{1,64}$/.test(appId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Look up the application — get cvPath and original filename from DB
  const application = await applicationRepo.findUnique(appId, ["cvPath", "cvFileName"]);

  if (!application || !application.cvPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Resolve the absolute path and verify it stays within UPLOADS_DIR
  // (defense against a corrupted/malicious cvPath value in the DB)
  const absolutePath = path.resolve(UPLOADS_DIR, application.cvPath);
  if (!absolutePath.startsWith(CV_DIR + path.sep) && absolutePath !== CV_DIR) {
    console.error(`[cv serve] Path traversal attempt — cvPath: ${application.cvPath}`);
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  // Verify the file ends with .pdf (should always be true for new records, and old ones were validated on upload)
  if (!absolutePath.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(absolutePath);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Re-verify magic bytes on every serve — ensures the stored file is actually a PDF
  if (buffer.length < 5 || !buffer.subarray(0, 5).equals(PDF_MAGIC)) {
    console.error(`[cv serve] Stored file failed magic byte check: ${absolutePath}`);
    return NextResponse.json({ error: "File is invalid" }, { status: 500 });
  }

  // Derive a safe display name from the original filename stored in DB.
  // Old records may have "1234567890-name.pdf" format — strip the timestamp prefix.
  // New records store the original name directly.
  const rawDisplayName = (application.cvFileName as string) ?? "cv.pdf";
  const displayName = rawDisplayName
    .replace(/^\d{10,}-/, "")               // strip legacy timestamp prefix
    .replace(/[^a-zA-Z0-9._\- ()]/g, "_")  // sanitize for Content-Disposition
    || "cv.pdf";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      // Force browser to download — prevents inline rendering of potentially malicious PDFs
      "Content-Disposition": `attachment; filename="${displayName}"`,
      "Content-Type":        "application/pdf",
      "Content-Length":      String(buffer.length),
      // Security headers
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options":        "DENY",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control":          "private, no-store",
      "Referrer-Policy":        "no-referrer",
    },
  });
}
