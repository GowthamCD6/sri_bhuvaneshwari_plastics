const express = require('express');
const router = express.Router();
const stockAdjustmentController = require('../controllers/stockAdjustmentController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', requireRole('Admin', 'StoreOfficer', 'Accountant', 'QMS', 'PurchaseDepartment'), stockAdjustmentController.getAllAdjustments);
router.get('/:id', requireRole('Admin', 'StoreOfficer', 'Accountant', 'QMS', 'PurchaseDepartment'), stockAdjustmentController.getAdjustmentById);
router.post('/', requireRole('Admin', 'StoreOfficer'), stockAdjustmentController.createAdjustment);

module.exports = router;
