const jwt = require('jsonwebtoken');

/**
 * Generate JWT Access Token
 * Used for authenticating API requests
 * Short-lived token (24 hours by default)
 */
const generateAccessToken = (user, sessionId) => {
  const payload = {
    userId: user.user_id,
    roleId: user.role_id,
    sessionId: sessionId
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

/**
 * Generate JWT Refresh Token
 * Used to obtain new access tokens when they expire
 * Long-lived token (7 days by default)
 * 
 * WHY REFRESH TOKENS?
 * 1. Security: Access tokens are short-lived, limiting exposure if stolen
 * 2. User Experience: Users don't need to re-login every hour
 * 3. Token Rotation: Old refresh tokens can be invalidated when new ones are issued
 * 4. Device Management: Can track and revoke refresh tokens per device
 */
const generateRefreshToken = (user, sessionId) => {
  const payload = {
    userId: user.user_id,
    sessionId: sessionId,
    tokenType: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_SECRET + '_REFRESH', {
    expiresIn: '7d'
  });
};

/**
 * Verify JWT Access Token
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

/**
 * Verify JWT Refresh Token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET + '_REFRESH');
  } catch (error) {
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken
};
