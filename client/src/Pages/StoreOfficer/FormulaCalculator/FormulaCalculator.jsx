import React, { useMemo, useState, useEffect } from 'react';
import { Plus, Factory, Weight, Droplets, BadgeIndianRupee, ChevronLeft, ChevronRight, X, Trash2, Edit, FileText, Search } from 'lucide-react';
import formulaCalculatorService from '../../../services/formulaCalculatorService';
import './FormulaCalculator.css';
// import { MdOutlineAutoDelete } from "react-icons/md";


const toNumber = (value) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(/,/g, ''));
  if (!Number.isFinite(parsed)) return 0;
  // Stabilize floating point imprecision by rounding to 6 decimal places
  return Math.round(parsed * 1e6) / 1e6;
};

const calculateAllValues = (data = {}) => {
  const componentWeight = toNumber(data.componentWeight);
  const noOfCavity = toNumber(data.noOfCavity);
  const runnerWeightPerShot = toNumber(data.runnerWeightPerShot);
  const requirementPerMonth = toNumber(data.requirementPerMonth);
  const ratePerPiece = toNumber(data.ratePerPiece);
  const rawMaterialCostPerKg = toNumber(data.rawMaterialCostPerKg);

  const totalComponentWeight = componentWeight * noOfCavity;
  const shotWeight = (componentWeight * noOfCavity) + runnerWeightPerShot;
  const processLoss = shotWeight * 0.02;
  const totalShotWeight = shotWeight + processLoss;
  const piecesPerKg = totalShotWeight > 0 ? (1000 * noOfCavity) / totalShotWeight : 0;
  const ppuPerKg = totalShotWeight > 0 ? (1000 / totalShotWeight) * noOfCavity : 0;
  const runnerReturnPerPiece = noOfCavity > 0 ? runnerWeightPerShot / noOfCavity : 0;
  const amount = requirementPerMonth * ratePerPiece;
  const rawMaterialCostPerComponent = noOfCavity > 0
    ? (totalShotWeight * rawMaterialCostPerKg) / (noOfCavity * 1000)
    : 0;
  const rawMaterialForTotalQty = ppuPerKg > 0 ? requirementPerMonth / ppuPerKg : 0;
  const rmPercentage = ratePerPiece > 0 ? rawMaterialCostPerComponent / ratePerPiece : 0;

  return {
    totalComponentWeight,
    shotWeight,
    processLoss,
    totalShotWeight,
    piecesPerKg,
    ppuPerKg,
    runnerReturnPerPiece,
    amount,
    rawMaterialCostPerComponent,
    rawMaterialForTotalQty,
    rmPercentage,
  };
};

const EMPTY_ROW = {
  databaseId: null,
  partName: '',
  rawMaterial: '',
  cavity: '',
  componentWeight: '',
  runnerWeight: '',
  requiredPerMonth: '',
  ratePerKg: '',
  ratePerPiece: '',
};

let rowIdCounter = 0;

const createRow = (data = {}) => {
  const uniqueId = `row-${++rowIdCounter}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return {
    ...EMPTY_ROW,
    ...data,
    id: uniqueId, // Always set ID last to ensure it's never overwritten
  };
};

const sortRowsAlphabetically = (rows) =>
  [...rows].sort((a, b) =>
    String(a.partName || '').trim().localeCompare(String(b.partName || '').trim(), undefined, {
      sensitivity: 'base',
    })
  );

const formatNumber = (value, digits = 2) => {
  const num = toNumber(value);
  if (!Number.isFinite(num)) return '0';

  return num.toLocaleString('en-IN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
};

const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

const isSameRowData = (existingRow, incoming) =>
  normalizeText(existingRow.partName) === normalizeText(incoming.partName) &&
  normalizeText(existingRow.rawMaterial) === normalizeText(incoming.rawMaterial);

const formatFormulaLabel = (label = '') => {
  const raw = String(label || '').trim();
  if (!raw) return '';

  // Handle uppercase strings without spaces (e.g. TOTALCOMPONENTWEIGHT)
  if (/^[A-Z0-9_]+$/.test(raw) && !raw.includes(' ')) {
    const spaced = raw
      .replace(/_/g, ' ')
      .replace(
        /(TOTAL|COMPONENT|WEIGHT|PROCESS|LOSS|SHOT|PIECES|PER|KG|RUNNER|RETURN|PIECE|RAW|MATERIAL|COST|FOR|QTY|MONTH|AMOUNT|RATE|PPU|RM|PERCENTAGE)/g,
        ' $1'
      )
      .replace(/\s+/g, ' ')
      .trim();

    return spaced || raw;
  }

  // Handle camelCase / PascalCase labels
  return raw
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim();
};

const generateDummyRows = () => {
  const rows = [];
  
  // Use the product data with all values
  PRODUCT_DATA.forEach((product) => {
    rows.push(
      createRow({
        partName: product.partName,
        rawMaterial: product.rawMaterial,
        cavity: product.cavity,
        componentWeight: product.componentWeight,
        runnerWeight: product.runnerWeight,
        requiredPerMonth: product.requiredPerMonth,
        ratePerKg: product.ratePerKg,
      })
    );
  });
  
  return rows;
};

const FormulaCalculator = () => {
  const [rows, setRows] = useState([]);
  const [calculatorId, setCalculatorId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFormulasModal, setShowFormulasModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isClosingDetailsPanel, setIsClosingDetailsPanel] = useState(false);
  const [isClosingEditModal, setIsClosingEditModal] = useState(false);
  const [isClosingFormulasModal, setIsClosingFormulasModal] = useState(false);
  const [isClosingAddModal, setIsClosingAddModal] = useState(false);
  const [rowTooltip, setRowTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    partName: '',
    rawMaterial: '',
    cavity: '',
    componentWeight: '',
    runnerWeight: '',
    requiredPerMonth: '',
    ratePerKg: '',
    ratePerPiece: '',
  });
  const [editPanelData, setEditPanelData] = useState({
    partName: '',
    rawMaterial: '',
    cavity: '',
    componentWeight: '',
    runnerWeight: '',
    requiredPerMonth: '',
    ratePerKg: '',
    ratePerPiece: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [editPanelErrors, setEditPanelErrors] = useState({});
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [isUpdatingRow, setIsUpdatingRow] = useState(false);
  const [isDeletingRow, setIsDeletingRow] = useState(false);
  const rowsPerPage = 5;

  const reloadRowsFromServer = async () => {
    const data = await formulaCalculatorService.getDefaultCalculator();

    if (data?.calculator_id) {
      setCalculatorId(data.calculator_id);
    }

    if (data && data.rows && data.rows.length > 0) {
      const convertedRows = data.rows.map((row) =>
        createRow({
          databaseId: row.row_id,
          partName: row.part_name || '',
          rawMaterial: row.raw_material || '',
          cavity: row.cavity ? row.cavity.toString() : '',
          componentWeight: row.component_weight ? row.component_weight.toString() : '0.75',
          runnerWeight: row.runner_weight ? row.runner_weight.toString() : '0.15',
          requiredPerMonth: row.required_per_month ? row.required_per_month.toString() : '500',
          ratePerKg: row.rate_per_kg ? row.rate_per_kg.toString() : '100',
          ratePerPiece: row.rate_per_piece != null ? row.rate_per_piece.toString() : '',
          totalComponentWeight: row.total_component_weight,
          shotWeight: row.shot_weight,
          processLoss: row.process_loss,
          totalShotWeight: row.total_shot_weight,
          piecesPerKg: row.pieces_per_kg,
          ppuPerKg: row.ppu_per_kg,
          runnerReturnPerPiece: row.runner_return_per_piece,
          amount: row.amount != null ? toNumber(row.amount) : undefined,
          rawMaterialCostPerComponent: row.raw_material_cost_per_component,
          rawMaterialForTotalQty: row.raw_material_for_total_qty,
          rmPercentage: row.rm_percentage,
        })
      );

      setRows(sortRowsAlphabetically(convertedRows));
      return;
    }

    setRows([]);
  };

  // Load default calculator from database on component mount
  useEffect(() => {
    const loadDefaultCalculator = async () => {
      try {
        setLoading(true);
        await reloadRowsFromServer();
        setError(null);
      } catch (err) {
        // Keep table empty on load error
        setRows([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    loadDefaultCalculator();
  }, []);

  useEffect(() => {
    if (!actionMessage) return undefined;

    const timer = setTimeout(() => {
      setActionMessage(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [actionMessage]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;

      if (showFormulasModal) {
        setIsClosingFormulasModal(true);
        return;
      }

      if (showEditModal) {
        setIsClosingEditModal(true);
        return;
      }

      if (showAddModal) {
        setIsClosingAddModal(true);
        return;
      }

      if (selectedRow) {
        setIsClosingDetailsPanel(true);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showFormulasModal, showEditModal, showAddModal, selectedRow]);

  const updateRow = (index, field, value) => {
    setRows((currentRows) =>
      currentRows.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  };

  const addRow = () => {
    setIsClosingAddModal(false);
    setShowAddModal(true);
    setFormData({
      partName: '',
      rawMaterial: '',
      cavity: '',
      componentWeight: '',
      runnerWeight: '',
      requiredPerMonth: '',
      ratePerKg: '',
      ratePerPiece: '',
    });
    setFormErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.partName.trim()) errors.partName = 'Part Name is required';
    if (!formData.rawMaterial.trim()) errors.rawMaterial = 'Raw Material is required';
    if (!formData.cavity.trim()) errors.cavity = 'Cavity is required';
    if (!formData.componentWeight.trim()) errors.componentWeight = 'Component Weight is required';
    if (!formData.runnerWeight.trim()) errors.runnerWeight = 'Runner Weight is required';
    if (!formData.requiredPerMonth.trim()) errors.requiredPerMonth = 'Required Per Month is required';
    if (!formData.ratePerKg.trim()) errors.ratePerKg = 'Rate Per Kg is required';
    if (!formData.ratePerPiece.trim()) errors.ratePerPiece = 'Rate Per Piece is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const ensureCalculator = async () => {
    if (calculatorId) return calculatorId;

    const created = await formulaCalculatorService.createCalculator({
      calculator_name: 'Default Calculator',
      description: 'Default formula calculator for store officer',
      is_default: true,
      rows: [],
    });

    setCalculatorId(created.calculator_id);
    return created.calculator_id;
  };

  const handleAddRowSubmit = async () => {
    if (!validateForm()) return;
    if (isAddingRow) return;

    const duplicateExists = rows.some((row) => isSameRowData(row, formData));
    if (duplicateExists) {
      setActionMessage({ type: 'danger', text: 'Same row data already exists.' });
      return;
    }

    try {
      setIsAddingRow(true);
      const activeCalculatorId = await ensureCalculator();

      const payload = {
        part_name: formData.partName,
        raw_material: formData.rawMaterial,
        cavity: toNumber(formData.cavity),
        component_weight: toNumber(formData.componentWeight),
        runner_weight: toNumber(formData.runnerWeight),
        required_per_month: toNumber(formData.requiredPerMonth),
        rate_per_kg: toNumber(formData.ratePerKg),
        raw_material_cost_per_kg: toNumber(formData.ratePerKg),
        rate_per_piece: toNumber(formData.ratePerPiece),
      };

      const createdRow = await formulaCalculatorService.createCalculatorRow(activeCalculatorId, payload);

      setRows((currentRows) =>
        sortRowsAlphabetically([
          ...currentRows,
          createRow({
            ...formData,
            databaseId: createdRow.row_id,
            ...(createdRow.calculated || {}),
          }),
        ])
      );
      setCurrentPage(1);
      setIsClosingAddModal(true);
      setError(null);
      setActionMessage({ type: 'success', text: 'Row added successfully.' });
    } catch (err) {
      setError('Failed to add row. Please try again.');
      setActionMessage({ type: 'danger', text: 'Failed to add row.' });
    } finally {
      setIsAddingRow(false);
    }
  };

  const handleCloseModal = () => {
    setIsClosingAddModal(true);
  };

  const handleAddModalAnimationEnd = () => {
    if (isClosingAddModal) {
      setShowAddModal(false);
      setIsClosingAddModal(false);
      setFormData({
        partName: '',
        rawMaterial: '',
        cavity: '',
        componentWeight: '',
        runnerWeight: '',
        requiredPerMonth: '',
        ratePerKg: '',
        ratePerPiece: '',
      });
      setFormErrors({});
    }
  };

  const handleCloseDetailsPanel = () => {
    setIsClosingDetailsPanel(true);
  };

  const handleDetailsAnimationEnd = () => {
    if (isClosingDetailsPanel) {
      setSelectedRow(null);
      setIsClosingDetailsPanel(false);
    }
  };

  const handleCloseEditModal = () => {
    setIsClosingEditModal(true);
  };

  const handleEditModalAnimationEnd = () => {
    if (isClosingEditModal) {
      setShowEditModal(false);
      setIsClosingEditModal(false);
      setEditPanelData({
        partName: '',
        rawMaterial: '',
        cavity: '',
        componentWeight: '',
        runnerWeight: '',
        requiredPerMonth: '',
        ratePerKg: '',
        ratePerPiece: '',
      });
      setEditPanelErrors({});
    }
  };



  const handleCloseFormulasModal = () => {
    setIsClosingFormulasModal(true);
  };

  const handleFormulasModalAnimationEnd = () => {
    if (isClosingFormulasModal) {
      setShowFormulasModal(false);
      setIsClosingFormulasModal(false);
    }
  };

  const handleRowClick = (row) => {
    setSelectedRow(row);
  };

  const handleRowHoverStart = (event, row) => {
    const x = event.clientX;
    const y = event.clientY - 16;

    setRowTooltip({
      visible: true,
      text: row?.partName || '-',
      x,
      y,
    });
  };

  const handleRowHoverMove = (event) => {
    setRowTooltip((prev) => ({
      ...prev,
      x: event.clientX,
      y: event.clientY - 16,
    }));
  };

  const handleRowHoverEnd = () => {
    setRowTooltip((prev) => ({ ...prev, visible: false }));
  };

  const handleDeleteSelectedRow = async () => {
    if (!selectedRow) return;
    if (isDeletingRow) return;

    try {
      setIsDeletingRow(true);
      if (selectedRow.databaseId && calculatorId) {
        await formulaCalculatorService.deleteCalculatorRow(calculatorId, selectedRow.databaseId);
      }

      // Remove row locally after successful DB delete
      const selectedIndex = rows.findIndex((row) => row.id === selectedRow.id);
      if (selectedIndex !== -1) {
        removeRow(selectedIndex);
        setSelectedRow(null);
      }
      setError(null);
      setActionMessage({ type: 'danger', text: 'Row deleted successfully.' });
    } catch (err) {
      setError('Failed to delete row. Please try again.');
      setActionMessage({ type: 'danger', text: 'Failed to delete row.' });
    } finally {
      setIsDeletingRow(false);
    }
  };

  const handleShowFormulas = () => {
    if (selectedRow) {
      setShowFormulasModal(true);
    }
  };

  const handleEditButtonClick = () => {
    if (selectedRow) {
      // Populate edit form with current row data
      setEditPanelData({
        partName: selectedRow.partName,
        rawMaterial: selectedRow.rawMaterial,
        cavity: selectedRow.cavity,
        componentWeight: selectedRow.componentWeight,
        runnerWeight: selectedRow.runnerWeight,
        requiredPerMonth: selectedRow.requiredPerMonth,
        ratePerKg: selectedRow.ratePerKg,
        ratePerPiece: selectedRow.ratePerPiece,
      });
      setEditPanelErrors({});
      setShowEditModal(true);
    }
  };

  const handleEditPanelChange = (field, value) => {
    setEditPanelData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts editing
    if (editPanelErrors[field]) {
      setEditPanelErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateEditPanelForm = () => {
    const errors = {};
    if (!editPanelData.partName.trim()) errors.partName = 'Part Name is required';
    if (!editPanelData.rawMaterial.trim()) errors.rawMaterial = 'Raw Material is required';
    if (!editPanelData.cavity || toNumber(editPanelData.cavity) <= 0) errors.cavity = 'Cavity must be > 0';
    if (!editPanelData.componentWeight || toNumber(editPanelData.componentWeight) <= 0) errors.componentWeight = 'Component Weight must be > 0';
    if (!editPanelData.runnerWeight || toNumber(editPanelData.runnerWeight) <= 0) errors.runnerWeight = 'Runner Weight must be > 0';
    if (!editPanelData.requiredPerMonth || toNumber(editPanelData.requiredPerMonth) <= 0) errors.requiredPerMonth = 'Required/Month must be > 0';
    if (!editPanelData.ratePerKg || toNumber(editPanelData.ratePerKg) <= 0) errors.ratePerKg = 'Rate/Kg must be > 0';
    if (!editPanelData.ratePerPiece || toNumber(editPanelData.ratePerPiece) <= 0) errors.ratePerPiece = 'Rate/Piece must be > 0';
    return errors;
  };

  const handleSaveEditedRow = async () => {
    const errors = validateEditPanelForm();
    if (Object.keys(errors).length > 0) {
      setEditPanelErrors(errors);
      return;
    }

    if (isUpdatingRow) return;

    if (!selectedRow) {
      setEditPanelErrors({ general: 'No row selected' });
      return;
    }

    try {
      setIsUpdatingRow(true);
      // Prepare data for update - convert field names to snake_case
      const updateData = {
        part_name: editPanelData.partName,
        raw_material: editPanelData.rawMaterial,
        cavity: toNumber(editPanelData.cavity),
        component_weight: toNumber(editPanelData.componentWeight),
        runner_weight: toNumber(editPanelData.runnerWeight),
        required_per_month: toNumber(editPanelData.requiredPerMonth),
        rate_per_kg: toNumber(editPanelData.ratePerKg),
        raw_material_cost_per_kg: toNumber(editPanelData.ratePerKg),
        rate_per_piece: toNumber(editPanelData.ratePerPiece),
      };

      // If row has database ID, update database
      if (selectedRow.databaseId && calculatorId) {
        await formulaCalculatorService.updateCalculatorRow(calculatorId, selectedRow.databaseId, updateData);
      }

      // Update ONLY this specific row in state using the unique generated ID
      setRows((prevRows) => {
        const updatedRows = prevRows.map((row) => {
          // ALWAYS compare using the generated unique id (never use databaseId for matching)
          // This ensures only ONE row gets updated, not all rows with undefined databaseId
          if (row.id === selectedRow.id) {
            // Update only the matched row with new data
            return {
              ...row,
              partName: editPanelData.partName,
              rawMaterial: editPanelData.rawMaterial,
              cavity: editPanelData.cavity,
              componentWeight: editPanelData.componentWeight,
              runnerWeight: editPanelData.runnerWeight,
              requiredPerMonth: editPanelData.requiredPerMonth,
              ratePerKg: editPanelData.ratePerKg,
              ratePerPiece: editPanelData.ratePerPiece,
              ...(calculateAllValues({
                componentWeight: editPanelData.componentWeight,
                noOfCavity: editPanelData.cavity,
                runnerWeightPerShot: editPanelData.runnerWeight,
                requirementPerMonth: editPanelData.requiredPerMonth,
                ratePerPiece: editPanelData.ratePerPiece,
                rawMaterialCostPerKg: editPanelData.ratePerKg,
              })),
            };
          }
          // Return all other rows completely unchanged
          return row;
        });

        return sortRowsAlphabetically(updatedRows);
      });

      // Update selected row display
      setSelectedRow((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          partName: editPanelData.partName,
          rawMaterial: editPanelData.rawMaterial,
          cavity: editPanelData.cavity,
          componentWeight: editPanelData.componentWeight,
          runnerWeight: editPanelData.runnerWeight,
          requiredPerMonth: editPanelData.requiredPerMonth,
          ratePerKg: editPanelData.ratePerKg,
          ratePerPiece: editPanelData.ratePerPiece,
        };
      });

      // Exit edit modal
      setShowEditModal(false);
      setSelectedRow(null);
      setEditPanelData({
        partName: '',
        rawMaterial: '',
        cavity: '',
        componentWeight: '',
        runnerWeight: '',
        requiredPerMonth: '',
        ratePerKg: '',
        ratePerPiece: '',
      });
      setEditPanelErrors({});
      setActionMessage({ type: 'success', text: 'Row updated successfully.' });
    } catch (err) {
      setEditPanelErrors({ general: 'Failed to update row: ' + err.message });
      setActionMessage({ type: 'danger', text: 'Failed to update row.' });
    } finally {
      setIsUpdatingRow(false);
    }
  };

  const handleCancelEditPanel = () => {
    setShowEditModal(false);
    setEditPanelData({
      partName: '',
      rawMaterial: '',
      cavity: '',
      componentWeight: '',
      runnerWeight: '',
      requiredPerMonth: '',
      ratePerKg: '',
      ratePerPiece: '',
    });
    setEditPanelErrors({});
  };

  const removeRow = (index) => {
    setRows((currentRows) => {
      if (currentRows.length === 1) return [];
      return currentRows.filter((_, i) => i !== index);
    });
  };

  // Calculations from the required formula set
  const calculatedRows = useMemo(() => {
    return rows.map((row) => {
      const requiredPerMonth = toNumber(row.requiredPerMonth ?? row.required_per_month);
      const ratePerPiece = toNumber(row.ratePerPiece ?? row.rate_per_piece);
      const computed = calculateAllValues({
        componentWeight: row.componentWeight,
        noOfCavity: row.cavity,
        runnerWeightPerShot: row.runnerWeight,
        requirementPerMonth: requiredPerMonth,
        ratePerPiece,
        rawMaterialCostPerKg: row.ratePerKg,
      });

      return {
        ...row,
        requiredPerMonth,
        ratePerPiece,
        ...computed,
        amount: requiredPerMonth * ratePerPiece,
      };
    });
  }, [rows]);

  // Summary calculation
  const summary = useMemo(() => {
    return calculatedRows.reduce(
      (acc, row) => {
        acc.totalRawMaterialForQty += row.rawMaterialForTotalQty;
        acc.totalAmount += row.amount;
        acc.totalRequired += toNumber(row.requiredPerMonth);
        return acc;
      },
      { totalRawMaterialForQty: 0, totalAmount: 0, totalRequired: 0 }
    );
  }, [calculatedRows]);

  // Apply search filter before pagination
  const filteredRows = useMemo(() => {
    const q = String(searchQuery || '').trim().toLowerCase();
    if (!q) return calculatedRows;
    return calculatedRows.filter((r) => {
      return (
        String(r.partName || '').toLowerCase().includes(q) ||
        String(r.rawMaterial || '').toLowerCase().includes(q) ||
        String(r.cavity || '').toLowerCase().includes(q) ||
        String(r.ratePerPiece || '').toLowerCase().includes(q)
      );
    });
  }, [calculatedRows, searchQuery]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const topMetrics = [
    {
      label: 'Parts configured',
      value: calculatedRows.length,
      sub: 'Editable rows in the sheet',
      icon: Factory,
      tone: 'blue',
    },
    {
      label: 'Monthly quantity',
      value: formatNumber(summary.totalRequired),
      sub: 'Pieces required per month',
      icon: Weight,
      tone: 'teal',
    },
    {
      label: 'Material demand',
      value: `${formatNumber(summary.totalRawMaterialForQty)} kg`,
      sub: 'Raw material for total quantity',
      icon: Droplets,
      tone: 'amber',
    },
    {
      label: 'Estimated cost',
      value: `₹${formatNumber(summary.totalAmount)}`,
      sub: 'Requirement x rate per piece',
      icon: BadgeIndianRupee,
      tone: 'emerald',
    },
  ];

  const selectedFormulaValues = useMemo(() => {
    if (!selectedRow) return null;

    return calculateAllValues({
      componentWeight: selectedRow.componentWeight,
      noOfCavity: selectedRow.cavity,
      runnerWeightPerShot: selectedRow.runnerWeight,
      requirementPerMonth: selectedRow.requiredPerMonth,
      ratePerPiece: selectedRow.ratePerPiece,
      rawMaterialCostPerKg: selectedRow.ratePerKg,
    });
  }, [selectedRow]);

  const formulaCards = useMemo(() => {
    if (!selectedFormulaValues) return [];

    return [
      {
        label: 'totalComponentWeight',
        expression: 'componentWeight * noOfCavity',
        value: formatNumber(selectedFormulaValues.totalComponentWeight, 4),
      },
      {
        label: 'shotWeight',
        expression: '(componentWeight * noOfCavity) + runnerWeightPerShot',
        value: formatNumber(selectedFormulaValues.shotWeight, 4),
      },
      {
        label: 'processLoss',
        expression: 'shotWeight * 0.02',
        value: formatNumber(selectedFormulaValues.processLoss, 4),
      },
      {
        label: 'totalShotWeight',
        expression: 'shotWeight + processLoss',
        value: formatNumber(selectedFormulaValues.totalShotWeight, 4),
      },
      {
        label: 'piecesPerKg',
        expression: '(1000 * noOfCavity) / totalShotWeight',
        value: formatNumber(selectedFormulaValues.piecesPerKg, 4),
      },
      {
        label: 'ppuPerKg',
        expression: '(1000 / totalShotWeight) * noOfCavity',
        value: formatNumber(selectedFormulaValues.ppuPerKg, 4),
      },
      {
        label: 'runnerReturnPerPiece',
        expression: 'runnerWeightPerShot / noOfCavity',
        value: formatNumber(selectedFormulaValues.runnerReturnPerPiece, 4),
      },
      {
        label: 'amount',
        expression: 'requirementPerMonth * ratePerPiece',
        value: formatNumber(selectedFormulaValues.amount, 2),
      },
      {
        label: 'rawMaterialCostPerComponent',
        expression: '(totalShotWeight * rawMaterialCostPerKg) / (noOfCavity * 1000)',
        value: formatNumber(selectedFormulaValues.rawMaterialCostPerComponent, 6),
      },
      {
        label: 'rawMaterialForTotalQty',
        expression: 'requirementPerMonth / ppuPerKg',
        value: formatNumber(selectedFormulaValues.rawMaterialForTotalQty, 4),
      },
      {
        label: 'rmPercentage',
        expression: 'rawMaterialCostPerComponent / ratePerPiece',
        value: `${formatNumber((toNumber(selectedFormulaValues.rmPercentage) * 100), 2)}%`,
      },
    ];
  }, [selectedFormulaValues]);

  return (
    <div className="formula-page">
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Loading calculator data...</p>
        </div>
      )}
      
      {error && (
        <div style={{ 
          backgroundColor: '#fee', 
          color: '#c00', 
          padding: '10px 15px', 
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}

      {actionMessage && (
        <div className={`formula-action-message ${actionMessage.type}`}>
          {actionMessage.text}
        </div>
      )}

      <section className="formula-stats-grid">
        {topMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article
              key={metric.label}
              className={`formula-stat-card ${metric.tone}`}
            >
              <div className="formula-stat-head">
                <span>{metric.label}</span>
                <Icon size={18} />
              </div>
              <strong>{metric.value}</strong>
              <p>{metric.sub}</p>
            </article>
          );
        })}
      </section>

      <section className="formula-card formula-table-card">
        <div className="formula-toolbar">
          <div>
            <h2>Planning rows</h2>
           
          </div>
          <div className="formula-actions">
            <div className="formula-search-wrapper">
              <div className="formula-search-icon"><Search size={16} /></div>
              <input
                type="text"
                placeholder="Search parts or material"
                className="formula-search-input"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
          <button
            type="button"
            className="formula-add-btn"
            onClick={addRow}
          >
            <Plus size={16} /> Add Row
          </button>
        </div>

        <div className="formula-table-wrap">
          <table className="formula-table">
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Raw Material</th>
                <th>Cavity</th>
                <th>Component Weight (g)</th>
                <th>Runner Wt/Shot (g)</th>
                <th>Require / Month</th>
                <th>Rate / Kg</th>
                <th>Rate / Piece</th>
                <th>Total Kilograms</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => {
                const actualIndex = startIndex + index;
                // Always use the unique generated ID for selection comparison
                const isSelected = selectedRow && row.id === selectedRow.id;

                return (
                  <tr 
                    key={row.id}
                    className={isSelected ? 'row-selected' : ''}
                    onMouseEnter={(event) => handleRowHoverStart(event, row)}
                    onMouseMove={handleRowHoverMove}
                    onMouseLeave={handleRowHoverEnd}
                    onClick={() => handleRowClick(row)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td><span>{row.partName}</span></td>
                    <td><span>{row.rawMaterial}</span></td>
                    <td><span>{row.cavity}</span></td>
                    <td><span>{row.componentWeight}</span></td>
                    <td><span>{row.runnerWeight}</span></td>
                    <td><span>{row.requiredPerMonth}</span></td>
                    <td><span className="blue-text">{row.ratePerKg}</span></td>
                    <td><span className="blue-text">₹{formatNumber(row.ratePerPiece)}</span></td>
                    <td><span className="blue-text">{formatNumber(row.rawMaterialForTotalQty)} kg</span></td>
                    <td><span className="blue-text">₹{formatNumber(row.amount)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rowTooltip.visible && (
            <div
              className="row-tooltip"
              style={{
                left: `${Math.max(16, rowTooltip.x)}px`,
                top: `${Math.max(16, rowTooltip.y)}px`,
              }}
            >
              <span>Part Name</span>
              <strong>{rowTooltip.text}</strong>
            </div>
          )}
        </div>

        {/* Pagination Controls - shared pagination-bar UI */}
        <div className="pagination-bar">
          <span className="pagination-info">
            Showing {filteredRows.length > 0 ? startIndex + 1 : 0}-{Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length} entries
          </span>

          <div className="pagination-controls">
            <button
              className="page-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <div className="page-numbers">
              <button className="page-btn" disabled>
                {currentPage}
              </button>
              <span className="page-indicator">of {totalPages}</span>
            </div>

            <button
              className="page-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Add Row Modal */}
      {showAddModal && (
        <div className={`modal-overlay ${isClosingAddModal ? 'closing' : ''}`} onClick={handleCloseModal}>
          <div
            className={`modal-content ${isClosingAddModal ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            onAnimationEnd={handleAddModalAnimationEnd}
          >
            <div className="modal-header">
              <h2>Add New Row</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Part Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="partName"
                    placeholder="Enter part name"
                    value={formData.partName}
                    onChange={handleFormChange}
                    className={formErrors.partName ? 'input-error' : ''}
                  />
                  {formErrors.partName && (
                    <span className="error-message">{formErrors.partName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Raw Material <span className="required">*</span></label>
                  <input
                    type="text"
                    name="rawMaterial"
                    placeholder="Enter raw material"
                    value={formData.rawMaterial}
                    onChange={handleFormChange}
                    className={formErrors.rawMaterial ? 'input-error' : ''}
                  />
                  {formErrors.rawMaterial && (
                    <span className="error-message">{formErrors.rawMaterial}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cavity <span className="required">*</span></label>
                  <input
                    type="number"
                    name="cavity"
                    placeholder="Enter cavity"
                    value={formData.cavity}
                    onChange={handleFormChange}
                    className={formErrors.cavity ? 'input-error' : ''}
                  />
                  {formErrors.cavity && (
                    <span className="error-message">{formErrors.cavity}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Component Weight (g) <span className="required">*</span></label>
                  <input
                    type="number"
                    name="componentWeight"
                    placeholder="Enter component weight"
                    step="0.01"
                    value={formData.componentWeight}
                    onChange={handleFormChange}
                    className={formErrors.componentWeight ? 'input-error' : ''}
                  />
                  {formErrors.componentWeight && (
                    <span className="error-message">{formErrors.componentWeight}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Runner Weight (g) <span className="required">*</span></label>
                  <input
                    type="number"
                    name="runnerWeight"
                    placeholder="Enter runner weight"
                    step="0.01"
                    value={formData.runnerWeight}
                    onChange={handleFormChange}
                    className={formErrors.runnerWeight ? 'input-error' : ''}
                  />
                  {formErrors.runnerWeight && (
                    <span className="error-message">{formErrors.runnerWeight}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Required Per Month <span className="required">*</span></label>
                  <input
                    type="number"
                    name="requiredPerMonth"
                    placeholder="Enter quantity"
                    value={formData.requiredPerMonth}
                    onChange={handleFormChange}
                    className={formErrors.requiredPerMonth ? 'input-error' : ''}
                  />
                  {formErrors.requiredPerMonth && (
                    <span className="error-message">{formErrors.requiredPerMonth}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Rate Per Kg (₹) <span className="required">*</span></label>
                  <input
                    type="number"
                    name="ratePerKg"
                    placeholder="Enter rate per kg"
                    step="0.01"
                    value={formData.ratePerKg}
                    onChange={handleFormChange}
                    className={formErrors.ratePerKg ? 'input-error' : ''}
                  />
                  {formErrors.ratePerKg && (
                    <span className="error-message">{formErrors.ratePerKg}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Rate Per Piece (₹) <span className="required">*</span></label>
                  <input
                    type="number"
                    name="ratePerPiece"
                    placeholder="Enter rate per piece"
                    step="0.01"
                    value={formData.ratePerPiece}
                    onChange={handleFormChange}
                    className={formErrors.ratePerPiece ? 'input-error' : ''}
                  />
                  {formErrors.ratePerPiece && (
                    <span className="error-message">{formErrors.ratePerPiece}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseModal}>
                Cancel
              </button>
              <button className="btn-add" onClick={handleAddRowSubmit} disabled={isAddingRow}>
                {isAddingRow ? 'Adding...' : 'Add Row'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Row Modal */}
      {showEditModal && selectedRow && (
        <div className={`modal-overlay ${isClosingEditModal ? 'closing' : ''}`} onClick={handleCloseEditModal}>
          <div
            className={`modal-content ${isClosingEditModal ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            onAnimationEnd={handleEditModalAnimationEnd}
          >
            <div className="modal-header">
              <h2>Edit Row</h2>
              <button className="modal-close" onClick={handleCloseEditModal}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {editPanelErrors.general && (
                <div className="error-message" style={{ marginBottom: '12px', display: 'block' }}>
                  {editPanelErrors.general}
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Part Name <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter part name"
                    value={editPanelData.partName}
                    onChange={(e) => handleEditPanelChange('partName', e.target.value)}
                    className={editPanelErrors.partName ? 'input-error' : ''}
                  />
                  {editPanelErrors.partName && <span className="error-message">{editPanelErrors.partName}</span>}
                </div>

                <div className="form-group">
                  <label>Raw Material <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter raw material"
                    value={editPanelData.rawMaterial}
                    onChange={(e) => handleEditPanelChange('rawMaterial', e.target.value)}
                    className={editPanelErrors.rawMaterial ? 'input-error' : ''}
                  />
                  {editPanelErrors.rawMaterial && <span className="error-message">{editPanelErrors.rawMaterial}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cavity <span className="required">*</span></label>
                  <input
                    type="number"
                    placeholder="Enter cavity"
                    value={editPanelData.cavity}
                    onChange={(e) => handleEditPanelChange('cavity', e.target.value)}
                    className={editPanelErrors.cavity ? 'input-error' : ''}
                  />
                  {editPanelErrors.cavity && <span className="error-message">{editPanelErrors.cavity}</span>}
                </div>

                <div className="form-group">
                  <label>Component Weight (g) <span className="required">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter component weight"
                    value={editPanelData.componentWeight}
                    onChange={(e) => handleEditPanelChange('componentWeight', e.target.value)}
                    className={editPanelErrors.componentWeight ? 'input-error' : ''}
                  />
                  {editPanelErrors.componentWeight && <span className="error-message">{editPanelErrors.componentWeight}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Runner Weight (g) <span className="required">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter runner weight"
                    value={editPanelData.runnerWeight}
                    onChange={(e) => handleEditPanelChange('runnerWeight', e.target.value)}
                    className={editPanelErrors.runnerWeight ? 'input-error' : ''}
                  />
                  {editPanelErrors.runnerWeight && <span className="error-message">{editPanelErrors.runnerWeight}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Required Per Month <span className="required">*</span></label>
                  <input
                    type="number"
                    placeholder="Enter quantity"
                    value={editPanelData.requiredPerMonth}
                    onChange={(e) => handleEditPanelChange('requiredPerMonth', e.target.value)}
                    className={editPanelErrors.requiredPerMonth ? 'input-error' : ''}
                  />
                  {editPanelErrors.requiredPerMonth && <span className="error-message">{editPanelErrors.requiredPerMonth}</span>}
                </div>

                <div className="form-group">
                  <label>Rate Per Kg (₹) <span className="required">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter rate per kg"
                    value={editPanelData.ratePerKg}
                    onChange={(e) => handleEditPanelChange('ratePerKg', e.target.value)}
                    className={editPanelErrors.ratePerKg ? 'input-error' : ''}
                  />
                  {editPanelErrors.ratePerKg && <span className="error-message">{editPanelErrors.ratePerKg}</span>}
                </div>

                <div className="form-group">
                  <label>Rate Per Piece (₹) <span className="required">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter rate per piece"
                    value={editPanelData.ratePerPiece}
                    onChange={(e) => handleEditPanelChange('ratePerPiece', e.target.value)}
                    className={editPanelErrors.ratePerPiece ? 'input-error' : ''}
                  />
                  {editPanelErrors.ratePerPiece && <span className="error-message">{editPanelErrors.ratePerPiece}</span>}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseEditModal}>
                Cancel
              </button>
              <button className="btn-add" onClick={handleSaveEditedRow} disabled={isUpdatingRow}>
                {isUpdatingRow ? 'Updating...' : 'Update Row'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showFormulasModal && selectedRow && selectedFormulaValues && (
        <div className={`modal-overlay ${isClosingFormulasModal ? 'closing' : ''}`} onClick={handleCloseFormulasModal}>
          <div
            className={`modal-content formula-breakdown-modal ${isClosingFormulasModal ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            onAnimationEnd={handleFormulasModalAnimationEnd}
          >
            <div className="modal-header">
              <h2 className="formula-breakdown-title">Formula Breakdown</h2>
              <button className="modal-close" onClick={handleCloseFormulasModal}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="formula-summary-grid">
                <div className="formula-summary-item card-surface"><span>Cavity</span><strong>{selectedRow?.cavity}</strong></div>
                <div className="formula-summary-item card-surface"><span>Component Wt</span><strong>{selectedRow?.componentWeight}</strong></div>
                <div className="formula-summary-item card-surface"><span>Runner Wt</span><strong>{selectedRow?.runnerWeight}</strong></div>
                <div className="formula-summary-item card-surface"><span>Req / Month</span><strong>{selectedRow?.requiredPerMonth}</strong></div>
                <div className="formula-summary-item card-surface"><span>Rate / Piece</span><strong>₹{formatNumber(selectedRow?.ratePerPiece)}</strong></div>
              </div>

              <div className="formula-list">
                {formulaCards.map((item) => (
                  <div className="formula-item card-surface" key={item.label}>
                    <div className="formula-meta">
                      <strong className="heading">{formatFormulaLabel(item.label)}</strong>
                      <span className="expression">{item.expression}</span>
                    </div>
                    <div className="formula-value">
                      <em>{item.value}</em>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseFormulasModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row Details Panel */}
      {selectedRow && !showEditModal && (
        <div className={`details-panel-overlay ${isClosingDetailsPanel ? 'closing' : ''}`} onClick={handleCloseDetailsPanel}>
          <div
            className={`details-panel ${isClosingDetailsPanel ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            onAnimationEnd={handleDetailsAnimationEnd}
          >
            <div className="details-header">
              <h3>Row Details & Actions</h3>
              <button
                className="details-close"
                onClick={handleCloseDetailsPanel}
              >
                <X size={18} />
              </button>
            </div>

            <div className="details-body">
              <div className="detail-section">
                <label className="section-label">Selected Part</label>
                <div className="selected-part-box">{selectedRow?.partName}</div>
              </div>

              <div className="details-grid">
                <div className="grid-item">
                  <label className="field-label">Raw Material</label>
                  <div className="field-value-box">{selectedRow?.rawMaterial}</div>
                </div>
                <div className="grid-item">
                  <label className="field-label">Cavity</label>
                  <div className="field-value-box">{selectedRow?.cavity}</div>
                </div>
                <div className="grid-item">
                  <label className="field-label">Component Weight (g)</label>
                  <div className="field-value-box">{selectedRow?.componentWeight}</div>
                </div>
                <div className="grid-item">
                  <label className="field-label">Runner Weight (g)</label>
                  <div className="field-value-box">{selectedRow?.runnerWeight}</div>
                </div>
                <div className="grid-item">
                  <label className="field-label">Required Per Month</label>
                  <div className="field-value-box">{selectedRow?.requiredPerMonth}</div>
                </div>
                <div className="grid-item">
                  <label className="field-label">Rate Per Kg (₹)</label>
                  <div className="field-value-box">{selectedRow?.ratePerKg}</div>
                </div>
                <div className="grid-item">
                  <label className="field-label">Rate Per Piece (₹)</label>
                  <div className="field-value-box">₹{formatNumber(selectedRow?.ratePerPiece)}</div>
                </div>
                <div className="grid-item">
                  <label className="field-label">Amount (₹)</label>
                  <div className="field-value-box">₹{formatNumber(selectedRow?.amount)}</div>
                </div>
              </div>
            </div>

            <div className="details-footer">
              <button className="btn-details-delete" onClick={handleDeleteSelectedRow} disabled={isDeletingRow}>
                {isDeletingRow ? 'Deleting...' : (<><Trash2 size={14} />&nbsp;Delete</>)}
              </button>
              <button className="btn-details-edit" onClick={handleEditButtonClick}>
                <Edit size={14} />&nbsp;Edit
              </button>
              <button className="btn-details-primary" onClick={handleShowFormulas}>
                <FileText size={14} />&nbsp;Formulae
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulaCalculator;