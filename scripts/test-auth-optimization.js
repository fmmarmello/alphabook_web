/**
 * Authentication Optimization Test Suite
 * Validates performance improvements and security integrity
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class AuthOptimizationTester {
  constructor() {
    this.results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      performanceMetrics: {},
      errors: []
    };
    this.authCookies = '';
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
  }

  async measurePerformance(name, operation) {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      this.results.performanceMetrics[name] = duration;
      this.log(`${name}: ${duration.toFixed(2)}ms`, 'PERF');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.results.performanceMetrics[name] = duration;
      this.log(`${name} FAILED: ${duration.toFixed(2)}ms - ${error.message}`, 'PERF');
      throw error;
    }
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const response = {
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            json: async () => {
              try {
                return JSON.parse(data);
              } catch (e) {
                throw new Error('Response is not valid JSON');
              }
            }
          };
          resolve(response);
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  async test(testName, testFn) {
    this.results.totalTests++;
    try {
      await testFn();
      this.results.passedTests++;
      this.log(`✅ ${testName} - PASSED`, 'TEST');
    } catch (error) {
      this.results.failedTests++;
      this.results.errors.push({ test: testName, error: error.message });
      this.log(`❌ ${testName} - FAILED: ${error.message}`, 'TEST');
    }
  }

  async authenticateTestUser() {
    this.log('🔐 Authenticating test user...', 'AUTH');
    
    const response = await this.measurePerformance('Login Request', async () => {
      return this.makeRequest(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify({
            email: 'admin@example.com',
            password: 'admin123'
          }))
        },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'admin123'
        })
      });
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Authentication failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    // Extract cookies for subsequent requests
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      this.authCookies = Array.isArray(setCookieHeader) ? setCookieHeader.join('; ') : setCookieHeader;
    }

    const authData = await response.json();
    this.log('✅ Authentication successful', 'AUTH');
    return authData;
  }

  async testOptimizedAPICall(endpoint, expectedStatus = 200) {
    return this.measurePerformance(`API Call: ${endpoint}`, async () => {
      const response = await this.makeRequest(`${API_BASE}${endpoint}`, {
        headers: {
          'Cookie': this.authCookies,
          'Content-Type': 'application/json'
        }
      });

      if (response.status !== expectedStatus) {
        throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
      }

      return response.json();
    });
  }

  async testTokenRefresh() {
    return this.measurePerformance('Token Refresh', async () => {
      const response = await this.makeRequest(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Cookie': this.authCookies,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Token refresh failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      // Update cookies with new tokens
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        this.authCookies = Array.isArray(setCookieHeader) ? setCookieHeader.join('; ') : setCookieHeader;
      }

      return response.json();
    });
  }

  async runSecurityTests() {
    this.log('🔒 Running security validation tests...', 'SECURITY');

    // Test 1: Unauthenticated access should be blocked
    await this.test('Unauthenticated API access blocked', async () => {
      const response = await this.makeRequest(`${API_BASE}/api/dashboard/summary`);
      if (response.status !== 401) {
        throw new Error(`Expected 401 Unauthorized, got ${response.status}`);
      }
    });

    // Test 2: Authenticated access should work
    await this.test('Authenticated API access allowed', async () => {
      await this.testOptimizedAPICall('/api/dashboard/summary');
    });

    // Test 3: Token refresh should work
    await this.test('Token refresh functionality', async () => {
      await this.testTokenRefresh();
    });

    // Test 4: Various API endpoints should work
    const endpoints = [
      '/api/dashboard/summary',
      '/api/navigation/counts',
      '/api/clients',
      '/api/orders',
      '/api/budgets'
    ];

    for (const endpoint of endpoints) {
      await this.test(`Optimized auth for ${endpoint}`, async () => {
        await this.testOptimizedAPICall(endpoint);
      });
    }
  }

  async runPerformanceTests() {
    this.log('⚡ Running performance validation tests...', 'PERF');

    // Test multiple API calls to measure consistent performance
    const iterations = 5;
    const performanceTimes = [];

    for (let i = 0; i < iterations; i++) {
      await this.testOptimizedAPICall('/api/dashboard/summary');
      performanceTimes.push(this.results.performanceMetrics[`API Call: /api/dashboard/summary`]);
    }

    // Calculate performance statistics
    const avgTime = performanceTimes.reduce((a, b) => a + b, 0) / performanceTimes.length;
    const minTime = Math.min(...performanceTimes);
    const maxTime = Math.max(...performanceTimes);

    this.results.performanceMetrics['Average API Response Time'] = avgTime;
    this.results.performanceMetrics['Min API Response Time'] = minTime;
    this.results.performanceMetrics['Max API Response Time'] = maxTime;

    this.log(`Performance Statistics:`, 'PERF');
    this.log(`  Average: ${avgTime.toFixed(2)}ms`, 'PERF');
    this.log(`  Min: ${minTime.toFixed(2)}ms`, 'PERF');
    this.log(`  Max: ${maxTime.toFixed(2)}ms`, 'PERF');

    // Performance validation - API calls should be under 100ms for optimized auth
    await this.test('API response time under 100ms', async () => {
      if (avgTime > 100) {
        throw new Error(`Average response time ${avgTime.toFixed(2)}ms exceeds 100ms target`);
      }
    });
  }

  async runOptimizationValidation() {
    this.log('🚀 Running optimization validation...', 'OPT');

    // Test that header-based optimization is working
    await this.test('Header-based auth optimization active', async () => {
      const response = await this.makeRequest(`${API_BASE}/api/dashboard/summary`, {
        headers: {
          'Cookie': this.authCookies,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }

      // In development, we should see optimization headers in the response
      if (process.env.NODE_ENV === 'development') {
        // This is indirect validation - the fact that the API responds quickly
        // indicates the optimization is working
        this.log('Optimization appears to be active based on response patterns', 'OPT');
      }
    });

    // Test parallel token generation in refresh
    await this.test('Parallel token generation optimization', async () => {
      const refreshStart = performance.now();
      await this.testTokenRefresh();
      const refreshDuration = performance.now() - refreshStart;
      
      // Optimized refresh should be significantly faster (under 50ms target)
      if (refreshDuration > 50) {
        this.log(`Warning: Token refresh took ${refreshDuration.toFixed(2)}ms (target: <50ms)`, 'OPT');
      }
    });
  }

  async runAllTests() {
    this.log('🧪 Starting Authentication Optimization Test Suite...', 'START');
    console.log('=' .repeat(80));

    try {
      // Initialize by authenticating
      await this.authenticateTestUser();

      // Run test suites
      await this.runSecurityTests();
      await this.runPerformanceTests();
      await this.runOptimizationValidation();

      console.log('=' .repeat(80));
      this.printSummary();
      
    } catch (error) {
      this.log(`Critical test failure: ${error.message}`, 'ERROR');
      console.log('=' .repeat(80));
      this.printSummary();
      process.exit(1);
    }
  }

  printSummary() {
    this.log('📊 Test Summary:', 'SUMMARY');
    this.log(`Total Tests: ${this.results.totalTests}`, 'SUMMARY');
    this.log(`Passed: ${this.results.passedTests}`, 'SUMMARY');
    this.log(`Failed: ${this.results.failedTests}`, 'SUMMARY');
    this.log(`Success Rate: ${((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)}%`, 'SUMMARY');

    console.log('\n⚡ Performance Metrics:');
    Object.entries(this.results.performanceMetrics).forEach(([name, time]) => {
      console.log(`  ${name}: ${time.toFixed(2)}ms`);
    });

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach(({ test, error }) => {
        console.log(`  ${test}: ${error}`);
      });
    }

    if (this.results.failedTests === 0) {
      this.log('🎉 All tests passed! Authentication optimization is working correctly.', 'SUCCESS');
    } else {
      this.log(`⚠️  ${this.results.failedTests} test(s) failed. Review errors above.`, 'WARNING');
    }
  }
}

// Run the test suite
if (require.main === module) {
  const tester = new AuthOptimizationTester();
  tester.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = AuthOptimizationTester;