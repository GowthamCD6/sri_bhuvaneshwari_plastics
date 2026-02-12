const db = require('../config/db');

/**
 * Get all purchase indents with filters
 */
const getAllIndents = async (req, res) => {
  try {
    const { status, userId, workflowStage, search } = req.query;

    let query = `
      SELECT 
        pi.*,
        MAX(u.username) as requested_by_name,
        MAX(co.indent_id) as customer_order_indent_id,
        MAX(co.customer_name) as customer_name,
        COUNT(pim.indent_material_id) as total_materials
      FROM purchase_indents pi
      LEFT JOIN users u ON pi.requested_by = u.user_id
      LEFT JOIN customer_orders co ON pi.customer_order_id = co.order_id
      LEFT JOIN purchase_indent_materials pim ON pi.indent_id = pim.indent_id
      WHERE 1=1
    `;

    const params = [];

    if (status && status !== 'all') {
      query += ` AND pi.status = ?`;
      params.push(status);
    }

    if (workflowStage) {
      query += ` AND pi.workflow_stage = ?`;
      params.push(workflowStage);
    }

    if (userId) {
      query += ` AND pi.requested_by = ?`;
      params.push(userId);
    }

    if (search) {
      query += ` AND (pi.indent_number LIKE ? OR co.customer_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ` GROUP BY pi.indent_id ORDER BY pi.created_at DESC`;

    const [indents] = await db.query(query, params);

    // Get materials for each indent
    for (let indent of indents) {
      const [materials] = await db.query(
        'SELECT * FROM purchase_indent_materials WHERE indent_id = ?',
        [indent.indent_id]
      );
      console.log(`Indent ${indent.indent_number}: Found ${materials.length} materials`);
      indent.materials = materials;
    }

    res.status(200).json({
      success: true,
      data: indents
    });
  } catch (error) {
    console.error('Get indents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch indents'
    });
  }
};

/**
 * Get single indent by ID
 */
const getIndentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [indents] = await db.query(
      `SELECT 
        pi.*,
        u.username as requested_by_name,
        co.indent_id as customer_order_indent_id,
        co.customer_name,
        co.customer_phone,
        co.customer_email
      FROM purchase_indents pi
      LEFT JOIN users u ON pi.requested_by = u.user_id
      LEFT JOIN customer_orders co ON pi.customer_order_id = co.order_id
      WHERE pi.indent_id = ?`,
      [id]
    );

    if (indents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Indent not found'
      });
    }

    const indent = indents[0];

    // Get indent materials
    const [materials] = await db.query(
      'SELECT * FROM purchase_indent_materials WHERE indent_id = ? ORDER BY indent_material_id',
      [id]
    );

    console.log(`=== GET INDENT BY ID ===`);
    console.log(`Indent ID: ${id}, Indent Number: ${indent.indent_number}`);
    console.log(`Found ${materials.length} materials:`, materials.map(m => m.material_description));

    indent.materials = materials;

    // Get status history
    const [history] = await db.query(
      `SELECT 
        ish.*,
        u.username as changed_by_name
      FROM indent_status_history ish
      LEFT JOIN users u ON ish.changed_by = u.user_id
      WHERE ish.indent_id = ?
      ORDER BY ish.changed_at ASC`,
      [id]
    );

    indent.statusHistory = history;

    res.status(200).json({
      success: true,
      data: indent
    });
  } catch (error) {
    console.error('Get indent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch indent'
    });
  }
};

/**
 * Create new purchase indent
 */
const createIndent = async (req, res) => {
  try {
    const {
      indentNumber,
      customerOrderId,
      requestDate,
      requiredByDate,
      priority,
      workflowStage,
      status,
      poNumber,
      poReference,
      materials
    } = req.body;

    console.log('=== CREATE INDENT REQUEST ===');
    console.log('Indent Number:', indentNumber);
    console.log('Workflow Stage:', workflowStage);
    console.log('Status:', status);
    console.log('Materials count:', materials?.length);
    console.log('Materials data:', JSON.stringify(materials, null, 2));

    const userId = req.user.userId;

    // Validate required fields
    if (!indentNumber || !requestDate || !materials || materials.length === 0) {
      console.error('Validation failed - Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if indent_number already exists
    const [existing] = await db.query(
      'SELECT indent_id FROM purchase_indents WHERE indent_number = ?',
      [indentNumber]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Indent number already exists'
      });
    }

    // Insert purchase indent
    const [indentResult] = await db.query(
      `INSERT INTO purchase_indents 
        (indent_number, customer_order_id, requested_by, request_date, required_by_date, priority, status, workflow_stage, po_number, po_reference, order_quantity, rm_cost, rm_rate, pieces_per_kg, rm_percentage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        indentNumber, 
        customerOrderId || null, 
        userId, 
        requestDate, 
        requiredByDate, 
        priority || 'Standard',
        status || 'Draft',
        workflowStage || 'QMS Init',
        poNumber || null,
        poReference || null,
        req.body.orderQuantity || null,
        req.body.rmCost || null,
        req.body.rmRate || null,
        req.body.piecesPerKg || null,
        req.body.rmPercentage || null
      ]
    );

    const indentId = indentResult.insertId;

    console.log('Indent created with ID:', indentId);
    console.log('Inserting materials...');

    // Insert indent materials
    for (const material of materials) {
      console.log('Inserting material:', material.description);
      await db.query(
        `INSERT INTO purchase_indent_materials 
          (indent_id, material_description, quantity, unit_of_measurement, current_stock, required_stock, preferred_supplier, estimated_cost, specifications)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          indentId,
          material.description || material.material_description,
          material.quantity,
          material.unit || material.unit_of_measurement,
          material.currentStock || material.current_stock || 0,
          material.requiredStock || material.required_stock || 0,
          material.preferredSupplier || material.preferred_supplier,
          material.estimatedCost || material.estimated_cost || null,
          material.specifications || null
        ]
      );
    }

    console.log('All materials inserted successfully');

    // Log status history
    await db.query(
      `INSERT INTO indent_status_history 
        (indent_id, changed_by, new_status, workflow_stage, comments)
      VALUES (?, ?, 'Draft', 'QMS Init', 'Indent created')`,
      [indentId, userId]
    );

    // If linked to customer order, update order status
    if (customerOrderId) {
      await db.query(
        'UPDATE customer_orders SET status = ? WHERE order_id = ?',
        ['Pending Store Review', customerOrderId]
      );
    }

    // Fetch the created indent with materials
    const [newIndent] = await db.query(
      `SELECT pi.*, u.username as requested_by_name
       FROM purchase_indents pi
       LEFT JOIN users u ON pi.requested_by = u.user_id
       WHERE pi.indent_id = ?`,
      [indentId]
    );

    const [indentMaterials] = await db.query(
      'SELECT * FROM purchase_indent_materials WHERE indent_id = ?',
      [indentId]
    );

    newIndent[0].materials = indentMaterials;

    res.status(201).json({
      success: true,
      message: 'Purchase indent created successfully',
      data: newIndent[0]
    });
  } catch (error) {
    console.error('Create indent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create indent'
    });
  }
};

/**
 * Update indent status and workflow
 */
const updateIndentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, workflowStage, comments, storeOfficerNotes, qmsNotes, adminNotes, accountantNotes, poNumber, poReference, materials } = req.body;
    const userId = req.user.userId;

    // Get current indent
    const [indents] = await db.query(
      'SELECT status, workflow_stage FROM purchase_indents WHERE indent_id = ?',
      [id]
    );

    if (indents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Indent not found'
      });
    }

    const oldStatus = indents[0].status;
    const oldWorkflowStage = indents[0].workflow_stage;

    // Build update query
    let updateFields = [];
    let updateParams = [];

    if (status) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }

    if (workflowStage) {
      updateFields.push('workflow_stage = ?');
      updateParams.push(workflowStage);
    }

    if (poNumber !== undefined) {
      updateFields.push('po_number = ?');
      updateParams.push(poNumber);
    }

    if (poReference !== undefined) {
      updateFields.push('po_reference = ?');
      updateParams.push(poReference);
    }

    if (storeOfficerNotes !== undefined) {
      updateFields.push('store_officer_notes = ?');
      updateParams.push(storeOfficerNotes);
    }

    if (qmsNotes !== undefined) {
      updateFields.push('qms_notes = ?');
      updateParams.push(qmsNotes);
    }

    if (adminNotes !== undefined) {
      updateFields.push('admin_notes = ?');
      updateParams.push(adminNotes);
    }

    if (accountantNotes !== undefined) {
      updateFields.push('accountant_notes = ?');
      updateParams.push(accountantNotes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateParams.push(id);

    // Update indent
    await db.query(
      `UPDATE purchase_indents SET ${updateFields.join(', ')} WHERE indent_id = ?`,
      updateParams
    );

    // Update materials if provided
    if (materials && Array.isArray(materials) && materials.length > 0) {
      console.log('Updating materials for indent:', id);
      console.log('Materials received:', materials);
      
      // Delete existing materials
      await db.query(
        'DELETE FROM purchase_indent_materials WHERE indent_id = ?',
        [id]
      );
      
      // Insert new materials
      for (const material of materials) {
        await db.query(
          `INSERT INTO purchase_indent_materials 
            (indent_id, material_description, quantity, unit_of_measurement, current_stock, required_stock, preferred_supplier)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            material.description,
            material.quantity || material.requiredQuantity,
            material.unit || material.uom || 'kg',
            material.currentStock || material.onHand || '0',
            material.requiredStock || material.order || material.quantity,
            material.preferredSupplier || ''
          ]
        );
      }
      console.log(`Inserted ${materials.length} materials for indent ${id}`);
    }

    // Log status change
    await db.query(
      `INSERT INTO indent_status_history 
        (indent_id, changed_by, old_status, new_status, workflow_stage, comments)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, oldStatus, status || oldStatus, workflowStage || oldWorkflowStage, comments || null]
    );

    res.status(200).json({
      success: true,
      message: 'Indent updated successfully'
    });
  } catch (error) {
    console.error('Update indent status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update indent'
    });
  }
};

/**
 * Send indent to next workflow stage
 */
const sendToNextStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, poNumber, poReference, accountantNotes, materials } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.roleName;

    // Get current indent
    const [indents] = await db.query(
      'SELECT status, workflow_stage FROM purchase_indents WHERE indent_id = ?',
      [id]
    );

    if (indents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Indent not found'
      });
    }

    const currentStage = indents[0].workflow_stage;
    let newStatus, newStage;

    // Build update fields dynamically
    let updateFields = ['status = ?', 'workflow_stage = ?'];
    let updateParams = [];

    // Determine next stage based on current stage and user role
    switch (currentStage) {
      case 'QMS Init':
        // QMS submits initial form -> goes to Store Officer
        newStatus = 'Pending Store Review';
        newStage = 'Store Officer';
        break;
      case 'Store Officer':
        // Store Officer fills PO details -> goes back to QMS for verification
        if (userRole === 'StoreOfficer') {
          newStatus = 'Pending QMS Verification';
          newStage = 'QMS Verified';
          // Update PO fields from Store Officer
          console.log('=== STORE OFFICER SUBMITTING ===');
          console.log('PO Number received:', poNumber);
          console.log('PO Reference received:', poReference);
          console.log('Additional data:', { orderQuantity: req.body.orderQuantity, rmCost: req.body.rmCost, rmRate: req.body.rmRate });
          
          if (poNumber !== undefined) {
            updateFields.push('po_number = ?');
            updateParams.push(poNumber || null);
          }
          if (poReference !== undefined) {
            updateFields.push('po_reference = ?');
            updateParams.push(poReference || null);
          }
          if (req.body.orderQuantity !== undefined) {
            updateFields.push('order_quantity = ?');
            updateParams.push(req.body.orderQuantity || null);
          }
          if (req.body.rmCost !== undefined) {
            updateFields.push('rm_cost = ?');
            updateParams.push(req.body.rmCost || null);
          }
          if (req.body.rmRate !== undefined) {
            updateFields.push('rm_rate = ?');
            updateParams.push(req.body.rmRate || null);
          }
          if (req.body.piecesPerKg !== undefined) {
            updateFields.push('pieces_per_kg = ?');
            updateParams.push(req.body.piecesPerKg || null);
          }
          if (req.body.rmPercentage !== undefined) {
            updateFields.push('rm_percentage = ?');
            updateParams.push(req.body.rmPercentage || null);
          }
        }
        break;
      case 'QMS Verified':
        // QMS verifies Store Officer's work -> sends to Admin
        if (userRole === 'QMS') {
          newStatus = 'Pending Admin Approval';
          newStage = 'Admin';
        }
        break;
      case 'Admin':
        // Admin approves -> sends to Accountant
        if (userRole === 'Admin') {
          newStatus = 'Admin Approved';
          newStage = 'Accountant';
        }
        break;
      case 'Accountant':
        // Accountant completes
        newStatus = 'Completed';
        newStage = 'Completed';
        // Update accountant notes
        if (accountantNotes !== undefined) {
          updateFields.push('accountant_notes = ?');
          updateParams.push(accountantNotes);
        }
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid workflow stage'
        });
    }

    // Add status and stage to params at the beginning
    updateParams.unshift(newStatus, newStage);
    // Add timestamp and indent ID at the end
    updateFields.push('updated_at = NOW()');
    updateParams.push(id);

    // Update indent
    await db.query(
      `UPDATE purchase_indents SET ${updateFields.join(', ')} WHERE indent_id = ?`,
      updateParams
    );

    // Update materials if provided
    if (materials && Array.isArray(materials) && materials.length > 0) {
      console.log('Updating materials for indent:', id);
      console.log('Materials received:', materials);
      
      // Delete existing materials
      await db.query(
        'DELETE FROM purchase_indent_materials WHERE indent_id = ?',
        [id]
      );
      
      // Insert new materials
      for (const material of materials) {
        await db.query(
          `INSERT INTO purchase_indent_materials 
            (indent_id, material_description, quantity, unit_of_measurement, current_stock, required_stock, preferred_supplier)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            material.description,
            material.quantity || material.requiredQuantity,
            material.unit || material.uom || 'kg',
            material.currentStock || material.onHand || '0',
            material.requiredStock || material.order || material.quantity,
            material.preferredSupplier || ''
          ]
        );
      }
      console.log(`Inserted ${materials.length} materials for indent ${id}`);
    }

    // Update customer order status if linked
    const [indentInfo] = await db.query(
      'SELECT customer_order_id FROM purchase_indents WHERE indent_id = ?',
      [id]
    );
    
    if (indentInfo[0]?.customer_order_id) {
      let customerOrderStatus = 'Pending Store Review';
      
      // Map workflow stage to customer order status
      switch (newStage) {
        case 'Store Officer':
          customerOrderStatus = 'Pending Store Review';
          break;
        case 'QMS Verified':
          customerOrderStatus = 'Store Verified';
          break;
        case 'Admin':
          customerOrderStatus = 'Pending Admin Approval';
          break;
        case 'Accountant':
        case 'Completed':
          customerOrderStatus = 'Admin Approved';
          break;
      }
      
      await db.query(
        'UPDATE customer_orders SET status = ? WHERE order_id = ?',
        [customerOrderStatus, indentInfo[0].customer_order_id]
      );
    }

    // Log status change
    await db.query(
      `INSERT INTO indent_status_history 
        (indent_id, changed_by, old_status, new_status, workflow_stage, comments)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, indents[0].status, newStatus, newStage, comments || `Sent to ${newStage}`]
    );

    res.status(200).json({
      success: true,
      message: `Indent sent to ${newStage} successfully`,
      data: {
        newStatus,
        newStage
      }
    });
  } catch (error) {
    console.error('Send to next stage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send indent to next stage'
    });
  }
};

/**
 * Delete indent
 */
const deleteIndent = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM purchase_indents WHERE indent_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Indent not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Indent deleted successfully'
    });
  } catch (error) {
    console.error('Delete indent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete indent'
    });
  }
};

/**
 * Upload PO file for purchase indent
 */
const uploadPOFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Store relative path to file
    const filePath = `po-files/${req.file.filename}`;

    // Update indent with file path
    const [result] = await db.query(
      'UPDATE purchase_indents SET po_file_path = ? WHERE indent_id = ?',
      [filePath, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Indent not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'PO file uploaded successfully',
      data: {
        filePath: filePath,
        fileName: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Upload PO file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload PO file'
    });
  }
};

module.exports = {
  getAllIndents,
  getIndentById,
  createIndent,
  updateIndentStatus,
  sendToNextStage,
  deleteIndent,
  uploadPOFile
};
