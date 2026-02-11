const db = require('../config/db');

/**
 * Get all materials
 */
const getAllMaterials = (req, res) => {
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

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }

    res.status(200).json({
      success: true,
      materials: results
    });
  });
};

/**
 * Get material by ID
 */
const getMaterialById = (req, res) => {
  const { materialId } = req.params;

  const query = 'SELECT * FROM materials WHERE material_id = ?';

  db.query(query, [materialId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    res.status(200).json({
      success: true,
      material: results[0]
    });
  });
};

/**
 * Create new material
 */
const createMaterial = (req, res) => {
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
    specifications
  } = req.body;

  // Validation
  if (!materialCode || !materialName || !materialType || !unitOfMeasurement) {
    return res.status(400).json({
      success: false,
      message: 'Material code, name, type, and unit of measurement are required'
    });
  }

  // Check if material code exists
  const checkQuery = 'SELECT material_id FROM materials WHERE material_code = ?';
  
  db.query(checkQuery, [materialCode], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }

    if (results.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Material with this code already exists'
      });
    }

    const insertQuery = `
      INSERT INTO materials (
        material_code, material_name, material_type, category, description,
        unit_of_measurement, standard_cost, reorder_level, reorder_quantity,
        min_stock_level, max_stock_level, lead_time_days, specifications, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const specsJson = specifications ? JSON.stringify(specifications) : null;

    db.query(insertQuery, [
      materialCode,
      materialName,
      materialType,
      category,
      description,
      unitOfMeasurement,
      standardCost || 0,
      reorderLevel || 0,
      reorderQuantity || 0,
      minStockLevel || 0,
      maxStockLevel,
      leadTimeDays || 0,
      specsJson,
      req.user.userId
    ], (insertErr, result) => {
      if (insertErr) {
        console.error('Error inserting material:', insertErr);
        return res.status(500).json({
          success: false,
          message: 'Failed to create material'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Material created successfully',
        materialId: result.insertId
      });
    });
  });
};

/**
 * Update material
 */
const updateMaterial = (req, res) => {
  const { materialId } = req.params;
  const updates = [];
  const values = [];

  const allowedFields = [
    'material_name', 'material_type', 'category', 'description',
    'unit_of_measurement', 'standard_cost', 'reorder_level', 'reorder_quantity',
    'min_stock_level', 'max_stock_level', 'lead_time_days', 'is_active', 'specifications'
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

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No fields to update'
    });
  }

  values.push(materialId);

  const updateQuery = `UPDATE materials SET ${updates.join(', ')} WHERE material_id = ?`;

  db.query(updateQuery, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Material updated successfully'
    });
  });
};

/**
 * Delete material
 */
const deleteMaterial = (req, res) => {
  const { materialId } = req.params;

  const deleteQuery = 'DELETE FROM materials WHERE material_id = ?';

  db.query(deleteQuery, [materialId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Material deleted successfully'
    });
  });
};

/**
 * Get low stock materials
 */
const getLowStockMaterials = (req, res) => {
  const query = `
    SELECT m.*, i.current_stock, i.available_stock
    FROM materials m
    LEFT JOIN inventory i ON m.material_id = i.material_id
    WHERE m.is_active = 1 
    AND (i.available_stock <= m.reorder_level OR i.available_stock IS NULL)
    ORDER BY i.available_stock ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }

    res.status(200).json({
      success: true,
      materials: results
    });
  });
};

module.exports = {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getLowStockMaterials
};
