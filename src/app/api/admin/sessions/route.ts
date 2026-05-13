import { NextRequest, NextResponse } from "next/server";
import * as adminSessionRepo from "@/lib/db/repositories/adminSession";
import { requireSuperAdmin, getAdminSession } from "@/lib/proxy";
import { logAudit } from "@/lib/adminAuth";
import { getClientIp } from "@/lib/rateLimit";

// GET /api/admin/sessions — list all active sessions
export async function GET() {
  const deny = await requireSuperAdmin();
  if (deny) return deny;

  const currentUser = await getAdminSession();

  const sessions = await adminSessionRepo.findMany({ expiresAt: { gt: new Date() } }, { field: "createdAt", dir: "DESC" });

  return NextResponse.json(
    sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      username: s.user.username,
      role: s.user.role,
      ip: s.ip,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === currentUser?.sessionId,
    })),
  );
}

// DELETE /api/admin/sessions — revoke all sessions except the current one
export async function DELETE(request: NextRequest) {
  const deny = await requireSuperAdmin();
  if (deny) return deny;

  const ip = getClientIp(request.headers);
  const currentUser = await getAdminSession();

  await adminSessionRepo.removeAllExcept(currentUser!.sessionId);

  await logAudit("sessions_revoke_all", currentUser?.id ?? null, currentUser?.username ?? null, ip);
  return NextResponse.json({ ok: true });
}
