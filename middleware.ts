import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth for auth endpoints and non-API routes
  if (!pathname.startsWith("/api") ||
      pathname.startsWith("/api/auth/") ||
      pathname === "/api/specifications") {
    return NextResponse.next();
  }

  // For other API routes, require authentication
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: "Unauthorized", details: null } },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};

