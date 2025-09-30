import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: { message: "Refresh token not found", details: null } },
        { status: 401 }
      );
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: number };
    } catch (error) {
      return NextResponse.json(
        { error: { message: "Invalid refresh token", details: null } },
        { status: 401 }
      );
    }

    // Check if user still exists
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

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

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
      httpOnly: false, // Allow client to read
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes (matches token expiry)
    });

    // Update refresh token cookie
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: { message: "Internal server error", details: null } },
      { status: 500 }
    );
  }
}