const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

router.use(verifyToken);

// All these routes require the 'users:manage' permission (which Admins have)
router.get('/', authorize('users:manage'), roleController.getAllRoles);
router.get('/permissions', authorize('users:manage'), roleController.getAllPermissions);
router.get('/:roleId/permissions', authorize('users:manage'), roleController.getRolePermissions);
router.put('/:roleId/permissions', authorize('users:manage'), roleController.updateRolePermissions);

module.exports = router;
