import React, { useState } from 'react';
import './MaterialRequest.css';

// SVG Icons
const Icons = {
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
  )
};

const MaterialRequest = () => {
  const [itemType, setItemType] = useState('stock'); // 'stock' or 'component'

  return (
    <div className="mr-container">
      {/* Page Header */}
      <div className="mr-page-header">
        <h1 className="mr-title">Material Request</h1>
        <p className="mr-subtitle">Request purchase for insufficient raw materials or components.</p>
      </div>

      {/* Main Form Card */}
      <div className="mr-card">
        
        {/* Section Header */}
        <div className="mr-card-header">
          <h2 className="mr-section-title">Item Details</h2>
          <p className="mr-section-desc">Fill the key details for the material you need to purchase.</p>
        </div>
        
        <hr className="mr-divider" />

        <div className="mr-form-body">
          
          {/* Radio Group */}
          <div className="mr-form-group">
            <label className="mr-label">Item Type</label>
            <div className="mr-radio-group">
              <label className="mr-radio-label">
                <input 
                  type="radio" 
                  name="itemType" 
                  checked={itemType === 'stock'} 
                  onChange={() => setItemType('stock')}
                  className="mr-radio-input"
                />
                <span className="mr-radio-text">Stock / Raw Material</span>
              </label>

              <label className="mr-radio-label">
                <input 
                  type="radio" 
                  name="itemType" 
                  checked={itemType === 'component'} 
                  onChange={() => setItemType('component')}
                  className="mr-radio-input"
                />
                <span className="mr-radio-text">Component</span>
              </label>
            </div>
          </div>

          {/* Row 1: Code & Name */}
          <div className="mr-form-row">
            <div className="mr-form-group">
              <label className="mr-label">RM / Component Code</label>
              <input type="text" className="mr-input" placeholder="e.g. RM-10024" />
            </div>
            <div className="mr-form-group">
              <label className="mr-label">RM / Component Name</label>
              <input type="text" className="mr-input" placeholder="e.g. Polypropylene Granules" />
            </div>
          </div>

          {/* Row 2: Color & Storage */}
          <div className="mr-form-row">
            <div className="mr-form-group">
              <label className="mr-label">Color</label>
              <input type="text" className="mr-input" placeholder="e.g. Natural White" />
            </div>
            <div className="mr-form-group">
              <label className="mr-label">Storage Location</label>
              <div className="mr-select-wrapper">
                <select className="mr-select">
                  <option value="" disabled selected>Select location...</option>
                  <option>Warehouse A</option>
                  <option>Warehouse B</option>
                </select>
                <div className="mr-select-icon"><Icons.ChevronDown /></div>
              </div>
            </div>
          </div>

          {/* Row 3: Quantity */}
          <div className="mr-form-group">
            <label className="mr-label">Needed Quantity</label>
            <div className="mr-qty-row">
              <input type="number" className="mr-input" placeholder="0.00" style={{ flex: 1 }} />
              <div className="mr-select-wrapper" style={{ width: '120px' }}>
                <select className="mr-select">
                  <option>Kg</option>
                  <option>Ltr</option>
                  <option>Pcs</option>
                </select>
                <div className="mr-select-icon"><Icons.ChevronDown /></div>
              </div>
            </div>
          </div>

          {/* Row 4: Reason */}
          <div className="mr-form-group">
            <label className="mr-label">Used For / Reason</label>
            <textarea 
              className="mr-textarea" 
              placeholder="Mention why this item is needed (e.g. customer order, regular stock, machine maintenance)..."
            ></textarea>
          </div>

        </div>
      </div>
      
      {/* Scrollbar Mock (Visual only to match image) */}
      <div className="mr-scrollbar-track">
        <div className="mr-scrollbar-thumb"></div>
      </div>
    </div>
  );
};

export default MaterialRequest;