import React from 'react';
import './GoodsInventory.css';

// SVG Icons
const Icons = {
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
  ),
  ArrowUpRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
  )
};

const MaterialManager = () => {
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
      type: "Bulk Material"
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
      type: "Bulk Material"
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
      type: "Sheet"
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
      type: "Color Additive"
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
      type: "Scrap"
    }
  ];

  return (
    <div className="mm-container">
      
      {/* --- Left Column: Categories --- */}
      <div className="mm-sidebar">
        <div className="mm-sidebar-header">
          <h2 className="mm-panel-title">Material<br/>Categories</h2>
          <button className="mm-btn-outline">
            <Icons.Plus />
            Add Category
          </button>
        </div>

        <div className="mm-search-box">
          <div className="mm-search-icon"><Icons.Search /></div>
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
            <Icons.Plus />
            Add Material
          </button>
        </div>

        <div className="mm-items-scroll">
          {materials.map((item, idx) => (
            <div key={idx} className="mm-item-card">
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
      <div className="mm-details-panel">
        <div className="mm-details-header">
          <h2 className="mm-panel-title-md">Material Details & Actions</h2>
        </div>

        <div className="mm-form-body">
          
          {/* Selected Material */}
          <div className="mm-form-group">
            <label className="mm-label">Selected Material</label>
            <input type="text" className="mm-input" value="HDPE Granules – High Density (RM-1024)" readOnly />
          </div>

          {/* Row 1 */}
          <div className="mm-form-row">
            <div className="mm-form-group half">
              <label className="mm-label">Current Stock</label>
              <input type="text" className="mm-input" value="4,500 kg" readOnly />
            </div>
            <div className="mm-form-group half">
              <label className="mm-label">Reorder Level</label>
              <input type="text" className="mm-input" value="1,000 kg" readOnly />
            </div>
          </div>

          {/* Row 2 */}
          <div className="mm-form-row">
            <div className="mm-form-group half">
              <label className="mm-label">Warehouse Location</label>
              <input type="text" className="mm-input" value="Main Store A1" readOnly />
            </div>
            <div className="mm-form-group half">
              <label className="mm-label">Status</label>
              <input type="text" className="mm-input" value="In Stock" readOnly />
            </div>
          </div>

          {/* Remarks */}
          <div className="mm-form-group">
            <label className="mm-label">Remarks</label>
            <textarea className="mm-textarea" readOnly defaultValue="Used for extrusion products; no expiry tracking required."></textarea>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="mm-details-footer">
          <button className="mm-btn-secondary">
            <Icons.Edit />
            Edit Material
          </button>
          <button className="mm-btn-primary">
            <Icons.ArrowUpRight />
            Update Stock
          </button>
        </div>
      </div>

    </div>
  );
};

export default MaterialManager;