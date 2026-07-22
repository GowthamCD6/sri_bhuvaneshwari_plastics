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
const { verifyToken, authorize, authorizeAny } = require('../middleware/authMiddleware');
const upload = require('../middleware/fileUpload');

// All routes require authentication
router.use(verifyToken);

// ── Purchase Department indent routes ─────────────────────────────────────
// GET  /api/purchase-indents/purchase-dept       – list all Purchase Dept indents
// POST /api/purchase-indents/purchase-dept       – create a new Purchase Dept indent
router.get('/purchase-dept', authorize('indents:read'), getPurchaseDeptIndents);
router.post('/purchase-dept', authorize('indents:create'), createPurchaseDeptIndent);

// ── General routes ─────────────────────────────────────────────────────────
router.get('/', authorize('indents:read'), getAllIndents);
router.get('/admin/approvals', authorize('dashboard:admin'), getAdminApprovals);
router.get('/:id', authorize('indents:read'), getIndentById);
router.post('/', authorize('indents:create'), createIndent);
router.patch('/:id/status', authorize('indents:process'), updateIndentStatus);
router.post('/:id/send-next', authorize('indents:process'), sendToNextStage);
router.post('/:id/upload-po', authorize('indents:process'), upload.single('poFile'), uploadPOFile);
router.get('/:id/download-po', authorize('indents:read'), downloadPOFile);
router.delete('/:id', authorize('indents:delete'), deleteIndent);

module.exports = router;
