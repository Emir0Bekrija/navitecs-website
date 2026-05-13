import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import * as adminUserRepo from "@/lib/db/repositories/adminUser";
import { deleteSession, logAudit } from "@/lib/adminAuth";
import { getAdminSession } from "@/lib/proxy";
import { getClientIp } from "@/lib/rateLimit";

const Schema = z.object({
  password: z.string().min(1),
  // Optional hint about what action is being confirmed (e.g. "delete_project:some-id")
  action: z.string().optional(),
});

const MAX_ATTEMPTS = 3;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// In-memory attempt tracker keyed by session ID
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

// POST /api/admin/verify-password
// Checks the provided password against the stored hash for the CURRENT session user.
// Allows 3 attempts before locking out: deletes the session, flags the IP in the audit log.
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  const sessionKey = session.sessionId;

  // Check if this session is already locked out
  const existing = failedAttempts.get(sessionKey);
  if (existing && existing.count >= MAX_ATTEMPTS && existing.resetAt > Date.now()) {
    return NextResponse.json({ error: "Too many failed attempts", locked: true }, { status: 403 });
  }

  // Look up the currently logged-in user's password hash
  const user = await adminUserRepo.findUnique({ id: session.id });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password);

  if (!valid) {
    const now = Date.now();
    const current = failedAttempts.get(sessionKey);
    const newCount = current && current.resetAt > now ? current.count + 1 : 1;
    failedAttempts.set(sessionKey, { count: newCount, resetAt: now + WINDOW_MS });

    if (newCount >= MAX_ATTEMPTS) {
      // Lock out: terminate the session and write an audit entry flagging the IP
      await deleteSession(session.sessionTokenHash);
      await logAudit(
        "verify_password_lockout",
        session.id,
        session.username,
        ip,
        {
          action: parsed.data.action ?? "unknown",
          note: "Tried to delete item, entered wrong password too many times",
          flaggedAsSuspicious: true,
        },
      );
      return NextResponse.json({ error: "Too many failed attempts", locked: true }, { status: 403 });
    }

    const attemptsLeft = MAX_ATTEMPTS - newCount;
    return NextResponse.json({ error: "Incorrect password", attemptsLeft }, { status: 401 });
  }

  // Correct password — clear any tracked failures
  failedAttempts.delete(sessionKey);
  return NextResponse.json({ ok: true });
}
