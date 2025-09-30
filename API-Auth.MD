# API Authentication 401 Troubleshooting Guide

## 🚨 Critical 401 Error Sources Identified

### **Authentication System Architecture Overview**

Your authentication system uses a **multi-layer security approach**:

1. **JWT Token Management** (`/api/auth/login`)
   - Access tokens (15min expiry) 
   - Refresh tokens (7 days expiry)
   - HttpOnly cookie storage for XSS protection

2. **Next.js Middleware Protection** (`middleware.ts`)
   - Runs on ALL protected routes 
   - Validates tokens from Authorization headers OR cookies
   - Forwards user context via request headers

3. **API Route Authentication** (`/lib/api-auth.ts`)
   - Each route calls `getAuthenticatedUser(request)`
   - Reads user context from middleware-injected headers
   - Role-based access control (RBAC)

---

## 🔍 **Root Cause Analysis: 7 Primary 401 Error Sources**

### **1. Environment Variables & JWT Secret Issues**

**🎯 Most Likely Cause: Missing or Invalid JWT Secrets**

```bash
# Check your environment variables
echo $JWT_SECRET
echo $JWT_REFRESH_SECRET
```

**Symptoms:**
- All API routes return 401 despite successful login
- Token verification fails in middleware
- "JWT_SECRET must be set" errors in logs

**Resolution:**
```bash
# .env.local - Ensure these are set and ≥32 characters
JWT_SECRET=your-super-secure-secret-key-at-least-32-chars-long
JWT_REFRESH_SECRET=your-refresh-secret-key-also-32-chars-minimum
```

**Debug Command:**
```bash
node -e "console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 'MISSING')"
```

---

### **2. Token Extraction & Header Issues**

**🎯 Second Most Likely: Authorization Header Problems**

**Code Location:** `src/lib/edge-auth.ts:23-32`

```javascript
// Current extraction logic
export function extractAccessToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  
  const cookieToken = request.cookies.get("accessToken")?.value;
  return cookieToken ?? null;
}
```

**Debug Steps:**

```bash
# 1. Check request headers in browser DevTools
# Network tab → API request → Request Headers
# Look for: Authorization: Bearer <token>

# 2. Check cookie presence
# Application tab → Cookies → localhost
# Look for: accessToken cookie
```

**Common Issues:**
- Missing "Bearer " prefix in Authorization header
- Cookie not sent due to `sameSite` restrictions
- CORS stripping authentication headers

---

### **3. Middleware Header Forwarding Failures**

**🎯 Critical: Headers Not Reaching API Routes**

**Code Location:** `middleware.ts:35-48`

```javascript
// Middleware should set these headers
requestHeaders.set('x-user-id', decoded.userId.toString());
requestHeaders.set('x-user-email', decoded.email);
requestHeaders.set('x-user-role', decoded.role);
```

**Debug in API Route:**
```javascript
// Add this to any API route for debugging
export async function GET(request: NextRequest) {
  console.log('[DEBUG] All headers:', Object.fromEntries(request.headers.entries()));
  console.log('[DEBUG] x-user-id:', request.headers.get('x-user-id'));
  console.log('[DEBUG] x-user-email:', request.headers.get('x-user-email'));
  console.log('[DEBUG] x-user-role:', request.headers.get('x-user-role'));
  // ... rest of your code
}
```

**Symptoms:**
- Middleware logs show successful authentication
- API routes still throw 401 "Authentication required"
- Missing x-user-* headers in API routes

---

### **4. Token Expiry & Refresh Logic Issues**

**🎯 Timing Issues: Race Conditions & Expired Tokens**

**Access Token Lifespan:** 15 minutes
**Refresh Token Lifespan:** 7 days

**Client-Side Refresh Logic:** `src/components/auth/AuthProvider.tsx:159-181`

**Debug Token Expiry:**
```javascript
// Browser console - check token expiry
const token = document.cookie.match(/accessToken=([^;]+)/)?.[1];
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token expires:', new Date(payload.exp * 1000));
  console.log('Current time:', new Date());
}
```

**Common Issues:**
- Clock synchronization problems
- Refresh requests failing silently
- Multiple refresh attempts causing conflicts

---

### **5. CORS & Cross-Origin Request Problems**

**🎯 Browser Security: Credentials & Preflight Issues**

**Critical Settings in API Calls:**
```javascript
// Must include credentials for httpOnly cookies
fetch('/api/...', {
  credentials: 'include', // CRITICAL for cookie-based auth
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**CORS Troubleshooting:**
```bash
# Check for CORS preflight requests
# DevTools Network Tab → Look for OPTIONS requests
# Ensure they return 200 OK

# Check Response Headers:
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Headers: authorization, content-type
```

**Development vs Production:**
- Secure cookie flag differences
- Domain/port mismatches
- Proxy configuration issues

---

### **6. Next.js Middleware Configuration Issues**

**🎯 Route Matching: Middleware Not Running**

**Current Config:** `middleware.ts:96-117`

```javascript
export const config = {
  matcher: [
    '/api/dashboard/:path*',
    '/api/clients/:path*',
    '/api/orders/:path*',
    '/api/budgets/:path*',
    // ... other protected routes
  ],
};
```

**Debug Middleware Execution:**
```bash
# Check logs for middleware execution
# Should see: [SECURITY MIDDLEWARE] Protecting: /api/...

# If not seeing logs, middleware isn't running
# Check matcher patterns match your API routes
```

**Verification Command:**
```bash
# Test if middleware protects a route
curl -X GET http://localhost:3000/api/clients \
  -H "Content-Type: application/json"
# Should return 401 without proper authentication
```

---

### **7. Client-Server Authentication State Sync**

**🎯 State Management: Multi-Tab & Persistence Issues**

**AuthProvider Session Logic:** `src/components/auth/AuthProvider.tsx:110-134`

**Debug Session State:**
```javascript
// Browser console
console.log('Has auth session:', localStorage.getItem('hasAuthSession'));
console.log('Access token cookie:', document.cookie.includes('accessToken'));
```

**Common Issues:**
- Race conditions between tabs
- localStorage sync failures
- Automatic refresh conflicts

---

## 🛠 **Technical Debugging Methodology**

### **Phase 1: Environment Validation**

```bash
# 1. Verify environment variables
npm run dev 2>&1 | grep -i "jwt"

# 2. Check Next.js is reading .env.local
node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
node -e "console.log('JWT_SECRET defined:', !!process.env.JWT_SECRET)"
```

### **Phase 2: Token Flow Testing**

```bash
# 1. Login and capture tokens
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  -c cookies.txt -v

# 2. Test protected API with cookies
curl -X GET http://localhost:3000/api/clients \
  -b cookies.txt -v

# 3. Test with Authorization header
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' | \
  jq -r '.data.accessToken')

curl -X GET http://localhost:3000/api/clients \
  -H "Authorization: Bearer $TOKEN" -v
```

### **Phase 3: Middleware Analysis**

```bash
# Add debugging to middleware.ts
console.log('[MIDDLEWARE DEBUG] Route:', request.nextUrl.pathname);
console.log('[MIDDLEWARE DEBUG] Headers:', Object.fromEntries(request.headers.entries()));
console.log('[MIDDLEWARE DEBUG] Cookies:', request.cookies.getAll());
```

### **Phase 4: API Route Header Inspection**

Add to any API route:
```javascript
export async function GET(request: NextRequest) {
  console.log('[API DEBUG] Authentication headers:');
  console.log('  x-user-id:', request.headers.get('x-user-id'));
  console.log('  x-user-email:', request.headers.get('x-user-email'));
  console.log('  x-user-role:', request.headers.get('x-user-role'));
  console.log('  authorization:', request.headers.get('authorization'));
  
  // Continue with authentication logic...
}
```

---

## 🔧 **Systematic Resolution Checklist**

### **Immediate Actions (Do First)**

- [ ] **Verify JWT_SECRET in .env.local** (≥32 chars)
- [ ] **Check middleware logs** for route protection
- [ ] **Inspect browser cookies** for accessToken presence
- [ ] **Test login API directly** with curl/Postman

### **Environment Configuration**

- [ ] **JWT_SECRET** set and secure (≥32 characters)
- [ ] **JWT_REFRESH_SECRET** set and different from JWT_SECRET
- [ ] **NODE_ENV** correctly set (development/production)
- [ ] **Cookie security flags** match environment

### **Token Management**

- [ ] **Access token expiry** (15 minutes) working correctly
- [ ] **Refresh token expiry** (7 days) working correctly  
- [ ] **Token refresh logic** not causing conflicts
- [ ] **Clock synchronization** between client/server

### **Middleware Configuration**

- [ ] **Route matcher patterns** include all protected APIs
- [ ] **Header forwarding** working (x-user-* headers present)
- [ ] **Error handling** returning proper JSON for API routes
- [ ] **CORS configuration** allowing credentials

### **API Route Authentication**

- [ ] **getAuthenticatedUser()** reading headers correctly
- [ ] **Role-based access** working for different user types
- [ ] **Error responses** consistent and secure
- [ ] **Database queries** using proper user context

### **Client-Side Integration**

- [ ] **AuthProvider initialization** working correctly
- [ ] **Automatic refresh** triggering when needed
- [ ] **Multi-tab synchronization** via localStorage
- [ ] **Error handling** showing appropriate messages

---

## 📊 **Network Request Inspection**

### **Browser DevTools Checklist**

**Network Tab Analysis:**
1. **Login Request** → Status 200, returns access/refresh tokens
2. **Protected API Request** → Headers include `Authorization` OR cookies
3. **Response Status** → 401 indicates authentication failure
4. **Preflight OPTIONS** → Must return 200 with proper CORS headers

**Application Tab Analysis:**
1. **Cookies** → `accessToken` and `refreshToken` present
2. **Local Storage** → `hasAuthSession` = true
3. **Session Storage** → No conflicting auth data

**Console Analysis:**
1. **[SECURITY MIDDLEWARE]** logs showing route protection
2. **[API-AUTH DEBUG]** logs showing header values
3. **Authentication errors** with specific failure reasons

---

## 🚀 **Production Environment Considerations**

### **SSL/TLS & HTTPS Requirements**

```bash
# Production checklist
- [ ] HTTPS enabled for all authentication endpoints
- [ ] Secure cookie flag: true in production  
- [ ] HSTS headers properly configured
- [ ] Certificate chain valid and trusted
```

### **Load Balancer & Proxy Configuration**

```bash
# Common proxy issues
- [ ] Authentication headers forwarded correctly
- [ ] Session persistence (sticky sessions)
- [ ] Health checks bypassing authentication
- [ ] Rate limiting not blocking legitimate requests
```

### **Third-Party Service Integration**

```bash
# External service considerations  
- [ ] Database connection pooling and auth
- [ ] Redis/session store connectivity
- [ ] JWT verification service availability
- [ ] Logging and monitoring integration
```

---

## 🧪 **Step-by-Step Authentication Flow Testing**

### **Test Sequence 1: Basic Login Flow**

```bash
# 1. Test user registration/existence
curl -X GET http://localhost:3000/api/auth/validate
# Expected: 401 Unauthorized

# 2. Test login with valid credentials  
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin-email","password":"your-password"}' \
  -c cookies.txt
# Expected: 200 OK with tokens

# 3. Test protected route with cookies
curl -X GET http://localhost:3000/api/dashboard/summary \
  -b cookies.txt
# Expected: 200 OK with data
```

### **Test Sequence 2: Token Refresh Flow**

```bash
# 1. Wait for access token expiry (15+ minutes)
# 2. Make API request with expired token
curl -X GET http://localhost:3000/api/clients -b cookies.txt
# Should trigger automatic refresh

# 3. Verify refresh endpoint directly
curl -X POST http://localhost:3000/api/auth/refresh -b cookies.txt
# Expected: 200 OK with new tokens
```

### **Test Sequence 3: Authorization Header Testing**

```bash
# Extract token from login response
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' | \
  jq -r '.data.accessToken')

# Test with Authorization header
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK (for admin) or 403 (for regular users)
```

---

## 🎯 **Most Common Resolution Patterns**

### **Pattern 1: Missing Environment Variables**
```bash
# Add to .env.local
JWT_SECRET=your-32-character-minimum-secret-key-here
JWT_REFRESH_SECRET=your-different-32-char-refresh-secret
```

### **Pattern 2: Middleware Not Running**
```javascript
// Check middleware.ts config
export const config = {
  matcher: [
    '/api/your-protected-routes/:path*', // Ensure this matches your API routes
  ],
};
```

### **Pattern 3: CORS Credentials Issue**
```javascript
// Ensure all API calls include credentials
fetch('/api/endpoint', {
  credentials: 'include', // Critical for cookie-based auth
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### **Pattern 4: Header Case Sensitivity**
```javascript
// Headers are case-insensitive in HTTP but check exact casing
request.headers.get('x-user-id') // lowercase
request.headers.get('X-User-Id') // title case  
request.headers.get('authorization') // lowercase
```

---

This comprehensive guide provides the systematic approach needed to identify and resolve the persistent 401 errors preventing your MVP release. Start with the **Environment Validation** phase and work through each section systematically.