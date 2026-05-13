import { NextResponse } from "next/server";
import { requireAdmin, getAdminSession } from "@/lib/proxy";

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const user = await getAdminSession();
  return NextResponse.json({
    id: user!.id,
    username: user!.username,
    role: user!.role,
  });
}
