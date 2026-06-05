-- Persist selected raw material alongside customer order items and purchase indent materials.

USE bhuvaneswari;

ALTER TABLE customer_order_items
  ADD COLUMN IF NOT EXISTS raw_material VARCHAR(200) DEFAULT NULL AFTER component_name;

ALTER TABLE purchase_indent_materials
  ADD COLUMN IF NOT EXISTS raw_material VARCHAR(200) DEFAULT NULL AFTER material_description;