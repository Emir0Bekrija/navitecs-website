import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { zipSync } from "fflate";
import * as applicationRepo from "@/lib/db/repositories/application";
import * as applicantRepo from "@/lib/db/repositories/applicant";
import * as adminUserRepo from "@/lib/db/repositories/adminUser";
import { requireAdmin, getAdminSession } from "@/lib/proxy";
import { tzStartOfDay, tzEndOfDay } from "@/lib/dateUtils";

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
const CV_DIR = path.join(UPLOADS_DIR, "cvs");

const Schema = z.object({
  password: z.string().min(1),
  mode: z.enum(["stale", "range"]),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// POST /api/admin/applications/export
// Exports applications (and applicants) to a ZIP archive containing:
//   - applications_export.xlsx  (two sheets: applicants + applications)
//   - cvs/<filename>.pdf        (one file per application that has a CV)
//
// The cvFileName column in the applications sheet contains a hyperlink to the
// corresponding file inside the cvs/ folder so it can be opened directly from Excel.
//
// mode="stale"  → applications older than 12 months; deletes DB records + CV files after export.
// mode="range"  → applications in the provided date range; export only, no deletion.
export async function POST(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { password, mode, dateFrom, dateTo } = parsed.data;

  // Verify the admin's password before proceeding
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await adminUserRepo.findUnique({ id: session.id });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Determine date filter
  const cutoff = new Date(Date.now() - TWELVE_MONTHS_MS);
  const appWhere =
    mode === "stale"
      ? { submittedAt: { lt: cutoff } }
      : {
          submittedAt: {
            ...(dateFrom ? { gte: tzStartOfDay(dateFrom) } : {}),
            ...(dateTo ? { lte: tzEndOfDay(dateTo) } : {}),
          },
        };

  // Fetch all matching applications with their job info
  const applications = await applicationRepo.findManyWithJob(appWhere, { field: "submittedAt", dir: "ASC" });

  if (applications.length === 0) {
    return NextResponse.json({ error: "No applications found for the selected period." }, { status: 404 });
  }

  // Collect unique applicant IDs
  const applicantIds = [...new Set(applications.map((a) => a.applicantId).filter(Boolean) as string[])];
  const applicants = applicantIds.length > 0
    ? await applicantRepo.findMany({ where: { id: { in: applicantIds } }, orderBy: { field: "createdAt", dir: "ASC" } })
    : [];

  // ── Collect CV files ──────────────────────────────────────────────────────────
  // Map: application id → { zipName, absolutePath }
  const cvFiles: Map<string, { zipName: string; absolutePath: string }> = new Map();

  for (const app of applications) {
    if (!app.cvPath || !app.cvFileName) continue;

    const absolutePath = path.resolve(UPLOADS_DIR, app.cvPath);
    // Path traversal guard
    if (!absolutePath.startsWith(CV_DIR + path.sep) && absolutePath !== CV_DIR) continue;
    if (!absolutePath.toLowerCase().endsWith(".pdf")) continue;

    // Build a clean display name: strip legacy timestamp prefix
    const rawName = app.cvFileName.replace(/^\d{10,}-/, "").replace(/[^a-zA-Z0-9._\- ()]/g, "_") || "cv.pdf";
    // Prefix with applicant name to avoid collisions when multiple apps share a name
    const appName = `${app.firstName}_${app.lastName}`.replace(/[^a-zA-Z0-9_-]/g, "_");
    const zipName = `${appName}_${rawName}`;

    cvFiles.set(app.id, { zipName, absolutePath });
  }

  // ── Build Excel ───────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  // Sheet 1: applicants
  const applicantRows = applicants.map((a) => ({
    id: a.id,
    email: a.email,
    firstName: a.firstName,
    lastName: a.lastName,
    phone: a.phone ?? "",
    score: a.score ?? "",
    comments: a.comments ?? "",
    fitsRoles: a.fitsRoles ?? "",
    doesNotFit: a.doesNotFit ?? "",
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(applicantRows), "applicants");

  // Sheet 2: applications — cvFileName column contains a hyperlink to cvs/<file>
  const appHeaders = [
    "id", "applicantId", "firstName", "lastName", "email", "phone",
    "role", "jobTitle", "jobId", "linkedin", "portfolio", "message",
    "cvFileName", "cvPath", "currentlyEmployed", "noticePeriod",
    "yearsOfExperience", "location", "bimSoftware",
    "consentDataSharing", "consentFutureUse", "submittedAt",
  ];

  const appData = applications.map((a) => {
    const cv = cvFiles.get(a.id);
    return [
      a.id,
      a.applicantId ?? "",
      a.firstName,
      a.lastName,
      a.email,
      a.phone,
      a.role,
      a.job?.title ?? "",
      a.jobId ?? "",
      a.linkedin ?? "",
      a.portfolio ?? "",
      a.message ?? "",
      cv ? cv.zipName : (a.cvFileName ?? ""),   // display name (hyperlink added below)
      a.cvPath ?? "",
      a.currentlyEmployed === null ? "" : a.currentlyEmployed ? "yes" : "no",
      a.noticePeriod ?? "",
      a.yearsOfExperience ?? "",
      a.location ?? "",
      a.bimSoftware ?? "",
      a.consentDataSharing ? "yes" : "no",
      a.consentFutureUse ? "yes" : "no",
      a.submittedAt.toISOString(),
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([appHeaders, ...appData]);

  // Add hyperlinks: cvFileName is column index 12 (0-based), rows start at 2 (1-indexed, row 1 is header)
  const cvFileNameColIndex = appHeaders.indexOf("cvFileName");
  applications.forEach((app, rowIdx) => {
    const cv = cvFiles.get(app.id);
    if (!cv) return;
    const cellAddress = XLSX.utils.encode_cell({ r: rowIdx + 1, c: cvFileNameColIndex });
    if (ws[cellAddress]) {
      ws[cellAddress].l = { Target: `cvs/${cv.zipName}`, Tooltip: "Open CV" };
    }
  });

  XLSX.utils.book_append_sheet(wb, ws, "applications");

  // Write Excel to buffer BEFORE any deletions
  let xlsxBuffer: Uint8Array;
  try {
    xlsxBuffer = new Uint8Array(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer);
  } catch {
    return NextResponse.json({ error: "Failed to generate Excel file." }, { status: 500 });
  }

  // ── Build ZIP ─────────────────────────────────────────────────────────────────
  const zipEntries: Record<string, Uint8Array> = {
    "applications_export.xlsx": xlsxBuffer,
  };

  await Promise.all(
    [...cvFiles.values()].map(async ({ zipName, absolutePath }) => {
      try {
        const fileBuffer = await fs.readFile(absolutePath);
        zipEntries[`cvs/${zipName}`] = new Uint8Array(fileBuffer);
      } catch {
        // Skip files that can't be read (already deleted or missing)
      }
    }),
  );

  const zipBuffer = zipSync(zipEntries);

  // ── Delete (stale mode only) ──────────────────────────────────────────────────
  if (mode === "stale") {
    const appIds = applications.map((a) => a.id);

    // Find applicants whose ONLY applications are in this export (no remaining recent ones)
    const recentApplicantIdsList = await applicationRepo.findDistinctApplicantIds({
      submittedAt: { gte: cutoff },
      applicantId: { in: applicantIds },
    });
    const recentApplicantIds = new Set(recentApplicantIdsList);

    const applicantIdsToDelete = applicantIds.filter((id) => !recentApplicantIds.has(id));

    // Delete DB records first
    await applicationRepo.deleteMany({ id: { in: appIds } });
    if (applicantIdsToDelete.length > 0) {
      await applicantRepo.deleteMany({ id: { in: applicantIdsToDelete } });
    }

    // Delete CV files from disk
    for (const [, { absolutePath }] of cvFiles) {
      await fs.unlink(absolutePath).catch(() => {});
    }
  }

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="applications_export.zip"',
    },
  });
}
