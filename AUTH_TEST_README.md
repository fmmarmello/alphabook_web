# 🔐 Authentication Security Test Suite

## Overview

This comprehensive test suite diagnoses authentication protection issues by simulating various unauthorized access scenarios and logging detailed information about the authentication flow.

## 🚀 Quick Start

### Browser Console Testing (Recommended)

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to `http://localhost:3000`

3. **Open browser console** (F12 → Console tab)

4. **Load the test script:**
   ```javascript
   // Copy and paste this into the console:
   const script = document.createElement('script');
   script.src = '/auth-test.js';
   document.head.appendChild(script);
   ```

5. **Run the test suite:**
   ```javascript
   testAuthSecurity()
   ```

## 📊 Test Scenarios

### 1. Cookie Access Test
- ✅ Checks if access/refresh tokens are properly stored in cookies
- ✅ Verifies cookie readability by client-side code

### 2. Direct Dashboard Access
- ✅ Attempts to access `/dashboard` without authentication
- ✅ Should redirect to `/login?redirect=/dashboard`
- ❌ **SECURITY ISSUE** if dashboard loads without login

### 3. API Access Without Auth
- ✅ Attempts to access `/api/budgets` without authentication
- ✅ Should return 401 Unauthorized
- ❌ **SECURITY ISSUE** if API returns data

### 4. Middleware Logging Check
- ✅ Verifies authentication logging is working
- ✅ Checks for recent auth events in the log

### 5. Login Flow Test
- ✅ Tests complete login process with valid credentials
- ✅ Verifies tokens are set in cookies after login

### 6. Authenticated Access Test
- ✅ Tests dashboard access after successful login
- ✅ Should allow access when properly authenticated

## 🔍 Debugging Dashboard Access Issue

### Current Symptoms
- Dashboard loads without requiring login
- User can access protected routes directly

### Key Investigation Points

#### 1. Middleware Execution
```bash
# Check if middleware is running
console.log('[MIDDLEWARE] Processing request: /dashboard');
```
**Expected:** Should see middleware logs in server console

#### 2. Cookie Validation
```javascript
// In browser console
console.log('Cookies:', document.cookie);
```
**Expected:** Should show `accessToken=...` when logged in

#### 3. ProtectedRoute Logic
```javascript
// Check ProtectedRoute component logs
console.log('[ProtectedRoute] Authentication check');
```
**Expected:** Should see component attempting authentication validation

#### 4. Token Validation
```javascript
// Test token validation
const token = getCookie('accessToken');
console.log('Token exists:', !!token);
console.log('Token valid:', !!verifyAccessToken(token));
```

## 🛠️ Manual Testing Steps

### Step 1: Clear Authentication State
```javascript
// Clear all auth data
document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
localStorage.clear();
sessionStorage.clear();
```

### Step 2: Test Direct Access
```javascript
// Navigate to dashboard without login
window.location.href = '/dashboard';
```
**Expected:** Should redirect to login page

### Step 3: Test Login Flow
```javascript
// Login with test credentials
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'felipe', password: 'Secret1!' })
}).then(r => r.json()).then(console.log);
```

### Step 4: Test Authenticated Access
```javascript
// Try dashboard access after login
window.location.href = '/dashboard';
```
**Expected:** Should load dashboard successfully

## 📋 Log Analysis

### Server Console Logs
Look for these patterns:
```
[MIDDLEWARE] Processing request: /dashboard
[MIDDLEWARE] Token validation: isValid=true, userId=1
[MIDDLEWARE] Page access granted: /dashboard for user 1
```

### Browser Console Logs
Look for these patterns:
```
[ProtectedRoute] Starting authentication check
[ProtectedRoute] Token check: hasToken=true, length=XXX
[ProtectedRoute] Authentication successful for user: 1
```

## 🚨 Common Issues & Fixes

### Issue 1: Middleware Not Running
**Symptoms:** No middleware logs in server console
**Fix:** Check middleware matcher configuration
```typescript
// In middleware.ts
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### Issue 2: Cookies Not Set
**Symptoms:** `document.cookie` doesn't show tokens
**Fix:** Check login API response and cookie settings

### Issue 3: Token Validation Failing
**Symptoms:** Token exists but validation fails
**Fix:** Check JWT_SECRET environment variable

### Issue 4: ProtectedRoute Not Working
**Symptoms:** Component renders without checking auth
**Fix:** Verify component is properly wrapped around dashboard

## 📈 Test Results Interpretation

### ✅ All Tests Pass
- Authentication system working correctly
- No security vulnerabilities detected

### ❌ Security Issues Found
- **HIGH PRIORITY:** Fix immediately
- Check middleware configuration
- Verify token validation logic
- Test with real authentication flow

### ⚠️ Warnings
- Review and optimize as needed
- May indicate potential issues

## 🔧 Advanced Debugging

### Enable Verbose Logging
```javascript
// In browser console
localStorage.setItem('auth_debug', 'true');
```

### Inspect Auth State
```javascript
// Check current auth state
console.log('Auth state:', {
  cookies: document.cookie,
  localStorage: Object.keys(localStorage),
  sessionStorage: Object.keys(sessionStorage)
});
```

### Monitor Network Requests
1. Open DevTools → Network tab
2. Filter by "dashboard"
3. Check response status and redirects

## 📞 Support

If tests reveal security issues:

1. **Document the issue** with exact steps to reproduce
2. **Include log output** from both server and browser consoles
3. **Note environment details** (browser, Node version, etc.)
4. **Check recent code changes** that might have affected auth

## 🎯 Next Steps

After running tests:
1. Fix any identified security issues
2. Implement additional monitoring
3. Consider adding automated tests to CI/CD
4. Schedule regular security audits