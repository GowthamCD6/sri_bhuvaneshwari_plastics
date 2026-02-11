const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/admin', dashboardController.getAdminDashboard);
router.get('/store', dashboardController.getStoreDashboard);
router.get('/purchase', dashboardController.getPurchaseDashboard);
router.get('/qms', dashboardController.getQMSDashboard);

module.exports = router;
