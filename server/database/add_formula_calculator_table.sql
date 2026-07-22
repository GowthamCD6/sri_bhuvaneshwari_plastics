-- ============================================
-- FORMULA CALCULATORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS formula_calculators (
  calculator_id INT PRIMARY KEY AUTO_INCREMENT,
  calculator_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  INDEX idx_calculator_name (calculator_name),
  INDEX idx_is_default (is_default),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FORMULA CALCULATOR ROWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS formula_calculator_rows (
  row_id INT PRIMARY KEY AUTO_INCREMENT,
  calculator_id INT NOT NULL,
  part_name VARCHAR(200) NOT NULL,
  raw_material VARCHAR(100),
  cavity INT,
  component_weight DECIMAL(10,2),
  runner_weight DECIMAL(10,2),
  required_per_month INT,
  rate_per_kg DECIMAL(10,2),
  formula_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (calculator_id) REFERENCES formula_calculators(calculator_id) ON DELETE CASCADE,
  INDEX idx_calculator (calculator_id),
  INDEX idx_part_name (part_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FORMULAS TABLE (for storing formula definitions)
-- ============================================
CREATE TABLE IF NOT EXISTS formulas (
  formula_id INT PRIMARY KEY AUTO_INCREMENT,
  formula_name VARCHAR(100) NOT NULL,
  formula_description TEXT,
  formula_expression JSON NOT NULL,
  output_field VARCHAR(100) NOT NULL,
  input_fields JSON NOT NULL,
  created_by INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  INDEX idx_formula_name (formula_name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;