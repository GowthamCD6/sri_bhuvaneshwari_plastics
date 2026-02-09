const express = require('express');
const router = express.Router();
const {
  getAllIndents,
  getIndentById,
  createIndent,
  updateIndentStatus,
  sendToNextStage,
  deleteIndent
} = require('../controllers/purchaseIndentController');
const { verifyToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Get all indents (with filters)
router.get('/', getAllIndents);

// Get single indent
router.get('/:id', getIndentById);

// Create new indent
router.post('/', createIndent);

// Update indent status/workflow
router.patch('/:id/status', updateIndentStatus);

// Send indent to next workflow stage
router.post('/:id/send-next', sendToNextStage);

// Delete indent
router.delete('/:id', deleteIndent);

module.exports = router;
