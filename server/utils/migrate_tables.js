const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database/add_formula_calculator_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon to get individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      try {
        await db.query(stmt);
      } catch (err) {
      }
    }
    
    
    // Verify tables created
    const [tables] = await db.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'bhuvaneshwari' 
      AND TABLE_NAME IN ('formula_calculators', 'formula_calculator_rows', 'formulas')
    `);
    
    tables.forEach(t => );
    
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
