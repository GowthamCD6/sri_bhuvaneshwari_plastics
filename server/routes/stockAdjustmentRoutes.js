const express = require('express');
const router = express.Router();
const stockAdjustmentController = require('../controllers/stockAdjustmentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', stockAdjustmentController.getAllAdjustments);
router.get('/:id', stockAdjustmentController.getAdjustmentById);
router.post('/', stockAdjustmentController.createAdjustment);

module.exports = router;
