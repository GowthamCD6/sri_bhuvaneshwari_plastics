const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function migrate() {
  console.log('Connecting via db.js...');
  
  try {
    const sqlFile = path.join(__dirname, 'session_migration.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolons for multiple statements if the driver doesn't support multipleStatements natively
    // Actually, db.js uses createPool which by default might not have multipleStatements: true
    // Let's force it for this connection if possible, or split manually
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`Executing ${statements.length} migration statements...`);
    for (const stmt of statements) {
       await db.query(stmt);
    }
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
