const jwt = require('jsonwebtoken');
const db = require('../config/db');

const normalizeRoleName = (roleName) => {
  const normalized = String(roleName || '').trim().toLowerCase();
  if (normalized === 'store') return 'storeofficer';
  if (normalized === 'purchase') return 'purchasedepartment';
  return normalized;
};

/**
 * Verify JWT Token Middleware
 */
const verifyToken = async (req, res, next) => {
  try {
    // Never block CORS preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    // Get token from header or cookie
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.jwt_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Instant Revocation Check
    if (decoded.sessionId) {
      const [sessions] = await db.query('SELECT is_active FROM user_sessions WHERE session_id = ?', [decoded.sessionId]);
      if (sessions.length === 0 || !sessions[0].is_active) {
        return res.status(401).json({
          success: false,
          message: 'Session has been revoked or is invalid'
        });
      }
    }

    req.user = decoded;
    next();

  } catch (error) {
    console.error('Token verification error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Check if user has required role (RBAC)
 * @param {Array<string>} allowedRoles - Array of allowed role names (e.g., 'Admin', 'QMS')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const normalizedAllowedRoles = allowedRoles.map(normalizeRoleName);
    const userRole = normalizeRoleName(req.user.roleName);

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

/**
 * PBAC: Authorize user based on specific permission
 * @param {string} requiredPermission - e.g., 'inventory:read'
 */
const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // Check permissions from database
      const query = `
        SELECT p.permission_name 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.permission_name = ?
      `;
      const [results] = await db.query(query, [req.user.roleId, requiredPermission]);

      if (results.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
};

/**
 * PBAC: Authorize user based on multiple possible permissions (OR logic)
 * @param {Array<string>} requiredPermissions - e.g., ['dashboard:admin', 'dashboard:store']
 */
const authorizeAny = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const query = `
        SELECT p.permission_name 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.permission_name IN (?)
      `;
      const [results] = await db.query(query, [req.user.roleId, requiredPermissions]);

      if (results.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
};

/**
 * Optional authentication - attach user if token exists but don't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.jwt_token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Instant Revocation Check
      if (decoded.sessionId) {
        const [sessions] = await db.query('SELECT is_active FROM user_sessions WHERE session_id = ?', [decoded.sessionId]);
        if (sessions.length > 0 && sessions[0].is_active) {
          req.user = decoded;
        }
      } else {
        req.user = decoded; // Legacy tokens without sessionId
      }
    }

    next();

  } catch (error) {
    // Don't block request if token is invalid, just continue without user
    next();
  }
};

module.exports = {
  verifyToken,
  requireRole,
  authorize,
  authorizeAny,
  optionalAuth
};
