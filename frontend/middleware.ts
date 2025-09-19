import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "auth_admin";
const INVESTOR_COOKIE = "auth_investor";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // always allow these
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname === "/login" ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/ping/")
  ) {
    return NextResponse.next();
  }

  // protect /admin
  if (pathname.startsWith("/admin")) {
    const ok = req.cookies.get(ADMIN_COOKIE)?.value === "1";
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?to=${encodeURIComponent(pathname + (search || ""))}&area=admin`;
      return NextResponse.redirect(url);
    }
  }

  // protect /investors
  if (pathname.startsWith("/investors")) {
    const ok = req.cookies.get(INVESTOR_COOKIE)?.value === "1";
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?to=${encodeURIComponent(pathname + (search || ""))}&area=investor`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/investors/:path*", "/login", "/api/:path*"],
};
