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

const formatDateForInput = (value) => {
  if (!value) return getTodayDate();

  if (typeof value === 'string') {
    const match = value.match(/^\d{4}-\d{2}-\d{2}$/); // only exact match YYYY-MM-DD
    if (match) return match[0];
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return getTodayDate();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  const [indentNumber] = useState(() => {
    return location.state?.storeRequest?.id || generateIndentNumber();
  });
  const [formData, setFormData] = useState({
    department: 'Store',
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
  const passedIndentId = location.state?.indentId || viewIndentData?.indentId || viewIndentData?.indent_id;
  const readOnlyMode = location.state?.readOnly;

  const targetIndentId = passedIndentId || viewIndentData?.indentId || viewIndentData?.indent_id;
  const [currentIndentId, setCurrentIndentId] = useState(targetIndentId || null);

  useEffect(() => {
    const mapPriority = (p) => {
      if (!p) return 'Normal';
      const l = p.toString().toLowerCase();
      if (l === 'high') return 'High';
      if (l === 'urgent') return 'Urgent';
      return 'Normal';
    };

    const mapRowData = (m, catalog = allMaterials) => {
      const matDesc = (m.material_description || m.material_name || m.description || '').trim();
      const matCode = (m.material_code || m.raw_material || m.materialCode || '').trim();
      
      const matched = catalog.find(mat => 
        (m.material_id && mat.material_id === m.material_id) ||
        (matDesc && mat.material_name?.toLowerCase().trim() === matDesc.toLowerCase()) ||
        (matCode && mat.material_code?.toLowerCase().trim() === matCode.toLowerCase())
      );

      return {
        _key: m.indent_material_id || Math.random(),
        materialId: m.material_id || matched?.material_id || null,
        description: matDesc || matched?.material_name || '',
        materialCode: matCode || matched?.material_code || '',
        warehouseLocation: m.warehouse_location || matched?.warehouse_location || '',
        currentStock: m.current_stock ?? m.stock_quantity ?? matched?.current_stock ?? '',
        quantity: m.quantity || '',
        unit: m.unit_of_measurement || m.unit || matched?.unit_of_measurement || 'Kg',
        remarks: m.specifications || m.remarks || ''
      };
    };

    if (viewIndentData || targetIndentId) {
      setIsReadOnly(!!readOnlyMode);
      if (targetIndentId) setCurrentIndentId(targetIndentId);

      if (viewIndentData) {
        setFormData(prev => ({
          ...prev,
          indentNumber: viewIndentData.id || viewIndentData.indent_number || prev.indentNumber,
          department: viewIndentData.department || 'Store',
          requiredDate: formatDateForInput(viewIndentData.rawRequiredDate || viewIndentData.required_by_date || viewIndentData.request_date),
          priority: mapPriority(viewIndentData.priority),
          reason: viewIndentData.reason || viewIndentData.remarks || viewIndentData.justification || '',
          status: viewIndentData.status || '',
          workflowStage: viewIndentData.workflow_stage || viewIndentData.workflowStage || ''
        }));

        const mats = viewIndentData.materials || [];
        if (mats.length > 0) {
          setRows(mats.map(m => mapRowData(m)));
        }
      }

      // Always fetch latest record from API if indentId is present to guarantee DB accuracy
      if (targetIndentId) {
        purchaseIndentService.getIndentById(targetIndentId)
          .then(res => {
            if (res.success && res.data) {
              const indent = res.data;
              setCurrentIndentId(indent.indent_id);
              setFormData(prev => ({
                ...prev,
                indentNumber: indent.indent_number || indent.id || prev.indentNumber,
                department: indent.department || 'Store',
                requiredDate: formatDateForInput(indent.required_by_date || indent.request_date),
                priority: mapPriority(indent.priority),
                reason: indent.reason || indent.remarks || indent.justification || viewIndentData?.reason || viewIndentData?.remarks || '',
                status: indent.status,
                workflowStage: indent.workflow_stage
              }));

              const fetchedMats = indent.materials || [];
              if (fetchedMats.length > 0) {
                setRows(fetchedMats.map(m => mapRowData(m)));
              }
            }
          })
          .catch(() => {});
      }
    } else if (storeRequest) {
      setFormData(prev => ({
        ...prev,
        requiredDate: formatDateForInput(storeRequest.neededDate || storeRequest.neededDateRaw),
        priority: storeRequest.priority || 'Normal',
        reason: storeRequest.reason || ''
      }));
      
      setRows([{
        _key: Date.now(),
        materialId: null,
        description: storeRequest.material,
        materialCode: storeRequest.code || '',
        warehouseLocation: '',
        currentStock: '',
        quantity: storeRequest.quantity,
        unit: storeRequest.unit || 'Kg',
        remarks: storeRequest.specs || ''
      }]);
    }
  }, [storeRequest, viewIndentData, targetIndentId, readOnlyMode, allMaterials]);

  useEffect(() => {
    materialService.getAllMaterials()
      .then((res) => {
        const materials = res.materials || res.data || [];
        setAllMaterials(materials);
        
        // Enrich rows with materials catalog data
        setRows(prevRows => prevRows.map(row => {
          if (!row.description && !row.materialId) return row;
          const matched = materials.find(m => 
            (row.materialId && m.material_id === row.materialId) ||
            (row.description && m.material_name?.toLowerCase().trim() === row.description.toLowerCase().trim()) ||
            (row.materialCode && m.material_code?.toLowerCase().trim() === row.materialCode.toLowerCase().trim())
          );
          if (matched) {
            return {
              ...row,
              materialId: row.materialId || matched.material_id,
              materialCode: row.materialCode || matched.material_code || '',
              warehouseLocation: row.warehouseLocation || matched.warehouse_location || '',
              currentStock: row.currentStock !== '' ? row.currentStock : (matched.current_stock ?? matched.stock_quantity ?? ''),
              unit: row.unit || matched.unit_of_measurement || 'Kg'
            };
          }
          return row;
        }));
      })
      .catch((err) => {});
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const userRole = user?.roleName?.toLowerCase() || '';
  const isQmsOrAdmin = userRole === 'qms' || userRole === 'admin';
  const isPendingVerification = 
    formData.status === 'Pending QMS Verification' || 
    formData.status === 'Pending QMS Approval' || 
    formData.status === 'Pending Admin Approval' || 
    ['Purchase Dept', 'QMS Init', 'QMS Verified', 'Admin'].includes(formData.workflowStage);
  const canQmsVerify = isQmsOrAdmin && isReadOnly && currentIndentId && isPendingVerification && formData.status !== 'Rejected';

  const handleQmsApprove = async () => {
    try {
      setSubmitting(true);
      await purchaseIndentService.sendToNextStage(currentIndentId, { comments: 'Approved by QMS' });
      showToast('success', 'Indent approved successfully.');
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      showToast('error', err.message || 'Failed to approve indent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQmsReject = async () => {
    try {
      setSubmitting(true);
      await purchaseIndentService.updateIndentStatus(currentIndentId, {
        status: 'Rejected',
        comments: 'Rejected by QMS',
      });
      showToast('success', 'Indent rejected.');
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      showToast('error', err.message || 'Failed to reject indent');
    } finally {
      setSubmitting(false);
    }
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
        buildPayload('Pending QMS Verification', 'Purchase Dept')
      );
      if (storeRequest && storeRequest.id && response.data?.indent_id) {
        await storeRequestService.updateRequest(storeRequest.id, {
          status: 'Processed',
          indentId: response.data.indent_id
        });
      }
      showToast('success', 'Indent submitted successfully.');
      setTimeout(() => navigate('/qms-indents'), 1500);
    } catch (err) {
      showToast('error', err.message || 'Failed to submit indent.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepState = (stepNumber) => {
    const stage = formData.workflowStage || 'Purchase Dept';
    const status = formData.status;

    if (status === 'Rejected') return stepNumber === 1 ? 'active' : '';

    if (stepNumber === 1) return 'active';
    if (stepNumber === 2) {
      if (['Purchase Dept', 'QMS Init'].includes(stage)) return 'active';
      if (['Admin', 'Accountant', 'Completed'].includes(stage)) return 'active';
      return '';
    }
    if (stepNumber === 3) {
      if (stage === 'Admin') return 'active';
      if (['Accountant', 'Completed'].includes(stage)) return 'active';
      return '';
    }
    if (stepNumber === 4) {
      if (['Accountant', 'Completed'].includes(stage)) return 'active';
      return '';
    }
    return '';
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
            {canQmsVerify && (
              <>
                <button
                  className="pi-btn"
                  style={{ background: '#ef4444', color: 'white' }}
                  onClick={handleQmsReject}
                  disabled={submitting}
                >
                  Reject Indent
                </button>
                <button
                  className="pi-btn"
                  style={{ background: '#10b981', color: 'white' }}
                  onClick={handleQmsApprove}
                  disabled={submitting}
                >
                  Approve & Verify
                </button>
              </>
            )}
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
                <input className="pi-input" value={formData.department} readOnly />
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
                  value={formData.reason || (isReadOnly ? 'No specific reason specified (Standard material request)' : '')}
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
              <div className={`pi-step-item ${getStepState(1)}`}>
                <div className="pi-step-circle">1</div>
                <div className="pi-step-label">Purchase Dept</div>
              </div>
              <div className={`pi-step-item ${getStepState(2)}`}>
                <div className="pi-step-circle">2</div>
                <div className="pi-step-label">QMS Verification</div>
              </div>
              <div className={`pi-step-item ${getStepState(3)}`}>
                <div className="pi-step-circle">3</div>
                <div className="pi-step-label">Admin Approval</div>
              </div>
              <div className={`pi-step-item ${getStepState(4)}`}>
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
