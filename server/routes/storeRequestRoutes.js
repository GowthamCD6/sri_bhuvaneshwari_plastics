const express = require('express');
const router = express.Router();
const storeRequestController = require('../controllers/storeRequestController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', requireRole('StoreOfficer', 'PurchaseDepartment', 'Admin', 'QMS'), storeRequestController.getAllRequests);
router.get('/:id', requireRole('StoreOfficer', 'PurchaseDepartment', 'Admin', 'QMS'), storeRequestController.getRequestById);
router.post('/', requireRole('StoreOfficer'), storeRequestController.createRequest);
router.put('/:id', requireRole('StoreOfficer', 'PurchaseDepartment', 'Admin'), storeRequestController.updateRequest);
router.patch('/:id/verify', requireRole('PurchaseDepartment', 'Admin'), storeRequestController.verifyRequest);
router.delete('/:id', requireRole('StoreOfficer', 'Admin'), storeRequestController.deleteRequest);

module.exports = router;
