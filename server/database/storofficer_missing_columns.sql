-- ============================================================
-- STORE OFFICER - MISSING COLUMNS & FIXES
-- Run this script on your TiDB / MySQL database
-- DB: bhuvaneshwari
-- Generated: February 21, 2026
-- ============================================================

USE bhuvaneshwari;

-- ============================================================
-- 1. ADD preferred_supplier TO materials TABLE
--    NOTE: If you already ran this and get error 1060 "Duplicate column name",
--    skip this block — the column already exists in your DB.
-- ============================================================
-- ALTER TABLE materials
--   ADD COLUMN preferred_supplier VARCHAR(150) DEFAULT NULL
--     COMMENT 'Preferred supplier name for this material (display only)';
-- (Already added — commented out to prevent duplicate column error)

-- ============================================================
-- 2. ADD specs TO store_requests TABLE (if not exists)
--    NOTE: This column is already in schema.sql as specs VARCHAR(200)
--    Only run this if you get "Unknown column specs" errors
-- ============================================================
-- ALTER TABLE store_requests
--   ADD COLUMN IF NOT EXISTS specs VARCHAR(200) DEFAULT NULL;

-- ============================================================
-- 3. VERIFY COLUMNS - Run these SELECTs to confirm everything is in place
-- ============================================================

-- Check materials columns
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'bhuvaneshwari' AND TABLE_NAME = 'materials'
ORDER BY ORDINAL_POSITION;

-- Check inventory columns
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'bhuvaneshwari' AND TABLE_NAME = 'inventory'
ORDER BY ORDINAL_POSITION;

-- Check store_requests columns
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'bhuvaneshwari' AND TABLE_NAME = 'store_requests'
ORDER BY ORDINAL_POSITION;

-- Check purchase_indents columns  
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'bhuvaneshwari' AND TABLE_NAME = 'purchase_indents'
ORDER BY ORDINAL_POSITION;

-- ============================================================
-- 4. DATA VALIDATION QUERIES
--    Use these to confirm data is correct before testing screens
-- ============================================================

-- Total materials in system
SELECT COUNT(*) as total_materials FROM materials WHERE is_active = 1;

-- Low stock materials
SELECT m.material_id, m.material_name, m.material_code,
       COALESCE(i.available_stock, m.current_stock, 0) as current_stock,
       m.reorder_level
FROM materials m
LEFT JOIN inventory i ON m.material_id = i.material_id
WHERE m.is_active = 1
  AND COALESCE(i.available_stock, m.current_stock, 0) <= m.reorder_level;

-- All store requests (recent 10)
SELECT sr.request_number, sr.material_name, sr.quantity, sr.unit_of_measurement,
       sr.priority, sr.status, u.username as requested_by
FROM store_requests sr
LEFT JOIN users u ON sr.requested_by = u.user_id
ORDER BY sr.created_at DESC
LIMIT 10;

-- Dashboard stats for Store Officer
SELECT 
  (SELECT COUNT(*) FROM materials m LEFT JOIN inventory i ON m.material_id = i.material_id
   WHERE m.is_active = 1 AND COALESCE(i.available_stock, m.current_stock, 0) <= m.reorder_level) as low_stock_count,
  (SELECT COUNT(*) FROM purchase_indents WHERE workflow_stage = 'Store Officer') as pending_indents,
  (SELECT COUNT(*) FROM store_requests WHERE status = 'Pending') as pending_requests,
  (SELECT COUNT(*) FROM materials WHERE is_active = 1) as total_materials;
