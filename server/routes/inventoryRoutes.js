const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), inventoryController.getAllInventory);
router.get('/:id', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), inventoryController.getInventoryById);
router.put('/:id/stock', requireRole('Admin', 'StoreOfficer'), inventoryController.updateInventoryStock);
router.get('/:id/history', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), inventoryController.getInventoryHistory);

module.exports = router;
