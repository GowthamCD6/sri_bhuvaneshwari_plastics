const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function verifySetup() {

  // 1. Check Database Connection
  try {
    const [result] = await db.query('SELECT DATABASE() as current_db');
  } catch (err) {
    console.error(`   ✗ Database connection failed: ${err.message}`);
    process.exit(1);
  }

  // 2. Check if po_file_path column exists
  try {
    const [columns] = await db.query(
      "SHOW COLUMNS FROM purchase_indents LIKE 'po_file_path'"
    );
    if (columns.length > 0) {
    } else {
    }
  } catch (err) {
    console.error(`   ✗ Error checking column: ${err.message}`);
  }

  // 3. Check uploads directory
  const uploadsDir = path.join(__dirname, '../uploads');
  const poFilesDir = path.join(uploadsDir, 'po-files');

  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (err) {
      console.error(`   ✗ Failed to create /uploads: ${err.message}`);
    }
  } else {
  }

  if (!fs.existsSync(poFilesDir)) {
    try {
      fs.mkdirSync(poFilesDir, { recursive: true });
    } catch (err) {
      console.error(`   ✗ Failed to create /uploads/po-files: ${err.message}`);
    }
  } else {
    try {
      const files = fs.readdirSync(poFilesDir);
    } catch (err) {
      console.error(`   ✗ Error reading po-files: ${err.message}`);
    }
  }

  // 4. Summary
  process.exit(0);
}

verifySetup().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
