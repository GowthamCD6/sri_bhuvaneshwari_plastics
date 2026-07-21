-- ============================================
-- PBAC Tables (Permission Based Access Control)
-- ============================================

CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permission_name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default permissions
INSERT IGNORE INTO permissions (permission_name, description) VALUES
('users:manage', 'Can view, create, edit, and delete users'),
('dashboard:admin', 'Can view Admin dashboard'),
('dashboard:store', 'Can view Store dashboard'),
('dashboard:purchase', 'Can view Purchase dashboard'),
('dashboard:qms', 'Can view QMS dashboard'),
('suppliers:read', 'Can read suppliers list'),
('suppliers:write', 'Can create and update suppliers'),
('suppliers:delete', 'Can delete suppliers'),
('inventory:read', 'Can read inventory data'),
('inventory:write', 'Can update stock levels'),
('categories:read', 'Can read categories'),
('categories:write', 'Can create, update, delete categories'),
('formulas:read', 'Can read formula calculators'),
('formulas:write', 'Can create, update, delete formulas'),
('indents:read', 'Can read purchase indents'),
('indents:create', 'Can create purchase indents'),
('indents:process', 'Can process/update purchase indents'),
('indents:delete', 'Can delete purchase indents'),
('requests:read', 'Can read store requests'),
('requests:create', 'Can create store requests'),
('requests:process', 'Can process/update store requests'),
('requests:delete', 'Can delete store requests'),
('orders:read', 'Can read customer orders'),
('orders:write', 'Can create and update customer orders'),
('orders:delete', 'Can delete customer orders'),
('materials:read', 'Can read materials'),
('materials:create', 'Can create materials'),
('materials:update', 'Can update materials'),
('materials:delete', 'Can delete materials');

-- Seed Role Permissions based on existing hardcoded logic
-- Role IDs (assumed based on standard insertion order, will use subqueries to be safe)

-- Admin (Has ALL permissions)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.id FROM roles r CROSS JOIN permissions p WHERE r.role_name = 'Admin';

-- StoreOfficer
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.id FROM roles r, permissions p 
WHERE r.role_name = 'StoreOfficer' AND p.permission_name IN (
  'dashboard:store', 'suppliers:read', 'inventory:read', 'inventory:write', 
  'categories:read', 'categories:write', 'formulas:read', 'formulas:write',
  'indents:read', 'indents:process', 'requests:read', 'requests:create', 'requests:process',
  'orders:read', 'orders:write', 'materials:read'
);

-- PurchaseDepartment
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.id FROM roles r, permissions p 
WHERE r.role_name = 'PurchaseDepartment' AND p.permission_name IN (
  'dashboard:purchase', 'suppliers:read', 'suppliers:write', 'inventory:read',
  'categories:read', 'formulas:read', 'indents:read', 'indents:create', 'indents:process',
  'requests:read', 'requests:process', 'orders:read', 'materials:read'
);

-- QMS
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.id FROM roles r, permissions p 
WHERE r.role_name = 'QMS' AND p.permission_name IN (
  'dashboard:qms', 'suppliers:read', 'inventory:read', 'categories:read', 'formulas:read',
  'indents:read', 'indents:create', 'indents:process', 'requests:read', 
  'orders:read', 'orders:write', 'materials:read'
);

-- Accountant
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.id FROM roles r, permissions p 
WHERE r.role_name = 'Accountant' AND p.permission_name IN (
  'suppliers:read', 'inventory:read', 'categories:read', 'formulas:read',
  'indents:read', 'indents:process', 'orders:read', 'materials:read'
);
