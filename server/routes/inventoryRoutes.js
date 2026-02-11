const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', inventoryController.getAllInventory);
router.get('/:id', inventoryController.getInventoryById);
router.put('/:id/stock', inventoryController.updateInventoryStock);
router.get('/:id/history', inventoryController.getInventoryHistory);

module.exports = router;
