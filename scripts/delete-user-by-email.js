const path = require('path');

// Load Prisma Client from generated output
const { PrismaClient } = require(path.join('..', 'src', 'generated', 'prisma'));

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/delete-user-by-email.js <email>');
    process.exit(1);
  }

  try {
    const res = await prisma.user.deleteMany({ where: { email } });
    console.log(`Deleted ${res.count} user(s) with email: ${email}`);
  } catch (err) {
    console.error('Failed to delete user(s):', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

