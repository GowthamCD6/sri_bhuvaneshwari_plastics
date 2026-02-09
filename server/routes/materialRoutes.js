const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { verifyToken, requirePermission } = require('../middleware/authMiddleware');

// All material routes require authentication
router.use(verifyToken);

// Get all materials
router.get('/', materialController.getAllMaterials);

// Get material by ID
router.get('/:materialId', materialController.getMaterialById);

// Create new material
router.post('/', requirePermission('materials', 'create'), materialController.createMaterial);

// Update material
router.put('/:materialId', requirePermission('materials', 'update'), materialController.updateMaterial);

// Delete material
router.delete('/:materialId', requirePermission('materials', 'delete'), materialController.deleteMaterial);

// Get low stock materials
router.get('/alerts/low-stock', materialController.getLowStockMaterials);

module.exports = router;
