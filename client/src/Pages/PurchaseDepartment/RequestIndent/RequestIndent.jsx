import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react';
import './RequestIndent.css';
import { purchaseIndentService, storeRequestService } from '../../../services/apiService';

const getTodayDate = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const normalizePriority = (priority) => {
  const normalized = String(priority || '').trim().toLowerCase();
  if (normalized === 'critical') return 'Critical';
  if (['urgent', 'high'].includes(normalized)) return 'Urgent';
  return 'Normal';
};

const normalizeUnit = (unit) => {
  const normalized = String(unit || '').trim().toLowerCase();
  if (['kg', 'kgs', 'kilogram', 'kilograms'].includes(normalized)) return 'kg';
  if (['g', 'gram', 'grams'].includes(normalized)) return 'g';
  if (['ml', 'milliliter', 'millilitre', 'milliliters', 'millilitres'].includes(normalized)) return 'ml';
  if (['ltr', 'l', 'litre', 'liter', 'liters', 'litres'].includes(normalized)) return 'ltr';
  if (['pcs', 'pc', 'piece', 'pieces'].includes(normalized)) return 'pcs';
  if (['set', 'sets'].includes(normalized)) return 'sets';
  if (['sheet', 'sheets'].includes(normalized)) return 'sheets';
  return normalized || 'kg';
};

const parseQtyAndUnit = (qtyNeeded) => {
  const raw = String(qtyNeeded || '').trim();
  if (!raw) return { quantity: '', unit: 'kg' };
  const parts = raw.split(/\s+/);
  const quantity = parts[0] || '';
  const unit = normalizeUnit(parts.slice(1).join(' '));
  return { quantity, unit };
};

const emptyRow = () => ({
  _key: Date.now() + Math.random(),
  description: '',
  materialCode: '',
  quantity: '',
  unit: 'kg',
  remarks: ''
});

const RequestIndent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const storeRequest = location.state?.storeRequest;

  const initialRow = useMemo(() => {
    if (!storeRequest) return emptyRow();
    const { quantity, unit } = parseQtyAndUnit(storeRequest.qtyNeeded);
    return {
      _key: Date.now() + Math.random(),
      description: storeRequest.material || '',
      materialCode: storeRequest.code || '',
      quantity,
      unit,
      remarks: storeRequest.specs || ''
    };
  }, [storeRequest]);

  const [indentNumber, setIndentNumber] = useState('');
  const [formData, setFormData] = useState({
    requestDate: storeRequest?.neededDateRaw || getTodayDate(),
    priority: normalizePriority(storeRequest?.priority),
    reason: storeRequest?.reason && storeRequest.reason !== '-' ? storeRequest.reason : ''
  });
  const [rows, setRows] = useState([initialRow]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadNextIndentNumber = async () => {
      try {
        const response = await purchaseIndentService.getPurchaseDeptIndents();
        const indents = response?.data || [];
        const currentYear = new Date().getFullYear();
        const sequenceNumbers = indents
          .map((indent) => String(indent.indent_number || '').match(/^IND-(\d{4})-(\d+)$/i))
          .filter(Boolean)
          .filter((match) => Number(match[1]) === currentYear)
          .map((match) => Number(match[2]))
          .filter((value) => Number.isFinite(value));

        const nextSequence = (sequenceNumbers.length ? Math.max(...sequenceNumbers) : 0) + 1;
        const nextIndentNumber = `IND-${currentYear}-${String(nextSequence).padStart(3, '0')}`;

        if (isActive) {
          setIndentNumber(nextIndentNumber);
        }
      } catch (err) {
        console.error('Failed to load next indent number:', err);
        if (isActive) {
          setIndentNumber(`IND-${new Date().getFullYear()}-001`);
        }
      }
    };

    loadNextIndentNumber();

    return () => {
      isActive = false;
    };
  }, []);

  if (!storeRequest) {
    return (
      <div className="ri-page">
        <div className="ri-empty">
          <h2>No Store Request Selected</h2>
          <p>Open this screen from Purchase Department Store Requests using Create Indent.</p>
          <button className="ri-btn ri-btn-primary" onClick={() => navigate('/store-requests')}>
            Back to Store Requests
          </button>
        </div>
      </div>
    );
  }

  const handleRowChange = (index, key, value) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, emptyRow()]);
  };

  const handleDeleteRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!formData.requestDate) {
      alert('Requested date is required.');
      return false;
    }
    const validRows = rows.filter((r) => r.description.trim());
    if (validRows.length === 0) {
      alert('Add at least one material row.');
      return false;
    }
    for (const row of validRows) {
      if (!row.quantity || Number(row.quantity) <= 0) {
        alert(`Enter a valid quantity for ${row.description || 'material'}.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmitIndent = async () => {
    if (!validate()) return;

    const validRows = rows.filter((r) => r.description.trim());
    const payload = {
      indentNumber,
      requestDate: formData.requestDate,
      priority: normalizePriority(formData.priority),
      reason: formData.reason || `Created from store request ${storeRequest.id}`,
      status: 'Pending QMS Verification',
      workflowStage: 'QMS Init',
      materials: validRows.map((r) => ({
        description: r.description,
        quantity: Number(r.quantity),
        unit: r.unit,
        specifications: r.remarks || null
      }))
    };

    try {
      setSubmitting(true);
      const response = await purchaseIndentService.createPurchaseDeptIndent(payload);
      const createdIndent = response?.data || {};
      const createdIndentId = createdIndent.indent_id || null;

      await storeRequestService.updateRequest(storeRequest.requestId || storeRequest.id, {
        status: 'Processed',
        indentId: createdIndentId,
        remarks: createdIndent.indent_number
          ? `Converted to purchase indent ${createdIndent.indent_number}`
          : 'Converted to purchase indent'
      });

      alert('Purchase indent created successfully.');
      navigate('/store-requests');
    } catch (err) {
      console.error('Failed to create request indent:', err);
      alert(err.message || 'Failed to create purchase indent.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ri-page">
      <div className="ri-header">
        <button className="ri-btn ri-btn-icon" onClick={() => navigate('/store-requests')}>
          <ArrowLeft size={16} />
        </button>
        <h1>Request Indent</h1>
      </div>

      <div className="ri-card">
        <h2>Request Details</h2>
        <div className="ri-grid">
          <div><span>Request ID</span><strong>{storeRequest.id}</strong></div>
          <div><span>Material</span><strong>{storeRequest.material}</strong></div>
          <div><span>Requested Qty</span><strong>{storeRequest.qtyNeeded}</strong></div>
          <div><span>Needed Date</span><strong>{storeRequest.neededDate || '-'}</strong></div>
          <div><span>Priority</span><strong>{normalizePriority(storeRequest.priority)}</strong></div>
        </div>
      </div>

      <div className="ri-card">
        <h2>Indent Information</h2>
        <div className="ri-form-grid">
          <div>
            <label>Indent Number</label>
            <input value={indentNumber || 'Will be generated on submit'} readOnly />
          </div>
          <div>
            <label>Request Date</label>
            <input
              type="date"
              value={formData.requestDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, requestDate: e.target.value }))}
            />
          </div>
          <div>
            <label>Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
            >
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
        <div className="ri-full-field">
          <label>Reason</label>
          <textarea
            rows={3}
            value={formData.reason}
            onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Enter reason for this indent"
          />
        </div>
      </div>

      <div className="ri-card">
        <div className="ri-card-head-row">
          <h2>Materials</h2>
          <button className="ri-btn ri-btn-secondary" onClick={handleAddRow} type="button">
            <Plus size={14} /> Add Row
          </button>
        </div>
        <div className="ri-table-wrap">
          <table className="ri-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Material Code</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Remarks</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row._key}>
                  <td>
                    <input
                      value={row.description}
                      onChange={(e) => handleRowChange(idx, 'description', e.target.value)}
                      placeholder="Material name"
                    />
                  </td>
                  <td>
                    <input
                      value={row.materialCode}
                      onChange={(e) => handleRowChange(idx, 'materialCode', e.target.value)}
                      placeholder="Code"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={row.quantity}
                      onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                      placeholder="0"
                    />
                  </td>
                  <td>
                    <select
                      value={row.unit}
                      onChange={(e) => handleRowChange(idx, 'unit', e.target.value)}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="ltr">ltr</option>
                      <option value="pcs">pcs</option>
                      <option value="sets">sets</option>
                      <option value="sheets">sheets</option>
                    </select>
                  </td>
                  <td>
                    <input
                      value={row.remarks}
                      onChange={(e) => handleRowChange(idx, 'remarks', e.target.value)}
                      placeholder="Optional"
                    />
                  </td>
                  <td>
                    {rows.length > 1 && (
                      <button
                        className="ri-btn ri-btn-danger"
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        title="Remove row"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ri-footer">
        <button className="ri-btn ri-btn-secondary" onClick={() => navigate('/store-requests')}>
          Cancel
        </button>
        <button className="ri-btn ri-btn-primary" onClick={handleSubmitIndent} disabled={submitting}>
          <Check size={15} />
          {submitting ? 'Creating...' : 'Create Indent'}
        </button>
      </div>
    </div>
  );
};

export default RequestIndent;
