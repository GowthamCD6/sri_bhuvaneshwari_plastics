import React from 'react';
import './Inventory.css';

// Custom SVG Icons matching the design
const Icons = {
  Cube: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  ),
  AlertTriangle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
  ),
  XCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
  ),
  DollarSign: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  MoreVertical: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
  )
};

const InventoryDashboard = () => {
  // Data transcribed exactly from the image
  const materials = [
    {
      code: "RM-1024",
      name: "HDPE Granules - High Density",
      supplier: "Supplier: Polymer Inc.",
      category: "Raw Material",
      stock: "4,500",
      stockColor: "text-dark",
      unit: "kg",
      reorder: "1,000",
      status: "In Stock",
      statusClass: "badge-green"
    },
    {
      code: "RM-2055",
      name: "LDPE Resin - Clear",
      supplier: "Supplier: ChemWorld Ltd.",
      category: "Raw Material",
      stock: "450",
      stockColor: "text-orange", // Visual cue for low stock
      unit: "kg",
      reorder: "500",
      status: "Low Stock",
      statusClass: "badge-orange"
    },
    {
      code: "PK-0012",
      name: "Cardboard Box - Type A",
      supplier: "Supplier: PackItAll",
      category: "Packaging",
      stock: "0",
      stockColor: "text-red", // Visual cue for no stock
      unit: "pcs",
      reorder: "200",
      status: "Out of Stock",
      statusClass: "badge-red"
    },
    {
      code: "AD-5002",
      name: "Masterbatch - Red 404",
      supplier: "Supplier: ColorChem",
      category: "Additives",
      stock: "125",
      stockColor: "text-dark",
      unit: "kg",
      reorder: "50",
      status: "In Stock",
      statusClass: "badge-green"
    },
    {
      code: "RM-1033",
      name: "Polypropylene (PP) Sheets",
      supplier: "Supplier: Plasticos Ltd.",
      category: "Raw Material",
      stock: "2,100",
      stockColor: "text-dark",
      unit: "kg",
      reorder: "800",
      status: "In Stock",
      statusClass: "badge-green"
    }
  ];

  return (
    <div className="inv-container">
      
      {/* --- Stats Row --- */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Total Materials</span>
            <Icons.Cube />
          </div>
          <div className="inv-stat-value">142</div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Low Stock Items</span>
            <Icons.AlertTriangle />
          </div>
          <div className="inv-stat-value">8</div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Out of Stock</span>
            <Icons.XCircle />
          </div>
          <div className="inv-stat-value">2</div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Total Value</span>
            <Icons.DollarSign />
          </div>
          <div className="inv-stat-value">$24,500</div>
        </div>
      </div>

      {/* --- Main Content Card --- */}
      <div className="inv-main-card">
        
        {/* Toolbar (Tabs + Search + Add) */}
        <div className="inv-toolbar">
          <div className="inv-tabs-container">
            <button className="inv-tab active">All Materials</button>
            <button className="inv-tab">Raw Materials</button>
            <button className="inv-tab">Finished Goods</button>
            <button className="inv-tab">Packaging</button>
          </div>

          <div className="inv-actions">
            <div className="inv-search-wrapper">
              <div className="inv-search-icon">
                <Icons.Search />
              </div>
              <input 
                type="text" 
                placeholder="Search inventory..." 
                className="inv-search-input" 
              />
            </div>
            <button className="inv-btn-primary">
              <Icons.Plus />
              Add Material
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="inv-table-wrapper">
          <table className="inv-table">
            <thead>
              <tr>
                <th>ITEM CODE</th>
                <th>MATERIAL NAME</th>
                <th>CATEGORY</th>
                <th>CURRENT STOCK</th>
                <th>UNIT</th>
                <th>REORDER LEVEL</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((item, index) => (
                <tr key={index}>
                  {/* Code */}
                  <td className="font-code">{item.code}</td>
                  
                  {/* Name & Supplier */}
                  <td>
                    <div className="text-bold">{item.name}</div>
                    <div className="text-sub">{item.supplier}</div>
                  </td>
                  
                  {/* Category */}
                  <td className="text-normal">{item.category}</td>
                  
                  {/* Stock */}
                  <td className={`font-stock ${item.stockColor}`}>{item.stock}</td>
                  
                  {/* Unit */}
                  <td className="text-normal">{item.unit}</td>
                  
                  {/* Reorder */}
                  <td className="text-light-blue">{item.reorder}</td>
                  
                  {/* Status */}
                  <td>
                    <span className={`status-badge ${item.statusClass}`}>
                      {item.status.split(' ').map((word, i) => (
                        <span key={i} style={{display:'block'}}>{word}</span>
                      ))}
                    </span>
                  </td>
                  
                  {/* Actions */}
                  <td>
                    <div className="action-cell">
                      <button className="btn-update">Update Stock</button>
                      <button className="btn-more">
                        <Icons.MoreVertical />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="inv-footer">
          <span className="footer-text">Showing 1-5 of 142 items</span>
          <div className="pagination-group">
            <button className="btn-page">Previous</button>
            <button className="btn-page">Next</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InventoryDashboard;