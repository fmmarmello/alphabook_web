const path = require('path');
const { PrismaClient } = require(path.join('..', 'src', 'generated', 'prisma'));

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking database contents...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const clients = await prisma.client.findMany({
      select: { id: true, name: true, active: true }
    });

    const centers = await prisma.center.findMany({
      select: { id: true, name: true, active: true }
    });

    const budgets = await prisma.budget.findMany({
      include: {
        order: {
          select: { id: true, clientId: true, centerId: true }
        }
      }
    });

    console.log(`👥 Users (${users.length}):`);
    if (users.length === 0) {
      console.log('   No users found in the database.');
    } else {
      users.forEach(user => {
        console.log(`   ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
      });
    }

    console.log(`\n📊 Clients (${clients.length}):`);
    clients.forEach(client => {
      console.log(`   ID: ${client.id}, Name: ${client.name}, Active: ${client.active}`);
    });

    console.log(`\n🏭 Centers (${centers.length}):`);
    centers.forEach(center => {
      console.log(`   ID: ${center.id}, Name: ${center.name}, Active: ${center.active}`);
    });

    console.log(`\n📋 Budgets (${budgets.length}):`);
    budgets.forEach(budget => {
      console.log(`   ID: ${budget.id}, ClientID: ${budget.clientId || 'null'}, CenterID: ${budget.centerId || 'null'}, Status: ${budget.status}, Approved: ${budget.approved}, HasOrder: ${!!budget.order}`);
      if (budget.order) {
        console.log(`      └─ Order ClientID: ${budget.order.clientId}, Order CenterID: ${budget.order.centerId}`);
      }
    });

    // Summary by role
    if (users.length > 0) {
      const roleCounts = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 User Summary by Role:');
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`   ${role}: ${count} user(s)`);
      });
    }

    // Suggest defaults
    const activeClients = clients.filter(c => c.active);
    const activeCenters = centers.filter(c => c.active);
    
    console.log('\n💡 Suggested Defaults:');
    if (activeClients.length > 0) {
      console.log(`   Client ID: ${activeClients[0].id} (${activeClients[0].name})`);
    } else if (clients.length > 0) {
      console.log(`   Client ID: ${clients[0].id} (${clients[0].name}) - INACTIVE`);
    } else {
      console.log('   No clients found!');
    }

    if (activeCenters.length > 0) {
      console.log(`   Center ID: ${activeCenters[0].id} (${activeCenters[0].name})`);
    } else if (centers.length > 0) {
      console.log(`   Center ID: ${centers[0].id} (${centers[0].name}) - INACTIVE`);
    } else {
      console.log('   No centers found!');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();