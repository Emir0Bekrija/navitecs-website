import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { requireAdmin } from "@/lib/proxy";
import {
  validateImageUpload,
  IMAGE_MAX_INPUT_BYTES,
  IMAGE_MAX_DIMENSION_PX,
  IMAGE_OUTPUT_MAX_PX,
} from "@/lib/imageValidation";

const IMAGE_DIR = path.resolve(process.cwd(), "uploads", "images");

/**
 * POST /api/admin/images
 *
 * Secure image upload for project pages (featured images, content blocks).
 * Admin session required.
 *
 * Security layers:
 *  1. Admin auth
 *  2. Rate limiting (inherited from middleware / global layer)
 *  3. Extension + MIME + double-extension + magic bytes validation
 *  4. sharp processing:
 *     - Rejects files that aren't real images (sharp will throw)
 *     - Strips ALL metadata (EXIF, GPS, XMP, ICC profiles, comments)
 *     - Enforces max input dimensions (rejects polyglot/bomb images)
 *     - Re-encodes to WebP (safe output format, no script support)
 *     - Resizes to max 2048 × 2048, never upscales
 *  5. UUID-only disk filename — original name never touches the filesystem
 *  6. Stored outside public/ — served only through /api/images/[filename]
 *
 * Returns: { url: "/api/images/{uuid}.webp" }
 */
export async function POST(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Early size guard before reading into memory
    if (file.size > IMAGE_MAX_INPUT_BYTES) {
      return NextResponse.json({ error: "Image too large (max 10 MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate: extension, MIME, double-extension attack, magic bytes
    const validation = validateImageUpload(
      { name: file.name, type: file.type, size: file.size },
      buffer,
    );
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Process with sharp
    // This ALSO serves as a second layer of format verification:
    // if the buffer isn't a real image, sharp will throw before we write anything.
    let sharpInstance = sharp(buffer, { failOn: "error" });

    // Check actual pixel dimensions before processing
    const metadata = await sharpInstance.metadata();
    const { width = 0, height = 0 } = metadata;

    if (width > IMAGE_MAX_DIMENSION_PX || height > IMAGE_MAX_DIMENSION_PX) {
      return NextResponse.json(
        { error: `Image dimensions too large (max ${IMAGE_MAX_DIMENSION_PX}×${IMAGE_MAX_DIMENSION_PX}px)` },
        { status: 400 },
      );
    }

    // Re-encode to WebP:
    //  - withMetadata(false) — strips all EXIF, GPS, XMP, ICC, comments
    //  - resize — downscale if needed, never upscale
    //  - WebP has no concept of embedded scripts, unlike SVG or certain JPEG exploits
    // Re-encode to WebP — sharp strips ALL metadata by default (EXIF, GPS, XMP, ICC)
    // withoutEnlargement: never upscale, only downscale to IMAGE_OUTPUT_MAX_PX
    const processedBuffer = await sharpInstance
      .resize(IMAGE_OUTPUT_MAX_PX, IMAGE_OUTPUT_MAX_PX, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    // UUID-only filename — original name never hits the filesystem
    const filename = `${crypto.randomUUID()}.webp`;
    const diskPath = path.join(IMAGE_DIR, filename);

    await fs.mkdir(IMAGE_DIR, { recursive: true });
    await fs.writeFile(diskPath, processedBuffer);

    return NextResponse.json({ url: `/api/images/${filename}` });
  } catch (err) {
    // sharp throws on corrupt/malicious "images" — treat as invalid file
    console.error("[POST /api/admin/images]", err);
    return NextResponse.json({ error: "Invalid or corrupt image file" }, { status: 400 });
  }
}
