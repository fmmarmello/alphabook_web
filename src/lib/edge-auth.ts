import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JWTPayload } from "@/lib/auth-types";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set and at least 32 characters long");
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function verifyAccessTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as JWTPayload;
  } catch (error) {
    console.error("[EDGE AUTH] Token verification failed:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

export function extractAccessToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  const cookieToken = request.cookies.get("accessToken")?.value;
  return cookieToken ?? null;
}
