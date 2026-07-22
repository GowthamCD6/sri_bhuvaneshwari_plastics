const db = require('../config/db');

const getAllSuppliers = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM suppliers ORDER BY supplier_name ASC'
    );

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers'
    });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT * FROM suppliers WHERE supplier_id = ? OR supplier_name = ? LIMIT 1',
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier'
    });
  }
};

const createSupplier = async (req, res) => {
  try {
    const {
      supplierName,
      contactPerson,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      gstin,
      category,
      rating
    } = req.body;

    if (!supplierName) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name is required'
      });
    }

    const [result] = await db.query(
      `INSERT INTO suppliers
        (supplier_name, contact_person, phone, email, address, city, state, pincode, gstin, category, rating, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        supplierName,
        contactPerson || null,
        phone || null,
        email || null,
        address || null,
        city || null,
        state || null,
        pincode || null,
        gstin || null,
        category || null,
        rating || 0
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: { supplierId: result.insertId }
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create supplier'
    });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const fields = [
      'supplier_name',
      'contact_person',
      'phone',
      'email',
      'address',
      'city',
      'state',
      'pincode',
      'gstin',
      'category',
      'rating',
      'total_orders',
      'last_order_date',
      'is_active'
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

    values.push(id);

    const [result] = await db.query(
      `UPDATE suppliers SET ${updates.join(', ')} WHERE supplier_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update supplier'
    });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM suppliers WHERE supplier_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete supplier'
    });
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
