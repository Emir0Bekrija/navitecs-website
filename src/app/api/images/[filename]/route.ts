import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const IMAGE_DIR = path.resolve(process.cwd(), "uploads", "images");

type Params = { params: Promise<{ filename: string }> };

/**
 * GET /api/images/[filename]
 *
 * Public image serving endpoint. No auth required — these are project images
 * visible to all site visitors, but we never expose disk paths in URLs.
 *
 * Security:
 *  - Only UUID.webp filenames accepted (strict regex)
 *  - Path traversal guard (resolved path must stay inside IMAGE_DIR)
 *  - Correct Content-Type with nosniff
 *  - CSP: default-src 'none' (images can't load sub-resources)
 *  - Long-lived immutable cache (UUID filenames never change content)
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { filename } = await params;

  // Only allow UUID-format WebP filenames — no path traversal, no other formats
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/.test(filename)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.resolve(IMAGE_DIR, filename);

  // Path traversal guard (belt and suspenders after the regex above)
  if (!filePath.startsWith(IMAGE_DIR + path.sep) && filePath !== IMAGE_DIR) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(filePath);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":             "image/webp",
      "Content-Length":           String(buffer.length),
      "X-Content-Type-Options":   "nosniff",
      "Content-Security-Policy":  "default-src 'none'",
      // Immutable cache: UUID filenames never have their content changed
      "Cache-Control":            "public, max-age=31536000, immutable",
      "Referrer-Policy":          "no-referrer",
    },
  });
}
