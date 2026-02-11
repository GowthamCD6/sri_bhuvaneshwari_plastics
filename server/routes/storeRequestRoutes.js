const express = require('express');
const router = express.Router();
const storeRequestController = require('../controllers/storeRequestController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', storeRequestController.getAllRequests);
router.get('/:id', storeRequestController.getRequestById);
router.post('/', storeRequestController.createRequest);
router.put('/:id', storeRequestController.updateRequest);
router.patch('/:id/verify', storeRequestController.verifyRequest);
router.delete('/:id', storeRequestController.deleteRequest);

module.exports = router;
