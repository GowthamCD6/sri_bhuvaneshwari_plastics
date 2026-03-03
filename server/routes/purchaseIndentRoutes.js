const express = require('express');
const router = express.Router();
const {
  getAdminApprovals,
  getAllIndents,
  getIndentById,
  createIndent,
  updateIndentStatus,
  sendToNextStage,
  deleteIndent,
  uploadPOFile,
  downloadPOFile
} = require('../controllers/purchaseIndentController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/fileUpload');

// All routes require authentication
router.use(verifyToken);

// Get all indents (with filters)
router.get('/', getAllIndents);

// Admin approvals feed (QMS -> Admin final verification)
router.get('/admin/approvals', requireRole('Admin'), getAdminApprovals);

// Get single indent
router.get('/:id', getIndentById);

// Create new indent
router.post('/', createIndent);

// Update indent status/workflow
router.patch('/:id/status', updateIndentStatus);

// Send indent to next workflow stage
router.post('/:id/send-next', sendToNextStage);

// Upload PO file
router.post('/:id/upload-po', upload.single('poFile'), uploadPOFile);

// Download PO file
router.get('/:id/download-po', downloadPOFile);

// Delete indent
router.delete('/:id', deleteIndent);

module.exports = router;
