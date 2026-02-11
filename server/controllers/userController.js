const bcrypt = require('bcrypt');
const db = require('../config/db');

/**
 * Get all users
 */
const getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT u.user_id, u.username, u.phone_number, u.email, u.is_active,
             r.role_name, u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.is_active = 1
      ORDER BY u.created_at DESC
    `;

    const [results] = await db.query(query);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get user by ID
 */
const getUserById = (req, res) => {
  const { userId } = req.params;

  // Check if user is requesting their own data or is admin
  if (req.user.userId !== parseInt(userId) && String(req.user.roleName || '').toLowerCase() !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const query = `
    SELECT u.user_id, u.username, u.phone_number, u.email, u.is_active,
           u.created_at, u.updated_at, r.role_name, u.role_id, u.dept_id
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: results[0]
    });
  });
};

/**
 * Create new user (Admin only)
 */
const createUser = async (req, res) => {
  try {
    const { username, phoneNumber, email, password, roleId, roleName, deptId } = req.body;

    // Validation
    if (!phoneNumber || !password || !username || (!roleId && !roleName)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, password, username, and role are required'
      });
    }

    // Check if user already exists
    const checkQuery = 'SELECT user_id FROM users WHERE phone_number = ? OR email = ?';
    
    db.query(checkQuery, [phoneNumber, email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }

      if (results.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'User with this phone number or email already exists'
        });
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert new user
      let resolvedRoleId = roleId;
      if (!resolvedRoleId && roleName) {
        const [roles] = await db.query('SELECT role_id FROM roles WHERE role_name = ? LIMIT 1', [roleName]);
        resolvedRoleId = roles[0]?.role_id;
      }

      if (!resolvedRoleId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      const insertQuery = `
        INSERT INTO users (phone_number, email, password_hash, username, role_id, dept_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(insertQuery, [phoneNumber, email, passwordHash, username, resolvedRoleId, deptId || null], (insertErr, result) => {
        if (insertErr) {
          console.error('Error inserting user:', insertErr);
          return res.status(500).json({
            success: false,
            message: 'Failed to create user'
          });
        }

        res.status(201).json({
          success: true,
          message: 'User created successfully',
          userId: result.insertId
        });
      });
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update user
 */
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, phoneNumber, email, roleId, roleName, deptId, password } = req.body;

    // Check if user can update (own profile or admin)
    if (req.user.userId !== parseInt(userId) && String(req.user.roleName || '').toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Non-admins cannot change role
    if ((roleId || roleName) && String(req.user.roleName || '').toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can change user roles'
      });
    }

    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (phoneNumber) {
      updates.push('phone_number = ?');
      values.push(phoneNumber);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (String(req.user.roleName || '').toLowerCase() === 'admin') {
      if (roleId) {
        updates.push('role_id = ?');
        values.push(roleId);
      } else if (roleName) {
        const [roles] = await db.query('SELECT role_id FROM roles WHERE role_name = ? LIMIT 1', [roleName]);
        const resolvedRoleId = roles[0]?.role_id;
        if (!resolvedRoleId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid role'
          });
        }
        updates.push('role_id = ?');
        values.push(resolvedRoleId);
      }
    }
    if (deptId !== undefined) {
      updates.push('dept_id = ?');
      values.push(deptId || null);
    }
    if (password) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(userId);

    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`;

    db.query(updateQuery, values, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'User updated successfully'
      });
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete user (Admin only)
 */
const deleteUser = (req, res) => {
  const { userId } = req.params;

  // Prevent deleting self
  if (req.user.userId === parseInt(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account'
    });
  }

  const deleteQuery = 'DELETE FROM users WHERE user_id = ?';

  db.query(deleteQuery, [userId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  });
};

/**
 * Update user status (Admin only)
 */
const updateUserStatus = (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be: active or inactive'
    });
  }
  const isActive = status === 'active' ? 1 : 0;
  const updateQuery = 'UPDATE users SET is_active = ? WHERE user_id = ?';

  db.query(updateQuery, [isActive, userId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User status updated successfully'
    });
  });
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus
};
