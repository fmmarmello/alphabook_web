/**
 * Authentication Security Test Harness
 * ------------------------------------
 * Drop this file into the browser console via:
 *   const script = document.createElement('script');
 *   script.src = '/auth-test.js';
 *   document.head.appendChild(script);
 * Then run: testAuthSecurity();
 */

(function attachTestSuite() {
  if (typeof window === 'undefined') return;

  const icons = {
    info: '??',
    success: '?',
    warning: '??',
    error: '?',
  };

  function log(message, type = 'info') {
    console.log(`${icons[type] ?? icons.info} ${message}`);
  }

  function record(result, results) {
    result ? results.passed++ : results.failed++;
  }

  async function testCookieAccess(results) {
    console.log('\n?? Test 1: Cookie Access');
    try {
      const cookies = document.cookie;
      const hasAccessToken = cookies.includes('accessToken=');
      const hasRefreshToken = cookies.includes('refreshToken=');

      log(`Access token cookie: ${hasAccessToken ? 'present' : 'missing'}`, hasAccessToken ? 'success' : 'warning');
      log(`Refresh token cookie: ${hasRefreshToken ? 'present' : 'missing'}`, hasRefreshToken ? 'success' : 'warning');

      return { hasAccessToken, hasRefreshToken };
    } catch (error) {
      log(`Cookie access test failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      record(false, results);
      return { hasAccessToken: false, hasRefreshToken: false };
    }
  }

  async function testDirectDashboardAccess(results) {
    console.log('\n?? Test 2: Direct Dashboard Access');

    try {
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      log('Cleared authentication cookies', 'info');

      const response = await fetch('/dashboard', {
        method: 'GET',
        credentials: 'include',
      });

      log(`Dashboard response status: ${response.status}`, 'info');

      const redirectedToLogin = response.redirected && response.url.includes('/login');

      if (redirectedToLogin || response.status === 401) {
        log('Dashboard correctly blocked without authentication', 'success');
        record(true, results);
        return true;
      }

      if (response.status === 302 || response.status === 307) {
        const redirectUrl = response.headers.get('location') || response.url;
        log(`Correctly redirected to: ${redirectUrl}`, 'success');
        record(true, results);
        return true;
      }

      if (response.status === 200) {
        log('SECURITY ISSUE: Dashboard accessible without authentication!', 'error');
        record(false, results);
        results.securityIssues.push('Dashboard accessible without authentication');
        return false;
      }

      log(`Unexpected response: ${response.status}`, 'warning');
      return false;
    } catch (error) {
      log(`Dashboard access test failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      record(false, results);
      return false;
    }
  }

  async function testApiAccess(results) {
    console.log('\n?? Test 3: API Access Without Auth');

    try {
      const response = await fetch('/api/budgets', {
        method: 'GET',
        credentials: 'include',
      });

      log(`API response status: ${response.status}`, 'info');

      if (response.status === 401) {
        log('API correctly rejects unauthenticated requests', 'success');
        record(true, results);
        return true;
      }

      if (response.status === 200) {
        log('SECURITY ISSUE: API accessible without authentication!', 'error');
        results.securityIssues.push('Budget API accessible without authentication');
        record(false, results);
        return false;
      }

      log(`Unexpected API response: ${response.status}`, 'warning');
      return false;
    } catch (error) {
      log(`API access test failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      record(false, results);
      return false;
    }
  }

  async function testMiddlewareLogging(results) {
    console.log('\n?? Test 4: Middleware Logging Check');

    if (window.authLogger) {
      const recentLogs = window.authLogger.getRecentLogs?.(5) ?? [];
      log(`Found ${recentLogs.length} recent auth logs`, recentLogs.length ? 'info' : 'warning');

      recentLogs.forEach(entry => {
        log(`${entry.timestamp} [${entry.component}] ${entry.action}`, 'info');
      });

      if (recentLogs.length) {
        record(true, results);
        return true;
      }

      return false;
    }

    log('Auth logger not available in window object', 'warning');
    return false;
  }

  async function testLoginFlow(results) {
    console.log('\n?? Test 5: Login Flow Test');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'felipe', password: 'Secret1!' }),
      });

      log(`Login response status: ${response.status}`, 'info');

      if (response.status !== 200) {
        log(`Login failed with status: ${response.status}`, 'error');
        record(false, results);
        return false;
      }

      const cookies = document.cookie;
      const hasAccessToken = cookies.includes('accessToken=');
      const hasRefreshToken = cookies.includes('refreshToken=');

      log(`Access token cookie set: ${hasAccessToken}`, hasAccessToken ? 'success' : 'error');
      log(`Refresh token cookie set: ${hasRefreshToken}`, hasRefreshToken ? 'success' : 'error');

      const success = hasAccessToken && hasRefreshToken;
      record(success, results);
      return success;
    } catch (error) {
      log(`Login flow test failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      record(false, results);
      return false;
    }
  }

  async function testAuthenticatedAccess(results) {
    console.log('\n?? Test 6: Authenticated Access Test');

    const loggedIn = await testLoginFlow(results);
    if (!loggedIn) {
      log('Skipping authenticated access test because login failed', 'warning');
      return false;
    }

    try {
      const response = await fetch('/dashboard', {
        method: 'GET',
        credentials: 'include',
      });

      log(`Authenticated dashboard response: ${response.status}`, 'info');

      if (response.status === 200 && !response.redirected) {
        log('Dashboard accessible when authenticated', 'success');
        record(true, results);
        return true;
      }

      log('Unexpected authenticated response, please verify manually', 'warning');
      return false;
    } catch (error) {
      log(`Authenticated access test failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      record(false, results);
      return false;
    }
  }

  window.testAuthSecurity = async function runAuthSecuritySuite() {
    console.log('?? Starting Browser Authentication Security Test');

    const results = {
      passed: 0,
      failed: 0,
      securityIssues: [],
    };

    await testCookieAccess(results);
    await testDirectDashboardAccess(results);
    await testApiAccess(results);
    await testMiddlewareLogging(results);
    await testAuthenticatedAccess(results);

    console.log('\n================================================================================');
    console.log('?? AUTHENTICATION SECURITY TEST REPORT');
    console.log('================================================================================');
    console.log(`? Passed: ${results.passed}`);
    console.log(`? Failed: ${results.failed}`);
    console.log(`?? Security Issues: ${results.securityIssues.length}`);
    console.log('================================================================================');

    if (results.securityIssues.length) {
      console.log('\n?? CRITICAL SECURITY ISSUES:');
      results.securityIssues.forEach(issue => console.log(`  ? ${issue}`));
    }

    if (!results.securityIssues.length && results.failed === 0) {
      console.log('\n? All authentication tests passed!');
    }

    console.log('\n?? Next Steps:');
    console.log('  1. Fix all security issues immediately');
    console.log('  2. Check middleware configuration');
    console.log('  3. Verify ProtectedRoute implementation');
    console.log('  4. Test with different browsers');

    return results;
  };

  console.log(`\nAuthentication Security Test Loaded!\n\nRun testAuthSecurity() from the console to execute all checks.\n`);
})();
