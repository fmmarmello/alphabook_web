import { NextRequest, NextResponse } from 'next/server';
import { extractAccessToken, verifyAccessTokenEdge } from '@/lib/edge-auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip auth routes to prevent infinite loops
  if (pathname.startsWith('/api/auth/')) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }
  
  console.log('[SECURITY MIDDLEWARE] Protecting:', pathname);

  try {
    const accessToken = extractAccessToken(request);

    if (!accessToken) {
      console.log('[SECURITY MIDDLEWARE] No access token found for:', pathname);
      return handleUnauthorized(request, 'No access token provided');
    }

    console.log('[SECURITY MIDDLEWARE] Access token found, verifying...');

    const decoded = await verifyAccessTokenEdge(accessToken);

    if (!decoded) {
      console.log('[SECURITY MIDDLEWARE] Invalid or expired token for:', pathname);
      return handleUnauthorized(request, 'Invalid or expired token');
    }

    console.log('[SECURITY MIDDLEWARE] Authenticated:', decoded.email, 'Role:', decoded.role);

    // Pass user data to API routes via headers
    const requestHeaders = new Headers(request.headers);
    
    // 🐛 FIX: Add user context to REQUEST headers (not response headers)
    requestHeaders.set('x-user-id', decoded.userId.toString());
    requestHeaders.set('x-user-email', decoded.email);
    requestHeaders.set('x-user-role', decoded.role);
    
    console.log('[SECURITY MIDDLEWARE] Added headers - UserId:', decoded.userId, 'Email:', decoded.email, 'Role:', decoded.role);
    
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    addSecurityHeaders(response);
    return response;

  } catch (error) {
    console.error('[SECURITY MIDDLEWARE] Authentication error:', error);
    return handleUnauthorized(request, 'Authentication failed');
  }
}

function handleUnauthorized(request: NextRequest, reason: string) {
  const pathname = request.nextUrl.pathname;
  
  // API routes return JSON error (CRITICAL for API security)
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.json(
      {
        error: {
          message: 'Unauthorized',
          details: null // Don't expose internal reasons
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

function addSecurityHeaders(response: NextResponse) {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
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
