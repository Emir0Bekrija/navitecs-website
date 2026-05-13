import { NextRequest, NextResponse } from "next/server";
import * as adminSessionRepo from "@/lib/db/repositories/adminSession";
import { requireSuperAdmin, getAdminSession } from "@/lib/proxy";
import { logAudit } from "@/lib/adminAuth";
import { getClientIp } from "@/lib/rateLimit";

// DELETE /api/admin/sessions/[id] — revoke a specific session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = await requireSuperAdmin();
  if (deny) return deny;

  const { id } = await params;
  const ip = getClientIp(request.headers);
  const currentUser = await getAdminSession();

  if (id === currentUser?.sessionId) {
    return NextResponse.json(
      { error: "Use the logout button to end your current session." },
      { status: 400 },
    );
  }

  await adminSessionRepo.removeById(id);

  await logAudit("session_revoked", currentUser?.id ?? null, currentUser?.username ?? null, ip, {
    revokedSessionId: id,
  });

  return NextResponse.json({ ok: true });
}
