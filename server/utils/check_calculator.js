const db = require('../config/db');

(async () => {
  try {
    const [tables] = await db.query("SHOW TABLES LIKE 'formula_calculators'");
    
    if (tables.length > 0) {
      const [calcs] = await db.query('SELECT * FROM formula_calculators');
      
      if (calcs.length > 0) {
        const [rows] = await db.query('SELECT * FROM formula_calculator_rows LIMIT 10');
      }
    }
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
