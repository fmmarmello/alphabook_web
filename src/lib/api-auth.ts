import { NextRequest } from 'next/server';
import { Role } from './rbac';
import { verifyAccessToken, extractAccessToken } from './auth';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: Role;
}

export class ApiAuthError extends Error {
  constructor(public message: string, public status: number = 401) {
    super(message);
    this.name = 'ApiAuthError';
  }
}

/**
 * Get authenticated user by verifying JWT token from cookies or Authorization header
 * 🐛 FIX: Read token directly instead of relying on middleware headers
 */
export function getAuthenticatedUser(request: NextRequest): AuthenticatedUser {
  // 🔍 DEBUG: Log authentication attempt
  console.log('[API-AUTH] Starting authentication...');
  
  // Extract token from cookies or Authorization header
  const token = extractAccessToken(request);
  
  if (!token) {
    console.log('[API-AUTH ERROR] No access token found');
    throw new ApiAuthError('Authentication required', 401);
  }
  
  console.log('[API-AUTH] Token found, verifying...');
  
  // Verify the token
  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    console.log('[API-AUTH ERROR] Token verification failed');
    throw new ApiAuthError('Invalid or expired token', 401);
  }
  
  console.log('[API-AUTH SUCCESS] User authenticated:', decoded.email, 'Role:', decoded.role);
  
  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role as Role
  };
}

/**
 * Require specific role
 */
export function requireRole(user: AuthenticatedUser, requiredRole: Role): void {
  if (user.role !== requiredRole && !hasHigherRole(user.role, requiredRole)) {
    throw new ApiAuthError('Insufficient permissions', 403);
  }
}

/**
 * Check if user role is higher than required
 */
function hasHigherRole(userRole: Role, requiredRole: Role): boolean {
  const hierarchy = {
    [Role.USER]: 1,
    [Role.MODERATOR]: 2,
    [Role.ADMIN]: 3
  };
  
  return hierarchy[userRole] >= hierarchy[requiredRole];
}

/**
 * Check if user can manage another user
 */
export function canManageUser(actorRole: Role, targetRole: Role): boolean {
  const hierarchy = {
    [Role.USER]: 1,
    [Role.MODERATOR]: 2,
    [Role.ADMIN]: 3
  };
  
  return hierarchy[actorRole] > hierarchy[targetRole];
}

/**
 * Apply user-specific data filtering based on role
 */
export function applyUserFilter(user: AuthenticatedUser, baseWhere: Record<string, unknown> = {}) {
  switch (user.role) {
    case Role.ADMIN:
      return baseWhere; // No restrictions for admins
      
    case Role.MODERATOR:
      return baseWhere; // Moderators can see all data but with field restrictions
      
    case Role.USER:
      return {
        ...baseWhere,
        OR: [
          { createdByUserId: user.userId },
          { assignedToUserId: user.userId }
        ]
      };
      
    default:
      return { id: -1 }; // No access for unknown roles
  }
}

/**
 * Get field selection based on user role (for data filtering)
 */
export function getFieldSelection(user: AuthenticatedUser, resourceType: 'client' | 'order' | 'budget' | 'user') {
  switch (resourceType) {
    case 'client':
      switch (user.role) {
        case Role.ADMIN:
          return undefined; // All fields
        case Role.MODERATOR:
          return {
            id: true, name: true, email: true, cnpjCpf: true,
            phone: true, createdAt: true, updatedAt: true
          };
        case Role.USER:
          return {
            id: true, name: true, email: true, phone: true, createdAt: true
          };
      }
      break;
      
    case 'order':
      switch (user.role) {
        case Role.ADMIN:
          return undefined; // All fields
        case Role.MODERATOR:
          return {
            id: true, numeroOrdem: true, valorTotal: true, status: true,
            description: true, client: true, createdAt: true, updatedAt: true
          };
        case Role.USER:
          return {
            id: true, numeroOrdem: true, valorTotal: true, status: true,
            description: true, client: { select: { id: true, name: true } },
            createdAt: true
          };
      }
      break;
      
    case 'user':
      switch (user.role) {
        case Role.ADMIN:
          return undefined; // All fields
        case Role.MODERATOR:
          return {
            id: true, email: true, name: true, role: true, createdAt: true
          };
        case Role.USER:
          return {
            id: true, email: true, name: true, createdAt: true
          };
      }
      break;
      
    default:
      return { id: true }; // Minimal fields for unknown resource types
  }
  
  return { id: true };
}

/**
 * Check if user can access a specific resource (ownership check)
 */
export function canAccessResource(user: AuthenticatedUser, resource: Record<string, unknown>): boolean {
  // Admins can access everything
  if (user.role === Role.ADMIN) {
    return true;
  }
  
  // Moderators can access most things
  if (user.role === Role.MODERATOR) {
    return true;
  }
  
  // Users can only access their own resources
  if (user.role === Role.USER) {
    return resource.createdByUserId === user.userId || 
           resource.assignedToUserId === user.userId;
  }
  
  return false;
}

/**
 * Standardized error handler for API routes
 */
export function handleApiError(error: unknown) {
  if (error instanceof ApiAuthError) {
    return {
      error: { message: error.message, details: null },
      status: error.status
    };
  }
  
  if (error instanceof Error && error.message.includes('unique constraint')) {
    return {
      error: { message: 'Resource already exists', details: null },
      status: 409
    };
  }
  
  // Never expose internal errors
  console.error('Internal API Error:', error);
  return {
    error: { message: 'Internal server error', details: null },
    status: 500
  };
}