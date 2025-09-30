import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { Role, RBAC, Permission } from "./rbac";
import { JWTPayload } from "./auth-types";

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRATION_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds

// Validate JWT secret is properly configured
function validateJWTSecret() {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }
}

// Initialize secret validation
validateJWTSecret();

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export interface TokenValidationResult {
  isValid: boolean;
  payload: JWTPayload | null;
  error: string | null;
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

export function validateTokenWithDetails(token: string): TokenValidationResult {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JWTPayload;

    // Check if token is expired or will expire soon
    if (decoded.exp) {
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      if (timeUntilExpiration <= 0) {
        return { isValid: false, payload: null, error: "Token has expired" };
      }

      if (timeUntilExpiration <= TOKEN_EXPIRATION_BUFFER) {
        return { isValid: false, payload: null, error: "Token is about to expire" };
      }
    }

    return { isValid: true, payload: decoded, error: null };
  } catch (error) {
    let errorMessage = "Invalid token";
    if (error instanceof jwt.TokenExpiredError) {
      errorMessage = "Token has expired";
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = "Invalid token format";
    } else if (error instanceof jwt.NotBeforeError) {
      errorMessage = "Token not active";
    }
    console.error("Token validation failed:", error instanceof Error ? error.message : "Unknown error");
    return { isValid: false, payload: null, error: errorMessage };
  }
}

export function isTokenExpiredSoon(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || !decoded.exp) return false;

    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;

    return timeUntilExpiration <= TOKEN_EXPIRATION_BUFFER;
  } catch {
    return true; // Consider invalid tokens as expired
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

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = extractAccessToken(request);
  if (!token) {
    return null;
  }

  return verifyAccessToken(token);
}

export function requireAuth(request: NextRequest): JWTPayload {
  const user = getUserFromRequest(request);
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }
  return user;
}

export function requireRole(request: NextRequest, requiredRole: Role): JWTPayload {
  const user = requireAuth(request);
  if (user.role !== requiredRole && !RBAC.canManageRole(user.role, requiredRole)) {
    throw new AuthError("Insufficient permissions", 403);
  }
  return user;
}

export function requirePermission(request: NextRequest, permission: Permission): JWTPayload {
  const user = requireAuth(request);
  if (!RBAC.hasPermission(user.role, permission)) {
    throw new AuthError("Insufficient permissions", 403);
  }
  return user;
}

export function requireAnyPermission(request: NextRequest, permissions: Permission[]): JWTPayload {
  const user = requireAuth(request);
  if (!RBAC.hasAnyPermission(user.role, permissions)) {
    throw new AuthError("Insufficient permissions", 403);
  }
  return user;
}

export function requireAllPermissions(request: NextRequest, permissions: Permission[]): JWTPayload {
  const user = requireAuth(request);
  if (!RBAC.hasAllPermissions(user.role, permissions)) {
    throw new AuthError("Insufficient permissions", 403);
  }
  return user;
}

// Utility functions for common role checks
export function requireAdmin(request: NextRequest): JWTPayload {
  return requireRole(request, Role.ADMIN);
}

export function requireModerator(request: NextRequest): JWTPayload {
  const user = requireAuth(request);
  if (!RBAC.canManageRole(user.role, Role.USER)) {
    throw new AuthError("Moderator or Admin access required", 403);
  }
  return user;
}

// Check if user can manage another user's role
export function canManageUser(actorRole: Role, targetRole: Role): boolean {
  return RBAC.canManageRole(actorRole, targetRole);
}
