const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

async function addFelipeUser() {
  console.log('Adding Felipe admin user...');
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('Secret1!', 12);
    
    // Open database
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err.message);
        return;
      }
      console.log('Connected to SQLite database');
    });

    // Insert user
    const insertSQL = `INSERT INTO "User" ("email", "password", "name", "role", "createdAt", "updatedAt") 
                       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`;
    
    db.run(insertSQL, ['fmmarmello@gmail.com', hashedPassword, 'Felipe Admin', 'ADMIN'], function(err) {
      if (err) {
        console.error('Error inserting user:', err.message);
      } else {
        console.log('✅ Felipe admin user added successfully!');
        console.log('📧 Email: fmmarmello@gmail.com');
        console.log('🔑 Password: Secret1!');
        console.log('👤 Role: ADMIN');
        console.log('🆔 User ID:', this.lastID);
      }
      
      // Close database
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
      });
    });
    
  } catch (error) {
    console.error('Error hashing password:', error);
  }
}

addFelipeUser();