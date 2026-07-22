const express = require('express');
const router = express.Router();
const storeRequestController = require('../controllers/storeRequestController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', authorize('requests:read'), storeRequestController.getAllRequests);
router.get('/:id', authorize('requests:read'), storeRequestController.getRequestById);
router.post('/', authorize('requests:create'), storeRequestController.createRequest);
router.put('/:id', authorize('requests:process'), storeRequestController.updateRequest);
router.patch('/:id/verify', authorize('requests:process'), storeRequestController.verifyRequest);
router.delete('/:id', authorize('requests:delete'), storeRequestController.deleteRequest);

module.exports = router;
