-- Add missing columns to purchase_indents table
-- Run this script to add columns for RM-related fields

ALTER TABLE purchase_indents
ADD COLUMN order_quantity DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN rm_cost DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN rm_rate DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN pieces_per_kg DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN rm_percentage DECIMAL(5,2) DEFAULT NULL;
