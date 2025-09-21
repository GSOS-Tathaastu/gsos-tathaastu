// Pass-through middleware: no route protection.
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

// Empty matcher = nothing intercepted.
export const config = {
  matcher: [],
};
