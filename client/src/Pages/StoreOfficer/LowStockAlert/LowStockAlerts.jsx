import React from 'react';
import './LowStockAlerts.css';

// SVG Icons
const Icons = {
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  ),
  AlertTriangle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
  ),
  XCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  Cube: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
  )
};

const LowStockAlerts = () => {
  const alerts = [
    {
      name: "HDPE Granules - Natural",
      code: "MAT-PL-0008",
      category: "Raw Material",
      current: "0",
      min: "250",
      unit: "Kg",
      status: "Out of stock",
      statusType: "light-red" // Visual style key
    },
    {
      name: "PET Preform 28mm - Clear",
      code: "MAT-CM-0123",
      category: "Component",
      current: "40",
      min: "200",
      unit: "Nos",
      status: "Critical",
      statusType: "solid-red"
    },
    {
      name: "Shrink Wrap Roll 500mm",
      code: "MAT-PK-0044",
      category: "Packing",
      current: "12",
      min: "60",
      unit: "Rolls",
      status: "Low stock",
      statusType: "solid-orange"
    },
    {
      name: "Masterbatch - Blue 2%",
      code: "MAT-CL-0031",
      category: "Colour",
      current: "18",
      min: "80",
      unit: "Kg",
      status: "Low stock",
      statusType: "solid-orange"
    },
    {
      name: "LDPE Film Scrap",
      code: "MAT-RC-0005",
      category: "Regrind",
      current: "5",
      min: "40",
      unit: "Kg",
      status: "Critical",
      statusType: "solid-red"
    }
  ];

  return (
    <div className="lsa-container">
      
      {/* --- Header --- */}
      <header className="lsa-header">
        <div className="lsa-header-content">
          <h1 className="lsa-title">Low Stock Alerts</h1>
          <p className="lsa-subtitle">Monitor materials that are reaching or below minimum stock levels.</p>
        </div>
        <button className="lsa-btn-icon">
          <Icons.Bell />
        </button>
      </header>

      {/* --- Stats Cards --- */}
      <div className="lsa-stats-row">
        <div className="lsa-card">
          <div className="lsa-card-top">
            <span className="lsa-card-label">CRITICAL ITEMS</span>
            <Icons.Clock />
          </div>
          <div className="lsa-card-val">7</div>
          <div className="lsa-card-sub">Below minimum limit</div>
        </div>
        
        <div className="lsa-card">
          <div className="lsa-card-top">
            <span className="lsa-card-label">LOW STOCK</span>
            <Icons.AlertTriangle />
          </div>
          <div className="lsa-card-val">18</div>
          <div className="lsa-card-sub">Restock soon</div>
        </div>

        <div className="lsa-card">
          <div className="lsa-card-top">
            <span className="lsa-card-label">OUT OF STOCK</span>
            <Icons.XCircle />
          </div>
          <div className="lsa-card-val">3</div>
          <div className="lsa-card-sub">Unavailable in store</div>
        </div>
      </div>

      {/* --- Filters Bar --- */}
      <div className="lsa-filter-bar">
        <div className="lsa-filter-group">
          <div className="lsa-filter-item">
            <span className="lsa-filter-label">Status:</span>
            <button className="lsa-dropdown-btn">All alerts <Icons.ChevronDown/></button>
          </div>
          <div className="lsa-filter-item">
            <span className="lsa-filter-label">Category:</span>
            <button className="lsa-dropdown-btn">All categories <Icons.ChevronDown/></button>
          </div>
          <div className="lsa-filter-item">
            <span className="lsa-filter-label">Sort by:</span>
            <button className="lsa-dropdown-btn">Lowest stock first <Icons.ChevronDown/></button>
          </div>
        </div>
        
        <div className="lsa-search-wrapper">
          <div className="lsa-search-icon"><Icons.Search /></div>
          <input type="text" placeholder="Search materials, codes..." className="lsa-search-input" />
        </div>
      </div>

      {/* --- Table --- */}
      <div className="lsa-table-container">
        <table className="lsa-table">
          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>CATEGORY</th>
              <th>CURRENT STOCK</th>
              <th>MIN. REQUIRED</th>
              <th>UNIT</th>
              <th>STATUS</th>
              <th style={{textAlign: 'right'}}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((item, idx) => (
              <tr key={idx}>
                {/* Product */}
                <td>
                  <div className="lsa-prod-cell">
                    <div className="lsa-prod-icon">
                      <Icons.Cube />
                    </div>
                    <div>
                      <div className="lsa-prod-name">{item.name}</div>
                      <div className="lsa-prod-code">{item.code}</div>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="lsa-text-std">{item.category}</td>

                {/* Current Stock */}
                <td className="lsa-text-bold">{item.current}</td>

                {/* Min Required */}
                <td className="lsa-text-std">{item.min}</td>

                {/* Unit */}
                <td className="lsa-text-std">{item.unit}</td>

                {/* Status Badge */}
                <td>
                  <span className={`lsa-badge ${item.statusType}`}>
                    <span className="lsa-dot"></span>
                    {item.status}
                  </span>
                </td>

                {/* Actions */}
                <td style={{textAlign: 'right'}}>
                  <button className="lsa-btn-restock">Restock</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Footer --- */}
      <div className="lsa-footer">
        <span className="lsa-footer-text">Showing 1-5 of 32 materials</span>
        <div className="lsa-pagination">
          <button className="lsa-page-btn">Previous</button>
          <button className="lsa-page-btn">Next</button>
        </div>
      </div>

    </div>
  );
};

export default LowStockAlerts;