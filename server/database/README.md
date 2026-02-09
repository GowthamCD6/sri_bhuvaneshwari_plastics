# Sri Bhuvaneswari Plastics - Database Setup

## Initial Setup

### 1. Create Database
```sql
CREATE DATABASE IF NOT EXISTS sribhuvaneswari;
USE sribhuvaneswari;
```

### 2. Execute Schema
Run the schema file to create all tables:
```bash
mysql -u root -p sribhuvaneswari < database/schema.sql
```

Or from MySQL CLI:
```sql
USE sribhuvaneswari;
SOURCE database/schema.sql;
```

### 3. Verify Setup
```sql
-- Check tables
SHOW TABLES;

-- Check default admin user
SELECT * FROM users;

-- Check role permissions
SELECT * FROM role_permissions;
```

## Default Admin Credentials

After running the schema, you can login with:
- **Phone Number**: 9999999999
- **Password**: Admin@123
- **Role**: admin

## Database Schema Overview

### Core Tables (Implemented)

1. **users** - User authentication and management
2. **role_permissions** - RBAC permissions for each role
3. **refresh_tokens** - JWT refresh token storage
4. **materials** - Raw materials, components, finished goods
5. **suppliers** - Supplier information
6. **supplier_materials** - Many-to-many relationship
7. **inventory** - Current stock levels
8. **inventory_transactions** - All stock movements
9. **purchase_indents** - Purchase requests
10. **purchase_indent_items** - Items in each indent
11. **customer_orders** - Customer orders (QMS)
12. **customer_order_items** - Items in each order
13. **stock_adjustments** - Stock corrections
14. **stock_adjustment_items** - Items in each adjustment
15. **audit_log** - System audit trail

## Roles & Permissions

### Admin
- Manage users, materials, suppliers
- Approve purchase indents
- View all data

### QMS (Quality Management System)
- Manage customer orders
- Approve/reject purchase indents
- View materials and inventory

### Store Officer
- Manage inventory
- Create purchase indents
- Perform stock adjustments
- View materials

### Purchase Department
- Manage suppliers
- Update purchase indents
- View materials and inventory

## Next Steps

After setting up the database:

1. Install dependencies:
```bash
cd server
npm install jsonwebtoken bcrypt cookie-parser mysql2
```

2. Update .env file with database credentials

3. Start the server:
```bash
npm start
```

4. Test the login endpoint:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9999999999", "password": "Admin@123"}'
```

## Additional Tables to be Added

As modules are developed, additional tables can be added:
- Production modules
- Quality inspection
- Dispatch/Shipping
- Reports and analytics
- Notifications
