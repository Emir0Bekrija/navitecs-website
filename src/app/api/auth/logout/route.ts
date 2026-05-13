import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie, deleteSession, logAudit, SESSION_COOKIE } from "@/lib/adminAuth";
import { getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const user = await getSessionFromCookie();

  if (user) {
    await deleteSession(user.sessionTokenHash);
    await logAudit("logout", user.id, user.username, ip);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
