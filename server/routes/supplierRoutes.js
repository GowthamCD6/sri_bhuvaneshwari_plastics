const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), supplierController.getAllSuppliers);
router.get('/:id', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), supplierController.getSupplierById);
router.post('/', requireRole('Admin', 'PurchaseDepartment'), supplierController.createSupplier);
router.put('/:id', requireRole('Admin', 'PurchaseDepartment'), supplierController.updateSupplier);
router.delete('/:id', requireRole('Admin'), supplierController.deleteSupplier);

module.exports = router;
