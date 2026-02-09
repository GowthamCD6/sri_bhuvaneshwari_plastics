const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// All user routes require authentication
router.use(verifyToken);

// Get all users (Admin, QMS, and StoreOfficer for autocomplete)
router.get('/', requireRole('Admin', 'QMS', 'StoreOfficer'), userController.getAllUsers);

// Get user by ID
router.get('/:userId', userController.getUserById);

// Create new user (Admin only)
router.post('/', requireRole('Admin'), userController.createUser);

// Update user
router.put('/:userId', userController.updateUser);

// Delete user (Admin only)
router.delete('/:userId', requireRole('Admin'), userController.deleteUser);

// Update user status (Admin only)
router.patch('/:userId/status', requireRole('Admin'), userController.updateUserStatus);

module.exports = router;
