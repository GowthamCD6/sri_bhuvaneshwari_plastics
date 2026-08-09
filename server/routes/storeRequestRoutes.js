const express = require('express');
const router = express.Router();
const storeRequestController = require('../controllers/storeRequestController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS'), storeRequestController.getAllRequests);
router.get('/:id', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS'), storeRequestController.getRequestById);
router.post('/', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS'), storeRequestController.createRequest);
router.put('/:id', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS'), storeRequestController.updateRequest);
router.patch('/:id/verify', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS'), storeRequestController.verifyRequest);
router.delete('/:id', requireRole('Admin'), storeRequestController.deleteRequest);

module.exports = router;
