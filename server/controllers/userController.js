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
  if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const query = `
    SELECT user_id, phone_number, email, full_name, role, status, 
           profile_image, created_at, last_login
    FROM users
    WHERE user_id = ?
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
    const { phoneNumber, email, password, fullName, role } = req.body;

    // Validation
    if (!phoneNumber || !password || !fullName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, password, full name, and role are required'
      });
    }

    // Validate role
    const validRoles = ['admin', 'qms', 'store_officer', 'purchase_dept'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: admin, qms, store_officer, or purchase_dept'
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
      const insertQuery = `
        INSERT INTO users (phone_number, email, password_hash, full_name, role, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(insertQuery, [phoneNumber, email, passwordHash, fullName, role, req.user.userId], (insertErr, result) => {
        if (insertErr) {
          console.error('Error inserting user:', insertErr);
          return res.status(500).json({
            success: false,
            message: 'Failed to create user'
          });
        }

        // Log audit
        const auditQuery = `
          INSERT INTO audit_log (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
          VALUES (?, 'create', 'users', ?, ?, ?, ?)
        `;
        
        const newValues = JSON.stringify({ phoneNumber, email, fullName, role });
        
        db.query(auditQuery, [
          req.user.userId,
          result.insertId,
          newValues,
          req.ip,
          req.get('user-agent')
        ]);

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
    const { phoneNumber, email, fullName, role, password } = req.body;

    // Check if user can update (own profile or admin)
    if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Non-admins cannot change role
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can change user roles'
      });
    }

    const updates = [];
    const values = [];

    if (phoneNumber) {
      updates.push('phone_number = ?');
      values.push(phoneNumber);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (fullName) {
      updates.push('full_name = ?');
      values.push(fullName);
    }
    if (role && req.user.role === 'admin') {
      updates.push('role = ?');
      values.push(role);
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

      // Log audit
      const auditQuery = `
        INSERT INTO audit_log (user_id, action, table_name, record_id, ip_address, user_agent)
        VALUES (?, 'update', 'users', ?, ?, ?)
      `;
      
      db.query(auditQuery, [req.user.userId, userId, req.ip, req.get('user-agent')]);

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

    // Log audit
    const auditQuery = `
      INSERT INTO audit_log (user_id, action, table_name, record_id, ip_address, user_agent)
      VALUES (?, 'delete', 'users', ?, ?, ?)
    `;
    
    db.query(auditQuery, [req.user.userId, userId, req.ip, req.get('user-agent')]);

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

  if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be: active, inactive, or suspended'
    });
  }

  const updateQuery = 'UPDATE users SET status = ? WHERE user_id = ?';

  db.query(updateQuery, [status, userId], (err, result) => {
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

    // Log audit
    const auditQuery = `
      INSERT INTO audit_log (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
      VALUES (?, 'update_status', 'users', ?, ?, ?, ?)
    `;
    
    db.query(auditQuery, [
      req.user.userId, 
      userId, 
      JSON.stringify({ status }), 
      req.ip, 
      req.get('user-agent')
    ]);

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
