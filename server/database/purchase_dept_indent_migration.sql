-- ============================================================
-- Migration: Purchase Department Indent Support
-- ============================================================
USE bhuvaneswari;

-- 1. Add 'reason' column to purchase_indents
ALTER TABLE purchase_indents
  ADD COLUMN IF NOT EXISTS reason TEXT AFTER priority;

-- 2. Add 'Normal' to priority ENUM and 'Purchase Dept' to workflow_stage ENUM
ALTER TABLE purchase_indents
  MODIFY COLUMN priority ENUM('Normal', 'Standard', 'High', 'Urgent') DEFAULT 'Normal',
  MODIFY COLUMN workflow_stage ENUM('Purchase Dept', 'QMS Init', 'Store Officer', 'QMS Verified', 'Admin', 'Accountant', 'Completed') DEFAULT 'QMS Init';

-- 3. Add 'Pending QMS Verification' is already in status ENUM – confirm full ENUM
ALTER TABLE purchase_indents
  MODIFY COLUMN status ENUM(
    'Draft',
    'Pending Store Review',
    'Store Verified',
    'Pending QMS Verification',
    'QMS Verified',
    'Pending Admin Approval',
    'Admin Approved',
    'Rejected'
  ) DEFAULT 'Draft';
