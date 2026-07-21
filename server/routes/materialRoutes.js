const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

// All material routes require authentication
router.use(verifyToken);

// Get all materials
router.get('/', authorize('materials:read'), materialController.getAllMaterials);

// Get low stock materials — MUST be before /:materialId to avoid param capture
router.get('/low-stock', authorize('materials:read'), materialController.getLowStockMaterials);
router.get('/alerts/low-stock', authorize('materials:read'), materialController.getLowStockMaterials); // legacy alias

// Get material by ID
router.get('/:materialId', authorize('materials:read'), materialController.getMaterialById);

// Create new material
router.post('/', authorize('materials:create'), materialController.createMaterial);

// Update material
router.put('/:materialId', authorize('materials:update'), materialController.updateMaterial);

// Delete material
router.delete('/:materialId', authorize('materials:delete'), materialController.deleteMaterial);

module.exports = router;
