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
    // Get total orders count
    const [[orders]] = await db.query('SELECT COUNT(*) as count FROM customer_orders');
    
    // Get pending store review count
    const [[pendingStore]] = await db.query("SELECT COUNT(*) as count FROM purchase_indents WHERE status = 'Pending Store Review'");
    
    // Get pending admin approval count
    const [[pendingAdmin]] = await db.query("SELECT COUNT(*) as count FROM purchase_indents WHERE status = 'Pending Admin Approval'");
    
    // Get pending purchase dept verification count
    const [[pendingPurchaseDept]] = await db.query("SELECT COUNT(*) as count FROM purchase_indents WHERE customer_order_id IS NULL AND workflow_stage = 'QMS Init'");
    
    // Get urgent/high priority orders count
    const [[urgentOrders]] = await db.query("SELECT COUNT(*) as count FROM purchase_indents WHERE priority IN ('urgent', 'high', 'Urgent', 'High')");
    
    // Get completed orders count
    const [[completedOrders]] = await db.query("SELECT COUNT(*) as count FROM purchase_indents WHERE status IN ('Completed', 'completed', 'Approved')");
    
    // Get orders created today
    const [[todayOrders]] = await db.query("SELECT COUNT(*) as count FROM customer_orders WHERE DATE(created_at) = CURDATE()");

    res.status(200).json({
      success: true,
      data: {
        orders: orders.count || 0,
        pendingStore: pendingStore.count || 0,
        pendingAdmin: pendingAdmin.count || 0,
        pendingPurchaseDept: pendingPurchaseDept.count || 0,
        urgentOrders: urgentOrders.count || 0,
        completedOrders: completedOrders.count || 0,
        todayOrders: todayOrders.count || 0
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
