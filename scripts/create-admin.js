const bcrypt = require('bcryptjs');

// Simple script to create admin user directly in database
// Run this with: node scripts/create-admin.js

async function createAdminUser() {
  console.log('Creating admin user...');

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('Secret1!', 12);

    console.log('Admin user credentials:');
    console.log('Email: fmmarmello@gmail.com');
    console.log('Password: Secret1!');
    console.log('Hashed Password:', hashedPassword);
    console.log('Role: admin');
    console.log('');
    console.log('You can now use these credentials to login, or insert this data directly into your database:');
    console.log(`INSERT INTO "User" ("email", "password", "name", "role", "createdAt", "updatedAt") VALUES ('felipe', '${hashedPassword}', 'Felipe Admin', 'admin', datetime('now'), datetime('now'));`);

  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser();