import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as adminUserRepo from "@/lib/db/repositories/adminUser";

/**
 * One-time superadmin bootstrap endpoint.
 * Only works when NO AdminUser rows exist yet.
 * Once any admin user exists, this endpoint returns 403.
 */
export async function POST(req: NextRequest) {
  // Block if any admin user already exists
  const count = await adminUserRepo.count();
  if (count > 0) {
    return NextResponse.json(
      { error: "Setup already complete. Use the admin panel to manage users." },
      { status: 403 },
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  if (username.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
  }
  if (password.length < 12) {
    return NextResponse.json({ error: "Password must be at least 12 characters." }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await adminUserRepo.create({ username, password: hash, role: "superadmin" });

  return NextResponse.json({ ok: true, id: user.id, username: user.username });
}
