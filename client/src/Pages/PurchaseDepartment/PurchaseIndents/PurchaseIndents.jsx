import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Eye, Calendar, FileText, X, Package, User, MapPin, Clock, Plus } from 'lucide-react';
import './PurchaseIndents.css';
import { purchaseIndentService } from '../../../services/apiService';

const PurchaseIndents = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('this-month');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState(null);
  const itemsPerPage = 5;

  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIndents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await purchaseIndentService.getAllIndents();
      const data = response.data || [];
      const mapped = data.map((indent) => {
        const materials = Array.isArray(indent.materials) ? indent.materials : [];
        const first = materials[0];
        const isPurchaseDept = !indent.customer_order_id &&
          (indent.workflow_stage === 'Purchase Dept' || indent.workflow_stage === 'QMS Init');
        return {
          id: indent.indent_number,
          date: new Date(indent.request_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          material: first?.material_description || 'Materials',
          category: isPurchaseDept ? 'Purchase Dept' : (indent.customer_order_id ? 'Customer Order' : 'Store Request'),
          priority: String(indent.priority || 'NORMAL').toUpperCase(),
          status: indent.status || 'Pending',
          origin: isPurchaseDept ? 'Purchase Dept' : (indent.customer_order_id ? 'QMS Dept' : 'Store Request'),
          quantity: first?.quantity ? `${first.quantity} ${first.unit_of_measurement || ''}` : '-',
          requestedBy: indent.requested_by_name || '-',
          remarks: indent.reason || '',
          materials: materials,
        };
      });
      setIndents(mapped);
    } catch (err) {
      console.error('Failed to fetch indents:', err);
      setError('Failed to load indents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndents();
  }, []);

  // Filter and search logic
  const filteredIndents = useMemo(() => {
    let result = [...indents];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(i => i.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.id.toLowerCase().includes(query) ||
        i.material.toLowerCase().includes(query) ||
        i.category.toLowerCase().includes(query) ||
        i.origin.toLowerCase().includes(query)
      );
    }

    return result;
  }, [indents, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredIndents.length / itemsPerPage);
  const paginatedIndents = filteredIndents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewDetails = (indent) => {
    setSelectedIndent(indent);
    setShowDetailModal(true);
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'verified': return 'status-verified';
      case 'processed': return 'status-processed';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  const getPriorityClass = (priority) => {
    return priority === 'HIGH' ? 'priority-high' : 'priority-normal';
  };

  return (
    <div className="qi-container">
        <div className="qi-header">
          <h1 className="qi-title">Purchase Indents</h1>
        </div>

        {/* Toolbar - Search and Filters OUTSIDE the card */}
        <div className="qi-toolbar-external">
            <div className="qi-search">
              <Search size={16} className="qi-search-icon" />
              <input
                type="text"
                placeholder="Search indent ID or item..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
          
            <div className="qi-filters">
              <div className="qi-filter-dropdown">
                <select 
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">Status: All</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="processed">Processed</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown size={14} className="qi-dropdown-icon" />
              </div>
              <div className="qi-filter-dropdown">
                <Calendar size={14} className="qi-calendar-icon" />
                <select 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="this-month">This Month</option>
                  <option value="last-month">Last Month</option>
                  <option value="last-3-months">Last 3 Months</option>
                  <option value="all-time">All Time</option>
                </select>
                <ChevronDown size={14} className="qi-dropdown-icon" />
              </div>
              <button
                className="qi-create-btn"
                onClick={() => navigate('/create-purchase-indent')}
              >
                <Plus size={14} />
                Create Indent
              </button>
            </div>
        </div>
        
        <div className="qi-content">
        {error && (
          <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Table */}
        <div className="qi-table-container">
          <table className="qi-table">
            <thead>
              <tr>
                <th>Indent ID</th>
                <th>Date</th>
                <th>Requested Material</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Origin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedIndents.length > 0 ? (
                paginatedIndents.map((indent) => (
                  <tr key={indent.id}>
                    <td className="qi-td-id">{indent.id}</td>
                    <td className="qi-td-date">{indent.date}</td>
                    <td className="qi-td-material">
                      <div className="qi-material-name">{indent.material}</div>
                      <div className="qi-material-category">{indent.category}</div>
                    </td>
                    <td className="qi-td-priority">
                      <span className={`qi-priority-badge ${getPriorityClass(indent.priority)}`}>
                        {indent.priority}
                      </span>
                    </td>
                    <td className="qi-td-status">
                      <span className={`qi-status-badge ${getStatusClass(indent.status)}`}>
                        <span className="qi-status-icon">●</span>
                        {indent.status}
                      </span>
                    </td>
                    <td className="qi-td-origin">{indent.origin}</td>
                    <td className="qi-td-actions">
                      <button 
                        className="qi-btn-view"
                        onClick={() => handleViewDetails(indent)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="qi-empty">
                    <div className="qi-empty-content">
                      <FileText size={40} />
                      <p>No indents found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="qi-pagination">
          <span className="qi-pagination-info">
            Showing {filteredIndents.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredIndents.length)} of {filteredIndents.length} records
          </span>
          <div className="qi-pagination-controls">
            <button
              className="qi-page-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              className="qi-page-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
        </div>
      </div>


      {/* View Details Modal */}
      {showDetailModal && selectedIndent && (
        <div className="qi-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="qi-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qi-modal-header">
              <h3>Indent Details</h3>
              <button className="qi-modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="qi-modal-body">
              <div className="qi-detail-header">
                <div className="qi-detail-id">{selectedIndent.id}</div>
                <div className="qi-detail-badges">
                  <span className={`qi-priority-badge ${getPriorityClass(selectedIndent.priority)}`}>
                    {selectedIndent.priority}
                  </span>
                  <span className={`qi-status-badge ${getStatusClass(selectedIndent.status)}`}>
                    <span className="qi-status-icon">⊙</span>
                    {selectedIndent.status}
                  </span>
                </div>
              </div>

              <div className="qi-detail-grid">
                <div className="qi-detail-item">
                  <div className="qi-detail-icon">
                    <Package size={18} />
                  </div>
                  <div className="qi-detail-content">
                    <span className="qi-detail-label">Material</span>
                    <span className="qi-detail-value">{selectedIndent.material}</span>
                    <span className="qi-detail-sub">{selectedIndent.category}</span>
                  </div>
                </div>

                <div className="qi-detail-item">
                  <div className="qi-detail-icon">
                    <FileText size={18} />
                  </div>
                  <div className="qi-detail-content">
                    <span className="qi-detail-label">Quantity</span>
                    <span className="qi-detail-value">{selectedIndent.quantity}</span>
                  </div>
                </div>

                <div className="qi-detail-item">
                  <div className="qi-detail-icon">
                    <Clock size={18} />
                  </div>
                  <div className="qi-detail-content">
                    <span className="qi-detail-label">Date</span>
                    <span className="qi-detail-value">{selectedIndent.date}</span>
                  </div>
                </div>

                <div className="qi-detail-item">
                  <div className="qi-detail-icon">
                    <MapPin size={18} />
                  </div>
                  <div className="qi-detail-content">
                    <span className="qi-detail-label">Origin</span>
                    <span className="qi-detail-value">{selectedIndent.origin}</span>
                  </div>
                </div>
              </div>

              <div className="qi-detail-section">
                <div className="qi-detail-icon">
                  <User size={18} />
                </div>
                <div className="qi-detail-content">
                  <span className="qi-detail-label">Requested By</span>
                  <span className="qi-detail-value">{selectedIndent.requestedBy}</span>
                </div>
              </div>

              <div className="qi-detail-section">
                <span className="qi-detail-label">Remarks</span>
                <p className="qi-detail-remarks">{selectedIndent.remarks || '—'}</p>
              </div>

              {selectedIndent.status === 'Processed' && selectedIndent.poNumber && (
                <div className="qi-detail-section qi-po-info">
                  <span className="qi-detail-label">Purchase Order</span>
                  <span className="qi-detail-value qi-po-number">{selectedIndent.poNumber}</span>
                </div>
              )}

              {selectedIndent.status === 'Rejected' && selectedIndent.rejectionReason && (
                <div className="qi-detail-section qi-rejection-info">
                  <span className="qi-detail-label">Rejection Reason</span>
                  <p className="qi-detail-remarks">{selectedIndent.rejectionReason}</p>
                </div>
              )}
            </div>
            <div className="qi-modal-footer">
              <button className="qi-btn-danger" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
              {selectedIndent.status === 'Verified' && (
                <button className="qi-btn-primary">
                  Create PO
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseIndents;
