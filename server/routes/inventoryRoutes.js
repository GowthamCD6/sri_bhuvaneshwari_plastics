const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', authorize('inventory:read'), inventoryController.getAllInventory);
router.get('/:id', authorize('inventory:read'), inventoryController.getInventoryById);
router.put('/:id/stock', authorize('inventory:write'), inventoryController.updateInventoryStock);
router.get('/:id/history', authorize('inventory:read'), inventoryController.getInventoryHistory);

module.exports = router;
