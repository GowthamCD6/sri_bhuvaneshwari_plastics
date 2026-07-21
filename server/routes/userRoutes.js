const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, authorize, authorizeAny } = require('../middleware/authMiddleware');

// All user routes require authentication
router.use(verifyToken);

// Get all users (Users with manage permission, or specific other roles can be handled, but let's give users:manage)
router.get('/', authorize('users:manage'), userController.getAllUsers);

// Get user by ID (Admin only)
router.get('/:userId', authorize('users:manage'), userController.getUserById);

// Create new user (Admin only)
router.post('/', authorize('users:manage'), userController.createUser);

// Update user (Admin only)
router.put('/:userId', authorize('users:manage'), userController.updateUser);

// Delete user (Admin only)
router.delete('/:userId', authorize('users:manage'), userController.deleteUser);

// Update user status (Admin only)
router.patch('/:userId/status', authorize('users:manage'), userController.updateUserStatus);

module.exports = router;
