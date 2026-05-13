import "server-only";

// ── Magic byte signatures ──────────────────────────────────────────────────────
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_MAGIC  = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const RIFF_MAGIC = Buffer.from("RIFF", "ascii"); // WebP container: RIFF????WEBP
const WEBP_MAGIC = Buffer.from("WEBP", "ascii");

export type ImageFormat = "jpeg" | "png" | "webp";

export type ImageValidationResult =
  | { ok: true;  format: ImageFormat }
  | { ok: false; error: string };

export const IMAGE_MAX_INPUT_BYTES  = 10 * 1024 * 1024; // 10 MB raw upload
export const IMAGE_MAX_DIMENSION_PX = 4096;              // reject anything larger
export const IMAGE_OUTPUT_MAX_PX    = 2048;              // resize output to this

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const ALLOWED_MIMES      = new Set(["image/jpeg", "image/png", "image/webp"]);

// Double-extension attack: dangerous segment before the image extension
const DANGEROUS_STEM_RE =
  /\.(php\d?|phtml|asp|aspx|jsp|jspx|py|rb|pl|sh|bash|cgi|exe|bat|cmd|com|msi|dll|so|html?|svg|xml|js|ts|mjs|vbs|ps1|hta)$/i;

/**
 * Validate a raw image upload buffer.
 * Checks: size, extension, double-extension, MIME type (browser-reported), and magic bytes.
 * Magic bytes are the authoritative check — everything else is belt-and-suspenders.
 */
export function validateImageUpload(
  file: { name: string; type: string; size: number },
  buffer: Buffer,
): ImageValidationResult {
  // 1. Size
  if (file.size > IMAGE_MAX_INPUT_BYTES || buffer.length > IMAGE_MAX_INPUT_BYTES) {
    return { ok: false, error: "Image too large (max 10 MB)" };
  }

  // 2. Extension
  const lower = file.name.toLowerCase();
  const extMatch = lower.match(/\.[a-z0-9]+$/);
  if (!extMatch || !ALLOWED_EXTENSIONS.has(extMatch[0])) {
    return { ok: false, error: "Only JPEG, PNG, and WebP images are accepted" };
  }

  // 3. Double-extension: strip the image extension and check what remains
  const stem = file.name.slice(0, file.name.lastIndexOf("."));
  if (DANGEROUS_STEM_RE.test(stem)) {
    return { ok: false, error: "Invalid file" };
  }

  // 4. Reported MIME type (browser-supplied, easily spoofed — still one layer)
  if (!ALLOWED_MIMES.has(file.type)) {
    return { ok: false, error: "Only JPEG, PNG, and WebP images are accepted" };
  }

  // 5. Magic bytes — the only reliable check
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(JPEG_MAGIC)) {
    return { ok: true, format: "jpeg" };
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_MAGIC)) {
    return { ok: true, format: "png" };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).equals(RIFF_MAGIC) &&
    buffer.subarray(8, 12).equals(WEBP_MAGIC)
  ) {
    return { ok: true, format: "webp" };
  }

  return { ok: false, error: "File does not appear to be a valid image" };
}
