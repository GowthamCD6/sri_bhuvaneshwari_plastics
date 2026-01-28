import React from 'react';
import './VerifyStoreIndents.css';

// Exact SVG Icons matching the UI
const Icons = {
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  Filter: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
  ),
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  ),
  CheckCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
  ),
  ShoppingBag: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
  ),
  Box: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  ),
};

const VerifyStoreIndents = () => {
  // Mock Data corresponding to the image rows
  const indents = [
    {
      id: "#IND-24-082",
      date: "25 Jan, 2024",
      project: "Alpha Industrial Pump",
      orderId: "Order #ORD-9921",
      raisedBy: "Priya S.",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
      itemCount: "12 Items",
      priority: "High Priority",
      storeAvailable: 8,
      storeToBuy: 4,
      isFullStock: false,
      status: "Pending QMS",
      statusClass: "badge-pending",
    },
    {
      id: "#IND-24-081",
      date: "24 Jan, 2024",
      project: "Beta Machinery Ltd",
      orderId: "Order #ORD-9918",
      raisedBy: "Rajesh K.",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
      itemCount: "5 Items",
      priority: "Normal Priority",
      storeAvailable: 0,
      storeToBuy: 5,
      isFullStock: false,
      status: "Pending QMS",
      statusClass: "badge-pending",
    },
    {
      id: "#IND-24-079",
      date: "24 Jan, 2024",
      project: "Gamma Tech Solutions",
      orderId: "Order #ORD-9915",
      raisedBy: "Sarah M.",
      avatar: "https://i.pravatar.cc/150?u=a04258114e29026302d",
      itemCount: "8 Items",
      priority: "Normal Priority",
      storeAvailable: 8,
      storeToBuy: 0,
      isFullStock: true,
      status: "Store Verified",
      statusClass: "badge-verified",
    },
    {
      id: "#IND-24-075",
      date: "22 Jan, 2024",
      project: "Omega Structures",
      orderId: "Order #ORD-9902",
      raisedBy: "David W.",
      avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
      itemCount: "24 Items",
      priority: "Low Priority",
      storeAvailable: 20,
      storeToBuy: 4,
      isFullStock: false,
      status: "Pending QMS",
      statusClass: "badge-pending",
    },
  ];

  return (
    <div className="vsi-container">
      
      {/* Top Navbar Area */}
      <header className="vsi-header">
        <h1 className="vsi-page-title">Verify Store Indents</h1>
        <div className="vsi-header-right">
          <div className="vsi-notification">
            <Icons.Bell />
            <span className="vsi-notification-dot"></span>
          </div>
          <img src="https://i.pravatar.cc/150?u=admin" alt="User" className="vsi-user-avatar-lg" />
        </div>
      </header>

      {/* Stats Cards Row */}
      <div className="vsi-stats-row">
        <div className="vsi-card">
          <div className="vsi-card-header">
            <span className="vsi-card-label">Pending Verification</span>
            <Icons.Clock />
          </div>
          <div className="vsi-card-value">12</div>
        </div>
        <div className="vsi-card">
          <div className="vsi-card-header">
            <span className="vsi-card-label">Processed Today</span>
            <Icons.CheckCircle />
          </div>
          <div className="vsi-card-value">8</div>
        </div>
        <div className="vsi-card">
          <div className="vsi-card-header">
            <span className="vsi-card-label">Requires Purchase</span>
            <Icons.ShoppingBag />
          </div>
          <div className="vsi-card-value">5</div>
        </div>
        <div className="vsi-card">
          <div className="vsi-card-header">
            <span className="vsi-card-label">Fully Stocked</span>
            <Icons.Box />
          </div>
          <div className="vsi-card-value">3</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="vsi-main-panel">
        
        {/* Filters Toolbar */}
        <div className="vsi-toolbar">
          <div className="vsi-tabs">
            <button className="vsi-tab active">Pending</button>
            <button className="vsi-tab">Verified</button>
            <button className="vsi-tab">All Indents</button>
          </div>
          
          <div className="vsi-actions">
            <div className="vsi-search-wrapper">
              <div className="vsi-search-icon"><Icons.Search /></div>
              <input type="text" placeholder="Search indents..." className="vsi-search-input" />
            </div>
            <button className="vsi-filter-btn">
              <Icons.Filter />
              Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="vsi-table-container">
          <table className="vsi-table">
            <thead>
              <tr>
                <th>INDENT ID</th>
                <th>PROJECT / CUSTOMER</th>
                <th>RAISED BY</th>
                <th>ITEMS</th>
                <th>STORE STATUS</th>
                <th>VERIFICATION STATUS</th>
                <th style={{textAlign: 'right'}}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {indents.map((item, idx) => (
                <tr key={idx}>
                  
                  {/* ID */}
                  <td>
                    <div className="vsi-id-link">{item.id}</div>
                    <div className="vsi-subtext">{item.date}</div>
                  </td>

                  {/* Project */}
                  <td>
                    <div className="vsi-text-bold">{item.project}</div>
                    <div className="vsi-subtext-blue">{item.orderId}</div>
                  </td>

                  {/* Raised By */}
                  <td>
                    <div className="vsi-user-cell">
                      <img src={item.avatar} alt={item.raisedBy} className="vsi-user-avatar-sm" />
                      <span className="vsi-text-medium">{item.raisedBy}</span>
                    </div>
                  </td>

                  {/* Items */}
                  <td>
                    <div className="vsi-text-bold">{item.itemCount}</div>
                    <div className="vsi-subtext">{item.priority}</div>
                  </td>

                  {/* Store Status (Progress Bar) */}
                  <td style={{ minWidth: '180px' }}>
                    <div className="vsi-stock-text">
                      <span className="vsi-bold-dark">{item.storeAvailable} Available</span>
                      {item.isFullStock ? (
                         <span className="vsi-success-text">Full Stock</span>
                      ) : (
                         <span className="vsi-subtext-blue"> {item.storeToBuy} to Buy</span>
                      )}
                    </div>
                    {/* Progress Bar Visual */}
                    <div className="vsi-progress-track">
                      <div 
                        className="vsi-progress-fill" 
                        style={{ width: `${(item.storeAvailable / (item.storeAvailable + item.storeToBuy || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </td>

                  {/* Verification Status */}
                  <td>
                    <span className={`vsi-badge ${item.statusClass}`}>
                      {item.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td style={{textAlign: 'right'}}>
                    <button className="vsi-btn-verify">Verify</button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="vsi-footer">
          <span className="vsi-footer-text">Showing 1-4 of 12 items</span>
          <div className="vsi-pagination">
            <button className="vsi-page-btn">Previous</button>
            <button className="vsi-page-btn">Next</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VerifyStoreIndents;