import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Download } from 'lucide-react';
import '../CustomerOrder/CustomerOrder.css';
import './StoreRequestApproval.css';
import { purchaseIndentService } from '../../../services/apiService';
import { downloadSingleIndentPdf } from '../../../services/indentPdfService';

const StoreRequestApproval = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingIndentId, setDownloadingIndentId] = useState(null);

  const getLifecycleStatus = (status) => (status && status.startsWith('Pending') ? 'Open' : 'Closed');

  const escapeCsvValue = (value) => {
    const text = value == null ? '' : String(value);
    const escaped = text.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const downloadCsv = (headers, rows, fileName) => {
    const csvRows = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(','));
    const csvContent = `data:text/csv;charset=utf-8,${csvRows.join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');

    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const toUrgencyLabel = (priority) => {
    if (priority === 'Urgent') return 'Critical';
    if (priority === 'High') return 'High';
    return 'Normal';
  };

  const fetchStoreRequestIndents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await purchaseIndentService.getAllIndents();
      let data = [];
      if (response && response.success && Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response?.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      }

      if (data.length === 0) {
        try {
          const deptRes = await purchaseIndentService.getPurchaseDeptIndents();
          if (deptRes && deptRes.success && Array.isArray(deptRes.data)) {
            data = deptRes.data;
          }
        } catch (e) {}
      }

      const storeRequestIndents = data
        .filter((indent) => (!indent.customer_order_id || indent.customer_order_id === null) && indent.status !== 'Draft')
        .map((indent) => {
          const materials = Array.isArray(indent.materials) ? indent.materials : [];
          const first = materials[0];
          const materialName = first?.material_description || 'Materials';
          const materialCode = first?.material_code || first?.raw_material || 'N/A';
          const quantity = first?.quantity ? `${first.quantity}${first.unit_of_measurement || ''}` : '-';
          const details = materials.length > 1 ? `${quantity} • +${materials.length - 1} more` : `${quantity} • ${materialName}`;
          const reasonText = indent.reason || indent.remarks || 'Standard Material Request';

          let displayStatus;
          if (indent.status === 'Rejected') {
            displayStatus = 'Rejected';
          } else if (indent.status === 'Admin Approved' || ['Accountant', 'Completed'].includes(indent.workflow_stage)) {
            displayStatus = 'Admin Approved';
          } else {
            displayStatus = 'Pending Admin Approval';
          }

          return {
            id: indent.indent_number,
            indentId: indent.indent_id,
            date: formatDate(indent.request_date),
            material: materialName,
            materialCode,
            reason: reasonText,
            details,
            requestedBy: indent.requested_by_name || 'Purchase Department',
            urgency: toUrgencyLabel(indent.priority),
            status: displayStatus,
            lifecycleStatus: displayStatus === 'Pending Admin Approval' ? 'Open' : 'Closed',
            rawIndent: indent,
          };
        });

      setIndents(storeRequestIndents);
    } catch (err) {
      setError('Failed to load store request approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreRequestIndents();
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
            indent.materialCode,
            indent.reason,
            indent.details,
            indent.requestedBy,
            indent.status,
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

  const totalPages = Math.ceil(filteredIndents.length / itemsPerPage);

  const paginatedIndents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredIndents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredIndents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleViewIndent = (indent) => {
    if (!indent?.indentId) return;
    navigate('/create-purchase-indent', {
      state: {
        indentId: indent.indentId,
        indentData: indent.rawIndent || indent,
        readOnly: true,
      },
    });
  };

  const handleApprove = async (indentId) => {
    try {
      await purchaseIndentService.sendToNextStage(indentId, { comments: 'Approved by Admin' });
      fetchStoreRequestIndents();
    } catch (err) {
      alert('Failed to approve indent');
    }
  };

  const handleReject = async (indentId) => {
    try {
      await purchaseIndentService.updateIndentStatus(indentId, { status: 'Rejected', comments: 'Rejected by Admin' });
      fetchStoreRequestIndents();
    } catch (err) {
      alert('Failed to reject indent');
    }
  };

  const exportStoreRequestData = () => {
    exportRowsToCsv(filteredIndents, 'visible');
  };

  const exportAllStoreRequestData = () => {
    exportRowsToCsv(indents, 'all');
  };

  const exportRowsToCsv = (rows, mode) => {
    if (rows.length === 0) return;

    const headers = ['Indent ID', 'Date', 'Material', 'Material Code', 'Reason', 'Details', 'Requested By', 'Urgency', 'Workflow Status', 'Open/Closed'];
    const csvRows = rows.map((indent) => [
      indent.id,
      indent.date,
      indent.material,
      indent.materialCode,
      indent.reason,
      indent.details,
      indent.requestedBy,
      indent.urgency,
      indent.status,
      indent.lifecycleStatus,
    ]);

    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(csvRows.length > 0 ? headers : headers, csvRows, `admin_store_requests_${mode}_${activeTab}_${today}.csv`);
  };

  const exportSingleIndent = async (indent) => {
    if (!indent?.indentId) return;
    if (downloadingIndentId === indent.indentId) return;

    try {
      setDownloadingIndentId(indent.indentId);
      const response = await purchaseIndentService.getIndentById(indent.indentId);
      const detail = response?.data;

      downloadSingleIndentPdf({
        indentSummary: indent,
        indentDetail: detail,
        sourceLabel: 'Store Request',
      });
    } catch (err) {
      alert('Failed to download selected purchase indent PDF');
    } finally {
      setDownloadingIndentId(null);
    }
  };

  return (
    <div className="qms-container store-request-approval">
      <header className="qms-header">
        <div className="qms-header-content">
          <h1 className="qms-title">Store Request Approvals</h1>
        </div>
      </header>

      {error && (
        <div className="sra-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      <main className="qms-main">
        <div className="qms-card">
          <div className="qms-top-bar">
            <div className="qms-tabs-container">
              <button
                className={`qms-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                <span>Pending Review</span>
                <span className="qms-tab-count">{tabCounts.pending}</span>
              </button>
              <button
                className={`qms-tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
                onClick={() => setActiveTab('approved')}
              >
                <span>Approved History</span>
                <span className="qms-tab-count">{tabCounts.approved}</span>
              </button>
              <button
                className={`qms-tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
                onClick={() => setActiveTab('rejected')}
              >
                <span>Rejected</span>
                <span className="qms-tab-count">{tabCounts.rejected}</span>
              </button>
            </div>
            <div className="qms-top-actions">
              <div className="qms-search-wrapper">
                <svg className="qms-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  className="qms-search"
                  placeholder="Search indents, material, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="qms-export-actions">
                <button
                  className="qms-export-btn"
                  onClick={exportStoreRequestData}
                  disabled={filteredIndents.length === 0}
                  title="Export currently visible store request rows"
                >
                  Export Visible CSV
                </button>
                <button
                  className="qms-export-btn qms-export-btn-all"
                  onClick={exportAllStoreRequestData}
                  disabled={indents.length === 0}
                  title="Export all store request rows"
                >
                  Export All CSV
                </button>
              </div>
            </div>
          </div>

          <div className="qms-table-header">
            <div>Indent ID</div>
            <div>Requested By</div>
            <div>Material & Code</div>
            <div>Reason / Purpose</div>
            <div>Indent Date</div>
            <div>Urgency</div>
            <div>Status</div>
            <div>Action</div>
          </div>

          <div className="qms-table-body">
            {loading && (
              <div style={{ padding: '18px', color: '#64748b', textAlign: 'center' }}>
                Loading...
              </div>
            )}

            {paginatedIndents.map((indent) => (
              <div key={indent.id} className="qms-table-row">
                <div className="qms-indent-cell">
                  <div className="qms-indent-id-main">{indent.id}</div>
                  <div className="qms-indent-type">Purchase Dept</div>
                </div>

                <div className="qms-requester-cell">
                  <div className="qms-requester-name-main">{indent.requestedBy}</div>
                  <div className="qms-requester-role">Purchase Dept</div>
                </div>

                <div className="qms-indent-cell">
                  <div className="qms-indent-id-main" style={{ color: '#1f2937' }}>{indent.material}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '11px', background: '#f0f9ff', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bae6fd', fontWeight: 600 }}>Code: {indent.materialCode}</span>
                  </div>
                  <div className="qms-indent-id-sub">({indent.details})</div>
                </div>

                <div className="qms-indent-cell qms-reason-cell">
                  <div className="qms-indent-type" style={{ color: '#334155', fontWeight: 500 }} title={indent.reason}>{indent.reason}</div>
                </div>

                <div className="qms-date">{indent.date}</div>

                <div>
                  <span className={`qms-urgency ${indent.urgency.toLowerCase()}`}>
                    {indent.urgency}
                  </span>
                </div>

                <div className="qms-status">
                  <div className="qms-status-dot"></div>
                  <div className="qms-status-stack">
                    <span className="qms-status-text">{indent.status}</span>
                    <span className={`qms-status-subtext ${indent.lifecycleStatus.toLowerCase()}`}>{indent.lifecycleStatus}</span>
                  </div>
                </div>

                <div className="qms-actions-cell-row">
                  <button 
                    className="qms-action-link qms-action-btn-new"
                    onClick={() => handleViewIndent(indent)}
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    className="qms-action-link qms-action-btn-new"
                    disabled={downloadingIndentId === indent.indentId}
                    onClick={() => exportSingleIndent(indent)}
                    title="Download this purchase indent as PDF"
                  >
                    <Download size={16} />
                    {downloadingIndentId === indent.indentId ? '...' : 'PDF'}
                  </button>
                </div>
              </div>
            ))}

            {!loading && filteredIndents.length === 0 && (
              <div className="sra-info-state">
                No indents found.
              </div>
            )}
          </div>

          <div className="qms-footer">
            <span className="qms-footer-info">
              Showing {filteredIndents.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}
              -{Math.min(currentPage * itemsPerPage, filteredIndents.length)} of {filteredIndents.length} indents
            </span>
            <div className="qms-pagination">
              <button
                className="qms-pagination-btn"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || filteredIndents.length === 0}
              >
                Previous
              </button>
              <button
                className="qms-pagination-btn"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StoreRequestApproval;