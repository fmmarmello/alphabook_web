import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { JWTPayload as JoseJWTPayload } from "jose";
import { Role } from "@/lib/rbac";
import { JWTPayload } from "@/lib/auth-types";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set and at least 32 characters long");
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

const isAppJWTPayload = (payload: JoseJWTPayload): payload is JWTPayload & JoseJWTPayload => {
  const candidate = payload as Record<string, unknown>;

  const userId = candidate.userId;
  const email = candidate.email;
  const name = candidate.name;
  const role = candidate.role;

  const hasValidUserId = typeof userId === 'number' && Number.isFinite(userId);
  const hasValidEmail = typeof email === 'string' && email.length > 0;
  const hasValidName = typeof name === 'string' && name.length > 0;
  const hasValidRole = typeof role === 'string' && (Object.values(Role) as string[]).includes(role);

  return hasValidUserId && hasValidEmail && hasValidName && hasValidRole;
};

export async function verifyAccessTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (isAppJWTPayload(payload)) {
      return payload;
    }

    console.error("[EDGE AUTH] Invalid token payload shape");
    return null;
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
