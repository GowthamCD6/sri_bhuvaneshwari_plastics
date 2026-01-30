import React, { useState } from 'react';
import './QMSApproval.css';

const QMSIndentApprovals = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const indents = [
    {
      id: 'IND-2024-089',
      date: 'Oct 24, 2024',
      material: 'HDPE Granules - Blue',
      details: 'Qty: 500kg • Stock Replenishment',
      requestedBy: 'QMS Officer',
      urgency: 'Critical',
      status: 'Pending'
    },
    {
      id: 'IND-2024-094',
      date: 'Oct 23, 2024',
      material: 'Industrial Solvent X2',
      details: 'Qty: 100L • Maintenance',
      requestedBy: 'QMS Officer',
      urgency: 'High',
      status: 'Pending'
    },
    {
      id: 'IND-2024-092',
      date: 'Oct 22, 2024',
      material: 'Packing Tape (Clear)',
      details: 'Qty: 200 Rolls • Packaging',
      requestedBy: 'QMS Officer',
      urgency: 'Normal',
      status: 'Pending'
    },
    {
      id: 'IND-2024-098',
      date: 'Oct 21, 2024',
      material: 'Safety Gloves (L)',
      details: 'Qty: 50 Pairs • Safety Gear',
      requestedBy: 'QMS Officer',
      urgency: 'Normal',
      status: 'Pending'
    },
    {
      id: 'IND-2024-099',
      date: 'Oct 21, 2024',
      material: 'Machine Oil Type-A',
      details: 'Qty: 50L • Maintenance',
      requestedBy: 'QMS Officer',
      urgency: 'Normal',
      status: 'Pending'
    }
  ];

  const filteredIndents = indents.filter(indent => {
    const searchLower = searchQuery.toLowerCase();
    return (
      indent.id.toLowerCase().includes(searchLower) ||
      indent.material.toLowerCase().includes(searchLower) ||
      indent.details.toLowerCase().includes(searchLower)
    );
  });

  const handleViewIndent = (indentId) => {
    console.log('Viewing indent:', indentId);
    // Add your view logic here
  };

  return (
    <div className="qms-container">
      {/* Header */}
      <header className="qms-header">
        <div className="qms-header-content">
          <h1 className="qms-title">QMS Indent Approvals</h1>
          <div className="qms-header-right">
            <div className="qms-notification">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="qms-notification-dot"></span>
            </div>
            <span className="qms-login-info">Last login: Today, 09:41 AM</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="qms-main">
        <div className="qms-card">
          {/* Tabs and Search */}
          <div className="qms-top-bar">
            <div className="qms-tabs">
              <button 
                className={`qms-tab ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending Review (5)
              </button>
              <button 
                className={`qms-tab ${activeTab === 'approved' ? 'active' : ''}`}
                onClick={() => setActiveTab('approved')}
              >
                Approved History
              </button>
              <button 
                className={`qms-tab ${activeTab === 'rejected' ? 'active' : ''}`}
                onClick={() => setActiveTab('rejected')}
              >
                Rejected
              </button>
            </div>
            <div className="qms-search-wrapper">
              <svg className="qms-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input 
                type="text" 
                className="qms-search" 
                placeholder="Search indents, material, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Table Header */}
          <div className="qms-table-header">
            <div>Indent ID</div>
            <div>Date</div>
            <div>Material Details</div>
            <div>Requested By</div>
            <div>Urgency</div>
            <div>Status</div>
            <div>View</div>
          </div>

          {/* Table Body */}
          <div className="qms-table-body">
            {filteredIndents.map((indent) => (
              <div key={indent.id} className="qms-table-row">
                <div className="qms-indent-id">{indent.id}</div>
                <div className="qms-date">{indent.date}</div>
                <div>
                  <div className="qms-material-name">{indent.material}</div>
                  <div className="qms-material-details">{indent.details}</div>
                </div>
                <div className="qms-requester">
                  <div className="qms-avatar">
                    <span className="qms-avatar-text">Q</span>
                  </div>
                  <span className="qms-requester-name">{indent.requestedBy}</span>
                </div>
                <div>
                  <span className={`qms-urgency ${indent.urgency.toLowerCase()}`}>
                    {indent.urgency}
                  </span>
                </div>
                <div className="qms-status">
                  <div className="qms-status-dot"></div>
                  <span className="qms-status-text">{indent.status}</span>
                </div>
                <div>
                  <button 
                    className="qms-view-btn"
                    onClick={() => handleViewIndent(indent.id)}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="qms-footer">
            <span className="qms-footer-info">
              Showing {filteredIndents.length} of {indents.length} pending indents
            </span>
            <div className="qms-pagination">
              <button className="qms-pagination-btn" disabled>Previous</button>
              <button className="qms-pagination-btn" disabled>Next</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QMSIndentApprovals;