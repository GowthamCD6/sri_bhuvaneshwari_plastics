import React from 'react';
import { Package, AlertTriangle, XCircle, DollarSign, Search, Plus, MoreVertical } from 'lucide-react';
import './Inventory.css';

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
            <Package size={20} className="icon-blue" />
          </div>
          <div className="inv-stat-value">142</div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Low Stock Items</span>
            <AlertTriangle size={20} className="icon-orange" />
          </div>
          <div className="inv-stat-value">8</div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Out of Stock</span>
            <XCircle size={20} className="icon-red" />
          </div>
          <div className="inv-stat-value">2</div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Total Value</span>
            <DollarSign size={20} className="icon-green" />
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
                <Search size={18} className="icon-gray" />
              </div>
              <input 
                type="text" 
                placeholder="Search inventory..." 
                className="inv-search-input" 
              />
            </div>
            <button className="inv-btn-primary">
              <Plus size={18} />
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
                        <MoreVertical size={18} className="icon-gray" />
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