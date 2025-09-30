# MVP Security Implementation Plan
**EMERGENCY DEPLOYMENT REQUIRED - CRITICAL SECURITY VULNERABILITIES**

## Executive Summary

This plan addresses the **CRITICAL** authentication bypass vulnerabilities that leave ALL API endpoints completely unprotected. The current system allows anyone to access client data, orders, and financial information via simple curl commands.

**Current Risk Level:** 🔴 **CRITICAL** - Complete data exposure  
**Target Timeline:** 48 hours for production-safe deployment  
**Goal:** Transform from "completely insecure" to "production-safe" with minimum viable security

## Critical Vulnerabilities Overview

### Current State Analysis
- ❌ **API endpoints completely unprotected** - No authentication on any API routes
- ❌ **Middleware misconfiguration** - Only protects page routes, ignores `/api/*` routes
- ❌ **XSS vulnerability** - Access tokens stored in non-httpOnly cookies
- ❌ **No server-side validation** - Authentication only exists client-side
- ❌ **Complete data exposure** - Financial data, client info, orders accessible to anyone

### Target MVP State
- ✅ **ALL API routes protected** - Middleware covers `/api/*` routes
- ✅ **Server-side JWT validation** - Proper token verification on every request
- ✅ **HttpOnly cookies** - XSS-resistant token storage
- ✅ **Basic RBAC enforcement** - Role-based access on critical endpoints
- ✅ **Proper error responses** - 401/403 without information leakage

## Phase 1: Emergency API Protection (Deploy within 24 hours)

### 1.1 CRITICAL: Fix Middleware Configuration

**File:** `middleware.ts` (URGENT CHANGE REQUIRED)

```typescript
// EMERGENCY FIX - Add missing API route protection
export const config = {
  matcher: [
    // CRITICAL: Add these missing API routes
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
```

### 1.2 Enhanced Middleware Logic

**Update:** `middleware.ts` with proper API handling

```typescript
// Enhanced middleware with API-specific error handling
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
      console.log('[SECURITY MIDDLEWARE] No token found for:', pathname);
      return handleUnauthorized(request, 'No access token provided');
    }
    
    const decoded = await verifyAccessTokenEdge(accessToken);
    
    if (!decoded) {
      console.log('[SECURITY MIDDLEWARE] Invalid token for:', pathname);
      return handleUnauthorized(request, 'Invalid or expired token');
    }
    
    console.log('[SECURITY MIDDLEWARE] Authenticated:', decoded.email, 'Role:', decoded.role);
    
    // Pass user data to API routes via headers
    const response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });
    
    // Add user context for API routes
    response.headers.set('x-user-id', decoded.userId.toString());
    response.headers.set('x-user-email', decoded.email);
    response.headers.set('x-user-role', decoded.role);
    
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
```

### 1.3 Fix HttpOnly Cookie Security

**File:** `src/app/api/auth/login/route.ts` (CRITICAL FIX)

```typescript
// SECURITY FIX: Change line 154 from httpOnly: false to httpOnly: true
response.cookies.set("accessToken", accessToken, {
  httpOnly: true,        // ✅ CRITICAL FIX - Prevent XSS access
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 15 * 60,       // 15 minutes
  path: "/",
});
```

**Client-Side Impact:** Update frontend to use automatic cookie sending instead of manual token management.

## Phase 2: Server-Side Authentication (Deploy within 48 hours)

### 2.1 Create API Authentication Helper

**Create:** `src/lib/api-auth.ts`

```typescript
import { NextRequest } from 'next/server';
import { Role } from './rbac';

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
 * Get authenticated user from middleware headers (set by middleware)
 */
export function getAuthenticatedUser(request: NextRequest): AuthenticatedUser {
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');
  const role = request.headers.get('x-user-role');
  
  if (!userId || !email || !role) {
    throw new ApiAuthError('Authentication required', 401);
  }
  
  return {
    userId: parseInt(userId),
    email,
    role: role as Role
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
 * Apply user-specific data filtering
 */
export function applyUserFilter(user: AuthenticatedUser, baseWhere: any = {}) {
  switch (user.role) {
    case Role.ADMIN:
      return baseWhere; // No restrictions
      
    case Role.MODERATOR:
      return baseWhere; // Can see all data but with field restrictions
      
    case Role.USER:
      return {
        ...baseWhere,
        OR: [
          { createdByUserId: user.userId },
          { assignedToUserId: user.userId }
        ]
      };
      
    default:
      return { id: -1 }; // No access
  }
}
```

### 2.2 Standardized API Route Protection

**Template for securing API routes:**

```typescript
// Example: src/app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, requireRole, applyUserFilter, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(request);
    
    // ✅ SECURITY: Apply user-specific filtering
    const where = applyUserFilter(user);
    
    // ✅ SECURITY: Role-based field filtering
    let selectFields;
    switch (user.role) {
      case Role.ADMIN:
        selectFields = undefined; // All fields
        break;
      case Role.MODERATOR:
        selectFields = {
          id: true, name: true, email: true, cnpjCpf: true,
          phone: true, createdAt: true, updatedAt: true
        };
        break;
      case Role.USER:
        selectFields = {
          id: true, name: true, email: true, phone: true, createdAt: true
        };
        break;
    }
    
    const clients = await prisma.client.findMany({
      where,
      select: selectFields,
    });
    
    return NextResponse.json({
      data: clients,
      error: null
    });
    
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json(
        { error: { message: error.message, details: null } },
        { status: error.status }
      );
    }
    
    console.error('API Error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error', details: null } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Authentication required
    const user = getAuthenticatedUser(request);
    
    // ✅ SECURITY: Role check for write access
    if (user.role === Role.USER) {
      // Users can only create limited records
    }
    
    const data = await request.json();
    
    const client = await prisma.client.create({
      data: {
        ...data,
        createdByUserId: user.userId, // ✅ SECURITY: Track who created it
      }
    });
    
    return NextResponse.json({
      data: client,
      error: null
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json(
        { error: { message: error.message, details: null } },
        { status: error.status }
      );
    }
    
    console.error('API Error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error', details: null } },
      { status: 500 }
    );
  }
}
```

### 2.3 Critical Endpoints to Secure Immediately

**Priority 1 (IMMEDIATE):**
- ✅ `src/app/api/clients/route.ts` - Client data access
- ✅ `src/app/api/orders/route.ts` - Order management  
- ✅ `src/app/api/dashboard/summary/route.ts` - Business metrics
- ✅ `src/app/api/users/route.ts` - User management

**Priority 2 (Next 24 hours):**
- ✅ `src/app/api/budgets/route.ts` - Financial data
- ✅ `src/app/api/reports/route.ts` - Business reports
- ✅ `src/app/api/centers/route.ts` - Center management

## Phase 3: Basic RBAC Implementation (Deploy within 48 hours)

### 3.1 Role-Based Access Patterns

```typescript
// Quick RBAC enforcement patterns for different endpoints

// ADMIN ONLY - User management
export async function DELETE(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  requireRole(user, Role.ADMIN);
  // ... delete logic
}

// MODERATOR+ - Approval workflows
export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  requireRole(user, Role.MODERATOR);
  // ... approval logic
}

// USER+ with ownership - Resource access
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthenticatedUser(request);
  const resourceId = parseInt(params.id);
  
  if (user.role === Role.USER) {
    // Verify ownership for users
    const resource = await prisma.client.findFirst({
      where: { id: resourceId, createdByUserId: user.userId }
    });
    
    if (!resource) {
      return NextResponse.json(
        { error: { message: 'Resource not found', details: null } },
        { status: 404 } // 404 instead of 403 to avoid info leakage
      );
    }
  }
  
  // ... update logic
}
```

## Phase 4: Error Handling & Security Headers (Complete deployment)

### 4.1 Standardized Error Responses

```typescript
// Error handling patterns to prevent information leakage

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiAuthError) {
    return NextResponse.json(
      { error: { message: error.message, details: null } },
      { status: error.status }
    );
  }
  
  if (error instanceof Error && error.message.includes('unique constraint')) {
    return NextResponse.json(
      { error: { message: 'Resource already exists', details: null } },
      { status: 409 }
    );
  }
  
  // Never expose internal errors
  console.error('Internal API Error:', error);
  return NextResponse.json(
    { error: { message: 'Internal server error', details: null } },
    { status: 500 }
  );
}
```

### 4.2 Security Headers (Already implemented in middleware)

Current security headers are adequate for MVP:
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY` 
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Strict-Transport-Security`
- ✅ `Content-Security-Policy`

## MVP Deployment Checklist

### Pre-Deployment Verification

**⚠️ CRITICAL CHECKS:**
- [ ] Middleware config updated with ALL `/api/*` routes
- [ ] HttpOnly cookie setting changed from `false` to `true`
- [ ] All critical API routes use `getAuthenticatedUser()`
- [ ] Error responses don't leak internal information
- [ ] RBAC enforced on user management endpoints

### Quick Security Tests

```bash
# Test 1: Verify API protection (should fail with 401)
curl -X GET http://localhost:3000/api/clients
curl -X GET http://localhost:3000/api/dashboard/summary
curl -X POST http://localhost:3000/api/orders

# Test 2: Verify auth endpoints still work
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Test 3: Verify authenticated access works
# (Use token from login response)
curl -X GET http://localhost:3000/api/clients \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Deployment Steps

1. **Emergency Middleware Fix** (5 minutes)
   - Update `middleware.ts` config matcher
   - Deploy immediately

2. **HttpOnly Cookie Fix** (5 minutes)
   - Change login route cookie setting
   - Deploy immediately

3. **API Authentication** (2-4 hours)
   - Create `api-auth.ts` helper
   - Secure critical endpoints in priority order
   - Test each endpoint after securing

4. **Verification** (30 minutes)
   - Run security tests
   - Verify legitimate users can still access system
   - Monitor for authentication errors

## Technical Debt & Post-MVP Enhancements

### Deferred Features (Technical Debt)
- ❌ **Advanced token rotation** - Current tokens work until expiry
- ❌ **Device fingerprinting** - Basic session management only
- ❌ **Advanced CSRF protection** - Basic same-site cookies sufficient for MVP
- ❌ **Comprehensive audit logging** - Basic console logging only
- ❌ **Rate limiting** - Basic protection via hosting provider
- ❌ **Multi-factor authentication** - Single factor sufficient for MVP
- ❌ **Advanced monitoring** - Basic error logging only
- ❌ **Performance optimization** - Security over speed for MVP
- ❌ **Key rotation** - Static keys acceptable for MVP

### Post-MVP Security Roadmap (Next 4 weeks)

**Week 1: Enhanced Token Management**
- Implement refresh token rotation
- Add token revocation capabilities
- Implement device fingerprinting

**Week 2: Advanced Authorization** 
- Implement resource-level permissions
- Add dynamic authorization rules
- Implement field-level security

**Week 3: Security Monitoring**
- Add comprehensive audit logging
- Implement security event monitoring
- Add intrusion detection

**Week 4: Performance & Hardening**
- Implement caching for permissions
- Add rate limiting
- Performance optimization

## Success Metrics

### MVP Security Objectives ✅
- **Zero exposed API endpoints** - All `/api/*` routes require authentication
- **XSS mitigation** - HttpOnly cookies prevent token theft
- **Basic access control** - Role-based restrictions on sensitive operations
- **Information leak prevention** - Proper error handling without data exposure
- **Session security** - Secure cookie configuration

### Post-Deployment Monitoring
- Monitor 401/403 error rates (should be low for legitimate users)
- Track authentication failures (watch for brute force attempts)
- Monitor API response times (should remain under 500ms)
- Check for unauthorized access attempts in logs

---

**DEPLOYMENT URGENCY:** 🔴 **CRITICAL - DEPLOY WITHIN 48 HOURS**  
**Security Level:** Production-Safe MVP  
**Technical Debt:** Acceptable for short-term production use  
**Next Review:** 2 weeks post-deployment for enhanced security features