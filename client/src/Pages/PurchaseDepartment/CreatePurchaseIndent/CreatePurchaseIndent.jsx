import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import './CreatePurchaseIndent.css';
import { purchaseIndentService, materialService } from '../../../services/apiService';
import useAuthStore from '../../../store/authStore';

// ─── helpers ────────────────────────────────────────────────────────────────
const getTodayDate = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const generateIndentNumber = () => {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(100 + Math.random() * 900));
  return `IND-${year}-${rand}`;
};

const UNITS = ['Kg', 'Ltr', 'Pcs', 'Mtr', 'Box', 'Nos'];

// ─── empty material row factory ──────────────────────────────────────────────
const emptyRow = () => ({
  _key: Date.now() + Math.random(),
  materialId: null,
  description: '',
  materialCode: '',
  warehouseLocation: '',
  currentStock: '',
  quantity: '',
  unit: 'Kg',
  remarks: '',
});

// ─── MaterialRow component ───────────────────────────────────────────────────
const MaterialRow = ({ row, allMaterials, onChange, onDelete, showDelete }) => {
  const [query, setQuery] = useState(row.description);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const filtered = query.trim()
    ? allMaterials.filter(
        (m) =>
          m.material_name?.toLowerCase().includes(query.toLowerCase()) ||
          m.material_code?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (mat) => {
    setQuery(mat.material_name);
    setOpen(false);
    onChange({
      ...row,
      materialId: mat.material_id,
      description: mat.material_name,
      materialCode: mat.material_code || '',
      warehouseLocation: mat.warehouse_location || '',
      currentStock: mat.current_stock ?? mat.stock_quantity ?? '',
      unit: mat.unit_of_measurement || row.unit,
    });
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    onChange({ ...row, description: val, materialId: null, materialCode: '', warehouseLocation: '', currentStock: '' });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <tr className="cpi-table-row">
      {/* Material Name / Code */}
      <td className="cpi-td cpi-td-material">
        <div className="cpi-search-wrap" ref={wrapRef}>
          <input
            className="cpi-input cpi-input-material"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => query.trim() && setOpen(true)}
            placeholder="Search material..."
          />
          {open && filtered.length > 0 && (
            <ul className="cpi-dropdown">
              {filtered.slice(0, 8).map((m) => (
                <li
                  key={m.material_id}
                  className="cpi-dropdown-item"
                  onMouseDown={() => handleSelect(m)}
                >
                  <span className="cpi-dropdown-name">{m.material_name}</span>
                  <span className="cpi-dropdown-code">{m.material_code}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </td>

      {/* Material Code */}
      <td className="cpi-td">
        <input
          className="cpi-input cpi-input-code"
          value={row.materialCode}
          onChange={(e) => onChange({ ...row, materialCode: e.target.value })}
          placeholder="e.g. MAT-001"
        />
      </td>

      {/* Warehouse Location */}
      <td className="cpi-td">
        <input
          className="cpi-input cpi-input-location"
          value={row.warehouseLocation}
          onChange={(e) => onChange({ ...row, warehouseLocation: e.target.value })}
          placeholder="e.g. A-01"
        />
      </td>

      {/* Required Qty */}
      <td className="cpi-td">
        <input
          className="cpi-input cpi-input-qty"
          type="number"
          min="0"
          value={row.quantity}
          onChange={(e) => onChange({ ...row, quantity: e.target.value })}
          placeholder="0"
        />
      </td>

      {/* Unit */}
      <td className="cpi-td">
        <select
          className="cpi-select-unit"
          value={row.unit}
          onChange={(e) => onChange({ ...row, unit: e.target.value })}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </td>

      {/* Remarks */}
      <td className="cpi-td">
        <input
          className="cpi-input cpi-input-remarks"
          value={row.remarks}
          onChange={(e) => onChange({ ...row, remarks: e.target.value })}
          placeholder="Notes..."
        />
      </td>

      {/* Delete */}
      <td className="cpi-td cpi-td-action">
        {showDelete && (
          <button
            className="cpi-delete-btn"
            onClick={onDelete}
            type="button"
            title="Remove row"
          >
            <Trash2 size={15} />
          </button>
        )}
      </td>
    </tr>
  );
};

// ─── Main page component ─────────────────────────────────────────────────────
const CreatePurchaseIndent = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [indentNumber] = useState(generateIndentNumber);
  const [formData, setFormData] = useState({
    department: 'QMS',
    requestedDate: getTodayDate(),
    priority: 'Normal',
    reason: '',
  });
  const [rows, setRows] = useState([emptyRow()]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  // Fetch materials for the search dropdown
  useEffect(() => {
    materialService
      .getAllMaterials()
      .then((res) => setAllMaterials(res.materials || res.data || []))
      .catch(() => {});
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleRowChange = (index, updatedRow) => {
    setRows((prev) => prev.map((r, i) => (i === index ? updatedRow : r)));
  };

  const handleAddRow = () => setRows((prev) => [...prev, emptyRow()]);

  const handleDeleteRow = (index) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  // ── build payload ─────────────────────────────────────────────────────────
  const buildPayload = (status, workflowStage) => {
    const validRows = rows.filter((r) => r.description.trim());
    return {
      indentNumber,
      requestDate: formData.requestedDate,
      priority: formData.priority === 'Normal' ? 'Normal' : formData.priority,
      reason: formData.reason,
      status,
      workflowStage,
      materials: validRows.map((r) => ({
        description: r.description,
        quantity: parseFloat(r.quantity) || 0,
        unit: r.unit,
        currentStock: parseFloat(r.currentStock) || 0,
        specifications: r.remarks || '',
      })),
    };
  };

  const validate = () => {
    if (!formData.requestedDate) {
      showToast('error', 'Requested date is required.');
      return false;
    }
    const validRows = rows.filter((r) => r.description.trim());
    if (validRows.length === 0) {
      showToast('error', 'Add at least one material item.');
      return false;
    }
    for (const r of validRows) {
      if (!r.quantity || parseFloat(r.quantity) <= 0) {
        showToast('error', `Enter a valid quantity for "${r.description}".`);
        return false;
      }
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await purchaseIndentService.createPurchaseDeptIndent(buildPayload('Draft', 'Purchase Dept'));
      showToast('success', 'Draft saved successfully.');
      setTimeout(() => navigate('/qms-indents'), 1500);
    } catch (err) {
      showToast('error', err.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      await purchaseIndentService.createPurchaseDeptIndent(
        buildPayload('Pending QMS Verification', 'QMS Init')
      );
      showToast('success', 'Indent submitted for Store Verification.');
      setTimeout(() => navigate('/qms-indents'), 1500);
    } catch (err) {
      showToast('error', err.message || 'Failed to submit indent.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cpi-page">
      {/* ── Toast ── */}
      {toast && (
        <div className={`cpi-toast cpi-toast-${toast.type}`}>{toast.message}</div>
      )}

      {/* ── Header ── */}
      <div className="cpi-header">
        <button className="cpi-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </button>
        <h1 className="cpi-title">Create Purchase Indent</h1>
        <div className="cpi-header-actions">
          <button
            className="cpi-btn cpi-btn-submit"
            onClick={handleSubmit}
            disabled={saving || submitting}
          >
            {submitting ? (
              <Loader2 size={14} className="cpi-spin" />
            ) : (
              <Check size={14} />
            )}
            Submit Indent
          </button>
        </div>
      </div>

      {/* ── General Information ── */}
      <div className="cpi-card">
        <div className="cpi-card-header">
          <h2 className="cpi-section-title">General Information</h2>
          <span className="cpi-indent-num">Indent # {indentNumber}</span>
        </div>

        <div className="cpi-form-grid">
          {/* Department */}
          <div className="cpi-field">
            <label className="cpi-label">Department</label>
            <input
              className="cpi-input-field"
              value="QMS"
              readOnly
            />
          </div>

          {/* Requested Date */}
          <div className="cpi-field">
            <label className="cpi-label">Requested Date</label>
            <input
              type="date"
              className="cpi-input-field"
              value={formData.requestedDate}
              onChange={(e) => handleFieldChange('requestedDate', e.target.value)}
            />
          </div>

          {/* Priority */}
          <div className="cpi-field">
            <label className="cpi-label">Priority</label>
            <select
              className="cpi-select"
              value={formData.priority}
              onChange={(e) => handleFieldChange('priority', e.target.value)}
            >
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Reason */}
        <div className="cpi-field cpi-field-full">
          <label className="cpi-label">Reason / Purpose</label>
          <textarea
            className="cpi-textarea"
            rows={3}
            placeholder="e.g., Restocking for Q4 production..."
            value={formData.reason}
            onChange={(e) => handleFieldChange('reason', e.target.value)}
          />
        </div>
      </div>

      {/* ── Material Details ── */}
      <div className="cpi-card">
        <div className="cpi-card-header">
          <h2 className="cpi-section-title">Material Details</h2>
          <button className="cpi-btn cpi-btn-add" onClick={handleAddRow} type="button">
            <Plus size={14} />
            Add Item
          </button>
        </div>

        <div className="cpi-table-wrap">
          <table className="cpi-table">
            <thead>
              <tr>
                <th className="cpi-th">Material Name</th>
                <th className="cpi-th">Material Code</th>
                <th className="cpi-th">Warehouse Location</th>
                <th className="cpi-th">Required Qty</th>
                <th className="cpi-th">Unit</th>
                <th className="cpi-th">Remarks</th>
                <th className="cpi-th" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <MaterialRow
                  key={row._key}
                  row={row}
                  allMaterials={allMaterials}
                  onChange={(updated) => handleRowChange(idx, updated)}
                  onDelete={() => handleDeleteRow(idx)}
                  showDelete={rows.length > 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Approval Workflow ── */}
      <div className="cpi-card">
        <h2 className="cpi-section-title">Approval Workflow</h2>
        <div className="cpi-workflow">
          <div className="cpi-step cpi-step-active">
            <div className="cpi-step-circle cpi-step-circle-active">1</div>
            <span className="cpi-step-label">Purchase Department</span>
          </div>
          <div className="cpi-step-line" />
          <div className="cpi-step">
            <div className="cpi-step-circle">2</div>
            <span className="cpi-step-label">QMS Verification</span>
          </div>
          <div className="cpi-step-line" />
          <div className="cpi-step">
            <div className="cpi-step-circle">3</div>
            <span className="cpi-step-label">Admin Approval</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchaseIndent;
