import React, { useState } from 'react';
import './StockAdjustment.css';

// SVG Icons
const Icons = {
  ArrowDown: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <polyline points="19 12 12 19 5 12"></polyline>
    </svg>
  ),
  ArrowUp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"></line>
      <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
  ),
  Box: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  ),
  Scan: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
      <line x1="12" y1="17" x2="12" y2="7"></line>
    </svg>
  ),
  Minus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  )
};

const StockAdjustment = () => {
  const [quantity, setQuantity] = useState(150);
  const [selectedMaterial, setSelectedMaterial] = useState('HDPE Granules – High Density');
  const [reason, setReason] = useState('Purchase Receipt');
  const [notes, setNotes] = useState('');
  
  // Material stock data
  const materialStocks = {
    'HDPE Granules – High Density': 4500,
    'LDPE Resin – Clear': 450,
    'Polypropylene (PP) Sheets': 2100,
    'Masterbatch – Red 404': 125,
    'PVC Compounds': 800,
    'ABS Pellets': 600
  };
  
  const currentStock = materialStocks[selectedMaterial] || 0;

  // Plastic Manufacturing History Data
  const historyData = [
    { 
      date: "28/01/26", 
      item: "HDPE Granules – High Density", 
      qty: "+500", 
      prev: "4,000 kg", 
      new: "4,500 kg", 
      reason: "Purchase Receipt", 
      by: "Suresh Kumar", 
      initial: "S", 
      color: "avatar-blue" 
    },
    { 
      date: "26/01/26", 
      item: "LDPE Resin – Clear", 
      qty: "+200", 
      prev: "250 kg", 
      new: "450 kg", 
      reason: "Supplier Return Credit", 
      by: "Rajesh Patel", 
      initial: "R", 
      color: "avatar-red" 
    },
    { 
      date: "24/01/26", 
      item: "Polypropylene (PP) Sheets", 
      qty: "+300", 
      prev: "1,800 kg", 
      new: "2,100 kg", 
      reason: "Inventory Correction", 
      by: "Anitha Singh", 
      initial: "A", 
      color: "avatar-green" 
    },
    { 
      date: "22/01/26", 
      item: "Masterbatch – Red 404", 
      qty: "+75", 
      prev: "50 kg", 
      new: "125 kg", 
      reason: "New Purchase", 
      by: "Vijay Kumar", 
      initial: "V", 
      color: "avatar-orange" 
    },
  ];

  const handleSubmit = () => {
    // Handle form submission logic here
    console.log({
      material: selectedMaterial,
      quantity,
      reason,
      notes,
      currentStock,
      newStock: currentStock + quantity
    });
    // Reset form or show success message
  };

  return (
    <div className="sa-container">
      <h1 className="sa-title">Stock Adjustment</h1>

      {/* Toggle Buttons */}
      <div className="sa-toggle-group">
        <button className="sa-toggle-btn active">
          <Icons.ArrowDown /> Stock In
        </button>
        <button className="sa-toggle-btn">
          <Icons.ArrowUp /> Stock Out
        </button>
      </div>

      {/* Main Form Card */}
      <div className="sa-card sa-main-card">
        {/* Header with Blue Box Icon */}
        <div className="sa-card-header-flex">
          <div className="sa-icon-box">
            <Icons.Box />
          </div>
          <h2 className="sa-card-title">Stock In - Add Materials to Inventory</h2>
        </div>

        <div className="sa-form-grid">
          
          {/* Material Selector */}
          <div className="sa-form-group">
            <label className="sa-label">Material to Add</label>
            <div className="sa-input-with-action">
              <div className="sa-select-wrapper">
                <select 
                  className="sa-select" 
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                >
                  <option>HDPE Granules – High Density</option>
                  <option>LDPE Resin – Clear</option>
                  <option>Polypropylene (PP) Sheets</option>
                  <option>Masterbatch – Red 404</option>
                  <option>PVC Compounds</option>
                  <option>ABS Pellets</option>
                </select>
                <div className="sa-select-icon"><Icons.ChevronDown /></div>
              </div>
              <button className="sa-action-btn" title="Scan Barcode">
                <Icons.Scan />
              </button>
            </div>
          </div>

          {/* Quantity Counter */}
          <div className="sa-form-group">
            <label className="sa-label">Quantity to Add (kg)</label>
            <div className="sa-counter-row">
              <div className="sa-counter-controls">
                <button 
                  className="sa-circle-btn remove" 
                  onClick={() => setQuantity(q => Math.max(0, q - 50))}
                  title="Decrease by 50"
                >
                  <Icons.Minus />
                </button>
                <span className="sa-counter-value">{quantity}</span>
                <button 
                  className="sa-circle-btn add" 
                  onClick={() => setQuantity(q => q + 50)}
                  title="Increase by 50"
                >
                  <Icons.Plus />
                </button>
              </div>
              <div className="sa-helper-text">
                Current: <span className="sa-text-gray">{currentStock.toLocaleString()} kg</span> → <span className="sa-text-green">New: {(currentStock + quantity).toLocaleString()} kg</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="sa-form-group">
            <label className="sa-label">Reason for Adjustment</label>
            <div className="sa-select-wrapper">
              <select 
                className="sa-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option>Purchase Receipt</option>
                <option>Supplier Return Credit</option>
                <option>Inventory Correction</option>
                <option>Production Return</option>
                <option>Quality Acceptance</option>
                <option>Other</option>
              </select>
              <div className="sa-select-icon"><Icons.ChevronDown /></div>
            </div>
          </div>

          {/* Notes */}
          <div className="sa-form-group">
            <label className="sa-label">Notes (Optional)</label>
            <input 
              type="text" 
              className="sa-input" 
              placeholder="e.g. Lot number, supplier invoice reference, quality notes..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

        </div>

        <div className="sa-form-footer">
          <button className="sa-btn-submit" onClick={handleSubmit}>
            <Icons.Plus /> Add to Stock
          </button>
        </div>
      </div>

      {/* History Table Card */}
      <div className="sa-card sa-history-card">
        <div className="sa-history-header">
          <h2 className="sa-card-title-sm">Recent Stock In History</h2>
          <div className="sa-search-wrapper">
            <div className="sa-search-icon"><Icons.Search /></div>
            <input type="text" className="sa-search-input" placeholder="Search history..." />
          </div>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Material</th>
                <th>Quantity</th>
                <th>Previous Stock</th>
                <th>New Stock</th>
                <th>Reason</th>
                <th>Adjusted By</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.date}</td>
                  <td className="sa-text-theme">{row.item}</td>
                  <td>
                    <span className="sa-badge-green">{row.qty}</span>
                  </td>
                  <td>{row.prev}</td>
                  <td className="sa-font-bold">{row.new}</td>
                  <td>{row.reason}</td>
                  <td>
                    <div className="sa-user-cell">
                      <div className={`sa-avatar ${row.color}`}>
                        {row.initial}
                      </div>
                      <span>{row.by}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default StockAdjustment;