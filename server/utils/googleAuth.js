const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google OAuth token
 * @param {string} token - Google ID token from frontend
 * @returns {Object} - User info from Google
 */
const verifyGoogleToken = async (token) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    return {
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name,
      profileImage: payload.picture,
      emailVerified: payload.email_verified
    };
  } catch (error) {
    throw new Error('Invalid Google token');
  }
};

module.exports = {
  verifyGoogleToken
};
