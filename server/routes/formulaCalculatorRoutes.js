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
const { verifyToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

// Read permissions
router.get('/default', authorize('formulas:read'), getDefaultCalculator);
router.get('/', authorize('formulas:read'), getAllCalculators);
router.get('/:id', authorize('formulas:read'), getCalculatorById);

// Write permissions
router.post('/', authorize('formulas:write'), createCalculator);
router.put('/:id', authorize('formulas:write'), updateCalculator);
router.delete('/:id', authorize('formulas:write'), deleteCalculator);

// Row permissions
router.post('/:id/rows', authorize('formulas:write'), createCalculatorRow);
router.put('/:id/rows/:rowId', authorize('formulas:write'), updateCalculatorRow);
router.delete('/:id/rows/:rowId', authorize('formulas:write'), deleteCalculatorRow);

module.exports = router;
