import { NextRequest, NextResponse } from "next/server";

const ADMIN_PREFIX = "/navitecs-control-admin";
const LOGIN_PATH = "/navitecs-control-admin/login";
const SETUP_PATH = "/navitecs-control-admin/setup";
// Cookie name must match SESSION_COOKIE in src/lib/adminAuth.ts
const SESSION_COOKIE = "nca_sess";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(ADMIN_PREFIX)) return NextResponse.next();
  if (pathname === LOGIN_PATH) return NextResponse.next();
  if (pathname === SETUP_PATH) return NextResponse.next();

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/navitecs-control-admin/:path*"],
};
