const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// All user routes require authentication
router.use(verifyToken);

// Get all users (Users with manage permission, or specific other roles can be handled, but let's give users:manage)
router.get('/', requireRole('Admin'), userController.getAllUsers);

// Get user by ID (Admin only)
router.get('/:userId', requireRole('Admin'), userController.getUserById);

// Create new user (Admin only)
router.post('/', requireRole('Admin'), userController.createUser);

// Update user (Admin only)
router.put('/:userId', requireRole('Admin'), userController.updateUser);

// Delete user (Admin only)
router.delete('/:userId', requireRole('Admin'), userController.deleteUser);

// Update user status (Admin only)
router.patch('/:userId/status', requireRole('Admin'), userController.updateUserStatus);

module.exports = router;
