const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.post('/logout', verifyToken, authController.logout);
router.get('/profile', verifyToken, authController.getProfile);

// Admin only routes
router.post('/register', verifyToken, requireRole('Admin'), authController.register);

module.exports = router;
