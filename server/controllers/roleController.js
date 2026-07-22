const db = require('../config/db');

/**
 * Get all roles
 */
exports.getAllRoles = async (req, res) => {
  try {
    const [roles] = await db.query('SELECT role_id as id, role_name as name FROM roles');
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get all available permissions
 */
exports.getAllPermissions = async (req, res) => {
  try {
    const [permissions] = await db.query('SELECT id, permission_name as name, description FROM permissions');
    res.status(200).json({ success: true, data: permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get permissions for a specific role
 */
exports.getRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    
    // Check if role exists
    const [roles] = await db.query('SELECT * FROM roles WHERE role_id = ?', [roleId]);
    if (roles.length === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const query = `
      SELECT p.id, p.permission_name as name, p.description 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `;
    const [permissions] = await db.query(query, [roleId]);
    
    res.status(200).json({ success: true, data: permissions });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update permissions for a specific role
 */
exports.updateRolePermissions = async (req, res) => {
  // Using a transaction to ensure atomicity
  const connection = await db.getConnection();
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body; // Array of permission IDs

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ success: false, message: 'permissionIds must be an array' });
    }

    // Check if role exists
    const [roles] = await db.query('SELECT * FROM roles WHERE role_id = ?', [roleId]);
    if (roles.length === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    await connection.beginTransaction();

    // Delete existing permissions for this role
    await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

    // Insert new permissions
    if (permissionIds.length > 0) {
      // Build batch insert query: INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?), (?, ?)
      const placeholders = permissionIds.map(() => '(?, ?)').join(', ');
      const values = [];
      permissionIds.forEach(permId => {
        values.push(roleId, permId);
      });
      
      await connection.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders}`, values);
    }

    await connection.commit();
    
    res.status(200).json({ success: true, message: 'Role permissions updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating role permissions:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.release();
  }
};
