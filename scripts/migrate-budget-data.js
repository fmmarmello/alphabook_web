const path = require('path');

// Load Prisma Client generated in src/generated/prisma
// Use relative path to avoid TS path alias issues in Node scripts
const { PrismaClient } = require(path.join('..', 'src', 'generated', 'prisma'));

const prisma = new PrismaClient();

/**
 * Determines appropriate default client and center IDs from existing records
 */
async function determineDefaults() {
  const clients = await prisma.client.findMany({
    where: { active: true },
    orderBy: { id: 'asc' }
  });
  
  const centers = await prisma.center.findMany({
    where: { active: true },
    orderBy: { id: 'asc' }
  });

  // Fall back to any client/center if no active ones exist
  const fallbackClients = clients.length === 0 ? 
    await prisma.client.findMany({ orderBy: { id: 'asc' } }) : [];
  const fallbackCenters = centers.length === 0 ? 
    await prisma.center.findMany({ orderBy: { id: 'asc' } }) : [];

  return {
    defaultClientId: clients[0]?.id || fallbackClients[0]?.id || null,
    defaultCenterId: centers[0]?.id || fallbackCenters[0]?.id || null,
    clientsExist: clients.length > 0 || fallbackClients.length > 0,
    centersExist: centers.length > 0 || fallbackCenters.length > 0,
    suggestedClient: clients[0] || fallbackClients[0] || null,
    suggestedCenter: centers[0] || fallbackCenters[0] || null,
  };
}

/**
 * Creates sample client and center if database is empty
 */
async function createSampleData() {
  console.log('🏗️  Creating sample client and center for migration...\n');

  try {
    const client = await prisma.client.create({
      data: {
        name: 'Default Client',
        cnpjCpf: '00000000000000',
        phone: '(00) 0000-0000',
        email: 'default@example.com',
        address: 'Default Address',
        active: true,
      }
    });

    const center = await prisma.center.create({
      data: {
        name: 'Default Center',
        type: 'Production',
        obs: 'Default production center created for migration',
        active: true,
      }
    });

    console.log(`✅ Created sample client: ID ${client.id} - ${client.name}`);
    console.log(`✅ Created sample center: ID ${center.id} - ${center.name}\n`);

    return { clientId: client.id, centerId: center.id };
  } catch (error) {
    console.error('❌ Failed to create sample data:', error.message);
    throw error;
  }
}

/**
 * Analyzes the current database state to understand existing budget data
 */
async function analyzeDatabaseState() {
  console.log('🔍 Analyzing database state...\n');

  const budgets = await prisma.budget.findMany({
    include: {
      order: true,
      client: true,
      center: true,
    }
  });

  const clients = await prisma.client.count();
  const centers = await prisma.center.count();
  
  console.log(`📊 Database State Analysis:`);
  console.log(`   Total budgets: ${budgets.length}`);
  console.log(`   Total clients: ${clients}`);
  console.log(`   Total centers: ${centers}\n`);

  if (budgets.length === 0) {
    console.log('ℹ️  No budgets found in database. Nothing to migrate.\n');
    return {
      budgets: [],
      budgetsWithoutClient: [],
      budgetsWithoutCenter: [],
      budgetsWithLinkedOrders: [],
      budgetsWithoutLinkedOrders: [],
      approvedBudgets: [],
      draftBudgets: [],
    };
  }

  // Categorize budgets
  const budgetsWithoutClient = budgets.filter(b => !b.clientId);
  const budgetsWithoutCenter = budgets.filter(b => !b.centerId);
  const budgetsWithLinkedOrders = budgets.filter(b => b.order);
  const budgetsWithoutLinkedOrders = budgets.filter(b => !b.order);
  const approvedBudgets = budgets.filter(b => b.approved && !b.order);
  const draftBudgets = budgets.filter(b => !b.approved && !b.order);

  console.log(`📋 Budget Categories:`);
  console.log(`   Missing clientId: ${budgetsWithoutClient.length}`);
  console.log(`   Missing centerId: ${budgetsWithoutCenter.length}`);
  console.log(`   With linked orders: ${budgetsWithLinkedOrders.length}`);
  console.log(`   Without linked orders: ${budgetsWithoutLinkedOrders.length}`);
  console.log(`   Approved without orders: ${approvedBudgets.length}`);
  console.log(`   Draft without orders: ${draftBudgets.length}\n`);

  // Current status distribution
  const statusCounts = budgets.reduce((acc, budget) => {
    acc[budget.status] = (acc[budget.status] || 0) + 1;
    return acc;
  }, {});

  console.log(`📈 Current Status Distribution:`);
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });
  console.log();

  return {
    budgets,
    budgetsWithoutClient,
    budgetsWithoutCenter,
    budgetsWithLinkedOrders,
    budgetsWithoutLinkedOrders,
    approvedBudgets,
    draftBudgets,
  };
}

/**
 * Determines the new status for a budget based on its current state and relationships
 */
function determineNewStatus(budget) {
  if (budget.order) {
    return 'CONVERTED';
  } else if (budget.approved) {
    return 'APPROVED';
  } else {
    return 'DRAFT';
  }
}

/**
 * Creates migration plan for budgets
 */
function createMigrationPlan(analysis, defaultClientId, defaultCenterId) {
  const plan = [];

  analysis.budgets.forEach(budget => {
    const updates = {};
    let needsUpdate = false;

    // Determine clientId
    let newClientId = budget.clientId;
    if (!newClientId) {
      if (budget.order) {
        newClientId = budget.order.clientId;
      } else {
        newClientId = defaultClientId;
      }
      updates.clientId = newClientId;
      needsUpdate = true;
    }

    // Determine centerId
    let newCenterId = budget.centerId;
    if (!newCenterId) {
      if (budget.order) {
        newCenterId = budget.order.centerId;
      } else {
        newCenterId = defaultCenterId;
      }
      updates.centerId = newCenterId;
      needsUpdate = true;
    }

    // Determine new status
    const newStatus = determineNewStatus(budget);
    if (budget.status !== newStatus) {
      updates.status = newStatus;
      needsUpdate = true;
    }

    if (needsUpdate) {
      plan.push({
        budgetId: budget.id,
        currentState: {
          clientId: budget.clientId,
          centerId: budget.centerId,
          status: budget.status,
          approved: budget.approved,
          hasOrder: !!budget.order,
        },
        updates,
        reason: budget.order 
          ? 'Extracted from linked order'
          : 'Using default values (no linked order)',
      });
    }
  });

  return plan;
}

/**
 * Displays the migration plan
 */
function displayMigrationPlan(plan, isDryRun = true) {
  console.log(`${isDryRun ? '🧪 DRY RUN' : '🚀 EXECUTION'} - Migration Plan:`);
  console.log(`   Budgets to update: ${plan.length}\n`);

  if (plan.length === 0) {
    console.log('✅ No budgets need updating. All data is already correct.\n');
    return;
  }

  plan.forEach((item, index) => {
    console.log(`${index + 1}. Budget ID: ${item.budgetId}`);
    console.log(`   Current: clientId=${item.currentState.clientId}, centerId=${item.currentState.centerId}, status=${item.currentState.status}`);
    console.log(`   Updates: ${Object.entries(item.updates).map(([key, value]) => `${key}=${value}`).join(', ')}`);
    console.log(`   Reason:  ${item.reason}`);
    console.log();
  });
}

/**
 * Executes the migration plan
 */
async function executeMigrationPlan(plan) {
  if (plan.length === 0) {
    console.log('✅ No migration needed.\n');
    return { success: 0, errors: 0 };
  }

  let success = 0;
  let errors = 0;

  console.log('🔄 Starting migration...\n');

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of plan) {
        try {
          await tx.budget.update({
            where: { id: item.budgetId },
            data: item.updates,
          });

          console.log(`✅ Updated budget ${item.budgetId}: ${Object.entries(item.updates).map(([k,v]) => `${k}=${v}`).join(', ')}`);
          success++;
        } catch (error) {
          console.error(`❌ Failed to update budget ${item.budgetId}:`, error.message);
          errors++;
          throw error; // This will rollback the entire transaction
        }
      }
    });

    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`   Budgets updated: ${success}`);
    console.log(`   Errors: ${errors}\n`);

  } catch (error) {
    console.error(`\n💥 Migration failed! All changes rolled back.`);
    console.error(`Error:`, error.message);
    console.log(`   Budgets updated: 0 (transaction rolled back)`);
    console.log(`   Errors: ${plan.length}\n`);
  }

  return { success, errors };
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--execute');
  const createSample = args.includes('--create-sample');

  console.log('🔧 AlphaBook Budget Data Migration Script\n');

  if (isDryRun) {
    console.log('🧪 Running in DRY RUN mode. Use --execute flag to perform actual migration.\n');
  } else {
    console.log('🚀 EXECUTION mode - changes will be applied to database.\n');
  }

  try {
    // Step 1: Determine defaults or create sample data if needed
    console.log('🔍 Step 1: Determining defaults...');
    let defaults = await determineDefaults();
    
    if (!defaults.clientsExist || !defaults.centersExist) {
      console.log('⚠️  Database appears to be empty or missing required data:');
      if (!defaults.clientsExist) console.log('   - No clients found');
      if (!defaults.centersExist) console.log('   - No centers found');
      
      if (createSample) {
        const sampleData = await createSampleData();
        defaults.defaultClientId = sampleData.clientId;
        defaults.defaultCenterId = sampleData.centerId;
        defaults.clientsExist = true;
        defaults.centersExist = true;
      } else {
        console.log('\n💡 Options to fix this:');
        console.log('   1. Run with --create-sample to create default client and center');
        console.log('   2. Create client and center records manually in the database');
        console.log('   3. Use the web application to add client and center data');
        console.log('\nExample: node scripts/migrate-budget-data.js --create-sample\n');
        process.exit(1);
      }
    } else {
      console.log(`✅ Using defaults: Client ID ${defaults.defaultClientId} (${defaults.suggestedClient?.name}), Center ID ${defaults.defaultCenterId} (${defaults.suggestedCenter?.name})\n`);
    }

    // Step 2: Analyze current state
    console.log('🔍 Step 2: Analyzing database state...');
    const analysis = await analyzeDatabaseState();

    if (analysis.budgets.length === 0) {
      console.log('✅ Database is ready for use but contains no budgets to migrate.\n');
      process.exit(0);
    }

    // Step 3: Create migration plan
    console.log('📋 Step 3: Creating migration plan...');
    const plan = createMigrationPlan(analysis, defaults.defaultClientId, defaults.defaultCenterId);

    // Step 4: Display plan
    console.log('📄 Step 4: Displaying migration plan...');
    displayMigrationPlan(plan, isDryRun);

    // Step 5: Execute if not dry run
    if (!isDryRun && plan.length > 0) {
      console.log('🚀 Step 5: Executing migration...');
      const result = await executeMigrationPlan(plan);
      
      if (result.errors > 0) {
        process.exitCode = 1;
      }
    } else if (isDryRun) {
      console.log('🧪 Step 5: Skipped (dry run mode)');
      console.log('To execute the migration, run: node scripts/migrate-budget-data.js --execute\n');
    }

  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔧 AlphaBook Budget Data Migration Script

Usage: node scripts/migrate-budget-data.js [options]

Options:
  --execute         Execute the migration (default: dry run)
  --create-sample   Create sample client and center if database is empty
  --help, -h        Show this help message

Description:
  This script migrates existing budget data to populate missing clientId and 
  centerId fields, and updates budget statuses appropriately.

  Migration Logic:
  - For budgets with linked orders: Extract clientId/centerId from the order
  - For budgets without linked orders: Use default values from existing records
  - Update status based on current state:
    * Has linked order → CONVERTED
    * approved=true, no order → APPROVED  
    * approved=false, no order → DRAFT

  The script uses database transactions to ensure data integrity.
  All changes are rolled back if any error occurs.

Examples:
  node scripts/migrate-budget-data.js                    # Dry run (preview changes)
  node scripts/migrate-budget-data.js --execute          # Execute migration
  node scripts/migrate-budget-data.js --create-sample    # Create sample data if empty
`);
  process.exit(0);
}

main();