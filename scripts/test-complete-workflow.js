/**
 * Comprehensive End-to-End Test Suite for AlphaBook Web
 *
 * This script validates the entire system including:
 * - Budget Creation and Workflow (DRAFT → SUBMITTED → APPROVED → CONVERTED)
 * - Order Creation and Status Management
 * - Role-based Access Control and Permissions
 * - Database Relationships and Integrity
 * - API Endpoints and Business Rules
 * - Error Scenarios and Edge Cases
 */

const { PrismaClient } = require('../src/generated/prisma');
const path = require('path');

// Use built-in fetch for Node.js 18+
const fetch = globalThis.fetch;

// Configure Prisma client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(__dirname, '..', 'prisma', 'dev.db')}`
    }
  }
});

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
  performance: {},
  errors: []
};

// Test data cleanup tracking
const CREATED_ENTITIES = {
  users: [],
  clients: [],
  centers: [],
  budgets: [],
  orders: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logTest(testName, passed, details = '', duration = 0) {
  TEST_RESULTS.total++;
  if (passed) {
    TEST_RESULTS.passed++;
    log(`TEST PASSED: ${testName}${details ? ` - ${details}` : ''}`, 'success');
  } else {
    TEST_RESULTS.failed++;
    log(`TEST FAILED: ${testName}${details ? ` - ${details}` : ''}`, 'error');
    TEST_RESULTS.errors.push({ test: testName, details, timestamp: new Date().toISOString() });
  }
  
  TEST_RESULTS.details.push({
    test: testName,
    passed,
    details,
    duration,
    timestamp: new Date().toISOString()
  });
}

function timeStart(label) {
  TEST_RESULTS.performance[label] = { start: process.hrtime.bigint() };
}

function timeEnd(label) {
  if (TEST_RESULTS.performance[label]) {
    const end = process.hrtime.bigint();
    const duration = Number(end - TEST_RESULTS.performance[label].start) / 1000000; // Convert to milliseconds
    TEST_RESULTS.performance[label].duration = duration;
    return duration;
  }
  return 0;
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const startTime = process.hrtime.bigint();
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    
    return {
      status: response.status,
      data,
      duration,
      success: response.status >= 200 && response.status < 300,
      headers: response.headers
    };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    
    return {
      status: 0,
      data: { error: error.message },
      duration,
      success: false
    };
  }
}

// Test class for comprehensive workflow testing
class AlphaBookWorkflowTester {
  constructor() {
    this.authTokens = {
      admin: null,
      moderator: null,
      user: null
    };
    this.testUsers = {
      admin: null,
      moderator: null,
      user: null
    };
  }

  async initialize() {
    log('🚀 Initializing AlphaBook Web Comprehensive Test Suite...');
    timeStart('total-test-suite');
    
    try {
      // Check database connection
      await prisma.$connect();
      log('✅ Database connection established');
      
      // Setup test environment
      await this.setupTestEnvironment();
      
      return true;
    } catch (error) {
      log(`Initialization failed: ${error.message}`, 'error');
      return false;
    }
  }

  async setupTestEnvironment() {
    log('📋 Setting up test environment...');
    timeStart('environment-setup');
    
    try {
      // Create test users if they don't exist
      await this.createTestUsers();
      
      // Create test clients and centers
      await this.createTestClients();
      await this.createTestCenters();
      
      // Authenticate test users
      await this.authenticateTestUsers();
      
      timeEnd('environment-setup');
      log('✅ Test environment setup completed');
    } catch (error) {
      log(`Test environment setup failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async createTestUsers() {
    const testUsers = [
      { email: 'admin@test.com', name: 'Test Admin', role: 'ADMIN', password: 'admin123' },
      { email: 'moderator@test.com', name: 'Test Moderator', role: 'MODERATOR', password: 'moderator123' },
      { email: 'user@test.com', name: 'Test User', role: 'USER', password: 'user123' }
    ];

    for (const userData of testUsers) {
      try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (!existingUser) {
          const user = await prisma.user.create({
            data: userData
          });
          CREATED_ENTITIES.users.push(user.id);
          log(`Created test user: ${userData.email} (${userData.role})`);
          this.testUsers[userData.role.toLowerCase()] = user;
        } else {
          log(`Test user already exists: ${userData.email} (${userData.role})`);
          this.testUsers[userData.role.toLowerCase()] = existingUser;
        }
      } catch (error) {
        log(`Failed to create test user ${userData.email}: ${error.message}`, 'error');
      }
    }
  }

  async createTestClients() {
    const testClients = [
      {
        name: 'Client A - Complete Workflow Test',
        cnpjCpf: '12345678901',
        phone: '11999999999',
        email: 'clienta@test.com',
        address: 'Test Address A, 123'
      },
      {
        name: 'Client B - Error Scenario Test',
        cnpjCpf: '98765432109',
        phone: '11888888888',
        email: 'clientb@test.com',
        address: 'Test Address B, 456'
      }
    ];

    for (const clientData of testClients) {
      try {
        const client = await prisma.client.create({
          data: clientData
        });
        CREATED_ENTITIES.clients.push(client.id);
        log(`Created test client: ${client.name}`);
      } catch (error) {
        log(`Failed to create test client: ${error.message}`, 'error');
      }
    }
  }

  async createTestCenters() {
    const testCenters = [
      {
        name: 'Production Center A',
        type: 'Interno',
        obs: 'Test production center for workflow testing'
      },
      {
        name: 'Production Center B',
        type: 'Externo',
        obs: 'Test production center for error scenarios'
      }
    ];

    for (const centerData of testCenters) {
      try {
        const center = await prisma.center.create({
          data: centerData
        });
        CREATED_ENTITIES.centers.push(center.id);
        log(`Created test center: ${center.name}`);
      } catch (error) {
        log(`Failed to create test center: ${error.message}`, 'error');
      }
    }
  }

  async authenticateTestUsers() {
    for (const [role, user] of Object.entries(this.testUsers)) {
      if (user) {
        try {
          const result = await makeRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              email: user.email,
              password: role === 'admin' ? 'admin123' : role === 'moderator' ? 'moderator123' : 'user123'
            })
          });

          if (result.success) {
            // Extract cookies from response headers for authentication
            const setCookieHeader = result.headers?.get('set-cookie');
            if (setCookieHeader) {
              // Extract access token from cookies
              const accessTokenMatch = setCookieHeader.match(/access-token=([^;]+)/);
              if (accessTokenMatch) {
                this.authTokens[role] = accessTokenMatch[1];
                log(`Authenticated ${role} user: ${user.email}`);
              } else {
                log(`No access token found in cookies for ${role}`, 'error');
              }
            } else {
              // Fallback: try to get token from response body
              this.authTokens[role] = result.data.data?.token || 'mock-token';
              log(`Authenticated ${role} user: ${user.email} (fallback)`);
            }
          } else {
            log(`Failed to authenticate ${role} user: ${result.data.error?.message || 'Unknown error'}`, 'error');
            // Set mock token for testing purposes
            this.authTokens[role] = 'mock-token';
          }
        } catch (error) {
          log(`Authentication error for ${role}: ${error.message}`, 'error');
          // Set mock token for testing purposes
          this.authTokens[role] = 'mock-token';
        }
      }
    }
  }

  // Scenario A: Complete happy path workflow
  async testHappyPathWorkflow() {
    log('\n🎯 Testing Scenario A: Complete Happy Path Workflow');
    timeStart('happy-path-workflow');
    
    try {
      // Step 1: Create budget as regular user
      const budgetData = {
        clientId: CREATED_ENTITIES.clients[0],
        centerId: CREATED_ENTITIES.centers[0],
        titulo: 'Happy Path Budget Test',
        tiragem: 1000,
        formato: 'A4',
        total_pgs: 100,
        pgs_colors: 50,
        preco_unitario: 5.50,
        preco_total: 5500.00,
        prazo_producao: '15 dias',
        observacoes: 'Testing complete happy path workflow'
      };

      const createResult = await makeRequest('/api/budgets', {
        method: 'POST',
        headers: { Cookie: `access-token=${this.authTokens.user}` },
        body: JSON.stringify(budgetData)
      });

      const budgetCreated = createResult.success && createResult.status === 201;
      logTest('Budget Creation (USER)', budgetCreated, 
        budgetCreated ? `ID: ${createResult.data.data.id}` : `Status: ${createResult.status}`, 
        createResult.duration);

      if (!budgetCreated) {
        throw new Error(`Budget creation failed: ${JSON.stringify(createResult.data)}`);
      }

      const budgetId = createResult.data.data.id;
      CREATED_ENTITIES.budgets.push(budgetId);

      // Step 2: Submit budget (DRAFT -> SUBMITTED)
      const submitResult = await makeRequest(`/api/budgets/${budgetId}/submit`, {
        method: 'PATCH',
        headers: { Cookie: `access-token=${this.authTokens.user}` }
      });

      const budgetSubmitted = submitResult.success && submitResult.status === 200;
      logTest('Budget Submission (DRAFT -> SUBMITTED)', budgetSubmitted,
        budgetSubmitted ? `Status: ${submitResult.data.data.status}` : `Status: ${submitResult.status}`,
        submitResult.duration);

      // Step 3: Approve budget (SUBMITTED -> APPROVED) as moderator
      const approveResult = await makeRequest(`/api/budgets/${budgetId}/approve`, {
        method: 'PATCH',
        headers: { Cookie: `access-token=${this.authTokens.moderator}` }
      });

      const budgetApproved = approveResult.success && approveResult.status === 200;
      logTest('Budget Approval (SUBMITTED -> APPROVED)', budgetApproved,
        budgetApproved ? `Status: ${approveResult.data.data.status}` : `Status: ${approveResult.status}`,
        approveResult.duration);

      // Step 4: Convert budget to order (APPROVED -> CONVERTED)
      const convertResult = await makeRequest(`/api/budgets/${budgetId}/convert-to-order`, {
        method: 'PATCH',
        headers: { Cookie: `access-token=${this.authTokens.moderator}` }
      });

      const budgetConverted = convertResult.success && convertResult.status === 200;
      logTest('Budget Conversion (APPROVED -> CONVERTED)', budgetConverted,
        budgetConverted ? `Order ID: ${convertResult.data.data.order.id}` : `Status: ${convertResult.status}`,
        convertResult.duration);

      if (budgetConverted) {
        const orderId = convertResult.data.data.order.id;
        CREATED_ENTITIES.orders.push(orderId);

        // Step 5: Test order status changes
        await this.testOrderStatusTransitions(orderId);
      }

      const duration = timeEnd('happy-path-workflow');
      logTest('Complete Happy Path Workflow', budgetConverted, 
        `All steps completed in ${duration.toFixed(2)}ms`, duration);

    } catch (error) {
      timeEnd('happy-path-workflow');
      logTest('Complete Happy Path Workflow', false, error.message);
    }
  }

  async testOrderStatusTransitions(orderId) {
    // Test valid status transitions
    const transitions = [
      { from: 'PENDING', to: 'IN_PRODUCTION', role: 'moderator', reason: 'Starting production' },
      { from: 'IN_PRODUCTION', to: 'COMPLETED', role: 'moderator', reason: 'Production completed' },
      { from: 'COMPLETED', to: 'DELIVERED', role: 'moderator', reason: 'Delivered to client' }
    ];

    for (const transition of transitions) {
      const result = await makeRequest(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { Cookie: `access-token=${this.authTokens[transition.role]}` },
        body: JSON.stringify({
          status: transition.to,
          reason: transition.reason
        })
      });

      const transitionSuccess = result.success && result.status === 200;
      logTest(`Order Status: ${transition.from} -> ${transition.to}`, transitionSuccess,
        transitionSuccess ? `Status: ${result.data.data.status}` : `Status: ${result.status}`,
        result.duration);
    }

    // Test invalid transition (DELIVERED -> PENDING should fail)
    const invalidResult = await makeRequest(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { Cookie: `access-token=${this.authTokens.moderator}` },
      body: JSON.stringify({
        status: 'PENDING',
        reason: 'Invalid backward transition'
      })
    });

    const invalidTransitionBlocked = !invalidResult.success && invalidResult.status === 400;
    logTest('Invalid Status Transition Blocked', invalidTransitionBlocked,
      invalidTransitionBlocked ? 'Correctly rejected' : 'Should have been rejected',
      invalidResult.duration);
  }

  // Scenario B: Budget rejection and revision workflow
  async testBudgetRejectionWorkflow() {
    log('\n🎯 Testing Scenario B: Budget Rejection and Revision Workflow');
    timeStart('rejection-workflow');
    
    try {
      // Step 1: Create and submit budget
      const budgetData = {
        clientId: CREATED_ENTITIES.clients[1],
        centerId: CREATED_ENTITIES.centers[1],
        titulo: 'Rejection Test Budget',
        tiragem: 500,
        formato: 'A5',
        total_pgs: 50,
        pgs_colors: 25,
        preco_unitario: 3.00,
        preco_total: 1500.00,
        observacoes: 'Testing rejection workflow'
      };

      const createResult = await makeRequest('/api/budgets', {
        method: 'POST',
        headers: { Cookie: `access-token=${this.authTokens.user}` },
        body: JSON.stringify(budgetData)
      });

      if (!createResult.success) {
        throw new Error(`Budget creation failed: ${JSON.stringify(createResult.data)}`);
      }

      const budgetId = createResult.data.data.id;
      CREATED_ENTITIES.budgets.push(budgetId);

      // Submit budget
      const submitResult = await makeRequest(`/api/budgets/${budgetId}/submit`, {
        method: 'PATCH',
        headers: { Cookie: `access-token=${this.authTokens.user}` }
      });

      const budgetSubmitted = submitResult.success;
      logTest('Budget Submission for Rejection Test', budgetSubmitted);

      // Step 2: Reject budget
      const rejectResult = await makeRequest(`/api/budgets/${budgetId}/reject`, {
        method: 'PATCH',
        headers: { Cookie: `access-token=${this.authTokens.moderator}` },
        body: JSON.stringify({
          reason: 'Test rejection - specifications need revision'
        })
      });

      const budgetRejected = rejectResult.success && rejectResult.status === 200;
      logTest('Budget Rejection (SUBMITTED -> REJECTED)', budgetRejected,
        budgetRejected ? `Status: ${rejectResult.data.data.status}` : `Status: ${rejectResult.status}`,
        rejectResult.duration);

      // Step 3: Try to convert rejected budget (should fail)
      const convertResult = await makeRequest(`/api/budgets/${budgetId}/convert-to-order`, {
        method: 'PATCH',
        headers: { Cookie: `access-token=${this.authTokens.moderator}` }
      });

      const conversionBlocked = !convertResult.success && convertResult.status === 400;
      logTest('Rejected Budget Conversion Blocked', conversionBlocked,
        conversionBlocked ? 'Correctly blocked' : 'Should have been blocked',
        convertResult.duration);

      const duration = timeEnd('rejection-workflow');
      logTest('Budget Rejection Workflow', budgetRejected && conversionBlocked,
        `Completed in ${duration.toFixed(2)}ms`, duration);

    } catch (error) {
      timeEnd('rejection-workflow');
      logTest('Budget Rejection Workflow', false, error.message);
    }
  }

  // Scenario C: Direct order creation with permissions
  async testDirectOrderCreation() {
    log('\n🎯 Testing Scenario C: Direct Order Creation with Permissions');
    timeStart('direct-order-workflow');
    
    try {
      const orderData = {
        clientId: CREATED_ENTITIES.clients[0],
        centerId: CREATED_ENTITIES.centers[0],
        title: 'Direct Order Test',
        tiragem: 750,
        formato: 'A4',
        numPaginasTotal: 75,
        numPaginasColoridas: 30,
        valorUnitario: 4.50,
        valorTotal: 3375.00,
        prazoEntrega: '12 dias',
        obs: 'Direct order creation test'
      };

      // Test 1: USER should NOT be able to create direct orders
      const userResult = await makeRequest('/api/orders', {
        method: 'POST',
        headers: { Cookie: `access-token=${this.authTokens.user}` },
        body: JSON.stringify(orderData)
      });

      const userBlocked = !userResult.success && userResult.status === 403;
      logTest('USER Direct Order Creation Blocked', userBlocked,
        userBlocked ? 'Correctly blocked' : 'Should have been blocked',
        userResult.duration);

      // Test 2: MODERATOR should be able to create direct orders
      const moderatorResult = await makeRequest('/api/orders', {
        method: 'POST',
        headers: { Cookie: `access-token=${this.authTokens.moderator}` },
        body: JSON.stringify(orderData)
      });

      const moderatorAllowed = moderatorResult.success && moderatorResult.status === 201;
      logTest('MODERATOR Direct Order Creation Allowed', moderatorAllowed,
        moderatorAllowed ? `Order ID: ${moderatorResult.data.data.id}` : `Status: ${moderatorResult.status}`,
        moderatorResult.duration);

      if (moderatorAllowed) {
        CREATED_ENTITIES.orders.push(moderatorResult.data.data.id);
      }

      // Test 3: ADMIN should be able to create direct orders
      const adminResult = await makeRequest('/api/orders', {
        method: 'POST',
        headers: { Cookie: `access-token=${this.authTokens.admin}` },
        body: JSON.stringify({
          ...orderData,
          title: 'Admin Direct Order Test'
        })
      });

      const adminAllowed = adminResult.success && adminResult.status === 201;
      logTest('ADMIN Direct Order Creation Allowed', adminAllowed,
        adminAllowed ? `Order ID: ${adminResult.data.data.id}` : `Status: ${adminResult.status}`,
        adminResult.duration);

      if (adminAllowed) {
        CREATED_ENTITIES.orders.push(adminResult.data.data.id);
      }

      const duration = timeEnd('direct-order-workflow');
      logTest('Direct Order Creation Workflow', userBlocked && moderatorAllowed && adminAllowed,
        `Completed in ${duration.toFixed(2)}ms`, duration);

    } catch (error) {
      timeEnd('direct-order-workflow');
      logTest('Direct Order Creation Workflow', false, error.message);
    }
  }

  // Scenario D: Invalid operations and error handling
  async testErrorScenarios() {
    log('\n🎯 Testing Scenario D: Invalid Operations and Error Handling');
    timeStart('error-scenarios');
    
    try {
      // Test 1: Convert non-existent budget
      const nonExistentResult = await makeRequest('/api/budgets/99999/convert-to-order', {
        method: 'PATCH',
        headers: { Cookie: `access-token=${this.authTokens.moderator}` }
      });

      const nonExistentHandled = !nonExistentResult.success && nonExistentResult.status === 404;
      logTest('Non-existent Budget Handling', nonExistentHandled,
        nonExistentHandled ? 'Correctly returns 404' : `Status: ${nonExistentResult.status}`,
        nonExistentResult.duration);

      // Test 2: Invalid status transition
      if (CREATED_ENTITIES.orders.length > 0) {
        const invalidTransitionResult = await makeRequest(`/api/orders/${CREATED_ENTITIES.orders[0]}/status`, {
          method: 'PATCH',
          headers: { Cookie: `access-token=${this.authTokens.moderator}` },
          body: JSON.stringify({
            status: 'INVALID_STATUS',
            reason: 'Testing invalid status'
          })
        });

        const invalidStatusHandled = !invalidTransitionResult.success && invalidTransitionResult.status === 400;
        logTest('Invalid Status Handling', invalidStatusHandled,
          invalidStatusHandled ? 'Correctly returns 400' : `Status: ${invalidTransitionResult.status}`,
          invalidTransitionResult.duration);
      }

      // Test 3: Missing required fields in budget creation
      const invalidBudgetResult = await makeRequest('/api/budgets', {
        method: 'POST',
        headers: { Cookie: `access-token=${this.authTokens.user}` },
        body: JSON.stringify({
          titulo: 'Invalid Budget'
          // Missing required fields
        })
      });

      const validationHandled = !invalidBudgetResult.success && invalidBudgetResult.status === 400;
      logTest('Budget Validation Handling', validationHandled,
        validationHandled ? 'Correctly validates required fields' : `Status: ${invalidBudgetResult.status}`,
        invalidBudgetResult.duration);

      // Test 4: Unauthorized access without token
      const unauthorizedResult = await makeRequest('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          clientId: CREATED_ENTITIES.clients[0],
          centerId: CREATED_ENTITIES.centers[0],
          titulo: 'Unauthorized Test'
        })
      });

      const unauthorizedHandled = !unauthorizedResult.success && unauthorizedResult.status === 401;
      logTest('Unauthorized Access Handling', unauthorizedHandled,
        unauthorizedHandled ? 'Correctly requires authentication' : `Status: ${unauthorizedResult.status}`,
        unauthorizedResult.duration);

      const duration = timeEnd('error-scenarios');
      logTest('Error Scenarios Test', 
        nonExistentHandled && validationHandled && unauthorizedHandled,
        `Completed in ${duration.toFixed(2)}ms`, duration);

    } catch (error) {
      timeEnd('error-scenarios');
      logTest('Error Scenarios Test', false, error.message);
    }
  }

  // Scenario E: Database integrity and relationships
  async testDatabaseIntegrity() {
    log('\n🎯 Testing Scenario E: Database Integrity and Relationships');
    timeStart('database-integrity');
    
    try {
      // Test 1: Foreign key constraints
      const integrityChecks = [];

      // Check client-budget relationships
      const clientWithBudgets = await prisma.client.findFirst({
        where: { id: CREATED_ENTITIES.clients[0] },
        include: { budgets: true }
      });

      const clientBudgetRelation = clientWithBudgets && clientWithBudgets.budgets.length > 0;
      integrityChecks.push(clientBudgetRelation);
      logTest('Client-Budget Relationship Integrity', clientBudgetRelation,
        clientBudgetRelation ? `Client has ${clientWithBudgets.budgets.length} budgets` : 'No budgets found');

      // Check center-order relationships
      const centerWithOrders = await prisma.center.findFirst({
        where: { id: CREATED_ENTITIES.centers[0] },
        include: { orders: true }
      });

      const centerOrderRelation = centerWithOrders && centerWithOrders.orders.length > 0;
      integrityChecks.push(centerOrderRelation);
      logTest('Center-Order Relationship Integrity', centerOrderRelation,
        centerOrderRelation ? `Center has ${centerWithOrders.orders.length} orders` : 'No orders found');

      // Check budget-order relationships
      if (CREATED_ENTITIES.budgets.length > 0) {
        const budgetWithOrder = await prisma.budget.findFirst({
          where: { id: CREATED_ENTITIES.budgets[0] },
          include: { order: true }
        });

        const budgetOrderRelation = budgetWithOrder && budgetWithOrder.order !== null;
        integrityChecks.push(budgetOrderRelation);
        logTest('Budget-Order Relationship Integrity', budgetOrderRelation,
          budgetOrderRelation ? `Budget converted to order ${budgetWithOrder.order.id}` : 'No order found');
      }

      // Test 2: Enum value constraints
      const validBudgetStatuses = await prisma.budget.groupBy({
        by: ['status'],
        where: { id: { in: CREATED_ENTITIES.budgets } }
      });

      const validStatuses = validBudgetStatuses.every(status => 
        ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CONVERTED', 'CANCELLED'].includes(status.status)
      );

      integrityChecks.push(validStatuses);
      logTest('Budget Status Enum Constraints', validStatuses,
        validStatuses ? 'All statuses are valid' : 'Invalid status found');

      // Test 3: Audit trail fields
      const budgetWithAudit = await prisma.budget.findFirst({
        where: { status: 'APPROVED' },
        select: { approvedAt: true, approvedById: true }
      });

      const auditTrailPresent = budgetWithAudit && budgetWithAudit.approvedAt && budgetWithAudit.approvedById;
      integrityChecks.push(auditTrailPresent);
      logTest('Audit Trail Fields Present', auditTrailPresent,
        auditTrailPresent ? 'Audit fields populated' : 'Audit fields missing');

      const duration = timeEnd('database-integrity');
      const allIntegrityChecksPass = integrityChecks.every(check => check);
      logTest('Database Integrity Test', allIntegrityChecksPass,
        `${integrityChecks.filter(check => check).length}/${integrityChecks.length} checks passed`,
        duration);

    } catch (error) {
      timeEnd('database-integrity');
      logTest('Database Integrity Test', false, error.message);
    }
  }

  // Test API endpoints comprehensively
  async testApiEndpoints() {
    log('\n🎯 Testing API Endpoints Comprehensively');
    timeStart('api-endpoints');
    
    try {
      const endpointTests = [];

      // Test budget endpoints
      const budgetEndpoints = [
        { method: 'GET', path: '/api/budgets', auth: 'user' },
        { method: 'GET', path: '/api/budgets', auth: 'moderator' },
        { method: 'GET', path: '/api/budgets', auth: 'admin' }
      ];

      for (const endpoint of budgetEndpoints) {
        const result = await makeRequest(endpoint.path, {
          method: endpoint.method,
          headers: { Cookie: `access-token=${this.authTokens[endpoint.auth]}` }
        });

        const endpointWorks = result.success && result.status === 200;
        endpointTests.push(endpointWorks);
        logTest(`API Endpoint ${endpoint.method} ${endpoint.path} (${endpoint.auth})`, endpointWorks,
          endpointWorks ? `Response time: ${result.duration.toFixed(2)}ms` : `Status: ${result.status}`,
          result.duration);
      }

      // Test order endpoints
      const orderEndpoints = [
        { method: 'GET', path: '/api/orders', auth: 'user' },
        { method: 'GET', path: '/api/orders', auth: 'moderator' },
        { method: 'GET', path: '/api/orders', auth: 'admin' }
      ];

      for (const endpoint of orderEndpoints) {
        const result = await makeRequest(endpoint.path, {
          method: endpoint.method,
          headers: { Cookie: `access-token=${this.authTokens[endpoint.auth]}` }
        });

        const endpointWorks = result.success && result.status === 200;
        endpointTests.push(endpointWorks);
        logTest(`API Endpoint ${endpoint.method} ${endpoint.path} (${endpoint.auth})`, endpointWorks,
          endpointWorks ? `Response time: ${result.duration.toFixed(2)}ms` : `Status: ${result.status}`,
          result.duration);
      }

      // Test navigation counts endpoint
      const navResult = await makeRequest('/api/navigation/counts', {
        method: 'GET',
        headers: { Cookie: `access-token=${this.authTokens.user}` }
      });

      const navEndpointWorks = navResult.success && navResult.status === 200;
      endpointTests.push(navEndpointWorks);
      logTest('API Endpoint GET /api/navigation/counts', navEndpointWorks,
        navEndpointWorks ? `Response time: ${navResult.duration.toFixed(2)}ms` : `Status: ${navResult.status}`,
        navResult.duration);

      const duration = timeEnd('api-endpoints');
      const allEndpointsWork = endpointTests.every(test => test);
      logTest('API Endpoints Test', allEndpointsWork,
        `${endpointTests.filter(test => test).length}/${endpointTests.length} endpoints working`,
        duration);

    } catch (error) {
      timeEnd('api-endpoints');
      logTest('API Endpoints Test', false, error.message);
    }
  }

  // Test business rules enforcement
  async testBusinessRules() {
    log('\n🎯 Testing Business Rules Enforcement');
    timeStart('business-rules');
    
    try {
      const ruleTests = [];

      // Rule 1: Budget conversion requires approved budget
      if (CREATED_ENTITIES.budgets.length > 0) {
        // Create a draft budget and try to convert
        const draftBudget = await makeRequest('/api/budgets', {
          method: 'POST',
          headers: { Cookie: `access-token=${this.authTokens.user}` },
          body: JSON.stringify({
            clientId: CREATED_ENTITIES.clients[0],
            centerId: CREATED_ENTITIES.centers[0],
            titulo: 'Draft for Rule Test',
            tiragem: 100,
            formato: 'A4',
            total_pgs: 10,
            pgs_colors: 5,
            preco_unitario: 1.00,
            preco_total: 100.00
          })
        });

        if (draftBudget.success) {
          const draftId = draftBudget.data.data.id;
          const convertDraftResult = await makeRequest(`/api/budgets/${draftId}/convert-to-order`, {
            method: 'PATCH',
            headers: { Cookie: `access-token=${this.authTokens.moderator}` }
          });

          const draftConversionBlocked = !convertDraftResult.success && convertDraftResult.status === 400;
          ruleTests.push(draftConversionBlocked);
          logTest('Rule: Draft Budget Conversion Blocked', draftConversionBlocked,
            draftConversionBlocked ? 'Correctly blocked' : 'Should have been blocked');
        }
      }

      // Rule 2: Order status permissions
      if (CREATED_ENTITIES.orders.length > 0) {
        // Test USER trying to change to IN_PRODUCTION (should fail)
        const userStatusResult = await makeRequest(`/api/orders/${CREATED_ENTITIES.orders[0]}/status`, {
          method: 'PATCH',
          headers: { Cookie: `access-token=${this.authTokens.user}` },
          body: JSON.stringify({
            status: 'IN_PRODUCTION',
            reason: 'User trying to change status'
          })
        });

        const userStatusBlocked = !userStatusResult.success && userStatusResult.status === 403;
        ruleTests.push(userStatusBlocked);
        logTest('Rule: User Status Change Restricted', userStatusBlocked,
          userStatusBlocked ? 'Correctly blocked' : 'Should have been blocked');
      }

      // Rule 3: Financial data filtering for users
      const ordersResult = await makeRequest('/api/orders', {
        method: 'GET',
        headers: { Cookie: `access-token=${this.authTokens.user}` }
      });

      const financialDataFiltered = ordersResult.success && 
        ordersResult.data.data.length > 0 && 
        ordersResult.data.data.every(order => !order.valorTotal && !order.valorUnitario);

      ruleTests.push(financialDataFiltered);
      logTest('Rule: Financial Data Filtered for Users', financialDataFiltered,
        financialDataFiltered ? 'Financial data correctly hidden' : 'Financial data exposed');

      const duration = timeEnd('business-rules');
      const allRulesEnforced = ruleTests.every(test => test);
      logTest('Business Rules Test', allRulesEnforced,
        `${ruleTests.filter(test => test).length}/${ruleTests.length} rules enforced`,
        duration);

    } catch (error) {
      timeEnd('business-rules');
      logTest('Business Rules Test', false, error.message);
    }
  }

  // Performance testing
  async testPerformance() {
    log('\n🎯 Testing System Performance');
    timeStart('performance-tests');
    
    try {
      const performanceTests = [];

      // Test 1: Concurrent budget creation
      const concurrentBudgets = 5;
      const startTime = Date.now();
      
      const budgetPromises = Array.from({ length: concurrentBudgets }, (_, i) => 
        makeRequest('/api/budgets', {
          method: 'POST',
          headers: { Cookie: `access-token=${this.authTokens.user}` },
          body: JSON.stringify({
            clientId: CREATED_ENTITIES.clients[0],
            centerId: CREATED_ENTITIES.centers[0],
            titulo: `Concurrent Budget Test ${i + 1}`,
            tiragem: 100,
            formato: 'A4',
            total_pgs: 10,
            pgs_colors: 5,
            preco_unitario: 1.00,
            preco_total: 100.00
          })
        })
      );

      const concurrentResults = await Promise.all(budgetPromises);
      const concurrentDuration = Date.now() - startTime;
      const concurrentSuccess = concurrentResults.every(result => result.success);

      performanceTests.push(concurrentSuccess);
      logTest('Concurrent Budget Creation Performance', concurrentSuccess,
        `${concurrentBudgets} budgets in ${concurrentDuration}ms (${(concurrentDuration/concurrentBudgets).toFixed(2)}ms per budget)`);

      // Test 2: Large dataset retrieval
      const largeQueryStart = Date.now();
      const largeQueryResult = await makeRequest('/api/budgets?pageSize=100', {
        method: 'GET',
        headers: { Cookie: `access-token=${this.authTokens.moderator}` }
      });
      const largeQueryDuration = Date.now() - largeQueryStart;

      const largeQuerySuccess = largeQueryResult.success && largeQueryDuration < 2000; // Under 2 seconds
      performanceTests.push(largeQuerySuccess);
      logTest('Large Dataset Query Performance', largeQuerySuccess,
        `100 records in ${largeQueryDuration}ms`);

      const duration = timeEnd('performance-tests');
      const allPerformanceTestsPass = performanceTests.every(test => test);
      logTest('Performance Tests', allPerformanceTestsPass,
        `${performanceTests.filter(test => test).length}/${performanceTests.length} performance tests passed`,
        duration);

    } catch (error) {
      timeEnd('performance-tests');
      logTest('Performance Tests', false, error.message);
    }
  }

  // Cleanup test data
  async cleanup() {
    log('\n🧹 Cleaning up test data...');
    
    try {
      // Clean up in reverse order of creation (respect foreign key constraints)
      
      // Delete orders first
      for (const orderId of CREATED_ENTITIES.orders) {
        try {
          await prisma.order.delete({ where: { id: orderId } });
          log(`Deleted order: ${orderId}`);
        } catch (error) {
          log(`Failed to delete order ${orderId}: ${error.message}`, 'error');
        }
      }

      // Delete budgets
      for (const budgetId of CREATED_ENTITIES.budgets) {
        try {
          await prisma.budget.delete({ where: { id: budgetId } });
          log(`Deleted budget: ${budgetId}`);
        } catch (error) {
          log(`Failed to delete budget ${budgetId}: ${error.message}`, 'error');
        }
      }

      // Delete centers
      for (const centerId of CREATED_ENTITIES.centers) {
        try {
          await prisma.center.delete({ where: { id: centerId } });
          log(`Deleted center: ${centerId}`);
        } catch (error) {
          log(`Failed to delete center ${centerId}: ${error.message}`, 'error');
        }
      }

      // Delete clients
      for (const clientId of CREATED_ENTITIES.clients) {
        try {
          await prisma.client.delete({ where: { id: clientId } });
          log(`Deleted client: ${clientId}`);
        } catch (error) {
          log(`Failed to delete client ${clientId}: ${error.message}`, 'error');
        }
      }

      // Delete test users
      for (const userId of CREATED_ENTITIES.users) {
        try {
          await prisma.user.delete({ where: { id: userId } });
          log(`Deleted user: ${userId}`);
        } catch (error) {
          log(`Failed to delete user ${userId}: ${error.message}`, 'error');
        }
      }

      log('✅ Test data cleanup completed');
    } catch (error) {
      log(`Cleanup failed: ${error.message}`, 'error');
    }
  }

  // Generate comprehensive test report
  generateReport() {
    const totalDuration = timeEnd('total-test-suite');
    
    log('\n📊 COMPREHENSIVE TEST REPORT');
    log('='.repeat(50));
    
    // Summary
    log(`\n📈 SUMMARY:`);
    log(`   Total Tests: ${TEST_RESULTS.total}`);
    log(`   Passed: ${TEST_RESULTS.passed} ✅`);
    log(`   Failed: ${TEST_RESULTS.failed} ❌`);
    log(`   Success Rate: ${((TEST_RESULTS.passed / TEST_RESULTS.total) * 100).toFixed(2)}%`);
    log(`   Total Duration: ${totalDuration.toFixed(2)}ms`);

    // Performance metrics
    log(`\n⚡ PERFORMANCE METRICS:`);
    for (const [test, metrics] of Object.entries(TEST_RESULTS.performance)) {
      if (metrics.duration) {
        log(`   ${test}: ${metrics.duration.toFixed(2)}ms`);
      }
    }

    // Failed tests details
    if (TEST_RESULTS.errors.length > 0) {
      log(`\n❌ FAILED TESTS DETAILS:`);
      TEST_RESULTS.errors.forEach(error => {
        log(`   • ${error.test}: ${error.details}`);
      });
    }

    // Test categories summary
    const categories = {
      'Budget Workflow': TEST_RESULTS.details.filter(t => t.test.includes('Budget')).length,
      'Order Management': TEST_RESULTS.details.filter(t => t.test.includes('Order')).length,
      'Authentication & Authorization': TEST_RESULTS.details.filter(t => t.test.includes('USER') || t.test.includes('MODERATOR') || t.test.includes('ADMIN')).length,
      'API Endpoints': TEST_RESULTS.details.filter(t => t.test.includes('API Endpoint')).length,
      'Database Integrity': TEST_RESULTS.details.filter(t => t.test.includes('Relationship') || t.test.includes('Integrity')).length,
      'Business Rules': TEST_RESULTS.details.filter(t => t.test.includes('Rule')).length,
      'Error Handling': TEST_RESULTS.details.filter(t => t.test.includes('Handling') || t.test.includes('Blocked')).length,
      'Performance': TEST_RESULTS.details.filter(t => t.test.includes('Performance')).length
    };

    log(`\n📋 TEST CATEGORIES:`);
    for (const [category, count] of Object.entries(categories)) {
      if (count > 0) {
        log(`   ${category}: ${count} tests`);
      }
    }

    // Recommendations
    log(`\n🔍 RECOMMENDATIONS:`);
    if (TEST_RESULTS.failed === 0) {
      log(`   ✅ All tests passed! System is ready for production.`);
      log(`   ✅ Consider adding these tests to CI/CD pipeline.`);
      log(`   ✅ Monitor performance metrics in production.`);
    } else {
      log(`   ⚠️  Fix ${TEST_RESULTS.failed} failing tests before deployment.`);
      log(`   ⚠️  Review error handling for edge cases.`);
      log(`   ⚠️  Consider additional testing for high-risk areas.`);
    }

    log(`\n🎯 TEST SCENARIOS COVERED:`);
    log(`   ✅ Scenario A: Complete happy path workflow`);
    log(`   ✅ Scenario B: Budget rejection and revision workflow`);
    log(`   ✅ Scenario C: Direct order creation with permissions`);
    log(`   ✅ Scenario D: Invalid operations and error handling`);
    log(`   ✅ Scenario E: Database integrity and relationships`);
    log(`   ✅ API endpoints comprehensive testing`);
    log(`   ✅ Business rules enforcement`);
    log(`   ✅ Performance testing`);

    log('\n' + '='.repeat(50));
    log('🏁 AlphaBook Web Comprehensive Test Suite Complete');
  }

  // Run all tests
  async runAllTests() {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Test initialization failed');
      }

      // Run all test scenarios
      await this.testHappyPathWorkflow();
      await this.testBudgetRejectionWorkflow();
      await this.testDirectOrderCreation();
      await this.testErrorScenarios();
      await this.testDatabaseIntegrity();
      await this.testApiEndpoints();
      await this.testBusinessRules();
      await this.testPerformance();

      // Generate final report
      this.generateReport();

    } catch (error) {
      log(`Test suite execution failed: ${error.message}`, 'error');
    } finally {
      // Cleanup
      await this.cleanup();
      await prisma.$disconnect();
    }
  }
}

// Main execution
async function main() {
  const tester = new AlphaBookWorkflowTester();
  await tester.runAllTests();
}

// Run tests if script is executed directly
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = AlphaBookWorkflowTester;