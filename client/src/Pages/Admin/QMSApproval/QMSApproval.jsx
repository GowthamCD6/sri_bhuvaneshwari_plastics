import React, { useState } from 'react';
import './QMSApproval.css';

const QMSApproval = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sample pending approvals data
  const pendingApprovals = [
    {
      id: 'QMS-001',
      title: 'Raw Material Purchase - HDPE Granules',
      requestedBy: 'QMS Officer',
      department: 'Quality Management',
      date: '2026-01-28',
      amount: '₹45,000',
      priority: 'High',
      status: 'Pending'
    },
    {
      id: 'QMS-002',
      title: 'Customer Order Approval - ABC Corp',
      requestedBy: 'QMS Officer',
      department: 'Quality Management',
      date: '2026-01-27',
      amount: '₹1,25,000',
      priority: 'Medium',
      status: 'Pending'
    },
    {
      id: 'QMS-003',
      title: 'Store Indent Verification - Packaging Materials',
      requestedBy: 'Store Officer',
      department: 'Store',
      date: '2026-01-26',
      amount: '₹18,500',
      priority: 'Low',
      status: 'Pending'
    },
    {
      id: 'QMS-004',
      title: 'Quality Check Report - Batch #2024',
      requestedBy: 'QMS Officer',
      department: 'Quality Management',
      date: '2026-01-25',
      amount: '₹0',
      priority: 'High',
      status: 'Under Review'
    },
    {
      id: 'QMS-005',
      title: 'Vendor Registration - New Supplier',
      requestedBy: 'Procurement',
      department: 'Procurement',
      date: '2026-01-24',
      amount: '₹0',
      priority: 'Medium',
      status: 'Pending'
    }
  ];

  const filteredApprovals = pendingApprovals.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleApprove = (id) => {
    console.log('Approved:', id);
    // Add approval logic here
  };

  const handleReject = (id) => {
    console.log('Rejected:', id);
    // Add rejection logic here
  };

  const getPriorityClass = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'under review': return 'status-review';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  return (
    <div className="qms-approval-container">
      {/* Header */}
      <div className="qms-approval-header">
        <div className="header-left">
          <h1>QMS Approvals</h1>
          <p>Review and approve pending requests from QMS department</p>
        </div>
        <div className="header-stats">
          <div className="stat-card pending">
            <span className="stat-number">{pendingApprovals.filter(a => a.status === 'Pending').length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card review">
            <span className="stat-number">{pendingApprovals.filter(a => a.status === 'Under Review').length}</span>
            <span className="stat-label">Under Review</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="qms-approval-filters">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search by ID or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'under review' ? 'active' : ''}`}
            onClick={() => setFilterStatus('under review')}
          >
            Under Review
          </button>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="qms-approval-table-container">
        <table className="qms-approval-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Title</th>
              <th>Requested By</th>
              <th>Department</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApprovals.map((item) => (
              <tr key={item.id}>
                <td className="request-id">{item.id}</td>
                <td className="request-title">{item.title}</td>
                <td>{item.requestedBy}</td>
                <td>{item.department}</td>
                <td>{item.date}</td>
                <td className="amount">{item.amount}</td>
                <td>
                  <span className={`priority-badge ${getPriorityClass(item.priority)}`}>
                    {item.priority}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${getStatusClass(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="actions">
                  <button 
                    className="action-btn approve"
                    onClick={() => handleApprove(item.id)}
                    title="Approve"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>
                  <button 
                    className="action-btn reject"
                    onClick={() => handleReject(item.id)}
                    title="Reject"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  <button 
                    className="action-btn view"
                    title="View Details"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredApprovals.length === 0 && (
          <div className="no-data">
            <p>No pending approvals found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QMSApproval;
