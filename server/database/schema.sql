create database bhuvaneswari;
use bhuvaneswari;
-- ============================================
-- 1. ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  role_id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  INDEX idx_role_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- roles are QMS, StoreOfficer, Admin, PurchaseDepartment
-- ============================================
-- 2. DEPARTMENTS TABLE
-- ============================================
-- Stores, Quality Management, Administration, Accountant
CREATE TABLE IF NOT EXISTS departments (
  dept_id INT PRIMARY KEY AUTO_INCREMENT,
  dept_name VARCHAR(100) NOT NULL,
  dept_code VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dept_name (dept_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone_number VARCHAR(15),
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  dept_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE SET NULL,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_phone (phone_number),
  INDEX idx_role (role_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. SUPPLIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id INT PRIMARY KEY AUTO_INCREMENT,
  supplier_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  pincode VARCHAR(10),
  gstin VARCHAR(15),
  category VARCHAR(100),
  rating DECIMAL(3,2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  last_order_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_supplier_name (supplier_name),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  customer_id INT PRIMARY KEY AUTO_INCREMENT,
  customer_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  pincode VARCHAR(10),
  gstin VARCHAR(15),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer_name (customer_name),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. MATERIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS materials (
  material_id INT PRIMARY KEY AUTO_INCREMENT,
  material_code VARCHAR(50) UNIQUE NOT NULL,
  material_name VARCHAR(100) NOT NULL,
  material_type VARCHAR(50),
  category VARCHAR(50),
  description TEXT,
  unit_of_measurement VARCHAR(20) NOT NULL,
  current_stock DECIMAL(10,2) DEFAULT 0,
  min_stock_level DECIMAL(10,2) DEFAULT 0,
  max_stock_level DECIMAL(10,2),
  reorder_point DECIMAL(10,2),
  unit_price DECIMAL(10,2),
  standard_cost DECIMAL(10,2) DEFAULT 0,
  reorder_level DECIMAL(10,2) DEFAULT 0,
  reorder_quantity DECIMAL(10,2) DEFAULT 0,
  lead_time_days INT DEFAULT 0,
  specifications JSON,
  created_by INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_material_code (material_code),
  INDEX idx_material_name (material_name),
  INDEX idx_category (category),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. CUSTOMER ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customer_orders (
  order_id INT PRIMARY KEY AUTO_INCREMENT,
  indent_id VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(100),
  indent_date DATE NOT NULL,
  created_by INT NOT NULL,
  status ENUM('Draft', 'Pending Store Review', 'Store Verified', 'Pending Admin Approval', 'Admin Approved', 'Rejected') DEFAULT 'Draft',
  delivery_status ENUM('Open', 'Delivered') DEFAULT 'Open',
  delivered_at TIMESTAMP NULL,
  priority ENUM('Standard', 'High', 'Urgent') DEFAULT 'Standard',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  INDEX idx_indent_id (indent_id),
  INDEX idx_customer (customer_id),
  INDEX idx_status (status),
  INDEX idx_delivery_status (delivery_status),
  INDEX idx_created_by (created_by),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. CUSTOMER ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customer_order_items (
  item_id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  component_name VARCHAR(200) NOT NULL,
  raw_material VARCHAR(200),
  quantity INT NOT NULL,
  required_by_date DATE,
  status ENUM('Requested', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Requested',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES customer_orders(order_id) ON DELETE CASCADE,
  INDEX idx_order (order_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. PURCHASE INDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_indents (
  indent_id INT PRIMARY KEY AUTO_INCREMENT,
  indent_number VARCHAR(50) UNIQUE NOT NULL,
  customer_order_id INT,
  requested_by INT NOT NULL,
  request_date DATE NOT NULL,
  required_by_date DATE,
  priority ENUM('Standard', 'High', 'Urgent') DEFAULT 'Standard',
  status ENUM('Draft', 'Pending Store Review', 'Store Verified', 'Pending QMS Verification', 'QMS Verified', 'Pending Admin Approval', 'Admin Approved', 'Rejected') DEFAULT 'Draft',
  workflow_stage ENUM('QMS Init', 'Store Officer', 'QMS Verified', 'Admin', 'Accountant', 'Completed') DEFAULT 'QMS Init',
  po_number VARCHAR(50),
  po_date VARCHAR(100),
  order_quantity DECIMAL(10,2),
  rm_cost DECIMAL(10,2),
  rm_rate DECIMAL(10,2),
  pieces_per_kg DECIMAL(10,2),
  rm_percentage DECIMAL(5,2),
  store_officer_notes TEXT,
  qms_notes TEXT,
  admin_notes TEXT,
  accountant_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_order_id) REFERENCES customer_orders(order_id) ON DELETE SET NULL,
  FOREIGN KEY (requested_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  INDEX idx_indent_number (indent_number),
  INDEX idx_customer_order (customer_order_id),
  INDEX idx_status (status),
  INDEX idx_workflow_stage (workflow_stage),
  INDEX idx_requested_by (requested_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. PURCHASE INDENT MATERIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_indent_materials (
  indent_material_id INT PRIMARY KEY AUTO_INCREMENT,
  indent_id INT NOT NULL,
  material_id INT,
  material_description VARCHAR(200) NOT NULL,
  raw_material VARCHAR(200),
  quantity DECIMAL(10,2) NOT NULL,
  unit_of_measurement VARCHAR(20) NOT NULL,
  current_stock DECIMAL(10,2),
  required_stock DECIMAL(10,2),
  preferred_supplier VARCHAR(100),
  estimated_cost DECIMAL(10,2),
  specifications TEXT,
  customer_part VARCHAR(100),
  po_number VARCHAR(50),
  po_date VARCHAR(100),
  rm_cost DECIMAL(10,2),
  rm_rate DECIMAL(10,2),
  pieces_per_kg DECIMAL(10,2),
  rm_percentage DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (indent_id) REFERENCES purchase_indents(indent_id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE SET NULL,
  INDEX idx_indent (indent_id),
  INDEX idx_material (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. ORDER STATUS HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_status_history (
  history_id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  changed_by INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  comments TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES customer_orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  INDEX idx_order (order_id),
  INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. INDENT STATUS HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS indent_status_history (
  history_id INT PRIMARY KEY AUTO_INCREMENT,
  indent_id INT NOT NULL,
  changed_by INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  workflow_stage VARCHAR(50),
  comments TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (indent_id) REFERENCES purchase_indents(indent_id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  INDEX idx_indent (indent_id),
  INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. INVENTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
  inventory_id INT PRIMARY KEY AUTO_INCREMENT,
  material_id INT NOT NULL UNIQUE,
  current_stock DECIMAL(10,2) DEFAULT 0,
  available_stock DECIMAL(10,2) DEFAULT 0,
  reserved_stock DECIMAL(10,2) DEFAULT 0,
  warehouse_location VARCHAR(100),
  last_stocked_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE CASCADE,
  INDEX idx_material_id (material_id),
  INDEX idx_available_stock (available_stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 14. STOCK ADJUSTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stock_adjustments (
  adjustment_id INT PRIMARY KEY AUTO_INCREMENT,
  material_id INT NOT NULL,
  adjustment_type ENUM('IN', 'OUT') NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_of_measurement VARCHAR(20) NOT NULL,
  previous_stock DECIMAL(10,2) NOT NULL,
  new_stock DECIMAL(10,2) NOT NULL,
  reason VARCHAR(100) NOT NULL,
  notes TEXT,
  adjusted_by INT NOT NULL,
  adjusted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
  FOREIGN KEY (adjusted_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  INDEX idx_material (material_id),
  INDEX idx_adjusted_at (adjusted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 15. STORE REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS store_requests (
  request_id INT PRIMARY KEY AUTO_INCREMENT,
  request_number VARCHAR(50) UNIQUE NOT NULL,
  requested_by INT NOT NULL,
  dept_id INT,
  item_type VARCHAR(50),
  material_id INT NULL,
  material_code VARCHAR(50),
  material_name VARCHAR(200) NOT NULL,
  color VARCHAR(50),
  specs VARCHAR(200),
  quantity DECIMAL(10,2) NOT NULL,
  unit_of_measurement VARCHAR(20) NOT NULL,
  needed_by_date DATE,
  reason TEXT,
  priority ENUM('Normal', 'Urgent', 'Critical') DEFAULT 'Normal',
  status ENUM('Pending', 'Approved', 'Rejected', 'Processed') DEFAULT 'Pending',
  storage_location VARCHAR(100),
  request_date DATE NOT NULL,
  processed_at TIMESTAMP NULL,
  indent_id INT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requested_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE SET NULL,
  FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE SET NULL,
  FOREIGN KEY (indent_id) REFERENCES purchase_indents(indent_id) ON DELETE SET NULL,
  INDEX idx_request_number (request_number),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_request_date (request_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;