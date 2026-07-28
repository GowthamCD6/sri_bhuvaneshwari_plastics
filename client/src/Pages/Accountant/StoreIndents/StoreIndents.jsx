import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Filter, Clock, CheckCircle, ShoppingBag, Package, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import './StoreIndents.css';
import { purchaseIndentService } from '../../../services/apiService';
import useAuthStore from '../../../store/authStore';

const StoreIndents = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [selectedIndents, setSelectedIndents] = useState([]);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [allIndents, setAllIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch indents assigned to QMS for verification after Store Officer
  useEffect(() => {
    const fetchIndents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await purchaseIndentService.getAllIndents();
        let allData = [];
        if (response && response.success && Array.isArray(response.data)) {
          allData = response.data;
        } else if (Array.isArray(response?.data)) {
          allData = response.data;
        } else if (Array.isArray(response)) {
          allData = response;
        }

        if (allData.length === 0) {
          try {
            const deptRes = await purchaseIndentService.getPurchaseDeptIndents();
            if (deptRes && deptRes.success && Array.isArray(deptRes.data)) {
              allData = deptRes.data;
            }
          } catch (e) {}
        }
        
        const storeRequestIndents = allData
          .filter((indent) => (!indent.customer_order_id || indent.customer_order_id === null) && indent.status !== 'Draft')
          .map(indent => {
            const materials = Array.isArray(indent.materials) ? indent.materials : [];
            const first = materials[0];
            const materialName = first?.material_description || 'Materials';
            const materialCode = first?.material_code || first?.raw_material || 'N/A';
            const quantity = first?.quantity ? `${first.quantity}${first.unit_of_measurement || ''}` : '-';
            const details = materials.length > 1 ? `${quantity} • +${materials.length - 1} more` : `${quantity} • ${materialName}`;
            const reasonText = indent.reason || indent.remarks || 'Standard Material Request';

            let displayStatus = 'Pending Processing';
            let statusClass = 'badge-pending';
            if (indent.status === 'Rejected') {
              displayStatus = 'Rejected';
              statusClass = 'badge-rejected';
            } else if (['Completed'].includes(indent.workflow_stage)) {
              displayStatus = 'Processed';
              statusClass = 'badge-verified';
            }

            return {
              id: indent.indent_number,
              indentId: indent.indent_id,
              date: new Date(indent.request_date || indent.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              project: indent.customer_name || 'Stock Replenishment',
              orderId: indent.customer_order_indent_id ? `Order #${indent.customer_order_indent_id}` : 'N/A',
              isCustomerIndent: false,
              material: materialName,
              materialCode,
              reason: reasonText,
              details,
              raisedBy: indent.requested_by_name || 'Purchase Department',
              itemCount: `${materials.length || 0} Items`,
              priority: indent.priority === 'Urgent' ? 'High Priority' : 'Normal Priority',
              status: displayStatus,
              statusClass: statusClass,
              poNumber: indent.po_number || indent.material_po_number,
              poDate: indent.po_date,
              workflowStage: indent.workflow_stage,
              rawIndent: indent,
            };
          });
        
        setAllIndents(storeRequestIndents);
      } catch (err) {
        setError('Failed to load indents');
      } finally {
        setLoading(false);
      }
    };

    fetchIndents();
  }, []);

  // Filter and search logic
  const filteredIndents = useMemo(() => {
    let filtered = allIndents;

    // Filter for Store Indents only
    filtered = filtered.filter(indent => !indent.isCustomerIndent);

    // Filter by tab
    if (activeTab === 'pending') {
      filtered = filtered.filter(indent => 
        indent.status.toLowerCase().includes('pending') || 
        indent.statusClass === 'badge-pending'
      );
    } else if (activeTab === 'verified') {
      filtered = filtered.filter(indent => 
        indent.status.toLowerCase().includes('verified') || 
        indent.statusClass === 'badge-verified'
      );
    }
    // 'all' shows everything

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(indent => 
        indent.id.toLowerCase().includes(query) ||
        indent.project.toLowerCase().includes(query) ||
        indent.raisedBy.toLowerCase().includes(query) ||
        indent.orderId.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allIndents, searchQuery, activeTab]);

  // Calculate stats based on filteredIndents instead of allIndents to reflect current type
  const stats = useMemo(() => {
    const typeIndents = allIndents.filter(indent => !indent.isCustomerIndent);
    
    const pending = typeIndents.filter(i => 
      i.status.toLowerCase().includes('pending') || 
      i.statusClass === 'badge-pending'
    ).length;
    const verified = typeIndents.filter(i => 
      i.status.toLowerCase().includes('verified') || 
      i.statusClass === 'badge-verified'
    ).length;
    const requiresPurchase = typeIndents.filter(i => !i.poNumber).length;

    return { pending, verified, requiresPurchase, fullyStocked: 0 };
  }, [allIndents]);

  // Pagination logic
  const totalItems = filteredIndents.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentIndents = filteredIndents.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // Handle actions
  const handleVerify = (indentId) => {
    // Find the specific indent data
    const indentToVerify = allIndents.find(indent => indent.id === indentId);
    
    // Navigate to purchase indents page with indent data for verification
    navigate('/purchase-indents', {
      state: {
        verifyMode: true,
        indentId: indentToVerify.id
      }
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Navigate to view indent details
  const handleViewIndent = (indent) => {
    if (!indent?.indentId) return;
    navigate('/create-purchase-indent', {
      state: {
        indentId: indent.indentId,
        indentData: indent.rawIndent || indent,
        readOnly: true
      }
    });
  };

  return (
    <div className="vsi-container">
      
      {/* Top Navbar Area */}
      <header className="vsi-header">
        <h1 className="vsi-page-title">Store Request Indents</h1>
      </header>


      {/* Stats Cards Row */}
      <div className="vsi-stats-row">
        <div className="vsi-card">
          <div className="vsi-card-header">
            <span className="vsi-card-label">Pending Verification</span>
            <Clock size={20} className="vsi-stat-icon" style={{color: '#f97316'}} />
          </div>
          <div className="vsi-card-value">{stats.pending}</div>
        </div>
        <div className="vsi-card">
          <div className="vsi-card-header">
            <span className="vsi-card-label">Processed</span>
            <CheckCircle size={20} className="vsi-stat-icon" style={{color: '#10b981'}} />
          </div>
          <div className="vsi-card-value">{stats.verified}</div>
        </div>
        <div className="vsi-card">
          <div className="vsi-card-header">
            <span className="vsi-card-label">Requires Purchase</span>
            <ShoppingBag size={20} className="vsi-stat-icon" style={{color: '#3b82f6'}} />
          </div>
          <div className="vsi-card-value">{stats.requiresPurchase}</div>
        </div>
        <div className="vsi-card">
          <div className="vsi-card-header">
            <span className="vsi-card-label">Fully Stocked</span>
            <Package size={20} className="vsi-stat-icon" style={{color: '#94a3b8'}} />
          </div>
          <div className="vsi-card-value">{stats.fullyStocked}</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="vsi-main-panel">
        
        {/* Filters Toolbar */}
        <div className="vsi-toolbar">
          <div className="vsi-tabs">
            <button 
              className={`vsi-tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => handleTabChange('pending')}
            >
              Pending
            </button>
            <button 
              className={`vsi-tab ${activeTab === 'verified' ? 'active' : ''}`}
              onClick={() => handleTabChange('verified')}
            >
              Verified
            </button>
            <button 
              className={`vsi-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              All Indents
            </button>
          </div>
          
          <div className="vsi-actions">
            <div className="vsi-search-wrapper">
              <div className="vsi-search-icon"><Search size={18} style={{color: '#94a3b8'}} /></div>
              <input 
                type="text" 
                placeholder="Search indents..." 
                className="vsi-search-input"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <button className="vsi-filter-btn">
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="vsi-table-container">
          {loading ? (
            <div style={{ padding: '16px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ height: '48px', background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite', borderRadius: '6px', marginBottom: '8px' }} />
              ))}
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
              {error}
            </div>
          ) : (
            <table className="vsi-table">
              <thead>
                <tr>
                  <th>INDENT ID</th>
                  <th>MATERIAL & CODE</th>
                  <th>REASON / PURPOSE</th>
                  <th>RAISED BY</th>
                  <th>ITEMS</th>
                  <th>VERIFICATION STATUS</th>
                  <th style={{textAlign: 'right'}}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
              {currentIndents.length > 0 ? (
                currentIndents.map((item, idx) => (
                  <tr key={idx}>
                    
                    {/* ID */}
                    <td>
                      <div className="vsi-id-link">{item.id}</div>
                      <div className="vsi-subtext">{item.date}</div>
                    </td>

                    {/* Material & Code */}
                    <td>
                      <div className="vsi-text-bold">{item.material}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <span className="vpdi-code-badge">Code: {item.materialCode}</span>
                        <span className="vsi-subtext-blue" style={{ marginTop: 0 }}>({item.details})</span>
                      </div>
                    </td>

                    {/* Reason / Purpose */}
                    <td style={{ maxWidth: '240px' }}>
                      <div className="vpdi-reason-text" title={item.reason}>{item.reason}</div>
                    </td>

                    {/* Raised By */}
                    <td>
                      <div className="vsi-user-cell">
                        <div className="vpdi-avatar">P</div>
                        <span className="vsi-text-medium">{item.raisedBy}</span>
                      </div>
                    </td>

                    {/* Items */}
                    <td>
                      <div className="vsi-text-bold">{item.itemCount}</div>
                      <div className="vsi-subtext">{item.priority}</div>
                    </td>

                    {/* Verification Status */}
                    <td>
                      <span className={`vsi-badge ${item.statusClass}`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{textAlign: 'right'}}>
                      <button 
                        className="vsi-btn-verify"
                        onClick={() => handleViewIndent(item)}
                      >
                        <Eye size={16} style={{marginRight: '4px'}} />
                        View
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    {searchQuery ? 'No indents found matching your search.' : 'No indents available.'}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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

export default StoreIndents;
