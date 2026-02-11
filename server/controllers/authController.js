const bcrypt = require('bcrypt');
const db = require('../config/db'); // Now using promise-based pool
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwtUtils');
const { verifyGoogleToken } = require('../utils/googleAuth');

/**
 * Set JWT Cookie
 */
const setTokenCookie = (res, token) => {
  const expiresIn = process.env.JWT_COOKIE_EXPIRES_IN || '1';
  const days = parseInt(expiresIn);
  
  res.cookie('jwt_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: days * 24 * 60 * 60 * 1000
  });
};

/**
 * Login with username/email and password
 */
const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Validation
    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and password are required'
      });
    }

    // Find user by phone number using promise-based query
    const query = 'SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.phone_number = ? AND u.is_active = TRUE';
    
    const [results] = await db.query(query, [mobile]);

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    const user = results[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set cookie (for future use)
    setTokenCookie(res, accessToken);

    // Send response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        userId: user.user_id,
        phoneNumber: user.phone_number,
        username: user.username,
        email: user.email,
        roleName: user.role_name,
        roleId: user.role_id,
        deptId: user.dept_id
      },
      permissions: []
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Login with Google (OAuth)
 */
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Verify Google token
    const googleUser = await verifyGoogleToken(token);

    // Check if user exists with this email
    const checkQuery = 'SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.email = ? AND u.is_active = TRUE';
    
    const [results] = await db.query(checkQuery, [googleUser.email]);

    if (results.length === 0) {
      // User doesn't exist - Google signup not allowed
      return res.status(403).json({
        success: false,
        message: 'No account found with this email. Please contact admin to create your account.'
      });
    }

    const user = results[0];

    // Complete login for existing user
    await completeGoogleLogin(user, req, res);

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Google authentication failed'
    });
  }
};

/**
 * Helper function to complete Google login
 */
const completeGoogleLogin = async (user, req, res) => {
  try {
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set cookie
    setTokenCookie(res, accessToken);

    // Send response
    res.status(200).json({
      success: true,
      message: 'Google login successful',
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        userId: user.user_id,
        phoneNumber: user.phone_number,
        username: user.username,
        email: user.email,
        roleName: user.role_name,
        roleId: user.role_id,
        deptId: user.dept_id
      },
      permissions: []
    });
  } catch (error) {
    console.error('Complete Google login error:', error);
    throw error;
  }
};

/**
 * Logout
 */
const logout = async (req, res) => {
  try {
    // Clear cookie
    res.clearCookie('jwt_token');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const { userId } = req.user;

    const query = `
      SELECT u.user_id, u.username, u.email, u.phone_number, u.role_id, u.dept_id, 
             u.created_at, u.updated_at, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ? AND u.is_active = TRUE
    `;

    const [results] = await db.query(query, [userId]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = results[0];

    res.status(200).json({
      success: true,
      user: {
        userId: user.user_id,
        username: user.username,
        phoneNumber: user.phone_number,
        email: user.email,
        roleName: user.role_name,
        roleId: user.role_id,
        deptId: user.dept_id,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      permissions: []
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET + '_REFRESH');

    // Check if refresh token exists in database
    const query = `
      SELECT rt.*, u.* 
      FROM refresh_tokens rt
      JOIN users u ON rt.user_id = u.user_id
      WHERE rt.token = ? AND rt.expires_at > NOW() AND u.is_active = 1
    `;

    db.query(query, [refreshToken], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }

      const user = results[0];

      // Generate new access token
      const newAccessToken = generateAccessToken(user);

      // Set new cookie
      setTokenCookie(res, newAccessToken);

      res.status(200).json({
        success: true,
        token: newAccessToken
      });
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Register new user (Admin only - called from userController)
 * This function should only be called by admin through user management
 */
const register = async (req, res) => {
  try {
    const { phoneNumber, email, password, username, roleId, roleName, deptId } = req.body;

    // Validation
    if (!phoneNumber || !password || !username || (!roleId && !roleName)) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const checkQuery = 'SELECT user_id FROM users WHERE phone_number = ? OR email = ?';
    const [results] = await db.query(checkQuery, [phoneNumber, email]);

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

    const [result] = await db.query(insertQuery, [phoneNumber, email, passwordHash, username, resolvedRoleId, deptId || null]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  login,
  googleLogin,
  logout,
  getProfile,
  refreshToken,
  register
};
