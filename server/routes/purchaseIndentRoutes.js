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
router.get('/purchase-dept', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), getPurchaseDeptIndents);
router.post('/purchase-dept', requireRole('Admin', 'PurchaseDepartment'), createPurchaseDeptIndent);

// ── General routes ─────────────────────────────────────────────────────────
router.get('/', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), getAllIndents);
router.get('/admin/approvals', requireRole('Admin'), getAdminApprovals);
router.get('/:id', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), getIndentById);
router.post('/', requireRole('Admin', 'PurchaseDepartment', 'QMS'), createIndent);
router.patch('/:id/status', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), updateIndentStatus);
router.post('/:id/send-next', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), sendToNextStage);
router.post('/:id/upload-po', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), upload.single('poFile'), uploadPOFile);
router.get('/:id/download-po', requireRole('Admin', 'StoreOfficer', 'PurchaseDepartment', 'QMS', 'Accountant'), downloadPOFile);
router.delete('/:id', requireRole('Admin'), deleteIndent);

module.exports = router;
