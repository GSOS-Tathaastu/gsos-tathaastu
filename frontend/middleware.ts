// frontend/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  const adminCookie = req.cookies.get("auth_admin")?.value;
  const invCookie = req.cookies.get("auth_investor")?.value;

  if (url.pathname.startsWith("/admin")) {
    if (adminCookie !== "1") {
      url.pathname = "/login";
      url.searchParams.set("area", "admin");
      return NextResponse.redirect(url);
    }
  }

  if (url.pathname.startsWith("/investors")) {
    if (invCookie !== "1") {
      url.pathname = "/login";
      url.searchParams.set("area", "investor");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/investors/:path*"],
};
