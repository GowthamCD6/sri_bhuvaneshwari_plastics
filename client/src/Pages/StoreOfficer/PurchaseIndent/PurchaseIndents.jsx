import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, X, Plus, Search, ExternalLink, Save, Send, Filter, Check, GitBranch, User } from 'lucide-react';
import './PurchaseIndents.css';

const NewPurchaseIndent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're in verify mode or view mode
  const isVerifyMode = location.state?.verifyMode || false;
  const isViewMode = location.state?.viewMode || false;
  const indentToVerify = location.state?.indentData || null;
  
  // Initialize with localStorage data or defaults
  const [materials, setMaterials] = useState(() => {
    const saved = localStorage.getItem('purchaseIndentMaterials');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        description: 'EN8 Round Bar – 20 mm',
        preferredSupplier: 'ABC Steels Pvt Ltd',
        requiredQuantity: '1,000 kg',
        requiredDate: '25 Jan 2026',
        onHand: '250 kg',
        order: '750 kg',
        status: 'pending',
        uom: 'kg'
      },
      {
        id: 2,
        description: 'CI Bush – Size 30 × 40 × 25',
        preferredSupplier: 'Universal Castings',
        requiredQuantity: '500 Nos',
        requiredDate: '28 Jan 2026',
        onHand: '60 Nos',
        order: '440 Nos',
        status: 'pending',
        uom: 'Nos'
      },
      {
        id: 3,
        description: 'MS Sheet – 2 mm',
        preferredSupplier: 'Metro Metals',
        requiredQuantity: '50 Sheets',
        requiredDate: '30 Jan 2026',
        onHand: '0',
        order: '50',
        status: 'pending',
        uom: 'Sheets'
      }
    ];
  });

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('purchaseIndentForm');
    return saved ? JSON.parse(saved) : {
      department: '',
      requestedBy: '',
      priority: 'Medium',
      indentNumber: 'PI-2025-001',
      indentDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      requiredByDate: '',
      justification: '',
      customerPart: '',
      orderQuantity: '',
      poNumber: '',
      poDate: '',
      rmRate: '',
      piecesPerKg: '',
      rmPercentage: '',
      status: 'draft'
    };
  });

  const [isEditingMaterial, setIsEditingMaterial] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handle verification of indent
  const handleVerifyIndent = () => {
    if (window.confirm(`Are you sure you want to verify and approve indent ${indentToVerify?.id}?`)) {
      // In real app, this would make an API call to verify the indent
      alert(`Indent ${indentToVerify?.id} has been verified and approved successfully!`);
      navigate('/verify-store-indents');
    }
  };

  // Populate form data when in verify mode or view mode
  useEffect(() => {
    if ((isVerifyMode || isViewMode) && indentToVerify) {
      setFormData({
        department: indentToVerify.project || '',
        requestedBy: indentToVerify.raisedBy || '',
        priority: indentToVerify.priority?.replace(' Priority', '') || 'Medium',
        indentNumber: indentToVerify.id || '',
        indentDate: indentToVerify.date || '',
        requiredByDate: indentToVerify.date || '',
        justification: `Store indent for ${indentToVerify.project}`,
        customerPart: indentToVerify.orderId || '',
        orderQuantity: indentToVerify.itemCount?.replace(' Items', '') || '',
        poNumber: indentToVerify.orderId || '',
        poDate: indentToVerify.date || '',
        rmRate: '',
        piecesPerKg: '',
        rmPercentage: '',
        status: 'submitted'
      });
      
      // Set materials based on indent data
      if (indentToVerify.storeAvailable && indentToVerify.storeToBuy !== undefined) {
        const verifyMaterials = [
          {
            id: 1,
            description: `Materials for ${indentToVerify.project}`,
            preferredSupplier: 'To be assigned',
            requiredQuantity: `${indentToVerify.storeAvailable + indentToVerify.storeToBuy} units`,
            requiredDate: indentToVerify.date,
            onHand: `${indentToVerify.storeAvailable} units`,
            order: `${indentToVerify.storeToBuy} units`,
            status: 'pending',
            uom: 'units'
          }
        ];
        setMaterials(verifyMaterials);
      }
    }
  }, [isVerifyMode, indentToVerify]);
  const [showStock, setShowStock] = useState(false);
  const [groupBySupplier, setGroupBySupplier] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Clear validation errors when user starts typing
  const clearFieldError = (fieldName) => {
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const workflowSteps = [
    {
      key: 'qms-init',
      title: 'QMS Initiated',
      subtitle: 'Quality team created indent',
      actor: 'QMS',
      user: 'S. Chen (QMS)',
      date: 'Oct 24, 09:30 AM',
      status: 'completed'
    },
    {
      key: 'store-officer',
      title: 'Store Officer Review',
      subtitle: 'Stock and requirement verification',
      actor: 'Store Officer',
      user: 'R. Kumar (Store)',
      date: 'Oct 24, 11:45 AM',
      note: '"Specs match production requirement. Approved."',
      status: 'completed'
    },
    {
      key: 'qms-verified',
      title: 'QMS Verified',
      subtitle: 'Final quality verification',
      actor: 'QMS',
      user: null,
      date: null,
      status: 'current'
    },
    {
      key: 'admin',
      title: 'Admin Approval',
      subtitle: 'Pending final authorization',
      actor: 'Admin',
      user: null,
      date: null,
      status: 'pending'
    },
    {
      key: 'accountant',
      title: 'Accountant Processing',
      subtitle: 'Purchase order and billing process',
      actor: 'Accountant',
      user: null,
      date: null,
      status: 'pending'
    },
  ];

  const getCurrentWorkflowIndex = () => {
    const status = String(formData.status || '').toLowerCase();
    if (status === 'draft') return 2; // Awaiting Admin
    if (status === 'submitted') return 2; // Awaiting Admin
    if (status === 'approved') return 3; // Purchase Order
    return 2;
  };

  const currentWorkflowIndex = getCurrentWorkflowIndex();

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem('purchaseIndentMaterials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('purchaseIndentForm', JSON.stringify(formData));
  }, [formData]);

  // Generate indent number
  const generateIndentNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PI-${year}${month}${day}-${random}`;
  };

  // Handle add material
  const handleAddMaterial = () => {
    const newMaterial = {
      id: Date.now(),
      description: '',
      preferredSupplier: '',
      requiredQuantity: '',
      requiredDate: '',
      onHand: '0',
      order: '',
      status: 'pending',
      uom: 'kg',
      isEditing: true
    };
    setMaterials([...materials, newMaterial]);
    setIsEditingMaterial(newMaterial.id);    clearFieldError('materials');
    };

  // Handle remove material
  const handleRemoveMaterial = (id) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  // Handle edit material
  const handleEditMaterial = (id) => {
    setIsEditingMaterial(id);
    setMaterials(materials.map(m => 
      m.id === id ? { ...m, isEditing: true } : m
    ));
  };

  // Handle save material edits
  const handleSaveMaterial = (id, updatedFields) => {
    setMaterials(materials.map(m => 
      m.id === id ? { ...m, ...updatedFields, isEditing: false } : m
    ));
    setIsEditingMaterial(null);
  };

  // Handle material field change
  const handleMaterialChange = (id, field, value) => {
    setMaterials(materials.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  // Calculate total order quantity
  const calculateTotalOrder = () => {
    return materials.reduce((total, material) => {
      const orderQty = parseFloat(material.order) || 0;
      return total + orderQty;
    }, 0);
  };

  // Handle form submission
  const handleSubmit = (action) => {
    // Clear any existing success messages
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.success;
      return newErrors;
    });

    if (action === 'save') {
      setFormData({...formData, status: 'draft'});
      setValidationErrors({ success: 'Draft saved successfully!' });
      setTimeout(() => setValidationErrors({}), 3000);
    } else if (action === 'submit') {
      const errors = {};
      
      // Check required fields
      if (!formData.department || formData.department.trim() === '') {
        errors.department = 'Department is required';
      }
      if (!formData.requestedBy || formData.requestedBy.trim() === '') {
        errors.requestedBy = 'Requested by field is required';
      }
      if (!materials || materials.length === 0) {
        errors.materials = 'Please add at least one material';
      }
      
      // If there are validation errors, show them and don't submit
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        console.log('Validation errors:', errors); // Debug log
        return;
      }
      
      // If validation passes, submit the form
      setFormData({
        ...formData, 
        status: 'submitted',
        indentNumber: generateIndentNumber(),
        submittedDate: new Date().toISOString()
      });
      setValidationErrors({ success: 'Purchase indent submitted for approval!' });
      setTimeout(() => setValidationErrors({}), 3000);
    }
  };

  // Handle date picker
  const handleDateSelect = (field, date) => {
    setFormData({...formData, [field]: date});
  };

  // Filter materials based on search
  const filteredMaterials = materials.filter(material => 
    material.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.preferredSupplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group materials by supplier
  const groupedMaterials = groupBySupplier 
    ? materials.reduce((groups, material) => {
        const supplier = material.preferredSupplier || 'No Supplier';
        if (!groups[supplier]) groups[supplier] = [];
        groups[supplier].push(material);
        return groups;
      }, {})
    : null;

  // Render material card with edit capability
  const renderMaterialCard = (material, index) => {
    if (material.isEditing) {
      return (
        <div key={material.id} className="pi-material-card editing">
          <div className="pi-material-number">{index + 1}</div>
          <div className="pi-material-content">
            <div className="pi-material-column">
              <div className="pi-material-label">Material description</div>
              <input
                type="text"
                value={material.description}
                onChange={(e) => handleMaterialChange(material.id, 'description', e.target.value)}
                className="pi-input"
                placeholder="Enter material description"
                autoFocus
                readOnly={isVerifyMode}
              />
            </div>
            <div className="pi-material-column">
              <div className="pi-material-label">Preferred supplier</div>
              <input
                type="text"
                value={material.preferredSupplier}
                onChange={(e) => handleMaterialChange(material.id, 'preferredSupplier', e.target.value)}
                className="pi-input"
                placeholder="Enter preferred supplier"
                readOnly={isVerifyMode}
              />
                placeholder="Enter supplier name"
              
            </div>
            <div className="pi-material-column">
              <div className="pi-material-label">Required quantity</div>
              <input
                type="text"
                value={material.requiredQuantity}
                onChange={(e) => handleMaterialChange(material.id, 'requiredQuantity', e.target.value)}
                className="pi-input"
                placeholder="e.g., 100 kg"
              />
            </div>
            <div className="pi-material-column">
              <div className="pi-material-label">Stock & order</div>
              <div className="pi-material-stock-edit">
                <input
                  type="text"
                  value={material.onHand}
                  onChange={(e) => handleMaterialChange(material.id, 'onHand', e.target.value)}
                  className="pi-input-small"
                  placeholder="On hand"
                />
                <span className="pi-material-bullet">•</span>
                <input
                  type="text"
                  value={material.order}
                  onChange={(e) => handleMaterialChange(material.id, 'order', e.target.value)}
                  className="pi-input-small"
                  placeholder="Order"
                />
              </div>
            </div>
          </div>
          <div className="pi-material-actions">
            <button 
              onClick={() => handleSaveMaterial(material.id, material)}
              className="pi-btn pi-btn-primary"
            >
              <Check size={14} />
              Save
            </button>
            <button 
              onClick={() => handleRemoveMaterial(material.id)}
              className="pi-btn pi-btn-outline"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={material.id} className="pi-material-card">
        <div className="pi-material-number">{index + 1}</div>
        <div className="pi-material-content">
          <div className="pi-material-column">
            <div className="pi-material-label">Material description</div>
            <div className="pi-material-value">{material.description}</div>
          </div>
          <div className="pi-material-column">
            <div className="pi-material-label">Preferred supplier</div>
            <div className="pi-material-value-normal">{material.preferredSupplier}</div>
          </div>
          <div className="pi-material-column">
            <div className="pi-material-label">Required quantity</div>
            <div className="pi-material-value-normal">
              {material.requiredQuantity} 
              <span className="pi-material-required">• Required on {material.requiredDate}</span>
            </div>
          </div>
          <div className="pi-material-column">
            <div className="pi-material-label">Stock & order</div>
            <div className="pi-material-value-normal">
              {showStock ? (
                <>
                  On hand: {material.onHand} {material.uom}
                  <span className="pi-material-bullet">•</span>
                  Order: {material.order} {material.uom}
                </>
              ) : (
                `Order: ${material.order} ${material.uom}`
              )}
            </div>
          </div>
        </div>
        <div className="pi-material-actions">
          <button 
            onClick={() => handleEditMaterial(material.id)}
            className="pi-btn pi-btn-action"
          >
            Edit
          </button>
          <button 
            onClick={() => handleRemoveMaterial(material.id)}
            className="pi-btn pi-btn-action"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="purchase-indent-page">
      <div className="purchase-indent-container">
        {/* Header */}
        <div className="pi-header">
          <div className="pi-header-left">
            <h1>
              {isVerifyMode 
                ? `Verify Store Indent - ${indentToVerify?.id}` 
                : isViewMode
                ? `Review Purchase Indent - ${indentToVerify?.id}`
                : 'Review QMS Purchase Indent'
              }
            </h1>
            <p>
              {isVerifyMode 
                ? `Review and verify the indent raised by ${indentToVerify?.raisedBy} for ${indentToVerify?.project}` 
                : isViewMode
                ? `Review and fill store-related details for indent requested by ${indentToVerify?.reqName} (${indentToVerify?.reqRole})`
                : 'Review purchase indent initiated by QMS and provide store inventory details.'
              }
            </p>
          </div>
          <div className="pi-header-right">
            {isVerifyMode && (
              <>
                <button
                  type="button"
                  className="pi-btn-secondary"
                  onClick={() => navigate('/verify-store-indents')}
                >
                  <X size={16} />
                  Back to List
                </button>
                <button
                  type="button"
                  className="pi-btn-success"
                  onClick={() => handleVerifyIndent()}
                >
                  <Check size={16} />
                  Verify & Approve
                </button>
              </>
            )}
            {isViewMode && (
              <button
                type="button"
                className="pi-btn-secondary"
                onClick={() => navigate('/verify-indents')}
              >
                <X size={16} />
                Back to List
              </button>
            )}
            {!isVerifyMode && !isViewMode && (
              <button
                type="button"
                className="pi-workflow-btn"
                onClick={() => setShowWorkflow(true)}
                title="View workflow status"
                aria-label="View workflow status"
              >
                <GitBranch size={18} />
              </button>
            )}
            <div className="pi-draft-status">
              {formData.status === 'draft' ? 'Draft' : 'Submitted'} • {formData.indentNumber}
            </div>
            <div className="pi-save-status">
              <div className="status-indicator" />
              Last saved {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>

        {/* Workflow Status Modal */}
        {showWorkflow && (
          <div className="pi-workflow-overlay" onClick={() => setShowWorkflow(false)}>
            <div className="pi-workflow-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pi-workflow-header">
                <div>
                  <div className="pi-workflow-title">Workflow Status</div>
                  <div className="pi-workflow-subtitle">Indent {formData.indentNumber}</div>
                </div>
                <button
                  type="button"
                  className="pi-workflow-close"
                  onClick={() => setShowWorkflow(false)}
                  aria-label="Close workflow"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="pi-workflow-body">
                <div className="pi-workflow-timeline">
                  {workflowSteps.map((step, index) => {
                    const isCompleted = step.status === 'completed';
                    const isCurrent = step.status === 'current';
                    const isPending = step.status === 'pending';
                    return (
                      <div key={step.key} className={`pi-workflow-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}>
                        <div className="pi-workflow-marker">
                          <div className="pi-workflow-icon">
                            {isCompleted ? (
                              <Check size={12} strokeWidth={3} />
                            ) : isCurrent ? (
                              <div className="pi-current-dot" />
                            ) : (
                              <div className="pi-pending-dot" />
                            )}
                          </div>
                          {index !== workflowSteps.length - 1 && <div className="pi-workflow-line" />}
                        </div>
                        <div className="pi-workflow-content">
                          <div className="pi-workflow-step-header">
                            <div className="pi-workflow-step-title">{step.title}</div>
                            {isCurrent && <span className="pi-current-badge">Current Step</span>}
                          </div>
                          <div className="pi-workflow-step-subtitle">{step.subtitle}</div>
                          {step.date && (
                            <div className="pi-workflow-timestamp">{step.date}</div>
                          )}
                          {step.user && (
                            <div className="pi-workflow-user">
                              <div className="pi-user-avatar">
                                <User size={14} />
                              </div>
                              <span className="pi-user-name">{step.user}</span>
                            </div>
                          )}
                          {step.note && (
                            <div className="pi-workflow-note">{step.note}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {(validationErrors.success || Object.keys(validationErrors).filter(key => key !== 'success').length > 0) && (
          <div className="pi-message-container">
            {validationErrors.success && (
              <div className="pi-success-message">
                <Check size={16} />
                {validationErrors.success}
              </div>
            )}
          </div>
        )}

        {/* Form Content */}
        <div className="pi-form-content">
          {/* Indent Details Section */}
          <div className="pi-section">
            <h2 className="pi-section-title">Indent details</h2>
            <p className="pi-section-subtitle">Basic information used to identify and track this indent.</p>

            <div className="pi-form-grid">
              {/* Indent Number */}
              <div className="pi-form-field">
                <div className="pi-label-with-tag">
                  <label className="pi-label">Indent number</label>
                </div>
                <input
                  type="text"
                  value={formData.indentNumber}
                  onChange={(e) => setFormData({...formData, indentNumber: e.target.value})}
                  className="pi-input"
                  placeholder="PI-XXXX-XXX"
                />
              </div>

              {/* Indent Date */}
              <div className="pi-form-field">
                <label className="pi-label">Indent date</label>
                <div className="pi-input-wrapper">
                  <input
                    type="date"
                    value={formData.indentDate}
                    onChange={(e) => setFormData({...formData, indentDate: e.target.value})}
                    className="pi-input pi-input-with-icon"
                  />
                  <Calendar size={16} className="pi-input-icon" />
                </div>
              </div>

              {/* Required By Date */}
              <div className="pi-form-field">
                <label className="pi-label">Required by date *</label>
                <div className="pi-input-wrapper">
                  <input
                    type="date"
                    required
                    value={formData.requiredByDate}
                    onChange={(e) => setFormData({...formData, requiredByDate: e.target.value})}
                    className="pi-input pi-input-with-icon"
                  />
                  <Calendar size={16} className="pi-input-icon" />
                </div>
              </div>
            </div>

            <div className="pi-form-grid">
              {/* Department */}
              <div className="pi-form-field">
                <label className="pi-label">Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => {
                    setFormData({...formData, department: e.target.value});
                    clearFieldError('department');
                  }}
                  className={`pi-select ${validationErrors.department ? 'pi-input-error' : ''}`}
                  required
                  disabled={isVerifyMode}
                >
                  <option value="">Choose department</option>
                  <option value="production">Production</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="quality">Quality</option>
                  <option value="stores">Stores</option>
                  <option value="engineering">Engineering</option>
                </select>
                {validationErrors.department && (
                  <div className="pi-error-message">{validationErrors.department}</div>
                )}
              </div>

              {/* Requested By */}
              <div className="pi-form-field">
                <label className="pi-label">Requested by *</label>
                <div className="pi-input-wrapper">
                  <select
                    value={formData.requestedBy}
                    onChange={(e) => {
                      setFormData({...formData, requestedBy: e.target.value});
                      clearFieldError('requestedBy');
                    }}
                    className={`pi-input pi-input-with-icon ${validationErrors.requestedBy ? 'pi-input-error' : ''}`}
                    required
                  >
                    <option value="">Select requester</option>
                    <option value="john-doe">John Doe (Production Manager)</option>
                    <option value="jane-smith">Jane Smith (Maintenance Head)</option>
                    <option value="robert-brown">Robert Brown (Quality Head)</option>
                  </select>
                  <Search size={16} className="pi-input-icon" />
                </div>
              </div>

              {/* Priority */}
              <div className="pi-form-field">
                <label className="pi-label">Priority</label>
                <div className="pi-priority-group">
                  {['Low', 'Medium', 'High', 'Urgent'].map((priority) => (
                    <label key={priority} className="pi-priority-label">
                      <input
                        type="radio"
                        name="priority"
                        value={priority}
                        checked={formData.priority === priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      />
                      <span>{priority}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Materials Requested */}
          <div className="pi-section">
            <div className="pi-section-header">
              <div>
                <h2 className="pi-section-title">Materials requested</h2>
                <p className="pi-section-subtitle">List all raw materials or components to be purchased.</p>
                {validationErrors.materials && (
                  <div className="pi-error-message">{validationErrors.materials}</div>
                )}
                <div className="pi-total-order">
                  Total Order Quantity: {calculateTotalOrder()} units
                </div>
              </div>
              <button onClick={handleAddMaterial} className="pi-btn pi-btn-add-material">
                <Plus size={16} />
                Add material
              </button>
            </div>

            {/* Materials Header */}
            <div className="pi-materials-header">
              <div className="pi-materials-count">{materials.length} materials</div>
              <div className="pi-materials-search">
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pi-input-search"
                />
              </div>
              <div className="pi-materials-toggles">
                <button 
                  onClick={() => setShowStock(!showStock)}
                  className={`pi-btn ${showStock ? 'pi-btn-primary' : 'pi-btn-filter'}`}
                >
                  <Filter size={14} />
                  {showStock ? 'Hide Stock' : 'Show Stock'}
                </button>
                <button 
                  onClick={() => setGroupBySupplier(!groupBySupplier)}
                  className={`pi-btn ${groupBySupplier ? 'pi-btn-primary' : 'pi-btn-filter'}`}
                >
                  {groupBySupplier ? 'Ungroup' : 'Group by Supplier'}
                </button>
              </div>
            </div>

            {/* Materials List */}
            <div className="pi-materials-list">
              {groupBySupplier ? (
                Object.entries(groupedMaterials).map(([supplier, supplierMaterials]) => (
                  <div key={supplier} className="pi-supplier-group">
                    <div className="pi-supplier-header">
                      <h4>{supplier}</h4>
                      <span>{supplierMaterials.length} materials</span>
                    </div>
                    {supplierMaterials.map((material, index) => 
                      renderMaterialCard(material, index)
                    )}
                  </div>
                ))
              ) : (
                filteredMaterials.map((material, index) => 
                  renderMaterialCard(material, index)
                )
              )}
            </div>

            <div className="pi-materials-footer">
              <span className="pi-materials-footer-text">
                Materials added: {materials.length} | Total items: {calculateTotalOrder()}
              </span>
              <button 
                onClick={() => alert('Viewing received status...')}
                className="pi-link-btn"
              >
                View Received Status
              </button>
            </div>
          </div>

          {/* Part & PO Reference */}
          <div className="pi-section">
            <div className="pi-section-header">
              <div>
                <h2 className="pi-section-title">Part & PO reference</h2>
                <p className="pi-section-subtitle">Link this indent to customer parts and existing purchase orders.</p>
              </div>
              <button 
                onClick={() => alert('Linking PO...')}
                className="pi-btn pi-btn-secondary"
              >
                <ExternalLink size={14} />
                Link PO
              </button>
            </div>

            <div className="pi-form-grid-2">
              {/* Customer Part */}
              <div className="pi-form-field">
                <label className="pi-label">Customer part</label>
                <div className="pi-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search and select part"
                    value={formData.customerPart}
                    onChange={(e) => setFormData({...formData, customerPart: e.target.value})}
                    className="pi-input pi-input-with-icon"
                  />
                  <Search size={16} className="pi-input-icon" />
                </div>
              </div>

              {/* Order Quantity */}
              <div className="pi-form-field">
                <label className="pi-label">Order quantity</label>
                <input
                  type="number"
                  placeholder="Enter quantity"
                  value={formData.orderQuantity}
                  onChange={(e) => setFormData({...formData, orderQuantity: e.target.value})}
                  className="pi-input"
                />
              </div>
            </div>

            <div className="pi-form-grid-2">
              {/* Purchase Number */}
              <div className="pi-form-field">
                <label className="pi-label">Purchase number</label>
                <input
                  type="text"
                  placeholder="Enter purchase number (optional)"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({...formData, poNumber: e.target.value})}
                  className="pi-input"
                />
              </div>

              {/* RM Cost */}
              <div className="pi-form-field">
                <label className="pi-label">RM cost</label>
                <input
                  type="number"
                  placeholder="Enter raw material cost"
                  value={formData.rmCost || ''}
                  onChange={(e) => setFormData({...formData, rmCost: e.target.value})}
                  className="pi-input"
                />
              </div>
            </div>

            <div className="pi-form-grid">
              {/* RM Rate */}
              <div className="pi-form-field">
                <label className="pi-label">RM rate / kg</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter rate"
                  value={formData.rmRate}
                  onChange={(e) => setFormData({...formData, rmRate: e.target.value})}
                  className="pi-input"
                />
              </div>

              {/* No. of Pieces / kg */}
              <div className="pi-form-field">
                <label className="pi-label">No. of pieces / kg</label>
                <input
                  type="number"
                  placeholder="Enter pieces per kg"
                  value={formData.piecesPerKg}
                  onChange={(e) => setFormData({...formData, piecesPerKg: e.target.value})}
                  className="pi-input"
                />
              </div>

              {/* RM% */}
              <div className="pi-form-field">
                <label className="pi-label">RM%</label>
                <input
                  type="number"
                  placeholder="Enter RM percentage"
                  value={formData.rmPercentage}
                  onChange={(e) => setFormData({...formData, rmPercentage: e.target.value})}
                  className="pi-input"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pi-footer">
            <div className="pi-document-code">Document code: SBP/PI/IB/02-00 | v1.0</div>
            {!isVerifyMode && (
              <div className="pi-footer-actions">
                <button 
                  onClick={() => handleSubmit('save')}
                  className="pi-btn pi-btn-outline"
                >
                  <Save size={16} />
                  Save draft
                </button>
                <button 
                  onClick={() => handleSubmit('submit')}
                  className="pi-btn pi-btn-primary"
                >
                  <Send size={16} />
                  Submit for approval
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPurchaseIndent;