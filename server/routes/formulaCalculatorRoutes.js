const express = require('express');
const {
  getAllCalculators,
  getDefaultCalculator,
  getCalculatorById,
  createCalculator,
  updateCalculator,
  deleteCalculator,
  createCalculatorRow,
  updateCalculatorRow,
  deleteCalculatorRow
} = require('../controllers/formulaCalculatorController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

// Read permissions
router.get('/default', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), getDefaultCalculator);
router.get('/', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), getAllCalculators);
router.get('/:id', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), getCalculatorById);

// Write permissions
router.post('/', requireRole('Admin', 'StoreOfficer'), createCalculator);
router.put('/:id', requireRole('Admin', 'StoreOfficer'), updateCalculator);
router.delete('/:id', requireRole('Admin', 'StoreOfficer'), deleteCalculator);

// Row permissions
router.post('/:id/rows', requireRole('Admin', 'StoreOfficer'), createCalculatorRow);
router.put('/:id/rows/:rowId', requireRole('Admin', 'StoreOfficer'), updateCalculatorRow);
router.delete('/:id/rows/:rowId', requireRole('Admin', 'StoreOfficer'), deleteCalculatorRow);

module.exports = router;
