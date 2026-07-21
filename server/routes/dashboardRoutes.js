const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/admin', authorize('dashboard:admin'), dashboardController.getAdminDashboard);
router.get('/store', authorize('dashboard:store'), dashboardController.getStoreDashboard);
router.get('/purchase', authorize('dashboard:purchase'), dashboardController.getPurchaseDashboard);
router.get('/qms', authorize('dashboard:qms'), dashboardController.getQMSDashboard);

module.exports = router;
