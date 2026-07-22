const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running formula calculator table migration...\n');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database/add_formula_calculator_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon to get individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(`Statement preview: ${stmt.substring(0, 80)}...`);
      
      try {
        await db.query(stmt);
        console.log(`✓ Success\n`);
      } catch (err) {
        console.log(`✗ Error: ${err.message}\n`);
      }
    }
    
    console.log('Migration complete!');
    
    // Verify tables created
    const [tables] = await db.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'bhuvaneshwari' 
      AND TABLE_NAME IN ('formula_calculators', 'formula_calculator_rows', 'formulas')
    `);
    
    console.log('\nTables created:');
    tables.forEach(t => console.log(`  ✓ ${t.TABLE_NAME}`));
    
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
