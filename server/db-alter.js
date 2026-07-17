const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  console.log("Connecting to database...");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: true,
    }
  });

  try {
    console.log("Altering table purchase_indent_materials...");
    
    // Check if columns exist first by trying to add them (it will fail if they exist, but that's fine, we can just catch it)
    await connection.query(`
      ALTER TABLE purchase_indent_materials
      ADD COLUMN customer_part VARCHAR(100),
      ADD COLUMN po_number VARCHAR(50),
      ADD COLUMN po_reference VARCHAR(100),
      ADD COLUMN rm_cost DECIMAL(10,2),
      ADD COLUMN rm_rate DECIMAL(10,2),
      ADD COLUMN pieces_per_kg DECIMAL(10,2),
      ADD COLUMN rm_percentage DECIMAL(5,2);
    `);
    
    console.log("Successfully altered purchase_indent_materials.");
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
       console.log("Columns already exist, skipping alter.");
    } else {
       console.error("Error altering table:", error);
    }
  } finally {
    await connection.end();
  }
}

run();
