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

const router = express.Router();

// Get default calculator - NO auth required
router.get('/default', getDefaultCalculator);

// Get all calculators
router.get('/', getAllCalculators);

// Get calculator by ID
router.get('/:id', getCalculatorById);

// Create new calculator
router.post('/', createCalculator);

// Update calculator
router.put('/:id', updateCalculator);

// Delete calculator
router.delete('/:id', deleteCalculator);

// Create row in calculator
router.post('/:id/rows', createCalculatorRow);

// Update row in calculator
router.put('/:id/rows/:rowId', updateCalculatorRow);

// Delete row from calculator
router.delete('/:id/rows/:rowId', deleteCalculatorRow);

module.exports = router;
