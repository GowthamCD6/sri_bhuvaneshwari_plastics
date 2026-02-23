const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { verifyToken, requirePermission } = require('../middleware/authMiddleware');

// All material routes require authentication
router.use(verifyToken);

// Get all materials
router.get('/', materialController.getAllMaterials);

// Get low stock materials — MUST be before /:materialId to avoid param capture
router.get('/low-stock', materialController.getLowStockMaterials);
router.get('/alerts/low-stock', materialController.getLowStockMaterials); // legacy alias

// Get material by ID
router.get('/:materialId', materialController.getMaterialById);

// Create new material
router.post('/', requirePermission('materials', 'create'), materialController.createMaterial);

// Update material
router.put('/:materialId', requirePermission('materials', 'update'), materialController.updateMaterial);

// Delete material
router.delete('/:materialId', requirePermission('materials', 'delete'), materialController.deleteMaterial);

module.exports = router;
