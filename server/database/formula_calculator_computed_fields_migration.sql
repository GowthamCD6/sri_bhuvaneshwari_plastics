-- Formula Calculator migration with computed fields
-- MySQL/TiDB compatible

CREATE TABLE IF NOT EXISTS formula_calculators (
  calculator_id INT PRIMARY KEY AUTO_INCREMENT,
  calculator_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_default (is_default)
);

CREATE TABLE IF NOT EXISTS formula_calculator_rows (
  row_id INT PRIMARY KEY AUTO_INCREMENT,
  calculator_id INT NOT NULL,
  part_name VARCHAR(200) NOT NULL,
  raw_material VARCHAR(100),
  cavity DECIMAL(10,2),
  no_of_gravity DECIMAL(10,2),
  component_weight DECIMAL(10,4),
  runner_weight DECIMAL(10,4),
  required_per_month DECIMAL(12,2),
  rate_per_kg DECIMAL(12,4),
  rate_per_piece DECIMAL(12,4),
  total_component_weight DECIMAL(14,6),
  shot_weight DECIMAL(14,6),
  process_loss DECIMAL(14,6),
  total_shot_weight DECIMAL(14,6),
  pieces_per_kg DECIMAL(14,6),
  ppu_per_kg DECIMAL(14,6),
  runner_return_per_piece DECIMAL(14,6),
  amount DECIMAL(14,6),
  raw_material_cost_per_component DECIMAL(14,6),
  raw_material_for_total_qty DECIMAL(14,6),
  rm_percentage DECIMAL(14,6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_calculator (calculator_id)
);

-- Add columns for existing deployments (safe for MySQL 8+/TiDB where IF NOT EXISTS is supported)
ALTER TABLE formula_calculator_rows ADD COLUMN IF NOT EXISTS no_of_gravity DECIMAL(10,2);
ALTER TABLE formula_calculator_rows ADD COLUMN IF NOT EXISTS rate_per_piece DECIMAL(12,4);
ALTER TABLE formula_calculator_rows ADD COLUMN IF NOT EXISTS total_component_weight DECIMAL(14,6);
ALTER TABLE formula_calculator_rows ADD COLUMN IF NOT EXISTS shot_weight DECIMAL(14,6);
ALTER TABLE formula_calculator_rows ADD COLUMN IF NOT EXISTS process_loss DECIMAL(14,6);
ALTER TABLE formula_calculator_rows ADD COLUMN IF NOT EXISTS total_shot_weight DECIMAL(14,6);
ALTER TABLE formula_calculator_rows ADD COLUMN IF NOT EXISTS pieces_per_kg DECIMAL(14,6);
ALTER TABLE formula_calculator_rows ADD COLUMN IF NOT EXISTS ppu_per_kg DECIMAL(14,6);
ALTER TABLE formula_calculator_rows ADD COLUMN IF NOT EXISTS runner_return_per_piece DECIMAL(14,6);
ALTER TABLE formula_calculator_rows ADD COLUMN IF NOT EXISTS amount DECIMAL(14,6);
ALTER TABLE formula_calculator_rows ADD COLUMN IF NOT EXISTS raw_material_cost_per_component DECIMAL(14,6);
ALTER TABLE formula_calculator_rows ADD COLUMN IF NOT EXISTS raw_material_for_total_qty DECIMAL(14,6);
ALTER TABLE formula_calculator_rows ADD COLUMN IF NOT EXISTS rm_percentage DECIMAL(14,6);


-- Backfill computed fields using required formulas
UPDATE formula_calculator_rows
SET
  total_component_weight = COALESCE(component_weight, 0) * COALESCE(cavity, 0),
  shot_weight = (COALESCE(component_weight, 0) * COALESCE(cavity, 0)) + COALESCE(runner_weight, 0),
  process_loss = ((COALESCE(component_weight, 0) * COALESCE(cavity, 0)) + COALESCE(runner_weight, 0)) * 0.02,
  total_shot_weight = ((COALESCE(component_weight, 0) * COALESCE(cavity, 0)) + COALESCE(runner_weight, 0)) * 1.02,
  pieces_per_kg = CASE
    WHEN (((COALESCE(component_weight, 0) * COALESCE(cavity, 0)) + COALESCE(runner_weight, 0)) * 1.02) > 0
      THEN (1000 * COALESCE(cavity, 0)) / (((COALESCE(component_weight, 0) * COALESCE(cavity, 0)) + COALESCE(runner_weight, 0)) * 1.02)
    ELSE 0
  END,
  ppu_per_kg = CASE
    WHEN (((COALESCE(component_weight, 0) * COALESCE(cavity, 0)) + COALESCE(runner_weight, 0)) * 1.02) > 0
      THEN (1000 / (((COALESCE(component_weight, 0) * COALESCE(cavity, 0)) + COALESCE(runner_weight, 0)) * 1.02)) * COALESCE(cavity, 0)
    ELSE 0
  END,
  runner_return_per_piece = CASE
    WHEN COALESCE(no_of_gravity, 0) > 0
      THEN COALESCE(runner_weight, 0) / COALESCE(no_of_gravity, 0)
    ELSE 0
  END,
  amount = COALESCE(required_per_month, 0) * COALESCE(rate_per_piece, 0),
  raw_material_cost_per_component = CASE
    WHEN COALESCE(cavity, 0) > 0
      THEN ((((COALESCE(component_weight, 0) * COALESCE(cavity, 0)) + COALESCE(runner_weight, 0)) * 1.02) * COALESCE(rate_per_kg, 0)) / (COALESCE(cavity, 0) * 1000)
    ELSE 0
  END,
  raw_material_for_total_qty = CASE
    WHEN (((1000 / (((COALESCE(component_weight, 0) * COALESCE(cavity, 0)) + COALESCE(runner_weight, 0)) * 1.02)) * COALESCE(cavity, 0))) > 0
      THEN COALESCE(required_per_month, 0) / ((1000 / (((COALESCE(component_weight, 0) * COALESCE(cavity, 0)) + COALESCE(runner_weight, 0)) * 1.02)) * COALESCE(cavity, 0))
    ELSE 0
  END,
  rm_percentage = CASE
    WHEN COALESCE(rate_per_piece, 0) > 0
      THEN (
        CASE
          WHEN COALESCE(cavity, 0) > 0
            THEN ((((COALESCE(component_weight, 0) * COALESCE(cavity, 0)) + COALESCE(runner_weight, 0)) * 1.02) * COALESCE(rate_per_kg, 0)) / (COALESCE(cavity, 0) * 1000)
          ELSE 0
        END
      ) / COALESCE(rate_per_piece, 0)
    ELSE 0
  END;
