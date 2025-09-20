import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const INVESTOR_COOKIE = "gsos_investor_session";
const ADMIN_COOKIE = "gsos_admin_session";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Protect /investors/dashboard
  if (url.pathname.startsWith("/investors/dashboard")) {
    const token = req.cookies.get(INVESTOR_COOKIE)?.value;
    if (!token) {
      url.pathname = "/investors";
      return NextResponse.redirect(url);
    }
  }

  // Protect /admin (except /admin/login)
  if (url.pathname.startsWith("/admin") && !url.pathname.startsWith("/admin/login")) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) {
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/investors/dashboard/:path*", "/admin/:path*"],
};
