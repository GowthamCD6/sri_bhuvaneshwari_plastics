import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, ChevronLeft, ChevronRight, FileText, X, Package, Calendar, MapPin, AlertCircle } from 'lucide-react';
import './StoreRequests.css';
import { storeRequestService } from '../../../services/apiService';

const StoreRequests = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showIndentModal, setShowIndentModal] = useState(false);
  const itemsPerPage = 4;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizePriority = (priority) => {
    const normalized = String(priority || '').trim().toLowerCase();
    if (normalized === 'critical') return 'Critical';
    if (['urgent', 'high'].includes(normalized)) return 'Urgent';
    if (['normal', 'standard', 'low'].includes(normalized)) return 'Normal';
    return 'Normal';
  };

  const parseDateParts = (value) => {
    const raw = String(value || '').trim();
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3])
      };
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  };

  const toDateInputValue = (value) => {
    const parts = parseDateParts(value);
    if (!parts) return '';
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const parts = parseDateParts(value);
    if (!parts) return value;
    const date = new Date(parts.year, parts.month - 1, parts.day);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await storeRequestService.getAllRequests();
      const data = response.data || [];
      const mapped = data.map((req) => {
        const priority = normalizePriority(req.priority);
        return {
        id: req.request_number,
        requestId: req.request_id,
        material: req.material_name,
        code: req.material_code || '-',
        specs: req.specs || '',
        qtyNeeded: `${req.quantity} ${req.unit_of_measurement}`,
        reason: req.reason || '-',
        location: req.storage_location ? `Loc: ${req.storage_location}` : '',
        requestDate: formatDate(req.request_date),
        requestDateRaw: toDateInputValue(req.request_date),
        neededDate: formatDate(req.needed_by_date),
        neededDateRaw: toDateInputValue(req.needed_by_date),
        priority,
        status: (req.status || 'Pending').toLowerCase(),
        requestedBy: req.requested_by_name || 'Store Officer',
        department: req.dept_name || '- ',
        indentId: req.indent_id
        };
      });
      setRequests(mapped);
    } catch (err) {
      console.error('Failed to fetch store requests:', err);
      setError('Failed to load store requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const intervalId = setInterval(fetchRequests, 30000);
    const onWindowFocus = () => fetchRequests();
    window.addEventListener('focus', onWindowFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, []);

  const filters = [
    { id: 'all', label: 'All Requests' },
    { id: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
    { id: 'processed', label: 'Processed' },
    { id: 'critical', label: 'Critical' }
  ];

  // Filter and search logic
  const filteredRequests = useMemo(() => {
    let result = [...requests];

    // Apply filter
    if (activeFilter === 'pending') {
      result = result.filter(r => r.status === 'pending');
    } else if (activeFilter === 'processed') {
      result = result.filter(r => r.status === 'processed');
    } else if (activeFilter === 'critical') {
      result = result.filter(r => ['Critical', 'Urgent'].includes(normalizePriority(r.priority)));
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRequests(paginatedRequests.map(r => r.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (id) => {
    setSelectedRequests(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  const handleCreateIndent = (request) => {
    setSelectedRequest(request);
    setShowIndentModal(true);
  };

  const confirmCreateIndent = () => {
    if (selectedRequest) {
      const requestToIndent = selectedRequest;
      setShowIndentModal(false);
      setSelectedRequest(null);
      navigate('/request-indent', {
        state: {
          storeRequest: requestToIndent
        }
      });
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const getPriorityClass = (priority) => {
    switch (normalizePriority(priority)) {
      case 'Critical': return 'priority-critical';
      case 'Urgent': return 'priority-urgent';
      case 'Normal': return 'priority-normal';
      default: return 'priority-normal';
    }
  };

  return (
    <div className="sr-container">
      <div className="sr-content">
        {error && (
          <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
            Loading requests...
          </div>
        )}
        {/* Filter Tabs and Search */}
        <div className="sr-toolbar">
          <div className="sr-filters">
            {filters.map(filter => (
              <button
                key={filter.id}
                className={`sr-filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                onClick={() => { setActiveFilter(filter.id); setCurrentPage(1); }}
              >
                {filter.label}
                {filter.count !== undefined && (
                  <span className="sr-filter-count">({filter.count})</span>
                )}
              </button>
            ))}
          </div>
          <div className="sr-search">
            <Search size={16} className="sr-search-icon" />
            <input
              type="text"
              placeholder="Search by request ID, material..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="sr-table-container">
          <table className="sr-table">
            <thead>
              <tr>
                <th className="sr-th-checkbox">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedRequests.length === paginatedRequests.length && paginatedRequests.length > 0}
                  />
                </th>
                <th>REQUEST ID</th>
                <th>REQUESTED MATERIAL</th>
                <th>QTY NEEDED</th>
                <th>REASON & DETAILS</th>
                <th>REQUEST DATE</th>
                <th>PRIORITY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.length > 0 ? (
                paginatedRequests.map((request) => (
                  <tr key={request.id} className={selectedRequests.includes(request.id) ? 'selected' : ''}>
                    <td className="sr-td-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => handleSelectRequest(request.id)}
                      />
                    </td>
                    <td className="sr-td-id">{request.id}</td>
                    <td className="sr-td-material">
                      <div className="sr-material-name">{request.material}</div>
                      <div className="sr-material-code">
                        Code: {request.code}
                        {request.specs && ` | ${request.specs}`}
                      </div>
                    </td>
                    <td className="sr-td-qty">
                      <span className="sr-qty-value">{request.qtyNeeded}</span>
                    </td>
                    <td className="sr-td-reason">
                      <div className="sr-reason-text">{request.reason}</div>
                      {request.location && (
                        <div className="sr-reason-location">{request.location}</div>
                      )}
                    </td>
                    <td className="sr-td-date">{request.requestDate}</td>
                    <td className="sr-td-priority">
                      {request.status === 'processed' ? (
                        <span className="sr-status-badge status-processed">Processed</span>
                      ) : (
                        <span className={`sr-priority-badge ${getPriorityClass(request.priority)}`}>
                          {request.priority}
                        </span>
                      )}
                    </td>
                    <td className="sr-td-actions">
                      <div className="sr-actions">
                        {request.status === 'pending' ? (
                          <button 
                            className="sr-btn-create"
                            onClick={() => handleCreateIndent(request)}
                          >
                            Create Indent
                          </button>
                        ) : (
                          <button className="sr-btn-created" disabled>
                            Indent Created
                          </button>
                        )}
                        <button 
                          className="sr-btn-view"
                          onClick={() => handleViewDetails(request)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="sr-empty">
                    <div className="sr-empty-content">
                      <FileText size={40} />
                      <p>No requests found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="sr-pagination">
          <span className="sr-pagination-info">
            Showing {filteredRequests.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
          </span>
          <div className="sr-pagination-controls">
            <button
              className="sr-page-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="sr-page-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

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
                {selectedRequest.status === 'processed' ? (
                  <span className="sr-status-badge status-processed">Processed</span>
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
            </div>
            <div className="sr-modal-footer">
              {selectedRequest.status === 'pending' && (
                <button 
                  className="sr-btn-create"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleCreateIndent(selectedRequest);
                  }}
                >
                  Create Indent
                </button>
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
