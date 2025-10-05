import { cookies } from 'next/headers';
import { getAuthContextWithFallback, extractAuthContext } from './unified-auth';
import { ApiAuthError, handleApiError, AuthenticatedUser } from './api-auth';
import { Role } from './rbac';
import { NextRequest } from 'next/server';

/**
 * Optimized server-side authentication using header context from middleware
 * Falls back to token validation for direct API calls
 * Eliminates double token validation for significant performance improvement
 */
export async function getServerAuthenticatedUser(request?: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // If we have a request object, use the optimized context extraction
    if (request) {
      const authContext = await getAuthContextWithFallback(request);
      
      if (!authContext || !authContext.isAuthenticated) {
        console.log('[SERVER-AUTH] No authenticated context found');
        return null;
      }
      
      console.log('[SERVER-AUTH] User authenticated via optimized context:', authContext.email, 'Role:', authContext.role);
      
      return {
        userId: authContext.userId,
        email: authContext.email,
        role: authContext.role as Role
      };
    }

    // Fallback for server components without request object - use cookies
    const cookieStore = await cookies();
    
    // Create a mock NextRequest to use the unified auth system
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
    
    // Use unified auth context extraction
    const authContext = await getAuthContextWithFallback(mockRequest);
    
    if (!authContext || !authContext.isAuthenticated) {
      console.log('[SERVER-AUTH] No access token or invalid token found');
      return null;
    }
    
    console.log('[SERVER-AUTH] User authenticated via fallback:', authContext.email, 'Role:', authContext.role);
    
    return {
      userId: authContext.userId,
      email: authContext.email,
      role: authContext.role as Role
    };
    
  } catch (error) {
    console.error('[SERVER-AUTH] Authentication error:', error);
    return null;
  }
}

/**
 * Optimized server-side authenticated fetch with header-based optimization
 * Leverages auth context for better performance
 */
export async function serverFetch(url: string, options?: RequestInit, request?: NextRequest): Promise<Response> {
  const user = await getServerAuthenticatedUser(request);
  
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
 * Optimized server-side API call helper with performance improvements
 * Uses the optimized authentication flow
 */
export async function serverApiCall<T>(endpoint: string, request?: NextRequest): Promise<T | null> {
  try {
    // Verify authentication using optimized method
    const user = await getServerAuthenticatedUser(request);
    if (!user) {
      console.error(`[SERVER-AUTH] Unauthenticated server API call attempted: ${endpoint}`);
      return null;
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await serverFetch(`${baseUrl}${endpoint}`, {
      cache: 'no-store',
    }, request);
    
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
 * Optimized server-side role check using header-based context
 */
export async function requireServerRole(requiredRole: Role, request?: NextRequest): Promise<AuthenticatedUser> {
  const user = await getServerAuthenticatedUser(request);
  
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

/**
 * Fast authentication helper specifically for API routes
 * Uses header context when available for optimal performance
 */
export async function getApiAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Try optimized header-based context first (middleware has already validated the token)
    const headerContext = extractAuthContext(request);
    if (headerContext && headerContext.isAuthenticated) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[API-AUTH] Using optimized header context for:', headerContext.email);
      }
      
      return {
        userId: headerContext.userId,
        email: headerContext.email,
        role: headerContext.role as Role
      };
    }

    // Fallback to full token validation for direct API calls (bypassing middleware)
    const authContext = await getAuthContextWithFallback(request);
    
    if (!authContext || !authContext.isAuthenticated) {
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[API-AUTH] Using fallback token validation for:', authContext.email);
    }
    
    return {
      userId: authContext.userId,
      email: authContext.email,
      role: authContext.role as Role
    };
    
  } catch (error) {
    console.error('[API-AUTH] Authentication error:', error);
    return null;
  }
}

/**
 * Require authentication for API routes with performance optimization
 */
export async function requireApiAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getApiAuthenticatedUser(request);
  if (!user) {
    throw new ApiAuthError('Authentication required', 401);
  }
  return user;
}

/**
 * Require specific role for API routes with optimization
 */
export async function requireApiRole(request: NextRequest, requiredRole: Role): Promise<AuthenticatedUser> {
  const user = await requireApiAuth(request);
  
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

/**
 * Performance monitoring helper to measure auth overhead
 */
export function measureAuthPerformance<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now();
      const result = await fn(...args);
      const duration = performance.now() - start;
      console.log(`[AUTH-PERF] ${name}: ${duration.toFixed(2)}ms`);
      return result;
    }
    return fn(...args);
  }) as T;
}

// Export performance-monitored versions for development
export const getServerAuthenticatedUserWithTiming = measureAuthPerformance(
  'getServerAuthenticatedUser',
  getServerAuthenticatedUser
);

export const getApiAuthenticatedUserWithTiming = measureAuthPerformance(
  'getApiAuthenticatedUser', 
  getApiAuthenticatedUser
);