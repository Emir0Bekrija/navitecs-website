import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import * as applicantRepo from "@/lib/db/repositories/applicant";
import * as applicationRepo from "@/lib/db/repositories/application";
import * as jobRepo from "@/lib/db/repositories/job";
import { adminEvents } from "@/lib/events";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import {
  validateCvUpload,
  generateSafeCvFilename,
  scanWithClamAV,
  sanitizePdfWithGhostscript,
  CV_MAX_SIZE_BYTES,
} from "@/lib/cvValidation";

// CV files are stored outside the web root — never served statically
const CV_DIR = path.join(process.cwd(), "uploads", "cvs");

const ApplySchema = z.object({
  firstName:          z.string().min(1).max(100),
  lastName:           z.string().max(100).default(""),
  email:              z.string().email().max(200),
  phone:              z.string().max(50).default(""),
  role:               z.string().min(1).max(200),
  linkedin:           z.string().max(300).default(""),
  portfolio:          z.string().max(300).default(""),
  message:            z.string().max(5000).default(""),
  jobId:              z.string().max(36).optional(),
  currentlyEmployed:  z.enum(["yes", "no"]).optional(),
  noticePeriod:       z.string().max(50).optional(),
  yearsOfExperience:  z.string().max(20).optional(),
  location:           z.string().max(255).optional(),
  bimSoftware:        z.string().max(500).optional(),
  // Legal consent — the string "true" means the box was checked
  consentDataSharing: z.string().optional().transform(v => v === "true"),
  consentFutureUse:   z.string().optional().transform(v => v === "true"),
});

// POST /api/apply — public job application (multipart/form-data)
export async function POST(request: NextRequest) {
  const { ok: rateLimitOk, retryAfter } = rateLimit(
    `apply:${getClientIp(request.headers)}`,
    3,               // 3 applications
    60 * 60 * 1000,  // per hour
  );
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a while before trying again." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  try {
    const formData = await request.formData();

    const fields = {
      firstName:          String(formData.get("firstName") ?? ""),
      lastName:           String(formData.get("lastName") ?? ""),
      email:              String(formData.get("email") ?? ""),
      phone:              String(formData.get("phone") ?? ""),
      role:               String(formData.get("role") ?? ""),
      linkedin:           String(formData.get("linkedin") ?? ""),
      portfolio:          String(formData.get("portfolio") ?? ""),
      message:            String(formData.get("message") ?? ""),
      jobId:              String(formData.get("jobId") ?? "") || undefined,
      currentlyEmployed:  String(formData.get("currentlyEmployed") ?? "") || undefined,
      noticePeriod:       String(formData.get("noticePeriod") ?? "") || undefined,
      yearsOfExperience:  String(formData.get("yearsOfExperience") ?? "") || undefined,
      location:           String(formData.get("location") ?? "") || undefined,
      bimSoftware:        String(formData.get("bimSoftware") ?? "") || undefined,
      consentDataSharing: String(formData.get("consentDataSharing") ?? ""),
      consentFutureUse:   String(formData.get("consentFutureUse") ?? ""),
    };

    const parsed = ApplySchema.safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Both legal consent checkboxes are mandatory
    if (!data.consentDataSharing || !data.consentFutureUse) {
      return NextResponse.json(
        { error: "Both consent checkboxes must be accepted before submitting." },
        { status: 400 },
      );
    }

    // ── CV upload ─────────────────────────────────────────────────────────────
    let cvFileName: string | null = null; // original filename — display only, never used as path
    let cvPath: string | null = null;     // relative path to the UUID-named file on disk

    const cvFile = formData.get("cv") as File | null;

    if (cvFile && cvFile.size > 0) {
      // Early size guard before reading the whole file into memory
      if (cvFile.size > CV_MAX_SIZE_BYTES) {
        return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
      }

      // Read buffer — authoritative for all subsequent checks
      const buffer = Buffer.from(await cvFile.arrayBuffer());

      // Validate: extension, MIME, double-extension attack, magic bytes
      const validation = validateCvUpload(
        { name: cvFile.name, type: cvFile.type, size: cvFile.size },
        buffer,
      );
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Generate a UUID-only disk filename — original name never touches the filesystem
      const diskFilename = generateSafeCvFilename();
      const diskPath = path.join(CV_DIR, diskFilename);

      await fs.mkdir(CV_DIR, { recursive: true });
      await fs.writeFile(diskPath, buffer);

      // ── ClamAV scan ─────────────────────────────────────────────────────────
      const scanResult = await scanWithClamAV(diskPath);
      if (scanResult !== null && !scanResult.clean) {
        // Malicious file detected — delete immediately and reject
        await fs.unlink(diskPath).catch(() => {});
        console.warn(`[apply] ClamAV detected threat in upload: ${scanResult.threat}`);
        return NextResponse.json(
          { error: "The uploaded file was rejected by the security scanner." },
          { status: 422 },
        );
      }

      // ── Ghostscript PDF sanitization ─────────────────────────────────────────
      // Strips embedded JavaScript, AcroForms, external references.
      // If GS is unavailable, we keep the original (ClamAV is the main protection).
      const sanitizedPath = diskPath.replace(/\.pdf$/, ".gs.pdf");
      const sanitized = await sanitizePdfWithGhostscript(diskPath, sanitizedPath);
      if (sanitized) {
        // Re-verify the sanitized output has valid PDF magic bytes before replacing original
        try {
          const gsBuffer = await fs.readFile(sanitizedPath);
          const PDF_MAGIC = Buffer.from("%PDF-", "ascii");
          if (gsBuffer.length >= 5 && gsBuffer.subarray(0, 5).equals(PDF_MAGIC)) {
            await fs.rename(sanitizedPath, diskPath);
          } else {
            // GS produced invalid output — keep original, remove bad output
            console.warn("[apply] Ghostscript output failed magic byte check — keeping original");
            await fs.unlink(sanitizedPath).catch(() => {});
          }
        } catch {
          await fs.unlink(sanitizedPath).catch(() => {});
        }
      }

      // Store original filename for display, UUID path for all filesystem operations
      cvFileName = cvFile.name;
      cvPath = `cvs/${diskFilename}`;
    }

    // ── DB ────────────────────────────────────────────────────────────────────

    // Upsert Applicant for cross-application tracking
    const applicant = await applicantRepo.upsert(
      data.email,
      {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
      },
      {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
      },
    );

    // Verify jobId exists if provided
    const jobId = data.jobId
      ? (await jobRepo.findUnique(data.jobId, ["id"]))?.id ?? null
      : null;

    await applicationRepo.create({
      firstName:         data.firstName,
      lastName:          data.lastName,
      email:             data.email,
      phone:             data.phone,
      role:              data.role,
      linkedin:          data.linkedin || null,
      portfolio:         data.portfolio || null,
      message:           data.message || null,
      cvFileName,
      cvPath,
      jobId,
      applicantId:       applicant.id,
      currentlyEmployed:
        data.currentlyEmployed === "yes"
          ? true
          : data.currentlyEmployed === "no"
            ? false
            : null,
      noticePeriod:       data.noticePeriod || null,
      yearsOfExperience:  data.yearsOfExperience || null,
      location:           data.location || null,
      bimSoftware:        data.bimSoftware || null,
      consentDataSharing: data.consentDataSharing,
      consentFutureUse:   data.consentFutureUse,
    });

    adminEvents.emit("new_application", {
      firstName:   data.firstName,
      lastName:    data.lastName,
      applicantId: applicant.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/apply]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
