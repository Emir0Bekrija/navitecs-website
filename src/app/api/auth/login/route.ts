import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import * as loginAttemptRepo from "@/lib/db/repositories/loginAttempt";
import * as adminUserRepo from "@/lib/db/repositories/adminUser";
import {
  createSession,
  logAudit,
  SESSION_COOKIE,
  SESSION_MAX_AGE_S,
} from "@/lib/adminAuth";
import { getClientIp } from "@/lib/rateLimit";

const LoginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1),
});

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILURES = 10;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const userAgent = request.headers.get("user-agent");

  // DB-persisted rate limit — survives server restarts
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const failCount = await loginAttemptRepo.count({ ip, success: false, createdAt: { gte: windowStart } });

  if (failCount >= MAX_FAILURES) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { username, password } = parsed.data;

  const user = await adminUserRepo.findUnique({ username });
  // Always run bcrypt even if user not found (prevents timing attacks)
  const valid = user
    ? await bcrypt.compare(password, user.password)
    : await bcrypt.compare(password, "$2b$12$invalidhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX").then(() => false);

  // Record attempt regardless of outcome
  await loginAttemptRepo.create({ ip, username, success: valid });

  if (!valid) {
    await logAudit("login_failed", user?.id ?? null, username, ip);
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  }

  const token = await createSession(user!.id, ip, userAgent);
  await logAudit("login_success", user!.id, user!.username, ip);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  return response;
}
