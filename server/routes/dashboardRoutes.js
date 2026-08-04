const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/admin', requireRole('Admin'), dashboardController.getAdminDashboard);
router.get('/store', requireRole('StoreOfficer'), dashboardController.getStoreDashboard);
router.get('/purchase', requireRole('PurchaseDepartment'), dashboardController.getPurchaseDashboard);
router.get('/qms', requireRole('QMS'), dashboardController.getQMSDashboard);

module.exports = router;
