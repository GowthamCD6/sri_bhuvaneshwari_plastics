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
const { verifyToken, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Get all orders (with filters)
router.get('/', authorize('orders:read'), getAllOrders);

// Get single order
router.get('/:id', authorize('orders:read'), getOrderById);

// Create new order
router.post('/', authorize('orders:write'), createOrder);

// Update order status
router.patch('/:id/status', authorize('orders:write'), updateOrderStatus);

// Update entire order
router.put('/:id', authorize('orders:write'), updateOrder);

// Delete order
router.delete('/:id', authorize('orders:delete'), deleteOrder);

module.exports = router;
