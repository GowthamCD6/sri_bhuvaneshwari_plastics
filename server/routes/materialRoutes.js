const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// All material routes require authentication
router.use(verifyToken);

// Get all materials
router.get('/', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), materialController.getAllMaterials);

// Get low stock materials — MUST be before /:materialId to avoid param capture
router.get('/low-stock', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), materialController.getLowStockMaterials);
router.get('/alerts/low-stock', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), materialController.getLowStockMaterials); // legacy alias

// Get material by ID
router.get('/:materialId', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), materialController.getMaterialById);

// Create new material
router.post('/', requireRole('Admin', 'StoreOfficer'), materialController.createMaterial);

// Update material
router.put('/:materialId', requireRole('Admin', 'StoreOfficer'), materialController.updateMaterial);

// Delete material
router.delete('/:materialId', requireRole('Admin', 'StoreOfficer'), materialController.deleteMaterial);

module.exports = router;
