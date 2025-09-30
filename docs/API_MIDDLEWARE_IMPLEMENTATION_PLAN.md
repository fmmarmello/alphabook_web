# API Middleware Authentication System Implementation Plan

## Critical Priority: Emergency API Protection

### Phase 1: Immediate Security Fix (Deploy within 24 hours)

#### 1.1 Emergency Middleware Configuration
**File: `middleware.ts`**
```typescript
export const config = {
  matcher: [
    // CRITICAL: Add missing API route protection
    '/api/dashboard/:path*',      // ✅ ADD - Dashboard APIs
    '/api/clients/:path*',        // ✅ ADD - Client APIs  
    '/api/orders/:path*',         // ✅ ADD - Order APIs
    '/api/budgets/:path*',        // ✅ ADD - Budget APIs
    '/api/centers/:path*',        // ✅ ADD - Center APIs
    '/api/reports/:path*',        // ✅ ADD - Report APIs
    '/api/users/:path*',          // ✅ ADD - User APIs
    // Existing page protection
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

#### 1.2 Enhanced Middleware Logic
```typescript
// middleware.ts - Enhanced Version
import { NextRequest, NextResponse } from 'next/server';
import { extractAccessToken, verifyAccessTokenEdge } from '@/lib/edge-auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip auth routes
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }
  
  console.log('[ENHANCED MIDDLEWARE] Protecting:', pathname);
  
  try {
    const accessToken = extractAccessToken(request);
    
    if (!accessToken) {
      console.log('[ENHANCED MIDDLEWARE] No token found for:', pathname);
      return handleUnauthorized(request, 'No access token');
    }
    
    const decoded = await verifyAccessTokenEdge(accessToken);
    
    if (!decoded) {
      console.log('[ENHANCED MIDDLEWARE] Invalid token for:', pathname);
      return handleUnauthorized(request, 'Invalid token');
    }
    
    // Add user info to headers for API routes
    const response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });
    
    response.headers.set('x-user-id', decoded.userId.toString());
    response.headers.set('x-user-email', decoded.email);
    response.headers.set('x-user-role', decoded.role);
    
    addSecurityHeaders(response);
    return response;
    
  } catch (error) {
    console.error('[ENHANCED MIDDLEWARE] Error for:', pathname, error);
    return handleUnauthorized(request, 'Authentication error');
  }
}

function handleUnauthorized(request: NextRequest, reason: string) {
  const pathname = request.nextUrl.pathname;
  
  // API routes return JSON error
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: { message: 'Unauthorized', details: reason } },
      { status: 401 }
    );
  }
  
  // Page routes redirect to login
  const loginUrl = new URL('/login', request.nextUrl.origin);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}
```

### Phase 2: Enhanced API Route Protection (Deploy within 48 hours)

#### 2.1 Standardized API Route Authentication
**Create: `src/lib/api-auth.ts`**
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

export function requireRole(user: AuthenticatedUser, requiredRole: Role): void {
  if (user.role !== requiredRole && !canAccessRole(user.role, requiredRole)) {
    throw new ApiAuthError('Insufficient permissions', 403);
  }
}

export function requirePermission(user: AuthenticatedUser, permission: string): void {
  if (!hasPermission(user.role, permission)) {
    throw new ApiAuthError(`Permission required: ${permission}`, 403);
  }
}

function canAccessRole(userRole: Role, requiredRole: Role): boolean {
  const hierarchy = {
    [Role.USER]: 1,
    [Role.MODERATOR]: 2,
    [Role.ADMIN]: 3
  };
  
  return hierarchy[userRole] >= hierarchy[requiredRole];
}

function hasPermission(role: Role, permission: string): boolean {
  // Implement permission checking logic
  const permissions = {
    [Role.USER]: ['read:clients', 'read:orders', 'write:orders'],
    [Role.MODERATOR]: ['read:clients', 'read:orders', 'write:orders', 'write:clients', 'read:reports'],
    [Role.ADMIN]: ['*'] // All permissions
  };
  
  return permissions[role]?.includes(permission) || permissions[role]?.includes('*');
}
```

#### 2.2 Protected API Route Template
**Update: All API routes**
```typescript
// Example: app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, requirePermission, ApiAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from middleware headers
    const user = getAuthenticatedUser(request);
    
    // Check permissions
    requirePermission(user, 'read:clients');
    
    // Apply data filtering based on role
    const clients = await getClientsForUser(user);
    
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

async function getClientsForUser(user: AuthenticatedUser) {
  // Role-based data filtering
  switch (user.role) {
    case Role.ADMIN:
      return prisma.client.findMany();
    case Role.MODERATOR:
      return prisma.client.findMany({
        select: { id: true, name: true, email: true, cnpjCpf: true }
      });
    case Role.USER:
      return prisma.client.findMany({
        where: { createdByUserId: user.userId },
        select: { id: true, name: true, email: true }
      });
    default:
      return [];
  }
}
```

### Phase 3: Advanced Security Middleware (Deploy within 1 week)

#### 3.1 Rate Limiting Implementation
**Create: `src/lib/middleware/rate-limiting.ts`**
```typescript
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();
  
  async checkLimit(
    identifier: string, 
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const record = this.store.get(identifier);
    
    if (!record || now > record.resetTime) {
      const resetTime = now + config.windowMs;
      this.store.set(identifier, { count: 1, resetTime });
      return { 
        allowed: true, 
        remaining: config.maxRequests - 1, 
        resetTime 
      };
    }
    
    if (record.count >= config.maxRequests) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: record.resetTime 
      };
    }
    
    record.count++;
    return { 
      allowed: true, 
      remaining: config.maxRequests - record.count, 
      resetTime: record.resetTime 
    };
  }
}

export const rateLimiter = new RateLimiter();

// Rate limiting configurations
export const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },      // 5 per 15 minutes
  api: { windowMs: 60 * 1000, maxRequests: 100 },          // 100 per minute
  strict: { windowMs: 60 * 1000, maxRequests: 10 },        // 10 per minute
};
```

#### 3.2 CSRF Protection
**Create: `src/lib/middleware/csrf-protection.ts`**
```typescript
import crypto from 'crypto';

export class CSRFProtection {
  private static readonly CSRF_TOKEN_LENGTH = 32;
  
  static generateToken(): string {
    return crypto.randomBytes(this.CSRF_TOKEN_LENGTH).toString('hex');
  }
  
  static validateToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) return false;
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(token, 'hex'),
        Buffer.from(sessionToken, 'hex')
      );
    } catch {
      return false;
    }
  }
  
  static async middleware(request: NextRequest): Promise<boolean> {
    // Skip GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }
    
    const csrfToken = request.headers.get('x-csrf-token') || 
                     request.cookies.get('csrf-token')?.value;
    
    const sessionCsrfToken = request.cookies.get('session-csrf')?.value;
    
    return this.validateToken(csrfToken || '', sessionCsrfToken || '');
  }
}
```

#### 3.3 Security Headers Implementation
**Create: `src/lib/middleware/security-headers.ts`**
```typescript
export function addSecurityHeaders(response: NextResponse): void {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Force HTTPS
  response.headers.set(
    'Strict-Transport-Security', 
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );
  
  // Prevent caching of sensitive content
  if (response.url?.includes('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }
}
```

## Deployment Strategy

### Rollout Phases

#### Phase 1: Emergency Fix (0-24 hours)
1. **Deploy middleware config update**
2. **Monitor API protection**
3. **Verify no legitimate requests blocked**

#### Phase 2: Enhanced Protection (24-48 hours)
1. **Deploy API authentication library**
2. **Update critical API routes**
3. **Test end-to-end functionality**

#### Phase 3: Advanced Security (48-168 hours)
1. **Deploy rate limiting**
2. **Implement CSRF protection**
3. **Add comprehensive security headers**
4. **Deploy audit logging**

### Monitoring & Alerting

#### Metrics to Track
```typescript
interface SecurityMetrics {
  blockedRequests: number;
  authenticationFailures: number;
  rateLimitExceeded: number;
  csrfViolations: number;
  averageResponseTime: number;
}
```

#### Alert Conditions
- Authentication failure rate > 10%
- Blocked requests > 100/minute
- Response time > 1000ms
- CSRF violations detected
- Unusual access patterns

### Testing Strategy

#### 1. Unit Tests
```typescript
describe('API Authentication Middleware', () => {
  it('should block requests without tokens', async () => {
    const response = await testMiddleware('/api/clients', { method: 'GET' });
    expect(response.status).toBe(401);
  });
  
  it('should allow requests with valid tokens', async () => {
    const token = generateValidToken({ role: Role.USER });
    const response = await testMiddleware('/api/clients', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status).toBe(200);
  });
});
```

#### 2. Integration Tests
```typescript
describe('End-to-End API Security', () => {
  it('should enforce role-based access', async () => {
    const userToken = generateToken({ role: Role.USER });
    const adminToken = generateToken({ role: Role.ADMIN });
    
    // User should not access admin endpoints
    const userResponse = await request('/api/users', userToken);
    expect(userResponse.status).toBe(403);
    
    // Admin should access admin endpoints
    const adminResponse = await request('/api/users', adminToken);
    expect(adminResponse.status).toBe(200);
  });
});
```

#### 3. Security Tests
```typescript
describe('Security Penetration Tests', () => {
  it('should prevent authentication bypass', async () => {
    // Test various bypass attempts
    const bypassAttempts = [
      { headers: { 'x-user-id': '1' } },
      { cookies: { 'fake-token': 'malicious' } },
      { headers: { Authorization: 'Bearer fake.jwt.token' } }
    ];
    
    for (const attempt of bypassAttempts) {
      const response = await testRequest('/api/clients', attempt);
      expect(response.status).toBe(401);
    }
  });
});
```

### Performance Optimization

#### Caching Strategy
```typescript
// Token validation caching
const tokenCache = new Map<string, { user: AuthenticatedUser; expires: number }>();

export function getCachedUser(token: string): AuthenticatedUser | null {
  const cached = tokenCache.get(token);
  if (cached && Date.now() < cached.expires) {
    return cached.user;
  }
  tokenCache.delete(token);
  return null;
}

export function setCachedUser(token: string, user: AuthenticatedUser): void {
  tokenCache.set(token, {
    user,
    expires: Date.now() + 60000 // 1 minute cache
  });
}
```

#### Database Query Optimization
```typescript
// Optimized user lookup with role-based queries
export async function getOptimizedUserData(userId: number, role: Role) {
  const baseQuery = { where: { id: userId } };
  
  switch (role) {
    case Role.ADMIN:
      return prisma.user.findUnique({
        ...baseQuery,
        include: { sessions: true, auditLogs: true }
      });
    case Role.MODERATOR:
      return prisma.user.findUnique({
        ...baseQuery,
        select: { id: true, email: true, name: true, role: true }
      });
    default:
      return prisma.user.findUnique({
        ...baseQuery,
        select: { id: true, email: true, name: true }
      });
  }
}
```

---

**Implementation Priority:** CRITICAL  
**Target Deployment:** 24-48 hours for core security  
**Full Implementation:** 1 week  
**Security Level:** Production-ready Zero-Trust