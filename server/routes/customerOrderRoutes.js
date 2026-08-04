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
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Get all orders (with filters)
router.get('/', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), getAllOrders);

// Get single order
router.get('/:id', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), getOrderById);

// Create new order
router.post('/', requireRole('Admin', 'QMS'), createOrder);

// Update order status
router.patch('/:id/status', requireRole('Admin', 'QMS'), updateOrderStatus);

// Update entire order
router.put('/:id', requireRole('Admin', 'QMS'), updateOrder);

// Delete order
router.delete('/:id', requireRole('Admin'), deleteOrder);

module.exports = router;
