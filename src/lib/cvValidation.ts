import "server-only";
import crypto from "crypto";

// PDF magic bytes — first 5 bytes must be "%PDF-"
const PDF_MAGIC = Buffer.from("%PDF-", "ascii");

export const CV_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Extensions that are dangerous if hidden before ".pdf" (double-extension attack)
const DANGEROUS_STEM_PATTERN =
  /\.(php\d?|phtml|asp|aspx|jsp|jspx|py|rb|pl|sh|bash|cgi|exe|bat|cmd|com|msi|dll|so|jar|html?|svg|xml|js|ts|mjs|vbs|ps1|hta)$/i;

export type CvValidationResult = { ok: true } | { ok: false; error: string };

/**
 * Validate a CV upload:
 *   1. Size (double-checked against the actual buffer)
 *   2. Extension — must end in ".pdf", case-insensitive
 *   3. Double-extension attack (e.g. evil.php.pdf)
 *   4. MIME type reported by browser (weak, but one layer)
 *   5. Magic bytes — the authoritative check
 */
export function validateCvUpload(
  file: { name: string; type: string; size: number },
  buffer: Buffer,
): CvValidationResult {
  // 1. Size — check both the reported size and the actual buffer length
  if (file.size > CV_MAX_SIZE_BYTES || buffer.length > CV_MAX_SIZE_BYTES) {
    return { ok: false, error: "File too large (max 5 MB)" };
  }

  // 2. Extension
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, error: "Only PDF files are accepted" };
  }

  // 3. Double-extension: strip ".pdf" and check if anything dangerous remains
  const stem = file.name.slice(0, -4);
  if (DANGEROUS_STEM_PATTERN.test(stem)) {
    return { ok: false, error: "Invalid file" };
  }

  // 4. Reported MIME type (browser-supplied, easily spoofed — just one extra layer)
  if (file.type !== "application/pdf") {
    return { ok: false, error: "Only PDF files are accepted" };
  }

  // 5. Magic bytes — only reliable check; must start with "%PDF-"
  if (buffer.length < 5 || !buffer.subarray(0, 5).equals(PDF_MAGIC)) {
    return { ok: false, error: "File does not appear to be a valid PDF" };
  }

  return { ok: true };
}

/** Generate a random UUID-only disk filename. The original name never touches disk. */
export function generateSafeCvFilename(): string {
  return `${crypto.randomUUID()}.pdf`;
}

