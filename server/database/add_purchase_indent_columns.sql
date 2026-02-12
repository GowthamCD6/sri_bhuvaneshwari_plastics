-- Add missing columns to purchase_indents table
-- Run this script to add columns for RM-related fields and PO file upload
-- Note: If some columns already exist, run add_po_file_column.sql instead

USE bhuvaneswari;

-- Add all columns (skip if they already exist)
ALTER TABLE purchase_indents
ADD COLUMN order_quantity DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN rm_cost DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN rm_rate DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN pieces_per_kg DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN rm_percentage DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN po_file_path VARCHAR(255) DEFAULT NULL;
