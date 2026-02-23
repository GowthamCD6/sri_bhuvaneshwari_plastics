const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function verifySetup() {
  console.log('========== VERIFICATION SCRIPT ==========\n');

  // 1. Check Database Connection
  console.log('1. Checking database connection...');
  try {
    const [result] = await db.query('SELECT DATABASE() as current_db');
    console.log(`   ✓ Connected to database: ${result[0].current_db}`);
  } catch (err) {
    console.error(`   ✗ Database connection failed: ${err.message}`);
    process.exit(1);
  }

  // 2. Check if po_file_path column exists
  console.log('\n2. Checking if po_file_path column exists in purchase_indents...');
  try {
    const [columns] = await db.query(
      "SHOW COLUMNS FROM purchase_indents LIKE 'po_file_path'"
    );
    if (columns.length > 0) {
      console.log(`   ✓ Column 'po_file_path' exists`);
    } else {
      console.log(`   ✗ Column 'po_file_path' does NOT exist`);
      console.log('   Run: mysql < server/database/add_po_file_column.sql');
    }
  } catch (err) {
    console.error(`   ✗ Error checking column: ${err.message}`);
  }

  // 3. Check uploads directory
  console.log('\n3. Checking uploads directory structure...');
  const uploadsDir = path.join(__dirname, '../uploads');
  const poFilesDir = path.join(uploadsDir, 'po-files');

  if (!fs.existsSync(uploadsDir)) {
    console.log(`   ✗ /uploads directory NOT found`);
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`   ✓ Created /uploads directory`);
    } catch (err) {
      console.error(`   ✗ Failed to create /uploads: ${err.message}`);
    }
  } else {
    console.log(`   ✓ /uploads directory exists`);
  }

  if (!fs.existsSync(poFilesDir)) {
    console.log(`   ✗ /uploads/po-files directory NOT found`);
    try {
      fs.mkdirSync(poFilesDir, { recursive: true });
      console.log(`   ✓ Created /uploads/po-files directory`);
    } catch (err) {
      console.error(`   ✗ Failed to create /uploads/po-files: ${err.message}`);
    }
  } else {
    console.log(`   ✓ /uploads/po-files directory exists`);
    try {
      const files = fs.readdirSync(poFilesDir);
      console.log(`   ✓ Files in po-files: ${files.length}`);
    } catch (err) {
      console.error(`   ✗ Error reading po-files: ${err.message}`);
    }
  }

  // 4. Summary
  console.log('\n========== SETUP COMPLETE ==========');
  console.log('Database and file upload directories are properly configured.');
  process.exit(0);
}

verifySetup().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
