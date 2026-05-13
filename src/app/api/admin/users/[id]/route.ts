import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import * as adminUserRepo from "@/lib/db/repositories/adminUser";
import { requireSuperAdmin, getAdminSession } from "@/lib/proxy";
import { logAudit, deleteAllUserSessions } from "@/lib/adminAuth";
import { getClientIp } from "@/lib/rateLimit";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12).max(200),
});

// PATCH /api/admin/users/[id] — change a user's password (requires their current password)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = await requireSuperAdmin();
  if (deny) return deny;

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const ip = getClientIp(request.headers);
  const currentUser = await getAdminSession();

  const body = await request.json().catch(() => null);
  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const target = await adminUserRepo.findUnique({ id: userId });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Verify the user's current password before allowing the change
  const currentPasswordOk = await bcrypt.compare(parsed.data.currentPassword, target.password);
  if (!currentPasswordOk) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 12);
  await adminUserRepo.update(userId, { password: hash });

  // Invalidate all sessions for this user — forces re-login everywhere
  await deleteAllUserSessions(userId);

  await logAudit("password_changed", currentUser?.id ?? null, currentUser?.username ?? null, ip, {
    targetUserId: userId,
    targetUsername: target.username,
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users/[id] — delete an admin user
// Password verification is handled upstream by /api/admin/verify-password (with lockout).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = await requireSuperAdmin();
  if (deny) return deny;

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const ip = getClientIp(_request.headers);
  const currentUser = await getAdminSession();

  if (userId === currentUser?.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  // Prevent deleting the last superadmin
  const target = await adminUserRepo.findUnique({ id: userId });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (target.role === "superadmin") {
    const superadminCount = await adminUserRepo.count({ role: "superadmin" });
    if (superadminCount <= 1) {
      return NextResponse.json({ error: "Cannot delete the last superadmin." }, { status: 400 });
    }
  }

  await deleteAllUserSessions(userId);
  await adminUserRepo.remove(userId);

  await logAudit("user_deleted", currentUser?.id ?? null, currentUser?.username ?? null, ip, {
    deletedUserId: userId,
    deletedUsername: target.username,
  });

  return NextResponse.json({ ok: true });
}
