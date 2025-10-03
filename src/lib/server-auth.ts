import { cookies } from 'next/headers';
import { verifyAccessToken, extractAccessToken } from './auth';
import { ApiAuthError, handleApiError, AuthenticatedUser } from './api-auth';
import { Role } from './rbac';
import { NextRequest } from 'next/server';

/**
 * Server-side authentication using existing robust patterns
 * Reuses the same token extraction and validation logic as API routes
 */
export async function getServerAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    
    // Create a mock NextRequest to reuse existing extractAccessToken logic
    const mockRequest = {
      headers: {
        get: (name: string) => {
          if (name === 'authorization') {
            const accessToken = cookieStore.get('accessToken')?.value;
            return accessToken ? `Bearer ${accessToken}` : null;
          }
          return null;
        }
      },
      cookies: {
        get: (name: string) => cookieStore.get(name)
      }
    } as NextRequest;
    
    // Extract token using existing robust logic
    const token = extractAccessToken(mockRequest);
    
    if (!token) {
      console.log('[SERVER-AUTH] No access token found');
      return null;
    }
    
    // Verify token using existing validation logic
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      console.log('[SERVER-AUTH] Token verification failed');
      return null;
    }
    
    console.log('[SERVER-AUTH] User authenticated:', decoded.email, 'Role:', decoded.role);
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role as Role
    };
    
  } catch (error) {
    console.error('[SERVER-AUTH] Authentication error:', error);
    return null;
  }
}

/**
 * Server-side authenticated fetch that follows existing security patterns
 * Only makes API calls if user is properly authenticated
 */
export async function serverFetch(url: string, options?: RequestInit): Promise<Response> {
  const user = await getServerAuthenticatedUser();
  
  if (!user) {
    throw new ApiAuthError('Server-side authentication required', 401);
  }
  
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  
  // Add existing headers from options
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => headers.set(key, value));
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => headers.set(key, value));
    } else {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (value !== undefined) {
          headers.set(key, String(value));
        }
      });
    }
  }
  
  // Add authentication headers using established patterns
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  // Forward all cookies for completeness
  const cookieHeader = cookieStore.toString();
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Server-side API call helper with proper authentication and error handling
 * Follows established error handling patterns
 */
export async function serverApiCall<T>(endpoint: string): Promise<T | null> {
  try {
    // Verify authentication first using existing patterns
    const user = await getServerAuthenticatedUser();
    if (!user) {
      console.error(`[SERVER-AUTH] Unauthenticated server API call attempted: ${endpoint}`);
      return null;
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await serverFetch(`${baseUrl}${endpoint}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      console.error(`[SERVER-AUTH] API call failed: ${endpoint}`, res.status, res.statusText);
      return null;
    }
    
    const data = await res.json();
    return data.data || data;
  } catch (error) {
    // Use existing error handling patterns
    const { error: apiError } = handleApiError(error);
    console.error(`[SERVER-AUTH] Server API call failed: ${endpoint}`, apiError);
    return null;
  }
}

/**
 * Server-side role check using existing RBAC patterns
 */
export async function requireServerRole(requiredRole: Role): Promise<AuthenticatedUser> {
  const user = await getServerAuthenticatedUser();
  
  if (!user) {
    throw new ApiAuthError('Authentication required', 401);
  }
  
  // Reuse existing role hierarchy logic with proper typing
  const hierarchy: Record<Role, number> = {
    [Role.USER]: 1,
    [Role.MODERATOR]: 2,
    [Role.ADMIN]: 3
  };
  
  if (hierarchy[user.role] < hierarchy[requiredRole]) {
    throw new ApiAuthError('Insufficient permissions', 403);
  }
  
  return user;
}