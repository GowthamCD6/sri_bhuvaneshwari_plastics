import React, { useEffect, useState } from 'react';
import './NewOrderModal.css';
import formulaCalculatorService from '../../../../services/formulaCalculatorService';

// Inline SVGs for pixel-perfect icons without external libraries
const Icons = {
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ),
  Phone: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
  ),
  Mail: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
  ),
  Box: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  ),
  Calendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  Hash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
  ),
  Package: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  )
};

// Generate unique Order ID
const generateOrderId = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 900) + 100;
  return `ORD-${year}-${randomNum}`;
};

// Generate unique Indent ID
const generateIndentId = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 900) + 100;
  return `IND-${year}-${randomNum}`;
};

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

const uniqueStrings = (values) => [...new Set(values.filter(Boolean))];

const NewOrderModal = ({ onClose, onSubmit }) => {
  // Form state for customer info and indent details
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    email: '',
    indentId: '',
    indentDate: getTodayDate()
  });

  // Items state - array of items for the order
  const [items, setItems] = useState([
    { id: 1, component: '', rawMaterial: '', quantity: '', unit: 'kg', requiredByDate: '' }
  ]);

  const [formulaRows, setFormulaRows] = useState([]);
  const [formulaRowsLoading, setFormulaRowsLoading] = useState(true);

  // Error state
  const [errors, setErrors] = useState({});
  const [itemErrors, setItemErrors] = useState({});
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadFormulaRows = async () => {
      try {
        const data = await formulaCalculatorService.getDefaultCalculator();
        if (!isActive) return;

        setFormulaRows(Array.isArray(data?.rows) ? data.rows : []);
      } catch (error) {
        console.error('Failed to load formula rows:', error);
        if (isActive) {
          setFormulaRows([]);
        }
      } finally {
        if (isActive) {
          setFormulaRowsLoading(false);
        }
      }
    };

    loadFormulaRows();

    return () => {
      isActive = false;
    };
  }, []);

  const getRawMaterialOptions = (componentName) => {
    const normalizedComponent = normalizeText(componentName);
    if (!normalizedComponent) return [];

    const exactMatches = formulaRows.filter(
      (row) => normalizeText(row.part_name) === normalizedComponent
    );

    const candidateRows = exactMatches.length > 0
      ? exactMatches
      : formulaRows.filter(
          (row) =>
            normalizeText(row.part_name).includes(normalizedComponent) ||
            normalizedComponent.includes(normalizeText(row.part_name))
        );

    return uniqueStrings(candidateRows.map((row) => String(row.raw_material || '').trim()));
  };

  // Handle input change for main form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle input change for item fields
  const handleItemChange = (itemId, field, value) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
    
    // Clear error when user starts typing
    if (itemErrors[`${itemId}_${field}`]) {
      setItemErrors(prev => ({
        ...prev,
        [`${itemId}_${field}`]: ''
      }));
    }
  };

  // Add new item
  const addItem = () => {
    const newId = Math.max(...items.map(item => item.id)) + 1;
    setItems(prev => [...prev, { id: newId, component: '', rawMaterial: '', quantity: '', unit: 'kg', requiredByDate: '' }]);
  };

  // Remove item
  const removeItem = (itemId) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== itemId));
      // Clear errors for removed item
      setItemErrors(prev => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach(key => {
          if (key.startsWith(`${itemId}_`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    const newItemErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[+]?[\d\s-]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Enter a valid phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.indentId.trim()) {
      newErrors.indentId = 'Indent ID is required';
    }

    if (!formData.indentDate) {
      newErrors.indentDate = 'Indent date is required';
    }

    // Validate each item
    items.forEach(item => {
      if (!item.component.trim()) {
        newItemErrors[`${item.id}_component`] = 'Component is required';
      }
      if (!item.rawMaterial.trim()) {
        newItemErrors[`${item.id}_rawMaterial`] = 'Raw material is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        newItemErrors[`${item.id}_quantity`] = 'Enter a valid quantity';
      }
      if (!item.requiredByDate) {
        newItemErrors[`${item.id}_requiredByDate`] = 'Required by date is required';
      }
    });

    setErrors(newErrors);
    setItemErrors(newItemErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newItemErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Format order object for backend API
    const newOrder = {
      indent_id: formData.indentId,
      customer_name: formData.customerName,
      customer_phone: formData.phoneNumber,
      customer_email: formData.email,
      indent_date: formData.indentDate,
      priority: 'Standard',
      items: items.map(item => ({
        component: item.component,
        rawMaterial: item.rawMaterial,
        quantity: parseInt(item.quantity),
        unit: item.unit,
        required_by_date: item.requiredByDate
      }))
    };

    try {
      // Call onSubmit callback if provided
      if (onSubmit) {
        await onSubmit(newOrder);
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">New Customer Order</h2>
          <button className="close-btn" onClick={onClose} type="button">
            <Icons.Close />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-content-wrapper">
              
              {/* --- Section 1: Customer Information --- */}
              <div className="form-section">
                <h3 className="section-title">Customer Information</h3>
                <p className="section-subtitle">Enter the contact details for the customer placing the order.</p>

                {/* Customer Name */}
                <div className="form-group">
                  <label className="input-label">Customer Name <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <div className="input-icon"><Icons.User /></div>
                    <input 
                      type="text" 
                      name="customerName"
                      className={`form-input has-icon ${errors.customerName ? 'input-error' : ''}`}
                      placeholder="e.g. Acme Industries Ltd." 
                      value={formData.customerName}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.customerName && <span className="error-message">{errors.customerName}</span>}
                </div>

                {/* Phone & Email Row */}
                <div className="form-row">
                  <div className="form-group half-width">
                    <label className="input-label">Phone Number <span className="required">*</span></label>
                    <div className="input-wrapper">
                      <div className="input-icon"><Icons.Phone /></div>
                      <input 
                        type="text" 
                        name="phoneNumber"
                        className={`form-input has-icon ${errors.phoneNumber ? 'input-error' : ''}`}
                        placeholder="+91 98765 43210" 
                        value={formData.phoneNumber}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                  </div>
                  <div className="form-group half-width">
                    <label className="input-label">Email Address <span className="required">*</span></label>
                    <div className="input-wrapper">
                      <div className="input-icon"><Icons.Mail /></div>
                      <input 
                        type="email" 
                        name="email"
                        className={`form-input has-icon ${errors.email ? 'input-error' : ''}`}
                        placeholder="contact@company.com" 
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                </div>
              </div>

              <hr className="divider" />

              {/* --- Section 2: Order Details --- */}
              <div className="form-section">
                <h3 className="section-title">Order Details</h3>
                <p className="section-subtitle">Specify the indent ID and order items.</p>

                {/* Indent ID & Indent Date Row */}
                <div className="form-row">
                  <div className="form-group half-width">
                    <label className="input-label">Indent ID <span className="required">*</span></label>
                    <div className="input-wrapper">
                      <div className="input-icon"><Icons.Hash /></div>
                      <input 
                        type="text" 
                        name="indentId"
                        className={`form-input has-icon ${errors.indentId ? 'input-error' : ''}`}
                        placeholder="e.g. IND-2026-001" 
                        value={formData.indentId}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.indentId && <span className="error-message">{errors.indentId}</span>}
                  </div>
                  <div className="form-group half-width">
                    <label className="input-label">Indent Date <span className="required">*</span></label>
                    <div className="input-wrapper">
                      <div className="input-icon"><Icons.Calendar /></div>
                      <input 
                        type="date" 
                        name="indentDate"
                        className={`form-input has-icon ${errors.indentDate ? 'input-error' : ''}`}
                        value={formData.indentDate}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.indentDate && <span className="error-message">{errors.indentDate}</span>}
                  </div>
                </div>
              </div>

              <hr className="divider" />

              {/* --- Section 3: Order Items --- */}
              <div className="form-section">
                <div className="section-header-row">
                  <div>
                    <h3 className="section-title">Order Items</h3>
                    <p className="section-subtitle">Add components and quantities for this order.</p>
                  </div>
                  <button type="button" className="btn btn-add-item" onClick={addItem}>
                    <Icons.Plus />
                    Add Item
                  </button>
                </div>

                {/* Items List */}
                <div className="items-list">
                  {items.map((item, index) => (
                    <div key={item.id} className="item-card">
                      <div className="item-header">
                        <span className="item-number">Item {index + 1}</span>
                        {items.length > 1 && (
                          <button 
                            type="button" 
                            className="btn-remove-item" 
                            onClick={() => removeItem(item.id)}
                            title="Remove item"
                          >
                            <Icons.Trash />
                          </button>
                        )}
                      </div>

                      {/* Component Requested */}
                      <div className="form-group">
                        <label className="input-label">Component Requested <span className="required">*</span></label>
                        <div className="input-wrapper">
                          <div className="input-icon"><Icons.Box /></div>
                          <input 
                            type="text" 
                            className={`form-input has-icon ${itemErrors[`${item.id}_component`] ? 'input-error' : ''}`}
                            placeholder="e.g. 500ml PET Bottle Preform" 
                            value={item.component}
                            onChange={(e) => {
                              handleItemChange(item.id, 'component', e.target.value);
                              handleItemChange(item.id, 'rawMaterial', '');
                            }}
                          />
                        </div>
                        {itemErrors[`${item.id}_component`] && <span className="error-message">{itemErrors[`${item.id}_component`]}</span>}
                      </div>

                      {/* Raw Material Requested */}
                      <div className="form-group">
                        <label className="input-label">Raw Material Requested <span className="required">*</span></label>
                        <div className="input-wrapper">
                          <div className="input-icon"><Icons.Package /></div>
                          {getRawMaterialOptions(item.component).length > 0 ? (
                            <select
                              className={`form-input has-icon ${itemErrors[`${item.id}_rawMaterial`] ? 'input-error' : ''}`}
                              value={item.rawMaterial}
                              onChange={(e) => handleItemChange(item.id, 'rawMaterial', e.target.value)}
                              disabled={formulaRowsLoading}
                            >
                              <option value="">Select raw material</option>
                              {getRawMaterialOptions(item.component).map((rawMaterial) => (
                                <option key={rawMaterial} value={rawMaterial}>
                                  {rawMaterial}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              className={`form-input has-icon ${itemErrors[`${item.id}_rawMaterial`] ? 'input-error' : ''}`}
                              placeholder={formulaRowsLoading ? 'Loading raw materials...' : 'Enter raw material'}
                              value={item.rawMaterial}
                              onChange={(e) => handleItemChange(item.id, 'rawMaterial', e.target.value)}
                            />
                          )}
                        </div>
                        {itemErrors[`${item.id}_rawMaterial`] && <span className="error-message">{itemErrors[`${item.id}_rawMaterial`]}</span>}
                        {!formulaRowsLoading && item.component.trim() && getRawMaterialOptions(item.component).length === 0 && (
                          <span className="section-subtitle" style={{ marginTop: '6px', marginBottom: 0 }}>
                            No formula mapping found for this component. Enter the raw material manually.
                          </span>
                        )}
                      </div>

                      {/* Quantity, Unit & Date Row */}
                      <div className="form-row">
                        <div className="form-group" style={{flex: '0 0 30%'}}>
                          <label className="input-label">Quantity <span className="required">*</span></label>
                          <input 
                            type="number" 
                            className={`form-input ${itemErrors[`${item.id}_quantity`] ? 'input-error' : ''}`}
                            placeholder="0" 
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          />
                          {itemErrors[`${item.id}_quantity`] && <span className="error-message">{itemErrors[`${item.id}_quantity`]}</span>}
                        </div>
                        <div className="form-group" style={{flex: '0 0 30%'}}>
                          <label className="input-label">Unit <span className="required">*</span></label>
                          <div className="input-wrapper">
                            <div className="input-icon"><Icons.Package /></div>
                            <select
                              className="form-input has-icon"
                              value={item.unit}
                              onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                            >
                              <option value="kg">Kilograms (kg)</option>
                              <option value="g">Grams (g)</option>
                              <option value="pcs">Pieces (pcs)</option>
                              <option value="box">Box</option>
                              <option value="ltr">Liters (ltr)</option>
                              <option value="m">Meters (m)</option>
                            </select>
                          </div>
                        </div>
                        <div className="form-group" style={{flex: '1'}}>
                          <label className="input-label">Required By Date <span className="required">*</span></label>
                          <div className="input-wrapper">
                            <div className="input-icon"><Icons.Calendar /></div>
                            <input 
                              type="date" 
                              className={`form-input has-icon ${itemErrors[`${item.id}_requiredByDate`] ? 'input-error' : ''}`}
                              value={item.requiredByDate}
                              onChange={(e) => handleItemChange(item.id, 'requiredByDate', e.target.value)}
                            />
                          </div>
                          {itemErrors[`${item.id}_requiredByDate`] && <span className="error-message">{itemErrors[`${item.id}_requiredByDate`]}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>Creating...</>
              ) : (
                <>
                  <Icons.Plus />
                  Create Order
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default NewOrderModal;