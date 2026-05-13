import "server-only";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

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

/**
 * Scan a file with ClamAV (tries clamdscan first, then clamscan).
 * Returns:
 *   { clean: true }              — file is clean
 *   { clean: false, threat }     — malware detected (file should be deleted)
 *   null                         — ClamAV not installed (caller should log and proceed)
 */
export async function scanWithClamAV(
  filePath: string,
): Promise<{ clean: boolean; threat?: string } | null> {
  for (const bin of ["clamdscan", "clamscan"]) {
    try {
      await execFileAsync(bin, ["--no-summary", filePath], { timeout: 30_000 });
      return { clean: true };
    } catch (err: unknown) {
      const e = err as { code?: number; stdout?: string };
      if (e.code === 1) {
        // Exit 1 = virus/PUA found
        const threat = String(e.stdout ?? "").trim() || "Unknown threat";
        return { clean: false, threat };
      }
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        continue; // binary not installed, try next
      }
      // Unexpected error (timeout, permissions, etc.) — skip scan, log
      console.warn(`[cvValidation] ${bin} scan error:`, err);
      return null;
    }
  }
  console.warn("[cvValidation] ClamAV not available — skipping malware scan");
  return null;
}

/**
 * Sanitize a PDF with Ghostscript (strips embedded JavaScript, AcroForms,
 * active content, external references by rendering to PDF 1.4).
 *
 * On success the sanitized PDF is written to outputPath.
 * Returns true on success, false if Ghostscript is unavailable or fails.
 */
export async function sanitizePdfWithGhostscript(
  inputPath: string,
  outputPath: string,
): Promise<boolean> {
  // Windows uses gswin64c (or gswin32c), *nix uses gs
  const gs = process.platform === "win32" ? "gswin64c" : "gs";
  try {
    await execFileAsync(
      gs,
      [
        "-dBATCH",
        "-dNOPAUSE",
        "-dQUIET",
        "-dSAFER",               // sandboxed execution — restricts file system access
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4", // PDF 1.4 has no JavaScript support — strips all active content
        "-dDetectDuplicateImages=true",
        `-sOutputFile=${outputPath}`,
        inputPath,
      ],
      { timeout: 60_000 },
    );
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.warn("[cvValidation] Ghostscript not found — skipping PDF sanitization");
    } else {
      console.warn("[cvValidation] Ghostscript error:", err);
    }
    return false;
  }
}
