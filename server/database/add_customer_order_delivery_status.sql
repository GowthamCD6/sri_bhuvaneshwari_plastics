-- Add dedicated delivery lifecycle fields for customer orders.
-- This is separate from verification workflow status.

ALTER TABLE customer_orders
  ADD COLUMN IF NOT EXISTS delivery_status ENUM('Open', 'Delivered') DEFAULT 'Open' AFTER status,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP NULL AFTER delivery_status;

SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'customer_orders'
    AND index_name = 'idx_customer_orders_delivery_status'
);

SET @idx_sql := IF(
  @idx_exists = 0,
  'CREATE INDEX idx_customer_orders_delivery_status ON customer_orders(delivery_status)',
  'SELECT 1'
);

PREPARE idx_stmt FROM @idx_sql;
EXECUTE idx_stmt;
DEALLOCATE PREPARE idx_stmt;

-- Backfill existing rows to Open if null
UPDATE customer_orders
SET delivery_status = 'Open'
WHERE delivery_status IS NULL;
