import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  INVESTOR_COOKIE,
  verifyToken,
} from "@/lib/auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /investors/dashboard
  if (pathname.startsWith("/investors/dashboard")) {
    const token = req.cookies.get(INVESTOR_COOKIE)?.value;
    const payload = verifyToken(token);
    if (!payload || payload.area !== "investor") {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("area", "investor");
      return NextResponse.redirect(url);
    }
  }

  // Protect /admin (except /admin/login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    const payload = verifyToken(token);
    if (!payload || payload.area !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("area", "admin");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/investors/dashboard/:path*", "/admin/:path*"],
};
