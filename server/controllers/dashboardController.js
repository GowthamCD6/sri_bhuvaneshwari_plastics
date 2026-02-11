const db = require('../config/db');

const getAdminDashboard = async (req, res) => {
  try {
    const [[usersCount]] = await db.query('SELECT COUNT(*) as count FROM users');
    const [[pendingIndents]] = await db.query("SELECT COUNT(*) as count FROM purchase_indents WHERE status = 'Pending Admin Approval'");
    const [[activeSuppliers]] = await db.query('SELECT COUNT(*) as count FROM suppliers WHERE is_active = 1');

    res.status(200).json({
      success: true,
      data: {
        users: usersCount.count,
        pendingIndents: pendingIndents.count,
        activeSuppliers: activeSuppliers.count
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard'
    });
  }
};

const getStoreDashboard = async (req, res) => {
  try {
    const [[lowStock]] = await db.query(
      `SELECT COUNT(*) as count
       FROM materials m
       LEFT JOIN inventory i ON m.material_id = i.material_id
       WHERE m.is_active = 1 AND (COALESCE(i.available_stock, m.current_stock, 0) <= m.reorder_level)`
    );

    const [[pendingIndents]] = await db.query(
      "SELECT COUNT(*) as count FROM purchase_indents WHERE workflow_stage = 'Store Officer'"
    );

    const [[pendingRequests]] = await db.query(
      "SELECT COUNT(*) as count FROM store_requests WHERE status = 'Pending'"
    );

    res.status(200).json({
      success: true,
      data: {
        lowStock: lowStock.count,
        pendingIndents: pendingIndents.count,
        pendingRequests: pendingRequests.count
      }
    });
  } catch (error) {
    console.error('Store dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store dashboard'
    });
  }
};

const getPurchaseDashboard = async (req, res) => {
  try {
    const [[pendingRequests]] = await db.query(
      "SELECT COUNT(*) as count FROM store_requests WHERE status = 'Pending'"
    );

    const [[processedRequests]] = await db.query(
      "SELECT COUNT(*) as count FROM store_requests WHERE status = 'Processed'"
    );

    const [[suppliers]] = await db.query('SELECT COUNT(*) as count FROM suppliers');

    res.status(200).json({
      success: true,
      data: {
        pendingRequests: pendingRequests.count,
        processedRequests: processedRequests.count,
        suppliers: suppliers.count
      }
    });
  } catch (error) {
    console.error('Purchase dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase dashboard'
    });
  }
};

const getQMSDashboard = async (req, res) => {
  try {
    const [[orders]] = await db.query('SELECT COUNT(*) as count FROM customer_orders');
    const [[pendingStore]] = await db.query("SELECT COUNT(*) as count FROM purchase_indents WHERE status = 'Pending Store Review'");
    const [[pendingAdmin]] = await db.query("SELECT COUNT(*) as count FROM purchase_indents WHERE status = 'Pending Admin Approval'");

    res.status(200).json({
      success: true,
      data: {
        orders: orders.count,
        pendingStore: pendingStore.count,
        pendingAdmin: pendingAdmin.count
      }
    });
  } catch (error) {
    console.error('QMS dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch QMS dashboard'
    });
  }
};

module.exports = {
  getAdminDashboard,
  getStoreDashboard,
  getPurchaseDashboard,
  getQMSDashboard
};
