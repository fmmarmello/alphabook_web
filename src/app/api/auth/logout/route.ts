import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      data: { message: "Logged out successfully" },
      error: null,
    });

    // Clear access token cookie
    response.cookies.set("accessToken", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
    });

    // Clear refresh token cookie
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: { message: "Internal server error", details: null } },
      { status: 500 }
    );
  }
}