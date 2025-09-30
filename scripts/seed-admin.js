const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Creating admin user...');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'felipe' },
    });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('Secret1!', 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'felipe',
        password: hashedPassword,
        name: 'Felipe Admin',
        role: 'admin',
      },
    });

    console.log('Admin user created successfully!');
    console.log('Email: felipe');
    console.log('Password: Secret1!');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();