import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { z } from "zod";
import * as contactRepo from "@/lib/db/repositories/contact";
import * as companyContactRepo from "@/lib/db/repositories/companyContact";
import * as adminUserRepo from "@/lib/db/repositories/adminUser";
import { requireAdmin, getAdminSession } from "@/lib/proxy";
import { tzStartOfDay, tzEndOfDay } from "@/lib/dateUtils";

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

const Schema = z.object({
  password: z.string().min(1),
  mode: z.enum(["stale", "range"]),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// POST /api/admin/contacts/export
// Exports contacts (and company contacts) to Excel.
// mode="stale"  → contacts older than 12 months; deletes them after export.
// mode="range"  → contacts in the provided date range; export only, no deletion.
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
  const contactWhere =
    mode === "stale"
      ? { submittedAt: { lt: cutoff } }
      : {
          submittedAt: {
            ...(dateFrom ? { gte: tzStartOfDay(dateFrom) } : {}),
            ...(dateTo ? { lte: tzEndOfDay(dateTo) } : {}),
          },
        };

  // Fetch all matching contacts
  const contacts = await contactRepo.findMany({
    where: contactWhere,
    orderBy: { field: "submittedAt", dir: "ASC" },
  });

  if (contacts.length === 0) {
    return NextResponse.json({ error: "No contacts found for the selected period." }, { status: 404 });
  }

  // Collect unique company contact IDs
  const companyContactIds = [
    ...new Set(contacts.map((c) => c.companyContactId).filter(Boolean) as string[]),
  ];
  const companyContacts = companyContactIds.length > 0
    ? await companyContactRepo.findMany({
        where: { id: { in: companyContactIds } },
        orderBy: { field: "createdAt", dir: "ASC" },
      })
    : [];

  // ── Build Excel ───────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  // Sheet 1: company_details (CompanyContact records)
  const companyRows = companyContacts.map((c) => ({
    id: c.id,
    email: c.email,
    name: c.name,
    company: c.company ?? "",
    phone: c.phone ?? "",
    score: c.score ?? "",
    comments: c.comments ?? "",
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(companyRows), "company_details");

  // Sheet 2: company_contacts (Contact submission records)
  const contactRows = contacts.map((c) => ({
    id: c.id,
    companyContactId: c.companyContactId ?? "",
    name: c.name,
    email: c.email,
    company: c.company ?? "",
    phone: c.phone ?? "",
    projectType: c.projectType ?? "",
    service: c.service ?? "",
    projectServices: c.projectServices ?? "",
    message: c.message,
    consentDataProcessing: c.consentDataProcessing ? "yes" : "no",
    submittedAt: c.submittedAt.toISOString(),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(contactRows), "company_contacts");

  // Write to buffer BEFORE any deletions
  let buffer: Uint8Array;
  try {
    buffer = new Uint8Array(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer);
  } catch {
    return NextResponse.json({ error: "Failed to generate Excel file." }, { status: 500 });
  }

  // ── Delete (stale mode only) ──────────────────────────────────────────────────
  if (mode === "stale") {
    const contactIds = contacts.map((c) => c.id);

    // Company contacts that have at least one RECENT submission (don't delete)
    const recentCompanyContactIdList = await contactRepo.findDistinctCompanyContactIds({
      submittedAt: { gte: cutoff },
      companyContactId: { not: null },
    });
    const recentCompanyContactIds = new Set(recentCompanyContactIdList);

    const companyContactIdsToDelete = companyContactIds.filter(
      (id) => !recentCompanyContactIds.has(id),
    );

    // Delete contacts first (FK constraint), then company contacts with no remaining ones
    await contactRepo.deleteMany({ id: { in: contactIds } });
    if (companyContactIdsToDelete.length > 0) {
      await companyContactRepo.deleteMany({ id: { in: companyContactIdsToDelete } });
    }
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="company_contacts.xlsx"',
    },
  });
}
