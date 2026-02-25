const db = require('../config/db');

const getAllInventory = async (req, res) => {
  try {
    const { category, search, active } = req.query;

    let query = `
      SELECT 
        m.material_id,
        m.material_code,
        m.material_name,
        m.material_type,
        m.category,
        m.unit_of_measurement,
        m.min_stock_level,
        m.max_stock_level,
        m.reorder_level,
        m.reorder_point,
        m.standard_cost,
        m.is_active,
        m.preferred_supplier,
        i.inventory_id,
        COALESCE(i.current_stock, m.current_stock, 0) as current_stock,
        COALESCE(i.available_stock, m.current_stock, 0) as available_stock,
        COALESCE(i.reserved_stock, 0) as reserved_stock,
        i.warehouse_location,
        i.last_stocked_at,
        i.updated_at
      FROM materials m
      LEFT JOIN inventory i ON m.material_id = i.material_id
      WHERE 1=1
    `;

    const params = [];

    if (active !== undefined) {
      query += ' AND m.is_active = ?';
      params.push(active === 'true' ? 1 : 0);
    }

    if (category) {
      query += ' AND m.category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (m.material_name LIKE ? OR m.material_code LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term);
    }

    query += ' ORDER BY m.material_name ASC';

    const [rows] = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory'
    });
  }
};

const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT 
        m.material_id,
        m.material_code,
        m.material_name,
        m.material_type,
        m.category,
        m.unit_of_measurement,
        m.min_stock_level,
        m.max_stock_level,
        m.reorder_level,
        m.reorder_point,
        m.is_active,
        i.inventory_id,
        COALESCE(i.current_stock, m.current_stock, 0) as current_stock,
        COALESCE(i.available_stock, m.current_stock, 0) as available_stock,
        COALESCE(i.reserved_stock, 0) as reserved_stock,
        i.warehouse_location,
        i.last_stocked_at,
        i.updated_at
      FROM materials m
      LEFT JOIN inventory i ON m.material_id = i.material_id
      WHERE i.inventory_id = ? OR m.material_id = ?
      LIMIT 1`,
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Get inventory by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory item'
    });
  }
};

const updateInventoryStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { materialId, currentStock, availableStock, reservedStock, warehouseLocation } = req.body;

    const [existing] = await db.query(
      'SELECT inventory_id, material_id FROM inventory WHERE inventory_id = ?',
      [id]
    );

    let inventoryId = id;
    let matId = materialId;

    if (existing.length === 0) {
      if (!materialId) {
        return res.status(400).json({
          success: false,
          message: 'materialId is required to create inventory'
        });
      }

      const [created] = await db.query(
        'INSERT INTO inventory (material_id, current_stock, available_stock, reserved_stock, warehouse_location) VALUES (?, ?, ?, ?, ?)',
        [
          materialId,
          currentStock ?? 0,
          availableStock ?? currentStock ?? 0,
          reservedStock ?? 0,
          warehouseLocation || null
        ]
      );

      inventoryId = created.insertId;
      matId = materialId;
    } else {
      matId = existing[0].material_id;
    }

    const updates = [];
    const values = [];

    if (currentStock !== undefined) {
      updates.push('current_stock = ?');
      values.push(currentStock);
    }

    if (availableStock !== undefined) {
      updates.push('available_stock = ?');
      values.push(availableStock);
    }

    if (reservedStock !== undefined) {
      updates.push('reserved_stock = ?');
      values.push(reservedStock);
    }

    if (warehouseLocation !== undefined) {
      updates.push('warehouse_location = ?');
      values.push(warehouseLocation);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(inventoryId);

      await db.query(
        `UPDATE inventory SET ${updates.join(', ')} WHERE inventory_id = ?`,
        values
      );
    }

    if (currentStock !== undefined) {
      await db.query(
        'UPDATE materials SET current_stock = ? WHERE material_id = ?',
        [currentStock, matId]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: { inventoryId }
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory'
    });
  }
};

const getInventoryHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const [inventoryRows] = await db.query(
      'SELECT material_id FROM inventory WHERE inventory_id = ? OR material_id = ? LIMIT 1',
      [id, id]
    );

    if (inventoryRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const materialId = inventoryRows[0].material_id;

    const [history] = await db.query(
      `SELECT sa.*, m.material_name, m.material_code, u.username as adjusted_by_name
       FROM stock_adjustments sa
       INNER JOIN materials m ON sa.material_id = m.material_id AND m.is_active = 1
       LEFT JOIN users u ON sa.adjusted_by = u.user_id
       WHERE sa.material_id = ?
       ORDER BY sa.adjusted_at DESC`,
      [materialId]
    );

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get inventory history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory history'
    });
  }
};

module.exports = {
  getAllInventory,
  getInventoryById,
  updateInventoryStock,
  getInventoryHistory
};
