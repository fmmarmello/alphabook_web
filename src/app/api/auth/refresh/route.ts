import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { generateTokenPair } from "@/lib/unified-auth";
import { Role } from "@/lib/rbac";

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

// Validate refresh secret
if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
  throw new Error("JWT_REFRESH_SECRET must be set and at least 32 characters long");
}

const refreshSecretKey = new TextEncoder().encode(JWT_REFRESH_SECRET);

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: { message: "Refresh token not found", details: null } },
        { status: 401 }
      );
    }

    // Verify refresh token using jose for consistency
    let decoded;
    try {
      const { payload } = await jwtVerify(refreshToken, refreshSecretKey);
      decoded = payload as { userId: number };
    } catch (error) {
      void error;
      return NextResponse.json(
        { error: { message: "Invalid refresh token", details: null } },
        { status: 401 }
      );
    }

    // Optimized database query - only check existence and get essential user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: "User not found", details: null } },
        { status: 401 }
      );
    }

    // Generate both tokens in parallel for performance optimization
    const { accessToken, refreshToken: newRefreshToken } = await generateTokenPair({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role, // Cast Prisma enum to RBAC enum
    });

    const response = NextResponse.json({
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        user,
      },
      error: null,
    });

    // Set new access token as regular cookie (readable by client)
    response.cookies.set("accessToken", accessToken, {
      httpOnly: false, // Allow client to read for auth context
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes (matches token expiry)
    });

    // Update refresh token cookie (HttpOnly for security)
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true, // Secure from XSS attacks
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Performance monitoring in development
    if (process.env.NODE_ENV === 'development') {
      const duration = performance.now() - startTime;
      console.log(`[REFRESH-AUTH-PERF] Token refresh completed in ${duration.toFixed(2)}ms`);
    }

    return response;
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: { message: "Internal server error", details: null } },
      { status: 500 }
    );
  }
}
