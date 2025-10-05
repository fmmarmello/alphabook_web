import { NextRequest, NextResponse } from 'next/server';
import { extractAccessToken, verifyAccessToken } from '@/lib/unified-auth';

// Environment-based feature flags for performance optimization
const isDevelopment = process.env.NODE_ENV === 'development';
const useOptimizedAuth = process.env.USE_OPTIMIZED_AUTH !== 'false';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip auth routes to prevent infinite loops
  if (pathname.startsWith('/api/auth/')) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }
  
  // Conditional logging for performance optimization
  if (isDevelopment) {
    console.log('[SECURITY MIDDLEWARE] Protecting:', pathname);
  }

  try {
    const accessToken = extractAccessToken(request);

    if (!accessToken) {
      if (isDevelopment) {
        console.log('[SECURITY MIDDLEWARE] No access token found for:', pathname);
      }
      return handleUnauthorized(request, 'No access token provided');
    }

    if (isDevelopment) {
      console.log('[SECURITY MIDDLEWARE] Access token found, verifying...');
    }

    // Use optimized unified auth verification
    const decoded = await verifyAccessToken(accessToken);

    if (!decoded) {
      if (isDevelopment) {
        console.log('[SECURITY MIDDLEWARE] Invalid or expired token for:', pathname);
      }
      return handleUnauthorized(request, 'Invalid or expired token');
    }

    if (isDevelopment) {
      console.log('[SECURITY MIDDLEWARE] Authenticated:', decoded.email, 'Role:', decoded.role);
    }

    // Create response and add optimized user context headers for API routes
    const response = NextResponse.next();
    
    // Add authentication context headers for optimized API route processing
    if (useOptimizedAuth) {
      response.headers.set('X-Auth-User-Id', decoded.userId.toString());
      response.headers.set('X-Auth-Email', decoded.email);
      response.headers.set('X-Auth-Name', decoded.name);
      response.headers.set('X-Auth-Role', decoded.role);
      response.headers.set('X-Auth-Optimized', 'true');
      
      if (isDevelopment) {
        console.log('[SECURITY MIDDLEWARE] Added auth context headers for optimization');
      }
    }
    
    addSecurityHeaders(response);
    return response;

  } catch (error) {
    if (isDevelopment) {
      console.error('[SECURITY MIDDLEWARE] Authentication error:', error);
    }
    return handleUnauthorized(request, 'Authentication failed');
  }
}

function handleUnauthorized(request: NextRequest, reason: string) {
  void reason;
  const pathname = request.nextUrl.pathname;
  
  // API routes return JSON error (CRITICAL for API security)
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.json(
      {
        error: {
          message: 'Unauthorized',
          details: null // Don't expose internal reasons for security
        }
      },
      { status: 401 }
    );
    addSecurityHeaders(response);
    return response;
  }
  
  // Page routes redirect to login
  const loginUrl = new URL('/login', request.nextUrl.origin);
  loginUrl.searchParams.set('redirect', pathname);
  const response = NextResponse.redirect(loginUrl);
  addSecurityHeaders(response);
  return response;
}

// Optimized security headers application
function addSecurityHeaders(response: NextResponse) {
  // Cache-friendly header application - only set if not already present
  const headers = response.headers;
  
  if (!headers.get('X-Content-Type-Options')) {
    headers.set('X-Content-Type-Options', 'nosniff');
  }
  
  if (!headers.get('X-Frame-Options')) {
    headers.set('X-Frame-Options', 'DENY');
  }
  
  if (!headers.get('X-XSS-Protection')) {
    headers.set('X-XSS-Protection', '1; mode=block');
  }
  
  if (!headers.get('Referrer-Policy')) {
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  
  if (!headers.get('Content-Security-Policy')) {
    headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  }

  // Only send HSTS in production over HTTPS to avoid local redirect issues
  if (process.env.NODE_ENV === 'production' && !headers.get('Strict-Transport-Security')) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

export const config = {
  matcher: [
    // CRITICAL: Protect ALL API routes - These were completely exposed!
    '/api/dashboard/:path*',     // ⚠️ CRITICAL - Was completely exposed
    '/api/clients/:path*',       // ⚠️ CRITICAL - Client data exposed
    '/api/orders/:path*',        // ⚠️ CRITICAL - Order data exposed
    '/api/budgets/:path*',       // ⚠️ CRITICAL - Financial data exposed
    '/api/centers/:path*',       // ⚠️ CRITICAL - Center data exposed
    '/api/reports/:path*',       // ⚠️ CRITICAL - Report data exposed
    '/api/users/:path*',         // ⚠️ CRITICAL - User management exposed
    '/api/specifications/:path*', // ⚠️ CRITICAL - Business data exposed
    '/api/navigation/:path*',    // Navigation counts API
    
    // Existing page protection (keep these)
    '/dashboard/:path*',
    '/clients/:path*',
    '/orders/:path*',
    '/budgets/:path*',
    '/centers/:path*',
    '/reports/:path*',
    '/admin/:path*',
  ],
};
