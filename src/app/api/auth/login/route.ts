// In-memory rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (clientIP) {
    return clientIP;
  }
  return 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/rbac";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Validate secrets
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set and at least 32 characters long");
}
if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
  throw new Error("JWT_REFRESH_SECRET must be set and at least 32 characters long");
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      const response = NextResponse.json(
        { error: { message: "Too many login attempts. Please try again later.", details: null } },
        { status: 429 }
      );
      addSecurityHeaders(response);
      return response;
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      const response = NextResponse.json(
        { error: { message: "Email and password are required", details: null } },
        { status: 400 }
      );
      addSecurityHeaders(response);
      return response;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    });

    if (!user) {
      const response = NextResponse.json(
        { error: { message: "Invalid credentials", details: null } },
        { status: 401 }
      );
      addSecurityHeaders(response);
      return response;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      const response = NextResponse.json(
        { error: { message: "Invalid credentials", details: null } },
        { status: 401 }
      );
      addSecurityHeaders(response);
      return response;
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET!,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      data: {
        accessToken,
        refreshToken,
        user: userWithoutPassword,
      },
      error: null,
    });

    // Set access token as httpOnly cookie (XSS protection)
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true, // ✅ CRITICAL FIX - Prevent XSS access
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes (matches token expiry)
      path: "/", // Ensure cookie is available for all routes
    });

    // Set refresh token as httpOnly cookie
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    addSecurityHeaders(response);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    const response = NextResponse.json(
      { error: { message: "Internal server error", details: null } },
      { status: 500 }
    );
    addSecurityHeaders(response);
    return response;
  }
}