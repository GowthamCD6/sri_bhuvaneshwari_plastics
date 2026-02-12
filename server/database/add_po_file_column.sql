-- Add po_file_path column for PO file upload feature
-- Run this script separately if other columns already exist

USE bhuvaneswari;

ALTER TABLE purchase_indents 
ADD COLUMN po_file_path VARCHAR(255) DEFAULT NULL;
