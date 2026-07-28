import React, { useState, useMemo, useEffect } from 'react';
import { Search, Eye, ChevronLeft, ChevronRight, FileText, X, Package, Calendar, MapPin, AlertCircle } from 'lucide-react';
import './StoreRequests.css';
import { useNavigate } from 'react-router-dom';
import { storeRequestService } from '../../../services/apiService';

const StoreRequests = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showIndentModal, setShowIndentModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const itemsPerPage = 5;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (value) => {
    if (!value) return '-';
    
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = value.split('-');
      const date = new Date(year, month - 1, day, 12, 0, 0);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await storeRequestService.getAllRequests();
      const data = response.data || [];
      const mapped = data.map((req) => ({
        id: req.request_number,
        requestId: req.request_id,
        material: req.material_name,
        code: req.material_code || '-',
        specs: req.specs || '',
        qtyNeeded: `${req.quantity} ${req.unit_of_measurement}`,
        rawQuantity: req.quantity,
        rawUnit: req.unit_of_measurement,
        reason: req.reason || '-',
        remarks: req.remarks || '',
        location: req.storage_location ? `Loc: ${req.storage_location}` : '',
        requestDate: formatDate(req.request_date),
        neededDate: formatDate(req.needed_by_date),
        rawNeededDate: req.needed_by_date,
        priority: req.priority || 'Normal',
        status: (req.status || 'Pending').toLowerCase(),
        requestedBy: req.requested_by_name || 'Store Officer',
        department: req.dept_name || '- ',
        indentId: req.indent_id
      }));
      setRequests(mapped);
    } catch (err) {
      setError('Failed to load store requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filters = [
    { id: 'all', label: 'All Requests' },
    { id: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
    { id: 'approved', label: 'Approved', count: requests.filter(r => r.status === 'processed' || r.status === 'approved').length },
    { id: 'rejected', label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length }
  ];

  // Filter and search logic
  const filteredRequests = useMemo(() => {
    let result = [...requests];

    if (activeFilter === 'pending') {
      result = result.filter(r => r.status === 'pending');
    } else if (activeFilter === 'approved') {
      result = result.filter(r => r.status === 'processed' || r.status === 'approved');
    } else if (activeFilter === 'rejected') {
      result = result.filter(r => r.status === 'rejected');
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.id.toLowerCase().includes(query) ||
        r.material.toLowerCase().includes(query) ||
        r.code.toLowerCase().includes(query) ||
        r.reason.toLowerCase().includes(query)
      );
    }

    return result;
  }, [requests, activeFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateIndent = (request) => {
    setSelectedRequest(request);
    setShowIndentModal(true);
  };

  const confirmCreateIndent = () => {
    if (!selectedRequest) return;
    
    // Navigate to Create Indent page with pre-filled data
    navigate('/create-purchase-indent', { 
      state: { 
        storeRequest: {
          id: selectedRequest.requestId || selectedRequest.id,
          material: selectedRequest.material,
          code: selectedRequest.code,
          quantity: selectedRequest.rawQuantity,
          unit: selectedRequest.rawUnit,
          neededDate: selectedRequest.rawNeededDate,
          priority: selectedRequest.priority,
          reason: selectedRequest.reason,
          specs: selectedRequest.specs
        }
      } 
    });
    
    setShowIndentModal(false);
    setSelectedRequest(null);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    try {
      await storeRequestService.verifyRequest(selectedRequest.requestId || selectedRequest.id, 'Rejected', rejectReason);
      await fetchRequests();
      setShowRejectModal(false);
      setSelectedRequest(null);
      // alert('Request rejected successfully');
    } catch (err) {
      alert('Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Critical': return 'priority-critical';
      case 'High': return 'priority-high';
      case 'Normal': return 'priority-normal';
      default: return 'priority-normal';
    }
  };

  return (
    <div className="sr-container">
      <div className="sr-content">
        <div className="sr-header">
           <h1 className="sr-title">Store Requests</h1>
        </div>
        
        {error && (
          <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
            <strong>Error:</strong> {error}
          </div>
        )}


        {/* Filter Tabs and Search */}
        <div className="sr-controls-section">
          <div className="sr-tabs">
            {filters.map(filter => (
              <button
                key={filter.id}
                className={`sr-tab ${activeFilter === filter.id ? 'active' : ''}`}
                onClick={() => { setActiveFilter(filter.id); setCurrentPage(1); }}
              >
                {filter.label}
                {filter.count !== undefined && (
                  <span className="sr-tab-count">{filter.count}</span>
                )}
              </button>
            ))}
          </div>
          <div className="sr-search-filter">
            <div className="sr-search-box">
              <Search size={16} className="sr-search-icon" />
              <input
                type="text"
                placeholder="Search by ID, code, or name..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="sr-search-input"
              />
            </div>
          </div>
        </div>

        {/* Card & Table */}
        <div className="sr-card">
          <div className="sr-card-header">
            <Package size={20} className="sr-header-icon" />
            <h2 className="sr-card-heading">Store Requests List</h2>
            <span className="sr-result-count">
              Showing {filteredRequests.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
            </span>
          </div>
          
          <div className="sr-table-responsive">
            <table className="sr-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>REQUEST ID</th>
                  <th style={{ width: '25%' }}>MATERIAL DETAILS</th>
                  <th style={{ width: '12%' }}>QUANTITY</th>
                  <th style={{ width: '18%' }}>REASON</th>
                  <th style={{ width: '12%' }}>NEEDED DATE</th>
                  <th style={{ width: '10%' }}>PRIORITY</th>
                  <th style={{ width: '8%' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.length > 0 ? (
                  paginatedRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div className="sr-id-text">{request.id}</div>
                        <div className="sr-sub-text">{request.requestDate}</div>
                      </td>
                      <td>
                        <div className="sr-bold-text">{request.material}</div>
                        <div className="sr-sub-text">
                          {request.code} {request.specs && `• ${request.specs}`}
                        </div>
                      </td>
                      <td>
                        <div className="sr-qty-text">{request.qtyNeeded}</div>
                      </td>
                      <td>
                        <div className="sr-reason-text">{request.reason}</div>
                        {request.location && (
                          <div className="sr-sub-text">{request.location}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                          <Calendar size={14} />
                          <span>{request.neededDate}</span>
                        </div>
                      </td>
                      <td>
                        {request.status === 'processed' || request.status === 'approved' ? (
                          <span className="sr-status-badge status-processed">Approved</span>
                        ) : request.status === 'rejected' ? (
                          <span className="sr-status-badge status-rejected">Rejected</span>
                        ) : (
                          <span className={`sr-priority-badge ${getPriorityClass(request.priority)}`}>
                            {request.priority}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="sr-actions">
                          <button 
                            className="sr-btn-icon sr-btn-view"
                            onClick={() => handleViewDetails(request)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {request.status === 'pending' ? (
                            <button 
                              className="sr-btn-create"
                              onClick={() => handleCreateIndent(request)}
                              title="Create Indent"
                            >
                              Create Indent
                            </button>
                          ) : request.status === 'rejected' ? (
                             <button className="sr-btn-created" disabled title="Rejected" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                              Rejected
                            </button>
                          ) : (
                            <button className="sr-btn-created" disabled title="Indent Created">
                              Created
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="sr-empty">
                      <div className="sr-empty-content">
                        <Package size={48} style={{ color: '#cbd5e1' }} />
                        <p>No requests found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="sr-pagination">
            <div className="sr-pagination-controls">
              <button
                className="sr-page-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                 <button
                   key={idx + 1}
                   className={`sr-page-btn ${currentPage === idx + 1 ? 'active' : ''}`}
                   style={currentPage === idx + 1 ? { backgroundColor: '#2563eb', color: 'white', borderColor: '#2563eb' } : {}}
                   onClick={() => setCurrentPage(idx + 1)}
                 >
                   {idx + 1}
                 </button>
              ))}
              <button
                className="sr-page-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Confirmation Modal */}
      {showRejectModal && selectedRequest && (
        <div className="sr-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="sr-modal sr-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="sr-modal-header">
              <h3>Reject Store Request</h3>
              <button className="sr-modal-close" onClick={() => setShowRejectModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="sr-modal-body">
              <p className="sr-confirm-text">
                Are you sure you want to reject this store request? This action cannot be undone.
              </p>
              <div className="sr-confirm-details">
                <div className="sr-confirm-row">
                  <span className="sr-confirm-label">Request ID:</span>
                  <span className="sr-confirm-value">{selectedRequest.id}</span>
                </div>
                <div className="sr-confirm-row">
                  <span className="sr-confirm-label">Material:</span>
                  <span className="sr-confirm-value">{selectedRequest.material}</span>
                </div>
              </div>
              <div className="sr-field-group" style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>Rejection Reason (Optional)</label>
                <textarea
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px', fontSize: '14px' }}
                  placeholder="Enter reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <div className="sr-modal-footer">
              <button className="sr-btn-secondary" onClick={() => setShowRejectModal(false)} disabled={isProcessing}>
                Cancel
              </button>
              <button 
                className="sr-btn-create" 
                onClick={confirmReject} 
                disabled={isProcessing}
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: 'white' }}
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailModal && selectedRequest && (
        <div className="sr-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="sr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sr-modal-header">
              <h3>Request Details</h3>
              <button className="sr-modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="sr-modal-body">
              <div className="sr-detail-header">
                <div className="sr-detail-id">{selectedRequest.id}</div>
                {selectedRequest.status === 'processed' || selectedRequest.status === 'approved' ? (
                  <span className="sr-status-badge status-processed">Approved</span>
                ) : selectedRequest.status === 'rejected' ? (
                  <span className="sr-status-badge status-rejected">Rejected</span>
                ) : (
                  <span className={`sr-priority-badge ${getPriorityClass(selectedRequest.priority)}`}>
                    {selectedRequest.priority}
                  </span>
                )}
              </div>
              
              <div className="sr-detail-grid">
                <div className="sr-detail-item">
                  <div className="sr-detail-icon">
                    <Package size={18} />
                  </div>
                  <div className="sr-detail-content">
                    <span className="sr-detail-label">Material</span>
                    <span className="sr-detail-value">{selectedRequest.material}</span>
                    <span className="sr-detail-sub">Code: {selectedRequest.code} {selectedRequest.specs && `| ${selectedRequest.specs}`}</span>
                  </div>
                </div>

                <div className="sr-detail-item">
                  <div className="sr-detail-icon">
                    <AlertCircle size={18} />
                  </div>
                  <div className="sr-detail-content">
                    <span className="sr-detail-label">Quantity Needed</span>
                    <span className="sr-detail-value">{selectedRequest.qtyNeeded}</span>
                  </div>
                </div>

                <div className="sr-detail-item">
                  <div className="sr-detail-icon">
                    <Calendar size={18} />
                  </div>
                  <div className="sr-detail-content">
                    <span className="sr-detail-label">Request Date</span>
                    <span className="sr-detail-value">{selectedRequest.requestDate}</span>
                  </div>
                </div>

                <div className="sr-detail-item">
                  <div className="sr-detail-icon">
                    <MapPin size={18} />
                  </div>
                  <div className="sr-detail-content">
                    <span className="sr-detail-label">Department</span>
                    <span className="sr-detail-value">{selectedRequest.department}</span>
                  </div>
                </div>
              </div>

              <div className="sr-detail-section">
                <span className="sr-detail-label">Reason for Request</span>
                <p className="sr-detail-reason">{selectedRequest.reason}</p>
                {selectedRequest.location && (
                  <span className="sr-detail-sub">{selectedRequest.location}</span>
                )}
              </div>

              <div className="sr-detail-section">
                <span className="sr-detail-label">Requested By</span>
                <p className="sr-detail-value">{selectedRequest.requestedBy}</p>
              </div>

              {selectedRequest.indentId && (
                <div className="sr-detail-section sr-indent-info">
                  <span className="sr-detail-label">Purchase Indent</span>
                  <p className="sr-detail-value sr-indent-id">{selectedRequest.indentId}</p>
                </div>
              )}
              {selectedRequest.status === 'rejected' && (
                <div className="sr-detail-section sr-indent-info" style={{background: '#fee2e2', borderColor: '#fca5a5'}}>
                  <span className="sr-detail-label" style={{color: '#dc2626'}}>Rejected</span>
                  {selectedRequest.remarks && (
                    <p className="sr-detail-value" style={{color: '#b91c1c'}}>{selectedRequest.remarks}</p>
                  )}
                </div>
              )}
            </div>
            <div className="sr-modal-footer">
              {selectedRequest.status === 'pending' && (
               <>
                <button 
                  className="sr-btn-reject"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleReject(selectedRequest);
                  }}
                  style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', marginRight: '8px' }}
                >
                  Reject
                </button>
                <button 
                  className="sr-btn-create" 
                  onClick={() => {
                    setShowDetailModal(false);
                    handleCreateIndent(selectedRequest);
                  }}
                >
                  Create Indent
                </button>
               </>
              )}
              <button className="sr-btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Indent Confirmation Modal */}
      {showIndentModal && selectedRequest && (
        <div className="sr-modal-overlay" onClick={() => setShowIndentModal(false)}>
          <div className="sr-modal sr-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="sr-modal-header">
              <h3>Create Purchase Indent</h3>
              <button className="sr-modal-close" onClick={() => setShowIndentModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="sr-modal-body">
              <p className="sr-confirm-text">
                Are you sure you want to create a purchase indent for the following request?
              </p>
              <div className="sr-confirm-details">
                <div className="sr-confirm-row">
                  <span className="sr-confirm-label">Request ID:</span>
                  <span className="sr-confirm-value">{selectedRequest.id}</span>
                </div>
                <div className="sr-confirm-row">
                  <span className="sr-confirm-label">Material:</span>
                  <span className="sr-confirm-value">{selectedRequest.material}</span>
                </div>
                <div className="sr-confirm-row">
                  <span className="sr-confirm-label">Quantity:</span>
                  <span className="sr-confirm-value">{selectedRequest.qtyNeeded}</span>
                </div>
              </div>
            </div>
            <div className="sr-modal-footer">
              <button className="sr-btn-secondary" onClick={() => setShowIndentModal(false)}>
                Cancel
              </button>
              <button className="sr-btn-create" onClick={confirmCreateIndent}>
                Confirm & Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreRequests;
