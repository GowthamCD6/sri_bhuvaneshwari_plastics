const db = require('../config/db');

/**
 * Get all materials
 */
const getAllMaterials = async (req, res) => {
  const { type, category, active } = req.query;
  
  let query = 'SELECT * FROM materials WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND material_type = ?';
    params.push(type);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (active !== undefined) {
    query += ' AND is_active = ?';
    params.push(active === 'true' ? 1 : 0);
  }

  query += ' ORDER BY material_name ASC';

  try {
    const [results] = await db.query(query, params);
    res.status(200).json({ success: true, materials: results });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get material by ID
 */
const getMaterialById = async (req, res) => {
  const { materialId } = req.params;
  try {
    const [results] = await db.query('SELECT * FROM materials WHERE material_id = ?', [materialId]);
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    res.status(200).json({ success: true, material: results[0] });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Create new material
 */
const createMaterial = async (req, res) => {
  const {
    materialCode,
    materialName,
    materialType,
    category,
    description,
    unitOfMeasurement,
    standardCost,
    reorderLevel,
    reorderQuantity,
    minStockLevel,
    maxStockLevel,
    leadTimeDays,
    specifications,
    preferredSupplier,
    warehouseLocation,
    openingStock
  } = req.body;

  if (!materialCode || !materialName || !materialType || !unitOfMeasurement) {
    return res.status(400).json({
      success: false,
      message: 'Material code, name, type, and unit of measurement are required'
    });
  }

  try {
    const [existing] = await db.query(
      'SELECT material_id FROM materials WHERE material_code = ?',
      [materialCode]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Material with this code already exists' });
    }

    const specsJson = specifications ? JSON.stringify(specifications) : null;
    const initialStock = Number(openingStock) || 0;

    // Base fields — always present in every DB setup
    const fields = [
      'material_code', 'material_name', 'material_type', 'category', 'description',
      'unit_of_measurement', 'standard_cost', 'reorder_level', 'reorder_quantity',
      'min_stock_level', 'max_stock_level', 'lead_time_days', 'specifications',
      'current_stock', 'created_by'
    ];
    const values = [
      materialCode, materialName, materialType, category, description,
      unitOfMeasurement, standardCost || 0, reorderLevel || 0, reorderQuantity || 0,
      minStockLevel || 0, maxStockLevel || null, leadTimeDays || 0, specsJson,
      initialStock, req.user.userId
    ];

    let materialId;

    // Try INSERT with preferred_supplier first; if the column doesn't exist yet
    // (migration not run), fall back to INSERT without it
    try {
      const tryFields = preferredSupplier ? [...fields, 'preferred_supplier'] : fields;
      const tryValues = preferredSupplier ? [...values, preferredSupplier] : values;
      const placeholders = tryFields.map(() => '?').join(', ');
      const [result] = await db.query(
        `INSERT INTO materials (${tryFields.join(', ')}) VALUES (${placeholders})`,
        tryValues
      );
      materialId = result.insertId;
    } catch (insErr) {
      // ER_BAD_FIELD_ERROR means preferred_supplier column doesn't exist yet — retry without it
      if (insErr.code === 'ER_BAD_FIELD_ERROR' || insErr.errno === 1054) {
        console.warn('preferred_supplier column not found — inserting without it. Run storofficer_missing_columns.sql to add it.');
        const placeholders = fields.map(() => '?').join(', ');
        const [result] = await db.query(
          `INSERT INTO materials (${fields.join(', ')}) VALUES (${placeholders})`,
          values
        );
        materialId = result.insertId;
      } else {
        throw insErr;
      }
    }

    // Insert inventory row (warehouse_location lives here) — separate try/catch so it
    // never blocks the material creation response
    try {
      await db.query(
        `INSERT INTO inventory (material_id, current_stock, available_stock, reserved_stock, warehouse_location)
         VALUES (?, ?, ?, 0, ?)`,
        [materialId, initialStock, initialStock, warehouseLocation || null]
      );
    } catch (invErr) {
      if (invErr.code === 'ER_DUP_ENTRY' || invErr.errno === 1062) {
        // Row already exists — update it
        await db.query(
          `UPDATE inventory
           SET current_stock = ?, available_stock = ?, warehouse_location = ?
           WHERE material_id = ?`,
          [initialStock, initialStock, warehouseLocation || null, materialId]
        );
      } else {
        console.error('Warning: inventory row creation failed:', invErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      materialId
    });
  } catch (err) {
    console.error('Error creating material:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create material' });
  }
};

/**
 * Update material
 */
const updateMaterial = async (req, res) => {
  const { materialId } = req.params;
  const updates = [];
  const values = [];

  const allowedFields = [
    'material_name', 'material_type', 'category', 'description',
    'unit_of_measurement', 'standard_cost', 'reorder_level', 'reorder_quantity',
    'min_stock_level', 'max_stock_level', 'lead_time_days', 'is_active',
    'specifications', 'preferred_supplier'
  ];

  allowedFields.forEach(field => {
    const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    if (req.body[camelField] !== undefined) {
      updates.push(`${field} = ?`);
      if (field === 'specifications') {
        values.push(JSON.stringify(req.body[camelField]));
      } else {
        values.push(req.body[camelField]);
      }
    }
  });

  if (updates.length === 0 && req.body.warehouseLocation === undefined) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  try {
    if (updates.length > 0) {
      const materialValues = [...values, materialId];
      const [result] = await db.query(
        `UPDATE materials SET ${updates.join(', ')} WHERE material_id = ?`,
        materialValues
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Material not found' });
      }
    }

    // Update warehouse_location in inventory table if provided
    if (req.body.warehouseLocation !== undefined) {
      const [invCheck] = await db.query(
        'SELECT inventory_id FROM inventory WHERE material_id = ?',
        [materialId]
      );
      if (invCheck.length > 0) {
        await db.query(
          'UPDATE inventory SET warehouse_location = ? WHERE material_id = ?',
          [req.body.warehouseLocation, materialId]
        );
      } else {
        await db.query(
          'INSERT INTO inventory (material_id, warehouse_location, current_stock) VALUES (?, ?, 0)',
          [materialId, req.body.warehouseLocation]
        );
      }
    }

    res.status(200).json({ success: true, message: 'Material updated successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Delete material
 */
const deleteMaterial = async (req, res) => {
  const { materialId } = req.params;
  try {
    // Soft-delete: set is_active = 0
    // Hard DELETE fails when stock_adjustments references this material (ON DELETE RESTRICT).
    // Soft delete hides the material from all active queries without breaking history.
    const [result] = await db.query(
      'UPDATE materials SET is_active = 0 WHERE material_id = ?',
      [materialId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    res.status(200).json({ success: true, message: 'Material deleted successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get low stock materials
 * Returns all materials where effective stock <= reorder_level
 */
const getLowStockMaterials = async (req, res) => {
  const query = `
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
      COALESCE(i.current_stock, m.current_stock, 0)   AS current_stock,
      COALESCE(i.available_stock, m.current_stock, 0) AS available_stock,
      COALESCE(i.reserved_stock, 0)                   AS reserved_stock,
      i.warehouse_location,
      i.last_stocked_at
    FROM materials m
    LEFT JOIN inventory i ON m.material_id = i.material_id
    WHERE m.is_active = 1
      AND COALESCE(i.available_stock, m.current_stock, 0) <= COALESCE(m.reorder_level, m.min_stock_level, 0)
    ORDER BY COALESCE(i.available_stock, m.current_stock, 0) ASC
  `;
  try {
    const [results] = await db.query(query);
    res.status(200).json({ success: true, materials: results });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getLowStockMaterials
};
