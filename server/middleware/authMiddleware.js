const jwt = require('jsonwebtoken');

const normalizeRoleName = (roleName) => {
  const normalized = String(roleName || '').trim().toLowerCase();
  if (normalized === 'store') return 'storeofficer';
  if (normalized === 'purchase') return 'purchasedepartment';
  return normalized;
};

/**
 * Verify JWT Token Middleware
 */
const verifyToken = (req, res, next) => {
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
 * Check if user has specific permission for a resource
 * @param {string} resource - Resource name (e.g., 'materials', 'users')
 * @param {string} action - Action type ('create', 'read', 'update', 'delete', 'approve')
 */
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      next();

    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

/**
 * Optional authentication - attach user if token exists but don't require it
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.jwt_token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
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
  requirePermission,
  optionalAuth
};
