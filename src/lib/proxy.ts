/**
 * Server-side admin auth guards for API routes.
 *
 * Usage:
 *   const deny = await requireAdmin();
 *   if (deny) return deny;
 *
 *   // superadmin-only:
 *   const deny = await requireSuperAdmin();
 *   if (deny) return deny;
 *
 *   // get current user:
 *   const user = await getAdminSession();
 */
import "server-only";
import { NextResponse } from "next/server";
import { getSessionFromCookie, type AdminSessionUser } from "@/lib/adminAuth";

export async function requireAdmin(): Promise<NextResponse | null> {
  const user = await getSessionFromCookie();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function requireSuperAdmin(): Promise<NextResponse | null> {
  const user = await getSessionFromCookie();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function getAdminSession(): Promise<AdminSessionUser | null> {
  return getSessionFromCookie();
}
