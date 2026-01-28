import { useState, useEffect } from 'react';
import { Calendar, X, Plus, Search, ExternalLink, Save, Send, Filter, Check } from 'lucide-react';
import './PurchaseIndents.css';

const NewPurchaseIndent = () => {
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
  const [showStock, setShowStock] = useState(false);
  const [groupBySupplier, setGroupBySupplier] = useState(false);

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
    setIsEditingMaterial(newMaterial.id);
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
    if (action === 'save') {
      setFormData({...formData, status: 'draft'});
      alert('Draft saved successfully!');
    } else if (action === 'submit') {
      if (!formData.department || !formData.requestedBy || !formData.justification) {
        alert('Please fill in all required fields');
        return;
      }
      if (materials.length === 0) {
        alert('Please add at least one material');
        return;
      }
      setFormData({
        ...formData, 
        status: 'submitted',
        indentNumber: generateIndentNumber(),
        submittedDate: new Date().toISOString()
      });
      alert('Purchase indent submitted for approval!');
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
              />
            </div>
            <div className="pi-material-column">
              <div className="pi-material-label">Preferred supplier</div>
              <input
                type="text"
                value={material.preferredSupplier}
                onChange={(e) => handleMaterialChange(material.id, 'preferredSupplier', e.target.value)}
                className="pi-input"
                placeholder="Enter supplier name"
              />
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
            <h1>New Purchase Indent</h1>
            <p>Capture material requirements and send to purchasing for approval.</p>
          </div>
          <div className="pi-header-right">
            <div className="pi-draft-status">
              {formData.status === 'draft' ? 'Draft' : 'Submitted'} • {formData.indentNumber}
            </div>
            <div className="pi-save-status">
              <div className="status-indicator" />
              Last saved {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="pi-form-content">
          {/* Indent Details Section */}
          <div className="pi-section">
            <h2 className="pi-section-title">Indent details</h2>
            <p className="pi-section-subtitle">Basic information used to identify and track this indent.</p>

            <div className="pi-form-grid">
              {/* PO Number */}
              <div className="pi-form-field">
                <div className="pi-label-with-tag">
                  <label className="pi-label">PO number</label>
                  <span className="pi-label-tag">Auto generated</span>
                </div>
                <input
                  type="text"
                  value={formData.indentNumber}
                  onChange={(e) => setFormData({...formData, indentNumber: e.target.value})}
                  className="pi-input"
                  placeholder="PI-XXXX-XXX"
                />
              </div>

              {/* PO Date */}
              <div className="pi-form-field">
                <label className="pi-label">PO date</label>
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
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="pi-select"
                  required
                >
                  <option value="">Choose department</option>
                  <option value="production">Production</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="quality">Quality</option>
                  <option value="stores">Stores</option>
                  <option value="engineering">Engineering</option>
                </select>
              </div>

              {/* Requested By */}
              <div className="pi-form-field">
                <label className="pi-label">Requested by *</label>
                <div className="pi-input-wrapper">
                  <select
                    value={formData.requestedBy}
                    onChange={(e) => setFormData({...formData, requestedBy: e.target.value})}
                    className="pi-input pi-input-with-icon"
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
              {/* PO Number */}
              <div className="pi-form-field">
                <label className="pi-label">PO number</label>
                <input
                  type="text"
                  placeholder="Enter PO number (optional)"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({...formData, poNumber: e.target.value})}
                  className="pi-input"
                />
              </div>

              {/* PO Date */}
              <div className="pi-form-field">
                <label className="pi-label">PO date</label>
                <div className="pi-input-wrapper">
                  <input
                    type="date"
                    placeholder="Select date"
                    value={formData.poDate}
                    onChange={(e) => setFormData({...formData, poDate: e.target.value})}
                    className="pi-input pi-input-with-icon"
                  />
                  <Calendar size={16} className="pi-input-icon" />
                </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPurchaseIndent;