const db = require('../config/db');

(async () => {
  try {
    console.log('Checking formula_calculators table...');
    const [tables] = await db.query("SHOW TABLES LIKE 'formula_calculators'");
    console.log('Table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      const [calcs] = await db.query('SELECT * FROM formula_calculators');
      console.log('Calculators:', calcs.length);
      console.log(calcs);
      
      if (calcs.length > 0) {
        const [rows] = await db.query('SELECT * FROM formula_calculator_rows LIMIT 10');
        console.log('Sample rows:', rows.length);
        console.log(rows);
      }
    }
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
