import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: { message: "Invalid token", details: null } },
        { status: 401 }
      );
    }

    return NextResponse.json({
      data: { user },
      error: null,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { error: { message: "Token validation failed", details: null } },
      { status: 401 }
    );
  }
}