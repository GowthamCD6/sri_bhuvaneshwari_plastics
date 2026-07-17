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
router.get('/purchase-dept', requireRole('PurchaseDepartment'), getPurchaseDeptIndents);
router.post('/purchase-dept', requireRole('PurchaseDepartment'), createPurchaseDeptIndent);

// ── General routes ─────────────────────────────────────────────────────────
router.get('/', requireRole('QMS', 'StoreOfficer', 'Admin', 'PurchaseDepartment', 'Accountant'), getAllIndents);
router.get('/admin/approvals', requireRole('Admin'), getAdminApprovals);
router.get('/:id', requireRole('QMS', 'StoreOfficer', 'Admin', 'PurchaseDepartment', 'Accountant'), getIndentById);
router.post('/', requireRole('QMS', 'PurchaseDepartment'), createIndent);
router.patch('/:id/status', requireRole('QMS', 'StoreOfficer', 'Admin', 'Accountant'), updateIndentStatus);
router.post('/:id/send-next', requireRole('QMS', 'StoreOfficer', 'Admin', 'Accountant'), sendToNextStage);
router.post('/:id/upload-po', requireRole('QMS', 'StoreOfficer'), upload.single('poFile'), uploadPOFile);
router.get('/:id/download-po', requireRole('QMS', 'StoreOfficer', 'Admin', 'PurchaseDepartment', 'Accountant'), downloadPOFile);
router.delete('/:id', requireRole('Admin', 'QMS'), deleteIndent);

module.exports = router;
