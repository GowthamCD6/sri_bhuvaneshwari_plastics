const express = require('express');
const router = express.Router();
const {
  getAdminApprovals,
  getAllIndents,
  getIndentById,
  createIndent,
  createPurchaseDeptIndent,
  getPurchaseDeptIndents,
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

// ── Purchase Department indent routes ─────────────────────────────────────
// GET  /api/purchase-indents/purchase-dept       – list all Purchase Dept indents
// POST /api/purchase-indents/purchase-dept       – create a new Purchase Dept indent
router.get('/purchase-dept', getPurchaseDeptIndents);
router.post('/purchase-dept', createPurchaseDeptIndent);

// ── General routes ─────────────────────────────────────────────────────────
router.get('/', getAllIndents);
router.get('/admin/approvals', requireRole('Admin'), getAdminApprovals);
router.get('/:id', getIndentById);
router.post('/', createIndent);
router.patch('/:id/status', updateIndentStatus);
router.post('/:id/send-next', sendToNextStage);
router.post('/:id/upload-po', upload.single('poFile'), uploadPOFile);
router.get('/:id/download-po', downloadPOFile);
router.delete('/:id', deleteIndent);

module.exports = router;
