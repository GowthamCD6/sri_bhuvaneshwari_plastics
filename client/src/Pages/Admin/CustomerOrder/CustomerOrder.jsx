import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerOrder.css';
import { purchaseIndentService } from '../../../services/apiService';

const CustomerOrderApprovals = () => {
  const navigate = useNavigate();
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
        if (indent.status === 'Rejected') {
          displayStatus = 'Rejected';
        } else if (indent.workflow_stage === 'Admin') {
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

  const tabCounts = useMemo(() => {
    const pending = indents.filter((i) => i.status === 'Pending Admin Approval').length;
    const approved = indents.filter((i) => i.status === 'Admin Approved').length;
    const rejected = indents.filter((i) => i.status === 'Rejected').length;
    return { pending, approved, rejected };
  }, [indents]);

  const filteredIndents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const searched = !q
      ? indents
      : indents.filter((indent) => {
          const haystack = [
            indent.id,
            indent.material,
            indent.details,
            indent.requestedBy,
            indent.status
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        });

    if (activeTab === 'pending') {
      return searched.filter((i) => i.status === 'Pending Admin Approval');
    }
    if (activeTab === 'approved') {
      return searched.filter((i) => i.status === 'Admin Approved');
    }
    if (activeTab === 'rejected') {
      return searched.filter((i) => i.status === 'Rejected');
    }

    return searched;
  }, [indents, searchQuery, activeTab]);

  const handleViewIndent = (indent) => {
    if (!indent?.indentId) return;
    navigate('/admin-purchase-indents', {
      state: {
        indentId: indent.indentId,
        isViewMode: true
      }
    });
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
          <h1 className="qms-title">Customer Order Approvals</h1>
        </div>
      </header>

      {error && (
        <div style={{ padding: '12px 16px', margin: '16px 0', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
          <strong>Error:</strong> {error}
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
                Pending Review ({tabCounts.pending})
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
                    onClick={() => handleViewIndent(indent)}
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

            {!loading && filteredIndents.length === 0 && (
              <div style={{ padding: '18px', color: '#64748b', textAlign: 'center' }}>
                No indents found.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="qms-footer">
            <span className="qms-footer-info">
              Showing {filteredIndents.length} of {indents.length} indents
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

export default CustomerOrderApprovals;