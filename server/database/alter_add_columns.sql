ALTER TABLE suppliers
  ADD COLUMN category VARCHAR(100),
  ADD COLUMN total_orders INT DEFAULT 0,
  ADD COLUMN last_order_date DATE,
  ADD COLUMN rating DECIMAL(3,2) DEFAULT 0;

ALTER TABLE materials
  ADD COLUMN material_type VARCHAR(50),
  ADD COLUMN description TEXT,
  ADD COLUMN standard_cost DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN reorder_level DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN reorder_quantity DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN lead_time_days INT DEFAULT 0,
  ADD COLUMN specifications JSON,
  ADD COLUMN created_by INT NULL;

ALTER TABLE materials
  ADD CONSTRAINT fk_materials_created_by
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL;
