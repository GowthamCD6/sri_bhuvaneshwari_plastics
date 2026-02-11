import React, { useState, useEffect } from 'react';
import './QMSApproval.css';
import { purchaseIndentService } from '../../../services/apiService';

const QMSIndentApprovals = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIndents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching all indents for Admin approval');
      // Fetch indents from multiple workflow stages:
      // 1. Admin: Pending for Admin approval
      // 2. Accountant, Completed: Already approved by Admin, showing history
      const responses = await Promise.all([
        purchaseIndentService.getAllIndents({ workflowStage: 'Admin' }),
        purchaseIndentService.getAllIndents({ workflowStage: 'Accountant' }),
        purchaseIndentService.getAllIndents({ workflowStage: 'Completed' })
      ]);
      
      console.log('Admin fetched responses:', responses);
      
      // Combine all responses
      const allIndentsData = responses.reduce((acc, response) => {
        if (response.success && response.data) {
          return [...acc, ...response.data];
        }
        return acc;
      }, []);
      
      console.log('Admin combined indents:', allIndentsData);
      
      const mapped = allIndentsData.map((indent) => {
        const materials = Array.isArray(indent.materials) ? indent.materials : [];
        const first = materials[0];
        const materialName = first?.material_description || 'Materials';
        const quantity = first?.quantity ? `${first.quantity}${first.unit_of_measurement || ''}` : '-';
        const details = materials.length > 1 ? `${quantity} • +${materials.length - 1} more` : `${quantity} • ${materialName}`;

        // Determine status based on workflow_stage
        let displayStatus = indent.status;
        if (indent.workflow_stage === 'Admin') {
          displayStatus = 'Pending Admin Approval';
        } else if (indent.workflow_stage === 'Accountant' || indent.workflow_stage === 'Completed') {
          displayStatus = 'Admin Approved';
        }

        return {
          id: indent.indent_number,
          indentId: indent.indent_id,
          date: new Date(indent.request_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          material: materialName,
          details,
          requestedBy: indent.requested_by_name || 'QMS Officer',
          urgency: indent.priority === 'High' ? 'High' : indent.priority === 'Urgent' ? 'Critical' : 'Normal',
          status: displayStatus,
          workflowStage: indent.workflow_stage
        };
      });
      setIndents(mapped);
    } catch (err) {
      console.error('Failed to fetch admin approvals:', err);
      setError('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndents();
  }, []);

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
  };

  const handleApprove = async (indentId) => {
    try {
      await purchaseIndentService.sendToNextStage(indentId, { comments: 'Approved by Admin' });
      fetchIndents();
    } catch (err) {
      console.error('Approve failed:', err);
      alert('Failed to approve indent');
    }
  };

  const handleReject = async (indentId) => {
    try {
      await purchaseIndentService.updateIndentStatus(indentId, { status: 'Rejected', comments: 'Rejected by Admin' });
      fetchIndents();
    } catch (err) {
      console.error('Reject failed:', err);
      alert('Failed to reject indent');
    }
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

      {error && (
        <div style={{ padding: '12px 16px', margin: '16px 0', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
          Loading approvals...
        </div>
      )}

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
                  {indent.status === 'Pending Admin Approval' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button className="qms-view-btn" onClick={() => handleApprove(indent.indentId)}>Approve</button>
                      <button className="qms-view-btn" onClick={() => handleReject(indent.indentId)}>Reject</button>
                    </div>
                  )}
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