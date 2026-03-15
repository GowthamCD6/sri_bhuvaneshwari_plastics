import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import './CreateIndent.css';
import { purchaseIndentService, materialService, storeRequestService } from '../../../services/apiService';
import useAuthStore from '../../../store/authStore';

// --- helpers ----------------------------------------------------------------
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

// --- empty material row factory ----------------------------------------------
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

// --- MaterialRow component ---------------------------------------------------
const MaterialRow = ({ row, allMaterials, onChange, onDelete, showDelete, readOnly }) => {
  const [query, setQuery] = useState(row.description);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  
  // Sync query if row description changes externally
  useEffect(() => {
    setQuery(row.description);
  }, [row.description]);

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
    <tr className="pi-tr">
      {/* Material Name / Code */}
      <td className="pi-td" style={{ minWidth: '220px' }}>
        <div className="cpi-search-wrap" ref={wrapRef}>
          <input
            className="pi-input pi-input-table"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => !readOnly && query.trim() && setOpen(true)}
            placeholder="Search material..."
            disabled={readOnly}
          />
          {!readOnly && open && filtered.length > 0 && (
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
      <td className="pi-td">
        <input
          className="pi-input pi-input-table"
          value={row.materialCode}
          onChange={(e) => onChange({ ...row, materialCode: e.target.value })}
          placeholder="e.g. MAT-001"
          disabled={readOnly}
          style={{ width: '120px' }}
        />
      </td>

      {/* Warehouse Location */}
      <td className="pi-td">
        <input
          className="pi-input pi-input-table"
          value={row.warehouseLocation}
          onChange={(e) => onChange({ ...row, warehouseLocation: e.target.value })}
          placeholder="e.g. A-01"
          disabled={readOnly}
          style={{ width: '120px' }}
        />
      </td>

      {/* Required Qty */}
      <td className="pi-td">
        <input
          className="pi-input pi-input-table"
          type="number"
          min="0"
          value={row.quantity}
          onChange={(e) => onChange({ ...row, quantity: e.target.value })}
          placeholder="0"
          disabled={readOnly}
          style={{ width: '100px' }}
        />
      </td>

      {/* Unit */}
      <td className="pi-td">
        <select
          className="pi-input pi-input-table"
          value={row.unit}
          onChange={(e) => onChange({ ...row, unit: e.target.value })}
          disabled={readOnly}
          style={{ width: '90px', cursor: 'pointer' }}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </td>

      {/* Remarks */}
      <td className="pi-td">
        <input
          className="pi-input pi-input-table"
          value={row.remarks}
          onChange={(e) => onChange({ ...row, remarks: e.target.value })}
          placeholder="Notes..."
          disabled={readOnly}
        />
      </td>

      {/* Delete */}
      <td className="pi-td" style={{ width: '50px', textAlign: 'center' }}>
        {showDelete && !readOnly && (
          <button
            className="pi-btn-delete"
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

// --- Main page component -----------------------------------------------------
const CreatePurchaseIndent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const [indentNumber] = useState(generateIndentNumber);
  const [formData, setFormData] = useState({
    department: 'QMS',
    requiredDate: getTodayDate(),
    priority: 'Normal',
    reason: '',
  });
  const [rows, setRows] = useState([emptyRow()]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  const storeRequest = location.state?.storeRequest;
  const viewIndentData = location.state?.indentData;
  const readOnlyMode = location.state?.readOnly;

  useEffect(() => {
    if (viewIndentData) {
      setIsReadOnly(!!readOnlyMode);
      
      const mapPriority = (p) => {
        if (!p) return 'Normal';
        const l = p.toString().toLowerCase();
        if (l === 'high') return 'High';
        if (l === 'urgent') return 'Urgent';
        return 'Normal';
      };

      setFormData(prev => ({
        ...prev,
        indentNumber: viewIndentData.id || viewIndentData.indent_number,
        requiredDate: viewIndentData.rawRequiredDate 
          ? new Date(viewIndentData.rawRequiredDate).toISOString().split('T')[0]
          : getTodayDate(),
        priority: mapPriority(viewIndentData.priority),
        reason: viewIndentData.remarks || viewIndentData.reason || ''
      }));

      const mats = viewIndentData.materials || [];
      if (mats.length > 0) {
        setRows(mats.map(m => ({
          _key: Math.random(),
          materialId: m.material_id,
          description: m.material_name || m.material_description || '',
          materialCode: m.material_code || '',
          warehouseLocation: m.warehouse_location || '',
          currentStock: m.current_stock || m.stock_quantity || '',
          quantity: m.quantity || '',
          unit: m.unit_of_measurement || 'Kg',
          remarks: m.specifications || m.remarks || ''
        })));
      }
    } else if (storeRequest) {
      setFormData(prev => ({
        ...prev,
        requiredDate: storeRequest.neededDate ? new Date(storeRequest.neededDate).toISOString().split('T')[0] : getTodayDate(),
        priority: storeRequest.priority || 'Normal',
        reason: storeRequest.reason || ''
      }));
      
      setRows([{
        _key: Date.now(),
        materialId: null,
        description: storeRequest.material,
        materialCode: storeRequest.code,
        warehouseLocation: '',
        currentStock: '',
        quantity: storeRequest.quantity,
        unit: storeRequest.unit || 'Kg',
        remarks: storeRequest.specs || ''
      }]);
    }
  }, [storeRequest, viewIndentData, readOnlyMode]);

  useEffect(() => {
    materialService.getAllMaterials()
      .then((res) => {
        const materials = res.materials || res.data || [];
        setAllMaterials(materials);
        
        if (storeRequest) {
          const matchedMaterial = materials.find(m => 
            m.material_name === storeRequest.material || 
            m.material_code === storeRequest.code
          );
          if (matchedMaterial) {
            setRows(prev => {
              const r = prev[0];
              return [{
                ...r,
                materialId: matchedMaterial.material_id,
                materialCode: storeRequest.code || matchedMaterial.material_code,
                warehouseLocation: matchedMaterial.warehouse_location,
                currentStock: matchedMaterial.current_stock ?? matchedMaterial.stock_quantity ?? '',
                quantity: storeRequest.quantity,
                unit: storeRequest.unit || matchedMaterial.unit_of_measurement,
                remarks: storeRequest.specs || ''
              }];
            });
          }
        }
      })
      .catch((err) => console.error('Failed to load materials:', err));
  }, [storeRequest]);

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

  const validate = () => {
    if (!formData.requiredDate) {
      showToast('error', 'Required date is required.');
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

  const buildPayload = (status, workflowStage) => {
    const validRows = rows.filter((r) => r.description.trim());
    return {
      indentNumber,
      requestDate: getTodayDate(),
      requiredByDate: formData.requiredDate,
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

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const response = await purchaseIndentService.createIndent(
        buildPayload('Pending QMS Verification', 'QMS Init')
      );
      if (storeRequest && storeRequest.id && response.data?.indent_id) {
        await storeRequestService.updateRequest(storeRequest.id, {
          status: 'Processed',
          indentId: response.data.indent_id
        });
      }
      showToast('success', 'Indent submitted for Store Verification.');
      setTimeout(() => navigate('/qms-indents'), 1500);
    } catch (err) {
      console.error('Submit indent error:', err);
      showToast('error', err.message || 'Failed to submit indent.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="purchase-indent-page">
      <div className="purchase-indent-container">
        {toast && <div className={`cpi-toast cpi-toast-${toast.type}`}>{toast.message}</div>}

        {/* -- Header -- */}
        <div className="pi-header">
          <div className="pi-header-left" style={{ display: "flex", alignItems: "center" }}>
            <button className="pi-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1>{isReadOnly ? 'View Purchase Indent' : 'New Purchase Indent'}</h1>
              <p>{isReadOnly ? `Viewing details for ${formData.indentNumber}` : 'Create a new material request'}</p>
            </div>
          </div>
          
          <div className="pi-header-right">
            {!isReadOnly && (
              <button
                className="pi-btn pi-btn-primary"
                onClick={handleSubmit}
                disabled={saving || submitting}
              >
                {submitting ? <Loader2 size={16} className="cpi-spin" /> : <Check size={16} />}
                Submit Indent
              </button>
            )}
          </div>
        </div>

        {/* -- Form Content -- */}
        <div className="pi-form-content">
          
          {/* General Information Section */}
          <div className="pi-section">
            <h2 className="pi-section-title">
              <span>General Information</span>
              <span className="pi-section-info">Indent # {formData.indentNumber || indentNumber}</span>
            </h2>
            
            <div className="pi-form-grid">
              <div className="pi-field">
                <label className="pi-label">Department</label>
                <input className="pi-input" value="QMS" readOnly />
              </div>

              <div className="pi-field">
                <label className="pi-label">Required Date</label>
                <input
                  type="date"
                  className="pi-input"
                  value={formData.requiredDate}
                  onChange={(e) => handleFieldChange('requiredDate', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>

              <div className="pi-field">
                <label className="pi-label">Priority</label>
                <select
                  className="pi-select"
                  value={formData.priority}
                  onChange={(e) => handleFieldChange('priority', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              
              <div className="pi-field pi-field-full" style={{ gridColumn: "1 / -1" }}>
                <label className="pi-label">Reason / Purpose</label>
                <textarea
                  className="pi-textarea"
                  placeholder="e.g., Restocking for Q4 production..."
                  value={formData.reason}
                  onChange={(e) => handleFieldChange('reason', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Material Details Section */}
          <div className="pi-section">
            <div className="pi-section-title">
              <span>Material Details</span>
              {!isReadOnly && (
                <button className="pi-btn pi-btn-add" onClick={handleAddRow} type="button">
                  <Plus size={14} />
                  Add Item
                </button>
              )}
            </div>

            <div className="pi-table-wrap">
              <table className="pi-table">
                <thead>
                  <tr>
                    <th className="pi-th">Material Name</th>
                    <th className="pi-th">Material Code</th>
                    <th className="pi-th">Location</th>
                    <th className="pi-th">Required Qty</th>
                    <th className="pi-th">Unit</th>
                    <th className="pi-th">Remarks</th>
                    <th className="pi-th" />
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
                      readOnly={isReadOnly}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approval Workflow */}
          <div className="pi-section">
            <h2 className="pi-section-title">Approval Workflow</h2>
            <div className="pi-workflow-steps">
              <div className="pi-step-item active">
                <div className="pi-step-circle">1</div>
                <div className="pi-step-label">Purchase Dept</div>
              </div>
              <div className="pi-step-item">
                <div className="pi-step-circle">2</div>
                <div className="pi-step-label">QMS Verification</div>
              </div>
              <div className="pi-step-item">
                <div className="pi-step-circle">3</div>
                <div className="pi-step-label">Admin Appoval</div>
              </div>
               <div className="pi-step-item">
                <div className="pi-step-circle">4</div>
                <div className="pi-step-label">Accountant</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreatePurchaseIndent;
