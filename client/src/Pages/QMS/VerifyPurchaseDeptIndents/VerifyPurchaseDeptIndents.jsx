import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertTriangle, Package, Search, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import '../VerifyStoreIndents/VerifyStoreIndents.css';
import './VerifyPurchaseDeptIndents.css';
import { purchaseIndentService } from '../../../services/apiService';

const VerifyPurchaseDeptIndents = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const toUrgencyLabel = (priority) => {
    if (priority === 'Urgent') return 'Critical';
    if (priority === 'High') return 'High';
    return 'Normal';
  };

  const fetchIndents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Purchase Dept indents across all stages so we can show pending + history
      const responses = await Promise.all([
        purchaseIndentService.getAllIndents({ workflowStage: 'Purchase Dept' }),
        purchaseIndentService.getAllIndents({ workflowStage: 'QMS Init' }),
        purchaseIndentService.getAllIndents({ workflowStage: 'Admin' }),
        purchaseIndentService.getAllIndents({ workflowStage: 'Accountant' }),
        purchaseIndentService.getAllIndents({ workflowStage: 'Completed' }),
      ]);

      const allData = responses.reduce((acc, res) => {
        if (res.success && res.data) return [...acc, ...res.data];
        return acc;
      }, []);

      // Only keep Purchase Dept indents (no linked customer order) and exclude Drafts
      const purchaseDeptIndents = allData
        .filter((indent) => indent.customer_order_id == null && indent.status !== 'Draft')
        .map((indent) => {
          const materials = Array.isArray(indent.materials) ? indent.materials : [];
          const first = materials[0];
          const materialName = first?.material_description || 'Materials';
          const quantity = first?.quantity
            ? `${first.quantity}${first.unit_of_measurement || ''}`
            : '-';
          const details =
            materials.length > 1
              ? `${quantity} • +${materials.length - 1} more`
              : `${quantity} • ${materialName}`;
          
          const itemCountText = materials.length > 0 ? `${materials.length} Items` : '0 Items';

          let displayStatus;
          if (indent.status === 'Rejected') {
            displayStatus = 'Rejected';
          } else if (indent.workflow_stage === 'Purchase Dept' || indent.workflow_stage === 'QMS Init') {
            displayStatus = 'Pending QMS Verification';
          } else if (['Admin', 'Accountant', 'Completed'].includes(indent.workflow_stage)) {
            displayStatus = 'QMS Approved';
          } else {
            displayStatus = indent.status;
          }

          return {
            id: indent.indent_number,
            indentId: indent.indent_id,
            date: formatDate(indent.request_date),
            material: materialName,
            details,
            requestedBy: indent.requested_by_name || 'Purchase Department',
            urgency: toUrgencyLabel(indent.priority),
            status: displayStatus,
            itemCount: itemCountText,
          };
        });

      setIndents(purchaseDeptIndents);
    } catch (err) {
      setError('Failed to load purchase dept indents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndents();
  }, []);

  const tabCounts = useMemo(() => ({
    pending: indents.filter((i) => i.status === 'Pending QMS Verification').length,
    verified: indents.filter((i) => i.status === 'QMS Approved' || i.status === 'Rejected').length,
  }), [indents]);

  const filteredIndents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const searched = !q
      ? indents
      : indents.filter((indent) =>
          [indent.id, indent.material, indent.details, indent.requestedBy, indent.status]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q)
        );

    if (activeTab === 'pending') return searched.filter((i) => i.status === 'Pending QMS Verification');
    if (activeTab === 'verified') return searched.filter((i) => i.status === 'QMS Approved' || i.status === 'Rejected');
    return searched;
  }, [indents, searchQuery, activeTab]);

  const totalPages = Math.ceil(filteredIndents.length / itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const handleViewIndent = (indent) => {
    if (!indent?.indentId) return;
    navigate('/qms-purchase-indents', {
      state: { indentId: indent.indentId, isViewMode: true },
    });
  };

  const handleApprove = async (indentId) => {
    try {
      await purchaseIndentService.sendToNextStage(indentId, { comments: 'Approved by QMS' });
      fetchIndents();
    } catch (err) {
      alert('Failed to approve indent');
    }
  };

  const handleReject = async (indentId) => {
    try {
      await purchaseIndentService.updateIndentStatus(indentId, {
        status: 'Rejected',
        comments: 'Rejected by QMS',
      });
      fetchIndents();
    } catch (err) {
      alert('Failed to reject indent');
    }
  };

  const totalItems = filteredIndents.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentIndents = filteredIndents.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  return (
    <div className="vsi-container vpdi-page-container">

      {/* Header */}
      <header className="vsi-header">
        <h1 className="vsi-page-title">Verify Purchase Dept Indents</h1>
      </header>

      {/* Stats Cards Row */}
      <div className="vsi-stats-row">
        <div className="vsi-card">
          <div className="vsi-card-header">
            <span className="vsi-card-label">Pending Verification</span>
            <Clock size={20} style={{ color: '#f97316' }} />
          </div>
          <div className="vsi-card-value">{tabCounts.pending}</div>
        </div>
        <div className="vsi-card">
          <div className="vsi-card-header">
            <span className="vsi-card-label">Verified</span>
            <CheckCircle size={20} style={{ color: '#10b981' }} />
          </div>
          <div className="vsi-card-value">{tabCounts.verified}</div>
        </div>
        <div className="vsi-card">
          <div className="vsi-card-header">
            <span className="vsi-card-label">Total Indents</span>
            <Package size={20} style={{ color: '#94a3b8' }} />
          </div>
          <div className="vsi-card-value">{indents.length}</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="vsi-main-panel">

        {/* Filters Toolbar */}
        <div className="vsi-toolbar">
          <div className="vsi-tabs">
            <button
              className={`vsi-tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending
            </button>
            <button
              className={`vsi-tab ${activeTab === 'verified' ? 'active' : ''}`}
              onClick={() => setActiveTab('verified')}
            >
              Verified
            </button>
            <button
              className={`vsi-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Indents
            </button>
          </div>
          <div className="vsi-actions">
            <div className="vsi-search-wrapper">
              <div className="vsi-search-icon"><Search size={18} style={{ color: '#94a3b8' }} /></div>
              <input
                type="text"
                className="vsi-search-input"
                placeholder="Search indents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="vsi-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading indents...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{error}</div>
          ) : (
          <table className="vsi-table">
            <thead>
              <tr>
                <th>INDENT ID</th>
                <th>PROJECT / CUSTOMER</th>
                <th>RAISED BY</th>
                <th>ITEMS</th>
                <th>PO NUMBER</th>
                <th>VERIFICATION STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentIndents.length > 0 ? (
                currentIndents.map((indent) => (
                  <tr key={indent.id}>

                    {/* Indent ID */}
                    <td>
                      <div className="vsi-id-link">{indent.id}</div>
                      <div className="vsi-subtext">{indent.date}</div>
                    </td>

                    {/* Material / Dept */}
                    <td>
                      <div className="vsi-text-bold">{indent.material}</div>
                      <div className="vsi-subtext-blue">{indent.details}</div>
                    </td>

                    {/* Raised By */}
                    <td>
                      <div className="vsi-user-cell">
                        <div className="vpdi-avatar">P</div>
                        <span className="vsi-text-medium">{indent.requestedBy}</span>
                      </div>
                    </td>

                    {/* Items */}
                    <td>
                      <div className="vsi-text-bold">{indent.itemCount}</div>
                      <div className="vsi-subtext">{indent.urgency}</div>
                    </td>

                    {/* PO Number */}
                    <td>
                      <div className="vsi-text-bold">N/A</div>
                    </td>

                    {/* Verification Status */}
                    <td>
                      <span className={`vsi-badge ${
                        indent.status === 'Pending QMS Verification' ? 'badge-pending'
                        : indent.status === 'QMS Approved' ? 'badge-verified'
                        : 'badge-rejected'
                      }`}>
                        {indent.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                       <button className="vsi-btn-verify" onClick={() => handleViewIndent(indent)}>
                          <Eye size={16} style={{ marginRight: '4px' }} />
                          View
                        </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    {searchQuery ? 'No indents found matching your search.' : 'No purchase dept indents available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>

        {/* Footer / Pagination */}
        {!loading && !error && (
          <div className="vsi-footer">
            <span className="vsi-footer-text">
              Showing {currentIndents.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalItems)} of {totalItems} items
            </span>
            <div className="vsi-pagination">
              <button
                className="vsi-page-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <div className="vsi-page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`vsi-page-btn ${page === currentPage ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                className="vsi-page-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyPurchaseDeptIndents;