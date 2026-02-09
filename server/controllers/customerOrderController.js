const db = require('../config/db');

/**
 * Get all customer orders with filters
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, userId, search } = req.query;

    let query = `
      SELECT 
        co.*,
        u.username as created_by_name,
        COUNT(coi.item_id) as total_items
      FROM customer_orders co
      LEFT JOIN users u ON co.created_by = u.user_id
      LEFT JOIN customer_order_items coi ON co.order_id = coi.order_id
      WHERE 1=1
    `;

    const params = [];

    if (status && status !== 'all') {
      query += ` AND co.status = ?`;
      params.push(status);
    }

    if (userId) {
      query += ` AND co.created_by = ?`;
      params.push(userId);
    }

    if (search) {
      query += ` AND (co.indent_id LIKE ? OR co.customer_name LIKE ? OR co.customer_email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` GROUP BY co.order_id ORDER BY co.created_at DESC`;

    const [orders] = await db.query(query, params);

    // Get items for each order
    for (let order of orders) {
      const [items] = await db.query(
        'SELECT * FROM customer_order_items WHERE order_id = ?',
        [order.order_id]
      );
      order.orderItems = items;
    }

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

/**
 * Get single order by ID
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await db.query(
      `SELECT 
        co.*,
        u.username as created_by_name,
        c.customer_name as customer_full_name,
        c.address as customer_address
      FROM customer_orders co
      LEFT JOIN users u ON co.created_by = u.user_id
      LEFT JOIN customers c ON co.customer_id = c.customer_id
      WHERE co.order_id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // Get order items
    const [items] = await db.query(
      'SELECT * FROM customer_order_items WHERE order_id = ? ORDER BY item_id',
      [id]
    );

    order.orderItems = items;

    // Get status history
    const [history] = await db.query(
      `SELECT 
        osh.*,
        u.username as changed_by_name
      FROM order_status_history osh
      LEFT JOIN users u ON osh.changed_by = u.user_id
      WHERE osh.order_id = ?
      ORDER BY osh.changed_at DESC`,
      [id]
    );

    order.statusHistory = history;

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
};

/**
 * Create new customer order
 */
const createOrder = async (req, res) => {
  try {
    const {
      indent_id,
      customer_name,
      customer_phone,
      customer_email,
      indent_date,
      items,
      priority,
      notes
    } = req.body;

    const userId = req.user.userId;

    // Validate required fields
    if (!indent_id || !customer_name || !indent_date || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if indent_id already exists
    const [existing] = await db.query(
      'SELECT order_id FROM customer_orders WHERE indent_id = ?',
      [indent_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Indent ID already exists'
      });
    }

    // Insert customer order
    const [orderResult] = await db.query(
      `INSERT INTO customer_orders 
        (indent_id, customer_name, customer_phone, customer_email, indent_date, created_by, priority, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Draft')`,
      [indent_id, customer_name, customer_phone, customer_email, indent_date, userId, priority || 'Standard', notes]
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of items) {
      await db.query(
        `INSERT INTO customer_order_items 
          (order_id, component_name, quantity, required_by_date, notes)
        VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.component, item.quantity, item.required_by_date, item.notes || null]
      );
    }

    // Log status history
    await db.query(
      `INSERT INTO order_status_history 
        (order_id, changed_by, new_status, comments)
      VALUES (?, ?, 'Draft', 'Order created')`,
      [orderId, userId]
    );

    // Fetch the created order with items
    const [newOrder] = await db.query(
      `SELECT co.*, u.username as created_by_name
       FROM customer_orders co
       LEFT JOIN users u ON co.created_by = u.user_id
       WHERE co.order_id = ?`,
      [orderId]
    );

    const [orderItems] = await db.query(
      'SELECT * FROM customer_order_items WHERE order_id = ?',
      [orderId]
    );

    newOrder[0].orderItems = orderItems;

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: newOrder[0]
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
};

/**
 * Update order status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const userId = req.user.userId;

    // Get current order
    const [orders] = await db.query(
      'SELECT status FROM customer_orders WHERE order_id = ?',
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = orders[0].status;

    // Update order status
    await db.query(
      'UPDATE customer_orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
      [status, id]
    );

    // Log status change
    await db.query(
      `INSERT INTO order_status_history 
        (order_id, changed_by, old_status, new_status, comments)
      VALUES (?, ?, ?, ?, ?)`,
      [id, userId, oldStatus, status, comments || null]
    );

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

/**
 * Update order details
 */
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, customerPhone, customerEmail, priority, notes } = req.body;

    const [result] = await db.query(
      `UPDATE customer_orders 
       SET customer_name = ?, customer_phone = ?, customer_email = ?, priority = ?, notes = ?, updated_at = NOW()
       WHERE order_id = ?`,
      [customerName, customerPhone, customerEmail, priority, notes, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order'
    });
  }
};

/**
 * Delete order
 */
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM customer_orders WHERE order_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order'
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder
};
