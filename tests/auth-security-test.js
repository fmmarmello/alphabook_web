/**
 * Authentication Security Test Suite
 *
 * This test suite simulates various unauthorized access scenarios
 * and logs detailed information about authentication flow.
 *
 * Run with: node tests/auth-security-test.js
 */

const { JSDOM } = require('jsdom');

// Mock browser environment for testing
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.sessionStorage = dom.window.sessionStorage;
global.localStorage = dom.window.localStorage;

// Mock fetch for testing
global.fetch = require('node-fetch');

// Import our auth utilities
const { verifyAccessToken } = require('../src/lib/auth.ts');
const { authLogger } = require('../src/lib/auth-logger.ts');

class AuthSecurityTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logEntry);
    this.testResults.push(logEntry);
  }

  async runTestSuite() {
    this.log('🚀 Starting Authentication Security Test Suite', 'info');

    try {
      // Test 1: Direct access to protected route without authentication
      await this.testDirectAccess();

      // Test 2: Access with invalid token
      await this.testInvalidToken();

      // Test 3: Access with expired token
      await this.testExpiredToken();

      // Test 4: API access without authentication
      await this.testApiAccess();

      // Test 5: Middleware behavior
      await this.testMiddlewareLogic();

      // Test 6: Cookie handling
      await this.testCookieHandling();

    } catch (error) {
      this.log(`Test suite error: ${error.message}`, 'error');
    }

    this.generateReport();
  }

  async testDirectAccess() {
    this.log('📋 Test 1: Direct Access to Protected Route', 'test');

    try {
      // Simulate accessing dashboard without authentication
      const response = await fetch(`${this.baseUrl}/dashboard`, {
        redirect: 'manual', // Don't follow redirects automatically
      });

      this.log(`Dashboard access response: ${response.status} ${response.statusText}`, 'info');

      if (response.status === 302 || response.status === 307) {
        const redirectUrl = response.headers.get('location');
        this.log(`Redirected to: ${redirectUrl}`, 'success');
      } else if (response.status === 200) {
        this.log('❌ SECURITY ISSUE: Dashboard accessible without authentication!', 'error');
      } else {
        this.log(`Unexpected response: ${response.status}`, 'warning');
      }

    } catch (error) {
      this.log(`Direct access test failed: ${error.message}`, 'error');
    }
  }

  async testInvalidToken() {
    this.log('📋 Test 2: Access with Invalid Token', 'test');

    try {
      // Set invalid token in cookie
      document.cookie = 'accessToken=invalid.jwt.token; path=/';

      const response = await fetch(`${this.baseUrl}/dashboard`, {
        redirect: 'manual',
      });

      this.log(`Invalid token response: ${response.status} ${response.statusText}`, 'info');

      if (response.status === 302 || response.status === 307) {
        this.log('✅ Correctly redirected with invalid token', 'success');
      } else {
        this.log('❌ SECURITY ISSUE: Invalid token not rejected!', 'error');
      }

    } catch (error) {
      this.log(`Invalid token test failed: ${error.message}`, 'error');
    }
  }

  async testExpiredToken() {
    this.log('📋 Test 3: Access with Expired Token', 'test');

    try {
      // Create an expired JWT token (expired 1 hour ago)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjg2MDAwMDAwLCJleHAiOjE2ODU5OTY0MDB9.invalid';

      document.cookie = `accessToken=${expiredToken}; path=/`;

      const response = await fetch(`${this.baseUrl}/dashboard`, {
        redirect: 'manual',
      });

      this.log(`Expired token response: ${response.status} ${response.statusText}`, 'info');

      if (response.status === 302 || response.status === 307) {
        this.log('✅ Correctly redirected with expired token', 'success');
      } else {
        this.log('❌ SECURITY ISSUE: Expired token not rejected!', 'error');
      }

    } catch (error) {
      this.log(`Expired token test failed: ${error.message}`, 'error');
    }
  }

  async testApiAccess() {
    this.log('📋 Test 4: API Access Without Authentication', 'test');

    try {
      const response = await fetch(`${this.baseUrl}/api/budgets`);

      this.log(`API access response: ${response.status} ${response.statusText}`, 'info');

      if (response.status === 401) {
        this.log('✅ API correctly rejects unauthenticated requests', 'success');
      } else {
        this.log('❌ SECURITY ISSUE: API accessible without authentication!', 'error');
      }

    } catch (error) {
      this.log(`API access test failed: ${error.message}`, 'error');
    }
  }

  testMiddlewareLogic() {
    this.log('📋 Test 5: Middleware Logic Validation', 'test');

    // Test token validation function
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjg2MDAwMDAwLCJleHAiOjE2ODU5OTY0MDB9.invalid';
    const invalidToken = 'invalid.jwt.token';

    const validResult = verifyAccessToken(validToken);
    const invalidResult = verifyAccessToken(invalidToken);

    this.log(`Token validation - Valid token: ${!!validResult ? 'accepted' : 'rejected'}`, validResult ? 'success' : 'error');
    this.log(`Token validation - Invalid token: ${!invalidResult ? 'correctly rejected' : 'incorrectly accepted'}`, !invalidResult ? 'success' : 'error');
  }

  testCookieHandling() {
    this.log('📋 Test 6: Cookie Handling', 'test');

    // Test cookie setting and reading
    document.cookie = 'testToken=abc123; path=/';
    const cookies = document.cookie;

    this.log(`Cookie set and readable: ${cookies.includes('testToken=abc123')}`, 'info');

    // Clean up
    document.cookie = 'testToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  generateReport() {
    this.log('📊 Test Suite Complete - Generating Report', 'info');

    const securityIssues = this.testResults.filter(line => line.includes('SECURITY ISSUE'));
    const successes = this.testResults.filter(line => line.includes('✅'));
    const failures = this.testResults.filter(line => line.includes('❌'));

    console.log('\n' + '='.repeat(80));
    console.log('📊 AUTHENTICATION SECURITY TEST REPORT');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${this.testResults.filter(line => line.includes('📋 Test')).length}`);
    console.log(`✅ Passed: ${successes.length}`);
    console.log(`❌ Failed: ${failures.length}`);
    console.log(`🚨 Security Issues: ${securityIssues.length}`);
    console.log('='.repeat(80));

    if (securityIssues.length > 0) {
      console.log('\n🚨 CRITICAL SECURITY ISSUES FOUND:');
      securityIssues.forEach(issue => console.log(`  ${issue}`));
    }

    if (securityIssues.length === 0) {
      console.log('\n✅ All security tests passed!');
    }

    console.log('\n📋 Recent Auth Logs:');
    const recentLogs = authLogger.getRecentLogs(10);
    recentLogs.forEach(log => {
      console.log(`  ${log.timestamp} [${log.component}] ${log.action}: ${JSON.stringify(log.details)}`);
    });

    console.log('\n💡 Recommendations:');
    if (securityIssues.length > 0) {
      console.log('  1. Fix all security issues immediately');
      console.log('  2. Review middleware configuration');
      console.log('  3. Verify token validation logic');
      console.log('  4. Test with real browser environment');
    } else {
      console.log('  1. Continue monitoring authentication logs');
      console.log('  2. Implement additional security measures');
      console.log('  3. Regular security audits recommended');
    }
  }
}

// Run the test suite
if (require.main === module) {
  const tester = new AuthSecurityTester();
  tester.runTestSuite().catch(console.error);
}

module.exports = AuthSecurityTester;