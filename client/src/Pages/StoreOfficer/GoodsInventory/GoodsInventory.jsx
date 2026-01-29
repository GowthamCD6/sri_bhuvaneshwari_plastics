import React, { useState } from 'react';
import { Plus, Search, Edit, ArrowUpRight, X } from 'lucide-react';
import './GoodsInventory.css';

const MaterialManager = () => {
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  
  // Sidebar Data
  const categories = [
    { name: "Raw Materials", count: "38 items", active: true },
    { name: "Finished Goods", count: "52 items", active: false },
    { name: "Semi-Finished Goods", count: "21 items", active: false },
    { name: "Packaging Materials", count: "18 items", active: false },
    { name: "Additives & Colors", count: "13 items", active: false },
    { name: "Scrap & Regrind", count: "7 items", active: false },
  ];

  // Middle Panel Data
  const materials = [
    {
      id: "RM-1024",
      name: "HDPE Granules – High Density",
      supplier: "Polymer Inc.",
      stock: "4,500",
      unit: "kg",
      status: "In Stock",
      statusClass: "mm-badge-green",
      stockClass: "mm-text-dark",
      type: "Bulk Material",
      reorderLevel: "1,000",
      warehouseLocation: "Main Store A1",
      remarks: "Used for extrusion products; no expiry tracking required."
    },
    {
      id: "RM-2055",
      name: "LDPE Resin – Clear",
      supplier: "ChemWorld",
      stock: "450",
      unit: "kg",
      status: "Low Stock",
      statusClass: "mm-badge-orange",
      stockClass: "mm-text-orange",
      type: "Bulk Material",
      reorderLevel: "500",
      warehouseLocation: "Main Store B2",
      remarks: "Monitor stock levels closely."
    },
    {
      id: "RM-1033",
      name: "Polypropylene (PP) Sheets",
      supplier: "Plasticos Ltd.",
      stock: "2,100",
      unit: "kg",
      status: "In Stock",
      statusClass: "mm-badge-green",
      stockClass: "mm-text-dark",
      type: "Sheet",
      reorderLevel: "800",
      warehouseLocation: "Main Store A3",
      remarks: "High-quality sheets for industrial use."
    },
    {
      id: "AD-5002",
      name: "Masterbatch – Red 404",
      supplier: "ColorChem",
      stock: "125",
      unit: "kg",
      status: "In Stock",
      statusClass: "mm-badge-green",
      stockClass: "mm-text-dark",
      type: "Color Additive",
      reorderLevel: "50",
      warehouseLocation: "Additive Store C1",
      remarks: "Store in cool, dry place."
    },
    {
      id: "SC-010",
      name: "Reprocessed HDPE Granules",
      supplier: "Scrap & Regrind",
      stock: "0",
      unit: "kg",
      status: "Out of Stock",
      statusClass: "mm-badge-red",
      stockClass: "mm-text-red",
      type: "Scrap",
      reorderLevel: "200",
      warehouseLocation: "Scrap Yard D1",
      remarks: "Urgent reorder required."
    }
  ];

  return (
    <div className="mm-container">
      
      {/* --- Left Column: Categories --- */}
      <div className="mm-sidebar">
        <div className="mm-sidebar-header">
          <h2 className="mm-panel-title">Material<br/>Categories</h2>
          <button className="mm-btn-outline">
            <Plus size={16} />
            Add Category
          </button>
        </div>

        <div className="mm-search-box">
          <div className="mm-search-icon"><Search size={18} className="icon-gray" /></div>
          <input type="text" placeholder="Search categories..." className="mm-input-search" />
        </div>

        <div className="mm-category-list">
          {categories.map((cat, idx) => (
            <div key={idx} className={`mm-category-item ${cat.active ? 'active' : ''}`}>
              <div className="mm-cat-name">{cat.name}</div>
              <div className="mm-cat-count">{cat.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Middle Column: Items List --- */}
      <div className="mm-main-list">
        <div className="mm-main-header">
          <div>
            <h2 className="mm-panel-title-lg">Items in Raw Materials</h2>
            <p className="mm-subtitle">Click a material to view full stock details and update quantities.</p>
          </div>
          <button className="mm-btn-primary">
            <Plus size={18} />
            Add Material
          </button>
        </div>

        <div className="mm-items-scroll">
          {materials.map((item, idx) => (
            <div 
              key={idx} 
              className={`mm-item-card ${selectedMaterial?.id === item.id ? 'active' : ''}`}
              onClick={() => setSelectedMaterial(item)}
            >
              <div className="mm-item-row-top">
                <div className="mm-item-name">{item.name}</div>
                <div className="mm-item-stock-group">
                  <span className={`mm-stock-val ${item.stockClass}`}>{item.stock}</span>
                  <span className={`mm-stock-unit ${item.stockClass}`}>{item.unit}</span>
                </div>
              </div>
              
              <div className="mm-item-row-btm">
                <div className="mm-item-meta">
                  Code: <span className="mm-code">{item.id}</span> • Supplier: <span className="mm-supplier">{item.supplier}</span>
                </div>
                <div className="mm-item-badges">
                  <span className={`mm-status-badge ${item.statusClass}`}>{item.status}</span>
                  <span className="mm-type-badge">{item.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Right Column: Details & Actions --- */}
      <div className={`mm-details-panel ${selectedMaterial ? 'open' : ''}`}>
        <div className="mm-details-header">
          <h2 className="mm-panel-title-md">Material Details & Actions</h2>
          <button className="mm-close-btn" onClick={() => setSelectedMaterial(null)}>
            <X size={20} />
          </button>
        </div>

        {selectedMaterial ? (
          <>
            <div className="mm-form-body">
              
              {/* Selected Material */}
              <div className="mm-form-group">
                <label className="mm-label">Selected Material</label>
                <input 
                  type="text" 
                  className="mm-input" 
                  value={`${selectedMaterial.name} (${selectedMaterial.id})`} 
                  readOnly 
                />
              </div>

              {/* Row 1 */}
              <div className="mm-form-row">
                <div className="mm-form-group half">
                  <label className="mm-label">Current Stock</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={`${selectedMaterial.stock} ${selectedMaterial.unit}`} 
                    readOnly 
                  />
                </div>
                <div className="mm-form-group half">
                  <label className="mm-label">Reorder Level</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={`${selectedMaterial.reorderLevel} ${selectedMaterial.unit}`} 
                    readOnly 
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="mm-form-row">
                <div className="mm-form-group half">
                  <label className="mm-label">Warehouse Location</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={selectedMaterial.warehouseLocation} 
                    readOnly 
                  />
                </div>
                <div className="mm-form-group half">
                  <label className="mm-label">Status</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={selectedMaterial.status} 
                    readOnly 
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="mm-form-group">
                <label className="mm-label">Remarks</label>
                <textarea 
                  className="mm-textarea" 
                  readOnly 
                  value={selectedMaterial.remarks}
                />
              </div>

            </div>

            {/* Footer Actions */}
            <div className="mm-details-footer">
              <button className="mm-btn-secondary">
                <Edit size={16} />
                Edit Material
              </button>
              <button className="mm-btn-primary">
                <ArrowUpRight size={16} />
                Update Stock
              </button>
            </div>
          </>
        ) : (
          <div className="mm-empty-state">
            <p>Select a material to view details</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default MaterialManager;