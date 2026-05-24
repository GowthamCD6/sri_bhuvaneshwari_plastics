const pool = require('../config/db');
const { calculateAllValues } = require('../utils/formulaCalculations');

let formulaTablesReady = false;
let formulaTablesReadyPromise = null;

const addColumnIfMissing = async (tableName, columnName, definition) => {
  const [existing] = await pool.query(
    `SELECT 1
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );

  if (existing.length === 0) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
  }
};

const ensureFormulaTables = async () => {
  if (formulaTablesReady) return;
  if (formulaTablesReadyPromise) {
    await formulaTablesReadyPromise;
    return;
  }

  formulaTablesReadyPromise = (async () => {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS formula_calculators (
        calculator_id INT PRIMARY KEY AUTO_INCREMENT,
        calculator_name VARCHAR(100) NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT FALSE,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_is_default (is_default)
      )`
    );

    await pool.query(
      `CREATE TABLE IF NOT EXISTS formula_calculator_rows (
        row_id INT PRIMARY KEY AUTO_INCREMENT,
        calculator_id INT NOT NULL,
        part_name VARCHAR(200) NOT NULL,
        raw_material VARCHAR(100),
        cavity DECIMAL(10,2),
        no_of_gravity DECIMAL(10,2),
        component_weight DECIMAL(10,4),
        runner_weight DECIMAL(10,4),
        required_per_month DECIMAL(12,2),
        rate_per_kg DECIMAL(12,4),
        rate_per_piece DECIMAL(12,4),
        total_component_weight DECIMAL(14,6),
        shot_weight DECIMAL(14,6),
        process_loss DECIMAL(14,6),
        total_shot_weight DECIMAL(14,6),
        pieces_per_kg DECIMAL(14,6),
        ppu_per_kg DECIMAL(14,6),
        runner_return_per_piece DECIMAL(14,6),
        amount DECIMAL(14,6),
        raw_material_cost_per_component DECIMAL(14,6),
        raw_material_for_total_qty DECIMAL(14,6),
        rm_percentage DECIMAL(14,6),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_calculator (calculator_id)
      )`
    );

    await addColumnIfMissing('formula_calculator_rows', 'no_of_gravity', 'no_of_gravity DECIMAL(10,2)');
    await addColumnIfMissing('formula_calculator_rows', 'rate_per_piece', 'rate_per_piece DECIMAL(12,4)');
    await addColumnIfMissing('formula_calculator_rows', 'total_component_weight', 'total_component_weight DECIMAL(14,6)');
    await addColumnIfMissing('formula_calculator_rows', 'shot_weight', 'shot_weight DECIMAL(14,6)');
    await addColumnIfMissing('formula_calculator_rows', 'process_loss', 'process_loss DECIMAL(14,6)');
    await addColumnIfMissing('formula_calculator_rows', 'total_shot_weight', 'total_shot_weight DECIMAL(14,6)');
    await addColumnIfMissing('formula_calculator_rows', 'pieces_per_kg', 'pieces_per_kg DECIMAL(14,6)');
    await addColumnIfMissing('formula_calculator_rows', 'ppu_per_kg', 'ppu_per_kg DECIMAL(14,6)');
    await addColumnIfMissing('formula_calculator_rows', 'runner_return_per_piece', 'runner_return_per_piece DECIMAL(14,6)');
    await addColumnIfMissing('formula_calculator_rows', 'amount', 'amount DECIMAL(14,6)');
    await addColumnIfMissing('formula_calculator_rows', 'raw_material_cost_per_component', 'raw_material_cost_per_component DECIMAL(14,6)');
    await addColumnIfMissing('formula_calculator_rows', 'raw_material_for_total_qty', 'raw_material_for_total_qty DECIMAL(14,6)');
    await addColumnIfMissing('formula_calculator_rows', 'rm_percentage', 'rm_percentage DECIMAL(14,6)');

    formulaTablesReady = true;
  })();

  try {
    await formulaTablesReadyPromise;
  } catch (error) {
    formulaTablesReadyPromise = null;
    throw error;
  }
};

const getCalculatedPayload = (data = {}) => {
  const cavity = data.cavity ?? data.noOfCavity;
  const componentWeight = data.component_weight ?? data.componentWeight;
  const runnerWeight = data.runner_weight ?? data.runnerWeight ?? data.runnerWeightPerShot;
  const requiredPerMonth = data.required_per_month ?? data.requiredPerMonth ?? data.requirementPerMonth;
  const ratePerPiece = data.rate_per_piece ?? data.ratePerPiece;
  const rawMaterialCostPerKg = data.raw_material_cost_per_kg ?? data.rawMaterialCostPerKg ?? data.rate_per_kg ?? data.ratePerKg;

  const calculated = calculateAllValues({
    componentWeight,
    noOfCavity: cavity,
    runnerWeightPerShot: runnerWeight,
    requirementPerMonth: requiredPerMonth,
    ratePerPiece,
    rawMaterialCostPerKg,
  });

  return {
    cavity: calculated.noOfCavity,
    no_of_gravity: calculated.noOfCavity,
    component_weight: calculated.componentWeight,
    runner_weight: calculated.runnerWeightPerShot,
    required_per_month: calculated.requirementPerMonth,
    rate_per_kg: calculated.rawMaterialCostPerKg,
    rate_per_piece: calculated.ratePerPiece,
    total_component_weight: calculated.totalComponentWeight,
    shot_weight: calculated.shotWeight,
    process_loss: calculated.processLoss,
    total_shot_weight: calculated.totalShotWeight,
    pieces_per_kg: calculated.piecesPerKg,
    ppu_per_kg: calculated.ppuPerKg,
    runner_return_per_piece: calculated.runnerReturnPerPiece,
    amount: calculated.amount,
    raw_material_cost_per_component: calculated.rawMaterialCostPerComponent,
    raw_material_for_total_qty: calculated.rawMaterialForTotalQty,
    rm_percentage: calculated.rmPercentage,
  };
};

// Get all formula calculators
const getAllCalculators = async (req, res) => {
  try {
    await ensureFormulaTables();
    const [calculators] = await pool.query(
      `SELECT 
        fc.calculator_id,
        fc.calculator_name,
        fc.description,
        fc.is_default,
        fc.created_by,
        u.username as created_by_name,
        fc.created_at,
        fc.updated_at,
        COUNT(fcr.row_id) as row_count
      FROM formula_calculators fc
      LEFT JOIN users u ON fc.created_by = u.user_id
      LEFT JOIN formula_calculator_rows fcr ON fc.calculator_id = fcr.calculator_id
      GROUP BY fc.calculator_id
      ORDER BY fc.is_default DESC, fc.updated_at DESC`
    );
    res.json(calculators);
  } catch (error) {
    console.error('Error fetching calculators:', error);
    res.status(500).json({ error: 'Error fetching calculators' });
  }
};

// Get default calculator
const getDefaultCalculator = async (req, res) => {
  const emptyDefault = {
    calculator_id: null,
    calculator_name: 'Default Calculator',
    rows: []
  };

  try {
    await ensureFormulaTables();
    const [calculators] = await pool.query(
      `SELECT fc.calculator_id, fc.calculator_name
      FROM formula_calculators fc
      WHERE fc.is_default = TRUE
      LIMIT 1`
    );

    // If no default calculator exists yet, return an empty default payload.
    // This keeps the frontend functional without forcing DB writes here.
    if (calculators.length === 0) {
      return res.json(emptyDefault);
    }

    const calculatorId = calculators[0].calculator_id;

    // Fetch rows for this calculator
    const [rows] = await pool.query(
      `SELECT * FROM formula_calculator_rows 
      WHERE calculator_id = ? 
      ORDER BY row_id`,
      [calculatorId]
    );

    res.json({
      calculator_id: calculatorId,
      calculator_name: calculators[0]?.calculator_name || emptyDefault.calculator_name,
      rows: rows || []
    });
  } catch (error) {
    console.error('Error fetching default calculator:', error);
    // Never block UI load from this endpoint; return a safe empty payload.
    return res.status(200).json(emptyDefault);
  }
};

// Get calculator by ID with all rows
const getCalculatorById = async (req, res) => {
  try {
    await ensureFormulaTables();
    const { id } = req.params;
    
    const [calculators] = await pool.query(
      `SELECT * FROM formula_calculators WHERE calculator_id = ?`,
      [id]
    );
    
    if (calculators.length === 0) {
      return res.status(404).json({ error: 'Calculator not found' });
    }

    const [rows] = await pool.query(
      `SELECT * FROM formula_calculator_rows 
      WHERE calculator_id = ? 
      ORDER BY row_id`,
      [id]
    );

    res.json({
      ...calculators[0],
      rows
    });
  } catch (error) {
    console.error('Error fetching calculator:', error);
    res.status(500).json({ error: 'Error fetching calculator' });
  }
};

// Create new calculator
const createCalculator = async (req, res) => {
  try {
    await ensureFormulaTables();
    const { calculator_name, description, is_default, rows } = req.body;
    const created_by = req.user?.user_id || req.userId;

    if (!calculator_name) {
      return res.status(400).json({ error: 'Calculator name is required' });
    }

    // If marking as default, unset other defaults
    if (is_default) {
      await pool.query(
        `UPDATE formula_calculators SET is_default = FALSE WHERE is_default = TRUE`
      );
    }

    const [result] = await pool.query(
      `INSERT INTO formula_calculators (calculator_name, description, is_default, created_by)
      VALUES (?, ?, ?, ?)`,
      [calculator_name, description || null, is_default || false, created_by]
    );

    const calculatorId = result.insertId;

    // Insert rows if provided
    if (rows && Array.isArray(rows)) {
      for (const row of rows) {
        const calculated = getCalculatedPayload({
          cavity: row.cavity,
          no_of_gravity: row.noOfGravity || row.no_of_gravity,
          component_weight: row.componentWeight || row.component_weight,
          runner_weight: row.runnerWeight || row.runner_weight,
          required_per_month: row.requiredPerMonth || row.required_per_month,
          rate_per_piece: row.ratePerPiece || row.rate_per_piece,
          raw_material_cost_per_kg: row.rawMaterialCostPerKg || row.raw_material_cost_per_kg,
          rate_per_kg: row.ratePerKg || row.rate_per_kg,
        });

        await pool.query(
          `INSERT INTO formula_calculator_rows 
          (calculator_id, part_name, raw_material, cavity, no_of_gravity, component_weight,
          runner_weight, required_per_month, rate_per_kg, rate_per_piece,
          total_component_weight, shot_weight, process_loss, total_shot_weight,
          pieces_per_kg, ppu_per_kg, runner_return_per_piece, amount,
          raw_material_cost_per_component, raw_material_for_total_qty, rm_percentage)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            calculatorId,
            row.partName || row.part_name,
            row.rawMaterial || row.raw_material,
            calculated.cavity,
            calculated.no_of_gravity,
            calculated.component_weight,
            calculated.runner_weight,
            calculated.required_per_month,
            calculated.rate_per_kg,
            calculated.rate_per_piece,
            calculated.total_component_weight,
            calculated.shot_weight,
            calculated.process_loss,
            calculated.total_shot_weight,
            calculated.pieces_per_kg,
            calculated.ppu_per_kg,
            calculated.runner_return_per_piece,
            calculated.amount,
            calculated.raw_material_cost_per_component,
            calculated.raw_material_for_total_qty,
            calculated.rm_percentage
          ]
        );
      }
    }

    res.status(201).json({
      calculator_id: calculatorId,
      calculator_name,
      description,
      is_default,
      created_by,
      rows: rows || []
    });
  } catch (error) {
    console.error('Error creating calculator:', error);
    res.status(500).json({ error: 'Error creating calculator' });
  }
};

// Update calculator
const updateCalculator = async (req, res) => {
  try {
    await ensureFormulaTables();
    const { id } = req.params;
    const { calculator_name, description, is_default, rows } = req.body;

    // If marking as default, unset other defaults
    if (is_default) {
      await pool.query(
        `UPDATE formula_calculators SET is_default = FALSE WHERE is_default = TRUE AND calculator_id != ?`,
        [id]
      );
    }

    await pool.query(
      `UPDATE formula_calculators 
      SET calculator_name = ?, description = ?, is_default = ?
      WHERE calculator_id = ?`,
      [calculator_name, description || null, is_default || false, id]
    );

    // Delete existing rows and insert new ones
    if (rows && Array.isArray(rows)) {
      await pool.query(
        `DELETE FROM formula_calculator_rows WHERE calculator_id = ?`,
        [id]
      );

      for (const row of rows) {
        const calculated = getCalculatedPayload({
          cavity: row.cavity,
          no_of_gravity: row.noOfGravity || row.no_of_gravity,
          component_weight: row.componentWeight || row.component_weight,
          runner_weight: row.runnerWeight || row.runner_weight,
          required_per_month: row.requiredPerMonth || row.required_per_month,
          rate_per_piece: row.ratePerPiece || row.rate_per_piece,
          raw_material_cost_per_kg: row.rawMaterialCostPerKg || row.raw_material_cost_per_kg,
          rate_per_kg: row.ratePerKg || row.rate_per_kg,
        });

        await pool.query(
          `INSERT INTO formula_calculator_rows 
          (calculator_id, part_name, raw_material, cavity, no_of_gravity, component_weight,
          runner_weight, required_per_month, rate_per_kg, rate_per_piece,
          total_component_weight, shot_weight, process_loss, total_shot_weight,
          pieces_per_kg, ppu_per_kg, runner_return_per_piece, amount,
          raw_material_cost_per_component, raw_material_for_total_qty, rm_percentage)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            row.partName || row.part_name,
            row.rawMaterial || row.raw_material,
            calculated.cavity,
            calculated.no_of_gravity,
            calculated.component_weight,
            calculated.runner_weight,
            calculated.required_per_month,
            calculated.rate_per_kg,
            calculated.rate_per_piece,
            calculated.total_component_weight,
            calculated.shot_weight,
            calculated.process_loss,
            calculated.total_shot_weight,
            calculated.pieces_per_kg,
            calculated.ppu_per_kg,
            calculated.runner_return_per_piece,
            calculated.amount,
            calculated.raw_material_cost_per_component,
            calculated.raw_material_for_total_qty,
            calculated.rm_percentage
          ]
        );
      }
    }

    res.json({ 
      message: 'Calculator updated successfully',
      calculator_id: id
    });
  } catch (error) {
    console.error('Error updating calculator:', error);
    res.status(500).json({ error: 'Error updating calculator' });
  }
};

// Delete calculator
const deleteCalculator = async (req, res) => {
  try {
    await ensureFormulaTables();
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM formula_calculators WHERE calculator_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Calculator not found' });
    }

    res.json({ message: 'Calculator deleted successfully' });
  } catch (error) {
    console.error('Error deleting calculator:', error);
    res.status(500).json({ error: 'Error deleting calculator' });
  }
};

// Update row in calculator
const createCalculatorRow = async (req, res) => {
  try {
    await ensureFormulaTables();
    const { id } = req.params;
    const { part_name, raw_material } = req.body;
    const calculated = getCalculatedPayload(req.body);

    const [result] = await pool.query(
      `INSERT INTO formula_calculator_rows
      (calculator_id, part_name, raw_material, cavity, no_of_gravity, component_weight,
      runner_weight, required_per_month, rate_per_kg, rate_per_piece,
      total_component_weight, shot_weight, process_loss, total_shot_weight,
      pieces_per_kg, ppu_per_kg, runner_return_per_piece, amount,
      raw_material_cost_per_component, raw_material_for_total_qty, rm_percentage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        id,
        part_name,
        raw_material,
        calculated.cavity,
        calculated.no_of_gravity,
        calculated.component_weight,
        calculated.runner_weight,
        calculated.required_per_month,
        calculated.rate_per_kg,
        calculated.rate_per_piece,
        calculated.total_component_weight,
        calculated.shot_weight,
        calculated.process_loss,
        calculated.total_shot_weight,
        calculated.pieces_per_kg,
        calculated.ppu_per_kg,
        calculated.runner_return_per_piece,
        calculated.amount,
        calculated.raw_material_cost_per_component,
        calculated.raw_material_for_total_qty,
        calculated.rm_percentage,
      ]
    );

    res.status(201).json({
      message: 'Row created successfully',
      row_id: result.insertId,
      calculated
    });
  } catch (error) {
    console.error('Error creating row:', error);
    res.status(500).json({ error: 'Error creating row' });
  }
};

// Update row in calculator
const updateCalculatorRow = async (req, res) => {
  try {
    await ensureFormulaTables();
    const { rowId } = req.params;
    const { part_name, raw_material } = req.body;
    const calculated = getCalculatedPayload(req.body);

    const [result] = await pool.query(
      `UPDATE formula_calculator_rows 
      SET part_name = ?, raw_material = ?, cavity = ?, no_of_gravity = ?, component_weight = ?,
          runner_weight = ?, required_per_month = ?, rate_per_kg = ?, rate_per_piece = ?,
          total_component_weight = ?, shot_weight = ?, process_loss = ?, total_shot_weight = ?,
          pieces_per_kg = ?, ppu_per_kg = ?, runner_return_per_piece = ?, amount = ?,
          raw_material_cost_per_component = ?, raw_material_for_total_qty = ?, rm_percentage = ?
      WHERE row_id = ?`,
      [
        part_name,
        raw_material,
        calculated.cavity,
        calculated.no_of_gravity,
        calculated.component_weight,
        calculated.runner_weight,
        calculated.required_per_month,
        calculated.rate_per_kg,
        calculated.rate_per_piece,
        calculated.total_component_weight,
        calculated.shot_weight,
        calculated.process_loss,
        calculated.total_shot_weight,
        calculated.pieces_per_kg,
        calculated.ppu_per_kg,
        calculated.runner_return_per_piece,
        calculated.amount,
        calculated.raw_material_cost_per_component,
        calculated.raw_material_for_total_qty,
        calculated.rm_percentage,
        rowId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Row not found for update' });
    }

    res.json({ message: 'Row updated successfully', calculated });
  } catch (error) {
    console.error('Error updating row:', error);
    res.status(500).json({ error: 'Error updating row' });
  }
};

// Delete row from calculator
const deleteCalculatorRow = async (req, res) => {
  try {
    await ensureFormulaTables();
    const { id, rowId } = req.params;

    const [result] = await pool.query(
      `DELETE FROM formula_calculator_rows WHERE row_id = ? AND calculator_id = ?`,
      [rowId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Row not found' });
    }

    res.json({ message: 'Row deleted successfully' });
  } catch (error) {
    console.error('Error deleting row:', error);
    res.status(500).json({ error: 'Error deleting row' });
  }
};

module.exports = {
  getAllCalculators,
  getDefaultCalculator,
  getCalculatorById,
  createCalculator,
  updateCalculator,
  deleteCalculator,
  createCalculatorRow,
  updateCalculatorRow,
  deleteCalculatorRow
};
