const db = require('../config/db');

const getAllAdjustments = async (req, res) => {
  try {
    const { materialId, type, search } = req.query;

    let query = `
      SELECT sa.*, m.material_name, m.material_code, u.username as adjusted_by_name
      FROM stock_adjustments sa
      LEFT JOIN materials m ON sa.material_id = m.material_id
      LEFT JOIN users u ON sa.adjusted_by = u.user_id
      WHERE 1=1
    `;

    const params = [];

    if (materialId) {
      query += ' AND sa.material_id = ?';
      params.push(materialId);
    }

    if (type) {
      query += ' AND sa.adjustment_type = ?';
      params.push(type.toUpperCase());
    }

    if (search) {
      query += ' AND (m.material_name LIKE ? OR m.material_code LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term);
    }

    query += ' ORDER BY sa.adjusted_at DESC';

    const [rows] = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Get stock adjustments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock adjustments'
    });
  }
};

const getAdjustmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT sa.*, m.material_name, m.material_code, u.username as adjusted_by_name
       FROM stock_adjustments sa
       LEFT JOIN materials m ON sa.material_id = m.material_id
       LEFT JOIN users u ON sa.adjusted_by = u.user_id
       WHERE sa.adjustment_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Adjustment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Get adjustment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch adjustment'
    });
  }
};

const createAdjustment = async (req, res) => {
  try {
    const {
      materialId,
      adjustmentType,
      quantity,
      unitOfMeasurement,
      reason,
      notes
    } = req.body;

    if (!materialId || !adjustmentType || !quantity || !unitOfMeasurement || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const type = adjustmentType.toUpperCase();
    if (!['IN', 'OUT'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid adjustment type'
      });
    }

    const userId = req.user.userId;

    const [inventoryRows] = await db.query(
      'SELECT inventory_id, current_stock FROM inventory WHERE material_id = ? LIMIT 1',
      [materialId]
    );

    let currentStock = 0;

    if (inventoryRows.length > 0) {
      currentStock = Number(inventoryRows[0].current_stock || 0);
    } else {
      const [materialRows] = await db.query(
        'SELECT current_stock FROM materials WHERE material_id = ? LIMIT 1',
        [materialId]
      );
      currentStock = Number(materialRows[0]?.current_stock || 0);

      await db.query(
        'INSERT INTO inventory (material_id, current_stock, available_stock, reserved_stock) VALUES (?, ?, ?, 0)',
        [materialId, currentStock, currentStock]
      );
    }

    const qty = Number(quantity);
    const newStock = type === 'IN' ? currentStock + qty : Math.max(0, currentStock - qty);

    await db.query(
      'UPDATE inventory SET current_stock = ?, available_stock = ?, updated_at = NOW() WHERE material_id = ?',
      [newStock, newStock, materialId]
    );

    await db.query(
      'UPDATE materials SET current_stock = ? WHERE material_id = ?',
      [newStock, materialId]
    );

    const [result] = await db.query(
      `INSERT INTO stock_adjustments
        (material_id, adjustment_type, quantity, unit_of_measurement, previous_stock, new_stock, reason, notes, adjusted_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [materialId, type, qty, unitOfMeasurement, currentStock, newStock, reason, notes || null, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Stock adjustment created successfully',
      data: { adjustmentId: result.insertId, previousStock: currentStock, newStock }
    });
  } catch (error) {
    console.error('Create stock adjustment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stock adjustment'
    });
  }
};

module.exports = {
  getAllAdjustments,
  getAdjustmentById,
  createAdjustment
};
