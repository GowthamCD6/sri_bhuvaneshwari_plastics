const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder
} = require('../controllers/customerOrderController');
const { verifyToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Get all orders (with filters)
router.get('/', getAllOrders);

// Get single order
router.get('/:id', getOrderById);

// Create new order
router.post('/', createOrder);

// Update order status
router.patch('/:id/status', updateOrderStatus);

// Update order details
router.put('/:id', updateOrder);

// Delete order
router.delete('/:id', deleteOrder);

module.exports = router;
