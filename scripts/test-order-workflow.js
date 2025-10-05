/**
 * Test script for Order Creation and Status Management Workflows
 * Tests budget-derived orders, direct orders, status changes, and validation rules
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class OrderWorkflowTester {
  constructor() {
    this.adminToken = null;
    this.moderatorToken = null;
    this.userToken = null;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    return { status: response.status, data };
  }

  async login(email, password) {
    const result = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (result.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(result.data)}`);
    }

    console.log(`✓ Logged in as ${email}`);
    return result.data.data.user;
  }

  async setupTestUsers() {
    console.log('\n📋 Setting up test users...');
    
    try {
      // Try to login with existing test users
      await this.login('admin@test.com', 'admin123');
      await this.login('moderator@test.com', 'moderator123');
      await this.login('user@test.com', 'user123');
      console.log('✓ Test users already exist');
    } catch (error) {
      console.log('⚠️ Test users need to be created manually');
      console.log('Create users with roles: admin@test.com (ADMIN), moderator@test.com (MODERATOR), user@test.com (USER)');
      process.exit(1);
    }
  }

  async createTestBudget(token) {
    console.log('\n📋 Creating test budget...');
    
    const budgetData = {
      clientId: 1,
      centerId: 1,
      titulo: 'Test Budget for Order Creation',
      tiragem: 1000,
      formato: 'A4',
      total_pgs: 100,
      pgs_colors: 20,
      preco_unitario: 5.50,
      preco_total: 5500.00,
      prazo_producao: '15 dias',
      observacoes: 'Budget created for order workflow testing'
    };

    const result = await this.makeRequest('/api/budgets', {
      method: 'POST',
      headers: { Cookie: `access-token=${token}` },
      body: JSON.stringify(budgetData)
    });

    if (result.status !== 201) {
      throw new Error(`Failed to create budget: ${JSON.stringify(result.data)}`);
    }

    const budgetId = result.data.data.id;
    console.log(`✓ Created test budget ID: ${budgetId}`);

    // Submit the budget
    const submitResult = await this.makeRequest(`/api/budgets/${budgetId}/submit`, {
      method: 'PATCH',
      headers: { Cookie: `access-token=${token}` }
    });

    if (submitResult.status !== 200) {
      throw new Error(`Failed to submit budget: ${JSON.stringify(submitResult.data)}`);
    }

    console.log(`✓ Submitted budget ID: ${budgetId}`);

    // Approve the budget (as moderator/admin)
    const approveResult = await this.makeRequest(`/api/budgets/${budgetId}/approve`, {
      method: 'PATCH',
      headers: { Cookie: `access-token=${token}` }
    });

    if (approveResult.status !== 200) {
      throw new Error(`Failed to approve budget: ${JSON.stringify(approveResult.data)}`);
    }

    console.log(`✓ Approved budget ID: ${budgetId}`);
    return budgetId;
  }

  async testBudgetDerivedOrderCreation(token, budgetId) {
    console.log('\n🎯 Testing Budget-Derived Order Creation...');

    const orderData = {
      budgetId: budgetId,
      title: 'Order from Approved Budget',
      tiragem: 1000,
      formato: 'A4',
      numPaginasTotal: 100,
      numPaginasColoridas: 20,
      valorUnitario: 5.50,
      valorTotal: 5500.00,
      prazoEntrega: '15 dias',
      obs: 'Order created from approved budget for testing'
    };

    const result = await this.makeRequest('/api/orders', {
      method: 'POST',
      headers: { Cookie: `access-token=${token}` },
      body: JSON.stringify(orderData)
    });

    if (result.status !== 201) {
      throw new Error(`Budget-derived order creation failed: ${JSON.stringify(result.data)}`);
    }

    console.log(`✓ Created budget-derived order ID: ${result.data.data.id}`);
    console.log(`✓ Order type: ${result.data.data.orderType}`);
    return result.data.data.id;
  }

  async testDirectOrderCreation(token, role) {
    console.log(`\n🎯 Testing Direct Order Creation (${role})...`);

    const orderData = {
      clientId: 1,
      centerId: 1,
      title: 'Direct Order Test',
      tiragem: 500,
      formato: 'A5',
      numPaginasTotal: 50,
      numPaginasColoridas: 10,
      valorUnitario: 3.00,
      valorTotal: 1500.00,
      prazoEntrega: '10 dias',
      obs: 'Direct order created for testing'
    };

    const result = await this.makeRequest('/api/orders', {
      method: 'POST',
      headers: { Cookie: `access-token=${token}` },
      body: JSON.stringify(orderData)
    });

    if (role === 'USER') {
      if (result.status !== 403) {
        throw new Error(`Expected 403 for USER direct order creation, got ${result.status}`);
      }
      console.log('✓ USER correctly blocked from direct order creation');
      return null;
    } else {
      if (result.status !== 201) {
        throw new Error(`Direct order creation failed for ${role}: ${JSON.stringify(result.data)}`);
      }
      console.log(`✓ Created direct order ID: ${result.data.data.id}`);
      console.log(`✓ Order type: ${result.data.data.orderType}`);
      return result.data.data.id;
    }
  }

  async testOrderStatusChanges(token, orderId, userRole) {
    console.log(`\n🎯 Testing Order Status Changes (${userRole})...`);

    // Test valid status transition: PENDING -> IN_PRODUCTION
    const statusChange1 = {
      status: 'IN_PRODUCTION',
      reason: 'Starting production process'
    };

    const result1 = await this.makeRequest(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { Cookie: `access-token=${token}` },
      body: JSON.stringify(statusChange1)
    });

    if (userRole === 'USER') {
      if (result1.status !== 403) {
        throw new Error(`Expected 403 for USER status change, got ${result1.status}`);
      }
      console.log('✓ USER correctly blocked from IN_PRODUCTION status change');
    } else {
      if (result1.status !== 200) {
        throw new Error(`Status change failed: ${JSON.stringify(result1.data)}`);
      }
      console.log(`✓ Changed status to IN_PRODUCTION`);
      console.log(`✓ Status change audit: ${result1.data.data.statusChange.changedBy}`);

      // Test invalid status transition: IN_PRODUCTION -> PENDING (not allowed)
      const statusChange2 = {
        status: 'PENDING',
        reason: 'Invalid backward transition test'
      };

      const result2 = await this.makeRequest(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { Cookie: `access-token=${token}` },
        body: JSON.stringify(statusChange2)
      });

      if (result2.status !== 400) {
        throw new Error(`Expected 400 for invalid transition, got ${result2.status}`);
      }
      console.log('✓ Invalid status transition correctly rejected');
    }
  }

  async testOrderUpdateRestrictions(token, orderId) {
    console.log('\n🎯 Testing Order Update Restrictions...');

    // Try to change budgetId (should be blocked)
    const updateData1 = {
      budgetId: 999,
      title: 'Updated title'
    };

    const result1 = await this.makeRequest(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { Cookie: `access-token=${token}` },
      body: JSON.stringify(updateData1)
    });

    if (result1.status !== 400) {
      throw new Error(`Expected 400 for budgetId change, got ${result1.status}`);
    }
    console.log('✓ budgetId change correctly blocked');

    // Try to change orderType (should be blocked)
    const updateData2 = {
      orderType: 'RUSH_ORDER',
      title: 'Updated title'
    };

    const result2 = await this.makeRequest(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { Cookie: `access-token=${token}` },
      body: JSON.stringify(updateData2)
    });

    if (result2.status !== 400) {
      throw new Error(`Expected 400 for orderType change, got ${result2.status}`);
    }
    console.log('✓ orderType change correctly blocked');

    // Try to change status via update API (should be blocked)
    const updateData3 = {
      status: 'COMPLETED',
      title: 'Updated title'
    };

    const result3 = await this.makeRequest(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { Cookie: `access-token=${token}` },
      body: JSON.stringify(updateData3)
    });

    if (result3.status !== 400) {
      throw new Error(`Expected 400 for status change via update API, got ${result3.status}`);
    }
    console.log('✓ Status change via update API correctly blocked');
  }

  async testValidStatusTransitions(token, orderId) {
    console.log('\n🎯 Testing Valid Status Transitions...');

    // Get available transitions
    const availableResult = await this.makeRequest(`/api/orders/${orderId}/status`, {
      method: 'GET',
      headers: { Cookie: `access-token=${token}` }
    });

    if (availableResult.status !== 200) {
      throw new Error(`Failed to get available transitions: ${JSON.stringify(availableResult.data)}`);
    }

    console.log(`✓ Current status: ${availableResult.data.data.currentStatus}`);
    console.log(`✓ Available transitions: ${availableResult.data.data.availableTransitions.join(', ')}`);

    // Test COMPLETED -> DELIVERED transition
    if (availableResult.data.data.availableTransitions.includes('COMPLETED')) {
      const completeResult = await this.makeRequest(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { Cookie: `access-token=${token}` },
        body: JSON.stringify({ status: 'COMPLETED', reason: 'Production completed' })
      });

      if (completeResult.status === 200) {
        console.log('✓ Order marked as COMPLETED');

        // Now try DELIVERED
        const deliverResult = await this.makeRequest(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { Cookie: `access-token=${token}` },
          body: JSON.stringify({ status: 'DELIVERED', reason: 'Order delivered to client' })
        });

        if (deliverResult.status === 200) {
          console.log('✓ Order marked as DELIVERED');
        }
      }
    }
  }

  async runTests() {
    console.log('🧪 Starting Order Workflow Tests...');

    try {
      await this.setupTestUsers();

      // Login as different users
      const adminUser = await this.login('admin@test.com', 'admin123');
      const moderatorUser = await this.login('moderator@test.com', 'moderator123');
      const regularUser = await this.login('user@test.com', 'user123');

      // Store tokens (simplified - in real app, extract from Set-Cookie header)
      this.adminToken = 'admin-token'; // Placeholder
      this.moderatorToken = 'moderator-token'; // Placeholder  
      this.userToken = 'user-token'; // Placeholder

      // Test 1: Create and approve a budget (as admin)
      const budgetId = await this.createTestBudget(this.adminToken);

      // Test 2: Budget-derived order creation (as admin)
      const budgetOrderId = await this.testBudgetDerivedOrderCreation(this.adminToken, budgetId);

      // Test 3: Direct order creation with different roles
      await this.testDirectOrderCreation(this.userToken, 'USER'); // Should fail
      const directOrderId = await this.testDirectOrderCreation(this.moderatorToken, 'MODERATOR'); // Should succeed

      // Test 4: Order status changes with different roles
      if (directOrderId) {
        await this.testOrderStatusChanges(this.userToken, directOrderId, 'USER'); // Limited access
        await this.testOrderStatusChanges(this.moderatorToken, directOrderId, 'MODERATOR'); // Full access
      }

      // Test 5: Order update restrictions
      if (budgetOrderId) {
        await this.testOrderUpdateRestrictions(this.adminToken, budgetOrderId);
      }

      // Test 6: Valid status transition flow
      if (directOrderId) {
        await this.testValidStatusTransitions(this.moderatorToken, directOrderId);
      }

      console.log('\n✅ All Order Workflow Tests Completed Successfully!');

    } catch (error) {
      console.error('\n❌ Test Failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new OrderWorkflowTester();
  tester.runTests().catch(console.error);
}

module.exports = OrderWorkflowTester;