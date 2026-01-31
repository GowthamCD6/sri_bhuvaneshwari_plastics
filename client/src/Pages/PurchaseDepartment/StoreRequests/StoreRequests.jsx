import React, { useState, useMemo } from 'react';
import { Search, Eye, ChevronLeft, ChevronRight, FileText, X, Package, Calendar, MapPin, AlertCircle } from 'lucide-react';
import './StoreRequests.css';

const StoreRequests = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showIndentModal, setShowIndentModal] = useState(false);
  const itemsPerPage = 4;

  // Sample data matching the screenshot
  const [requests, setRequests] = useState([
    {
      id: 'REQ-2024-089',
      material: 'Polypropylene Granules',
      code: 'RM-004-RED',
      specs: 'Color: Red',
      qtyNeeded: '500 kg',
      reason: 'Low stock alert in warehouse',
      location: 'Loc: WH-A12',
      requestDate: 'Oct 24, 2024',
      priority: 'Critical',
      status: 'pending',
      requestedBy: 'Store Officer',
      department: 'Production'
    },
    {
      id: 'REQ-2024-092',
      material: 'Packaging Box Type B',
      code: 'PKG-BOX-B',
      specs: '20×20×10',
      qtyNeeded: '2000 Units',
      reason: 'Upcoming production demand',
      location: 'Order: PO-9921',
      requestDate: 'Oct 24, 2024',
      priority: 'High',
      status: 'pending',
      requestedBy: 'Store Officer',
      department: 'Packaging'
    },
    {
      id: 'REQ-2024-095',
      material: 'Machine Oil (Hydraulic)',
      code: 'MNT-OIL-22',
      specs: '50L Drum',
      qtyNeeded: '50 Liters',
      reason: 'Quarterly maintenance',
      location: 'Dept: Production',
      requestDate: 'Oct 23, 2024',
      priority: 'Normal',
      status: 'pending',
      requestedBy: 'Maintenance Head',
      department: 'Maintenance'
    },
    {
      id: 'REQ-2024-085',
      material: 'Black Masterbatch',
      code: 'MB-BLK-01',
      specs: '',
      qtyNeeded: '100 kg',
      reason: 'Regular stock replenishment',
      location: '',
      requestDate: 'Oct 20, 2024',
      priority: 'Normal',
      status: 'processed',
      requestedBy: 'Store Officer',
      department: 'Production',
      indentId: 'IND-2024-045'
    },
    {
      id: 'REQ-2024-078',
      material: 'HDPE Pellets',
      code: 'RM-HDPE-01',
      specs: 'Grade A',
      qtyNeeded: '800 kg',
      reason: 'Production batch requirement',
      location: 'Order: PO-9918',
      requestDate: 'Oct 18, 2024',
      priority: 'High',
      status: 'processed',
      requestedBy: 'Production Manager',
      department: 'Production',
      indentId: 'IND-2024-042'
    },
    {
      id: 'REQ-2024-072',
      material: 'Lubricant Oil',
      code: 'MNT-LUB-05',
      specs: '20L Can',
      qtyNeeded: '30 Liters',
      reason: 'Machine maintenance schedule',
      location: 'Dept: Maintenance',
      requestDate: 'Oct 15, 2024',
      priority: 'Normal',
      status: 'processed',
      requestedBy: 'Maintenance Head',
      department: 'Maintenance',
      indentId: 'IND-2024-038'
    },
    {
      id: 'REQ-2024-068',
      material: 'Color Pigment Blue',
      code: 'PIG-BLU-02',
      specs: '',
      qtyNeeded: '25 kg',
      reason: 'Custom order requirement',
      location: 'Order: PO-9915',
      requestDate: 'Oct 12, 2024',
      priority: 'Critical',
      status: 'pending',
      requestedBy: 'Store Officer',
      department: 'Production'
    },
    {
      id: 'REQ-2024-065',
      material: 'Stretch Film',
      code: 'PKG-STR-01',
      specs: '500mm width',
      qtyNeeded: '50 Rolls',
      reason: 'Packaging supplies low',
      location: 'Loc: WH-B03',
      requestDate: 'Oct 10, 2024',
      priority: 'Normal',
      status: 'pending',
      requestedBy: 'Store Officer',
      department: 'Packaging'
    },
    {
      id: 'REQ-2024-060',
      material: 'PP Compound Natural',
      code: 'RM-PP-NAT',
      specs: '',
      qtyNeeded: '1200 kg',
      reason: 'Monthly stock requirement',
      location: '',
      requestDate: 'Oct 08, 2024',
      priority: 'High',
      status: 'processed',
      requestedBy: 'Production Manager',
      department: 'Production',
      indentId: 'IND-2024-035'
    },
    {
      id: 'REQ-2024-055',
      material: 'Adhesive Tape',
      code: 'PKG-TAP-02',
      specs: '48mm × 100m',
      qtyNeeded: '200 Rolls',
      reason: 'Packaging material stock',
      location: 'Loc: WH-B05',
      requestDate: 'Oct 05, 2024',
      priority: 'Normal',
      status: 'processed',
      requestedBy: 'Store Officer',
      department: 'Packaging',
      indentId: 'IND-2024-032'
    },
    {
      id: 'REQ-2024-050',
      material: 'ABS Granules White',
      code: 'RM-ABS-WHT',
      specs: 'High Impact',
      qtyNeeded: '600 kg',
      reason: 'Special order production',
      location: 'Order: PO-9910',
      requestDate: 'Oct 03, 2024',
      priority: 'Critical',
      status: 'pending',
      requestedBy: 'Production Manager',
      department: 'Production'
    },
    {
      id: 'REQ-2024-045',
      material: 'Cleaning Solvent',
      code: 'MNT-CLN-01',
      specs: '',
      qtyNeeded: '100 Liters',
      reason: 'Mould cleaning requirement',
      location: 'Dept: Production',
      requestDate: 'Oct 01, 2024',
      priority: 'Normal',
      status: 'processed',
      requestedBy: 'Maintenance Head',
      department: 'Maintenance',
      indentId: 'IND-2024-028'
    }
  ]);

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
      result = result.filter(r => r.priority === 'Critical');
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
      const newIndentId = `IND-2024-${String(Math.floor(Math.random() * 900) + 100)}`;
      setRequests(prev => prev.map(r => 
        r.id === selectedRequest.id 
          ? { ...r, status: 'processed', indentId: newIndentId } 
          : r
      ));
      setShowIndentModal(false);
      setSelectedRequest(null);
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
