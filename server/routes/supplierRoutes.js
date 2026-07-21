const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', authorize('suppliers:read'), supplierController.getAllSuppliers);
router.get('/:id', authorize('suppliers:read'), supplierController.getSupplierById);
router.post('/', authorize('suppliers:write'), supplierController.createSupplier);
router.put('/:id', authorize('suppliers:write'), supplierController.updateSupplier);
router.delete('/:id', authorize('suppliers:delete'), supplierController.deleteSupplier);

module.exports = router;
