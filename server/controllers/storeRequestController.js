const db = require('../config/db');

const generateRequestNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(100 + Math.random() * 900);
  return `MR-${year}-${rand}`;
};

const getAllRequests = async (req, res) => {
  try {
    const { status, priority, search, requestedBy } = req.query;

    let query = `
      SELECT sr.*, u.username as requested_by_name, d.dept_name
      FROM store_requests sr
      LEFT JOIN users u ON sr.requested_by = u.user_id
      LEFT JOIN departments d ON sr.dept_id = d.dept_id
      WHERE 1=1
    `;

    const params = [];

    if (status && status !== 'all') {
      query += ' AND sr.status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND sr.priority = ?';
      params.push(priority);
    }

    if (requestedBy) {
      query += ' AND sr.requested_by = ?';
      params.push(requestedBy);
    }

    if (search) {
      query += ' AND (sr.request_number LIKE ? OR sr.material_name LIKE ? OR sr.material_code LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY sr.created_at DESC';

    const [rows] = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Get store requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store requests'
    });
  }
};

const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT sr.*, u.username as requested_by_name, d.dept_name
       FROM store_requests sr
       LEFT JOIN users u ON sr.requested_by = u.user_id
       LEFT JOIN departments d ON sr.dept_id = d.dept_id
       WHERE sr.request_id = ? OR sr.request_number = ?`,
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Get store request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store request'
    });
  }
};

const createRequest = async (req, res) => {
  try {
    const {
      requestNumber,
      deptId,
      itemType,
      materialId,
      materialCode,
      materialName,
      color,
      specs,
      quantity,
      unitOfMeasurement,
      neededByDate,
      reason,
      priority,
      storageLocation,
      requestDate
    } = req.body;

    if (!materialName || !quantity || !unitOfMeasurement) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const userId = req.user.userId;
    const reqNumber = requestNumber || generateRequestNumber();

    const [result] = await db.query(
      `INSERT INTO store_requests
        (request_number, requested_by, dept_id, item_type, material_id, material_code, material_name, color, specs, quantity, unit_of_measurement, needed_by_date, reason, priority, status, storage_location, request_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
      [
        reqNumber,
        userId,
        deptId || null,
        itemType || null,
        materialId || null,
        materialCode || null,
        materialName,
        color || null,
        specs || null,
        quantity,
        unitOfMeasurement,
        neededByDate || null,
        reason || null,
        priority || 'Normal',
        storageLocation || null,
        requestDate || new Date()
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Store request created successfully',
      data: { requestId: result.insertId, requestNumber: reqNumber }
    });
  } catch (error) {
    console.error('Create store request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create store request'
    });
  }
};

const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const fields = [
      'dept_id',
      'item_type',
      'material_id',
      'material_code',
      'material_name',
      'color',
      'specs',
      'quantity',
      'unit_of_measurement',
      'needed_by_date',
      'reason',
      'priority',
      'status',
      'storage_location',
      'indent_id',
      'remarks'
    ];

    const updates = [];
    const values = [];

    fields.forEach(field => {
      const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (req.body[camelField] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[camelField]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const [result] = await db.query(
      `UPDATE store_requests SET ${updates.join(', ')} WHERE request_id = ? OR request_number = ?`,
      [...values, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Store request updated successfully'
    });
  } catch (error) {
    console.error('Update store request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store request'
    });
  }
};

const verifyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const [result] = await db.query(
      'UPDATE store_requests SET status = ?, remarks = ?, processed_at = NOW(), updated_at = NOW() WHERE request_id = ? OR request_number = ?',
      [status, remarks || null, id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Store request status updated'
    });
  } catch (error) {
    console.error('Verify store request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store request status'
    });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM store_requests WHERE request_id = ? OR request_number = ?',
      [id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Store request deleted successfully'
    });
  } catch (error) {
    console.error('Delete store request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete store request'
    });
  }
};

module.exports = {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  verifyRequest,
  deleteRequest
};
