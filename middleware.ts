import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api")) return NextResponse.next();

  const token = process.env.AUTH_TOKEN;
  if (!token) return NextResponse.next(); // Auth disabled when not configured

  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  const expected = `Bearer ${token}`;
  if (auth === expected) return NextResponse.next();

  return NextResponse.json(
    { data: null, error: { message: "Unauthorized", details: null } },
    { status: 401 }
  );
}

export const config = {
  matcher: ["/api/:path*"],
};

