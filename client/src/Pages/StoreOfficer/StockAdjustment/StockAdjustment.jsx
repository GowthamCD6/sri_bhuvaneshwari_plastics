import React, { useState } from 'react';
import './StockAdjustment.css';

// SVG Icons
const Icons = {
  ArrowDown: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
  ),
  ArrowUp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
  ),
  Box: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  ),
  Scan: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><line x1="12" y1="17" x2="12" y2="7"></line></svg>
  ),
  Minus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
  )
};

const StockAdjustment = () => {
  const [quantity, setQuantity] = useState(25);

  // Data from the image
  const historyData = [
    { date: "22/01/26", item: "Tomato (Kg)", qty: "+15", prev: "33 Kg", new: "48 Kg", reason: "Return from Kitchen", by: "Admin", initial: "A", color: "bg-blue" },
    { date: "21/01/26", item: "Potato (Kg)", qty: "+5", prev: "7 Kg", new: "12 Kg", reason: "Inventory Correction", by: "Rajesh", initial: "R", color: "bg-red" },
    { date: "19/01/26", item: "Rice (Kg)", qty: "+20", prev: "80 Kg", new: "100 Kg", reason: "Purchase Return", by: "Rajesh", initial: "R", color: "bg-red" },
  ];

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
        {/* Header with Green Box Icon */}
        <div className="sa-card-header-flex">
          <div className="sa-icon-box">
            <Icons.Box />
          </div>
          <h2 className="sa-card-title">Stock In - Return Items to Inventory</h2>
        </div>

        <div className="sa-form-grid">
          
          {/* Item Selector */}
          <div className="sa-form-group">
            <label className="sa-label">Item to Return</label>
            <div className="sa-input-with-action">
              <div className="sa-select-wrapper">
                <select className="sa-select">
                  <option>Tomato (Kg)</option>
                  <option>Potato (Kg)</option>
                </select>
                <div className="sa-select-icon"><Icons.ChevronDown /></div>
              </div>
              <button className="sa-action-btn">
                <Icons.Scan />
              </button>
            </div>
          </div>

          {/* Quantity Counter */}
          <div className="sa-form-group">
            <label className="sa-label">Quantity to Add</label>
            <div className="sa-counter-row">
              <div className="sa-counter-controls">
                {/* Changed Minus button to Blue to match theme, or could be Gray. Using Theme Blue. */}
                <button 
                  className="sa-circle-btn remove" 
                  onClick={() => setQuantity(q => Math.max(0, q - 1))}
                >
                  <Icons.Minus />
                </button>
                <span className="sa-counter-value">{quantity}</span>
                <button 
                  className="sa-circle-btn add" 
                  onClick={() => setQuantity(q => q + 1)}
                >
                  <Icons.Plus />
                </button>
              </div>
              <div className="sa-helper-text">
                Current: <span className="sa-text-gray">48 Kg</span> → <span className="sa-text-green">New: {48 + quantity} Kg</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="sa-form-group">
            <label className="sa-label">Reason</label>
            <div className="sa-select-wrapper">
              <select className="sa-select">
                <option>Return from Kitchen</option>
                <option>Damage</option>
                <option>Other</option>
              </select>
              <div className="sa-select-icon"><Icons.ChevronDown /></div>
            </div>
          </div>

          {/* Notes */}
          <div className="sa-form-group">
            <label className="sa-label">Notes (Optional)</label>
            <input type="text" className="sa-input" placeholder="e.g. Returned after event leftovers" />
          </div>

        </div>

        <div className="sa-form-footer">
          <button className="sa-btn-submit">
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
                <th>DATE</th>
                <th>ITEM</th>
                <th>QUANTITY</th>
                <th>PREVIOUS</th>
                <th>NEW STOCK</th>
                <th>REASON</th>
                <th>BY</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.date}</td>
                  {/* Changed text color to Blue to match theme */}
                  <td className="sa-text-theme">{row.item}</td>
                  <td>
                    <span className="sa-badge-green">{row.qty}</span>
                  </td>
                  <td>{row.prev}</td>
                  <td className="sa-font-bold">{row.new}</td>
                  <td>{row.reason}</td>
                  <td>
                    <div className="sa-user-cell">
                      <div className={`sa-avatar ${row.color === 'bg-blue' ? 'avatar-blue' : 'avatar-red'}`}>
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