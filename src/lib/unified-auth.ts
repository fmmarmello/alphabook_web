import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload as JoseJWTPayload } from "jose";
import { Role, RBAC, Permission } from "./rbac";
import { JWTPayload } from "./auth-types";

// Environment configuration with validation
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const TOKEN_EXPIRATION_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds

// Validate JWT secrets are properly configured
function validateJWTSecrets() {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }
  if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
    throw new Error("JWT_REFRESH_SECRET must be set and at least 32 characters long");
  }
}

// Initialize secret validation
validateJWTSecrets();

// Convert secrets to Uint8Array for jose
const accessSecretKey = new TextEncoder().encode(JWT_SECRET);
const refreshSecretKey = new TextEncoder().encode(JWT_REFRESH_SECRET);

// Enhanced error handling
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

export interface AuthContext {
  userId: number;
  email: string;
  name: string;
  role: Role;
}

// Type guard for JWTPayload validation
const isValidJWTPayload = (payload: JoseJWTPayload): payload is JWTPayload & JoseJWTPayload => {
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

// High-performance token verification using jose
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecretKey);
    
    if (isValidJWTPayload(payload)) {
      return payload;
    }

    console.error("[UNIFIED AUTH] Invalid token payload structure");
    return null;
  } catch (error) {
    // Only log in development to reduce production overhead
    if (process.env.NODE_ENV === 'development') {
      console.error("[UNIFIED AUTH] Token verification failed:", error instanceof Error ? error.message : "Unknown error");
    }
    return null;
  }
}

// Enhanced token validation with detailed error reporting
export async function validateTokenWithDetails(token: string): Promise<TokenValidationResult> {
  try {
    const { payload } = await jwtVerify(token, accessSecretKey);

    if (!isValidJWTPayload(payload)) {
      return { isValid: false, payload: null, error: "Invalid token payload structure" };
    }

    // Check if token is expired or will expire soon
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      if (timeUntilExpiration <= 0) {
        return { isValid: false, payload: null, error: "Token has expired" };
      }

      if (timeUntilExpiration <= TOKEN_EXPIRATION_BUFFER) {
        return { isValid: false, payload: null, error: "Token is about to expire" };
      }
    }

    return { isValid: true, payload, error: null };
  } catch (error) {
    let errorMessage = "Invalid token";
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        errorMessage = "Token has expired";
      } else if (error.message.includes('signature')) {
        errorMessage = "Invalid token signature";
      } else if (error.message.includes('before')) {
        errorMessage = "Token not active";
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.error("[UNIFIED AUTH] Token validation failed:", error instanceof Error ? error.message : "Unknown error");
    }
    return { isValid: false, payload: null, error: errorMessage };
  }
}

// Optimized token expiration check
export function isTokenExpiredSoon(token: string): boolean {
  try {
    // Fast decode without verification for expiration check
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1])) as { exp?: number };
    if (!payload.exp) return false;

    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;

    return timeUntilExpiration <= TOKEN_EXPIRATION_BUFFER;
  } catch {
    return true; // Consider invalid tokens as expired
  }
}

// High-performance access token generation
export async function generateAccessToken(payload: AuthContext): Promise<string> {
  return await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(accessSecretKey);
}

// High-performance refresh token generation
export async function generateRefreshToken(userId: number): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(refreshSecretKey);
}

// Parallel token generation for refresh endpoint
export async function generateTokenPair(payload: AuthContext): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload.userId)
  ]);

  return { accessToken, refreshToken };
}

// Optimized token extraction from request
export function extractAccessToken(request: NextRequest): string | null {
  // Check Authorization header first (most common)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Fallback to cookie
  const cookieToken = request.cookies.get("accessToken")?.value;
  return cookieToken ?? null;
}

// Enhanced request user extraction with performance optimization
export async function getUserFromRequest(request: NextRequest): Promise<JWTPayload | null> {
  const token = extractAccessToken(request);
  if (!token) {
    return null;
  }

  return await verifyAccessToken(token);
}

// High-performance authentication requirement with detailed errors
export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new AuthError("Unauthorized access - valid token required", 401);
  }
  return user;
}

// Optimized role-based authentication
export async function requireRole(request: NextRequest, requiredRole: Role): Promise<JWTPayload> {
  const user = await requireAuth(request);
  if (user.role !== requiredRole && !RBAC.canManageRole(user.role, requiredRole)) {
    throw new AuthError("Insufficient permissions for this operation", 403);
  }
  return user;
}

// Permission-based authentication
export async function requirePermission(request: NextRequest, permission: Permission): Promise<JWTPayload> {
  const user = await requireAuth(request);
  if (!RBAC.hasPermission(user.role, permission)) {
    throw new AuthError("Insufficient permissions for this operation", 403);
  }
  return user;
}

// Multiple permission checks
export async function requireAnyPermission(request: NextRequest, permissions: Permission[]): Promise<JWTPayload> {
  const user = await requireAuth(request);
  if (!RBAC.hasAnyPermission(user.role, permissions)) {
    throw new AuthError("Insufficient permissions for this operation", 403);
  }
  return user;
}

export async function requireAllPermissions(request: NextRequest, permissions: Permission[]): Promise<JWTPayload> {
  const user = await requireAuth(request);
  if (!RBAC.hasAllPermissions(user.role, permissions)) {
    throw new AuthError("Insufficient permissions for this operation", 403);
  }
  return user;
}

// Utility functions for common role checks
export async function requireAdmin(request: NextRequest): Promise<JWTPayload> {
  return await requireRole(request, Role.ADMIN);
}

export async function requireModerator(request: NextRequest): Promise<JWTPayload> {
  const user = await requireAuth(request);
  if (!RBAC.canManageRole(user.role, Role.USER)) {
    throw new AuthError("Moderator or Admin access required", 403);
  }
  return user;
}

// Check if user can manage another user's role
export function canManageUser(actorRole: Role, targetRole: Role): boolean {
  return RBAC.canManageRole(actorRole, targetRole);
}

// Performance optimized header-based authentication context
export interface RequestAuthContext {
  userId: number;
  email: string;
  name: string;
  role: Role;
  isAuthenticated: boolean;
}

// Extract authentication context from request headers (for optimized middleware flow)
export function extractAuthContext(request: NextRequest): RequestAuthContext | null {
  const userId = request.headers.get('X-Auth-User-Id');
  const email = request.headers.get('X-Auth-Email');
  const name = request.headers.get('X-Auth-Name');
  const role = request.headers.get('X-Auth-Role');

  if (!userId || !email || !name || !role) {
    return null;
  }

  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId)) {
    return null;
  }

  if (!(Object.values(Role) as string[]).includes(role)) {
    return null;
  }

  return {
    userId: parsedUserId,
    email,
    name,
    role: role as Role,
    isAuthenticated: true
  };
}

// Fallback authentication for direct API calls (bypassing middleware)
export async function getAuthContextWithFallback(request: NextRequest): Promise<RequestAuthContext | null> {
  // Try header-based context first (optimized path)
  const headerContext = extractAuthContext(request);
  if (headerContext) {
    return headerContext;
  }

  // Fallback to token validation (for direct API calls)
  const user = await getUserFromRequest(request);
  if (!user) {
    return null;
  }

  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    role: user.role,
    isAuthenticated: true
  };
}