import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Filter, Clock, CheckCircle, ShoppingBag, Package, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import './VerifyStoreIndents.css';
import { purchaseIndentService } from '../../../services/apiService';
import useAuthStore from '../../../store/authStore';

const VerifyStoreIndents = () => {
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
        
        console.log('Fetching all indents for QMS verification');
        // Fetch indents from multiple workflow stages:
        // 1. QMS Init: Draft indents created by QMS
        // 2. Store Officer: Submitted by QMS, pending Store Officer review
        // 3. QMS Verified: Pending for QMS to verify after Store Officer filled
        // 4. Admin, Accountant, Completed: Already verified by QMS, showing history
        const responses = await Promise.all([
          purchaseIndentService.getAllIndents({ workflowStage: 'QMS Init' }),
          purchaseIndentService.getAllIndents({ workflowStage: 'Store Officer' }),
          purchaseIndentService.getAllIndents({ workflowStage: 'QMS Verified' }),
          purchaseIndentService.getAllIndents({ workflowStage: 'Admin' }),
          purchaseIndentService.getAllIndents({ workflowStage: 'Accountant' }),
          purchaseIndentService.getAllIndents({ workflowStage: 'Completed' })
        ]);
        
        console.log('Fetched responses:', responses);
        
        // Combine all responses
        const allIndentsData = responses.reduce((acc, response) => {
          if (response.success && response.data) {
            return [...acc, ...response.data];
          }
          return acc;
        }, []);
        
        console.log('Combined indents:', allIndentsData);
        
        if (allIndentsData.length > 0) {
          const transformedData = allIndentsData.map(indent => {
            // Determine status based on workflow_stage
            let displayStatus = 'Pending QMS';
            let statusClass = 'badge-pending';
            
            if (indent.workflow_stage === 'QMS Init') {
              // Draft created by QMS, not submitted yet
              displayStatus = 'Draft';
              statusClass = 'badge-draft';
            } else if (indent.workflow_stage === 'Store Officer') {
              // Submitted by QMS, waiting for Store Officer
              displayStatus = 'Pending Store Review';
              statusClass = 'badge-pending';
            } else if (indent.workflow_stage === 'QMS Verified') {
              // Returned by Store Officer, pending QMS verification
              displayStatus = 'Pending QMS';
              statusClass = 'badge-pending';
            } else if (indent.workflow_stage === 'Admin' || indent.workflow_stage === 'Accountant' || indent.workflow_stage === 'Completed') {
              // Already verified by QMS and moved forward
              displayStatus = 'Verified';
              statusClass = 'badge-verified';
            }
            
            return {
              id: indent.indent_number,
              indentId: indent.indent_id,
              date: new Date(indent.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              project: indent.customer_name || 'Stock Replenishment',
              orderId: indent.customer_order_indent_id ? `Order #${indent.customer_order_indent_id}` : 'N/A',
              raisedBy: indent.requested_by_name || 'N/A',
              itemCount: `${indent.total_materials || 0} Items`,
              priority: indent.priority === 'Urgent' ? 'High Priority' : 'Normal Priority',
              status: displayStatus,
              statusClass: statusClass,
              poNumber: indent.po_number,
              poDate: indent.po_date,
              workflowStage: indent.workflow_stage // For debugging
            };
          });
          
          console.log('Transformed indents:', transformedData);
          setAllIndents(transformedData);
        }
      } catch (err) {
        console.error('Error fetching indents:', err);
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

  // Calculate stats
  const stats = useMemo(() => {
    const pending = allIndents.filter(i => 
      i.status.toLowerCase().includes('pending') || 
      i.statusClass === 'badge-pending'
    ).length;
    const verified = allIndents.filter(i => 
      i.status.toLowerCase().includes('verified') || 
      i.statusClass === 'badge-verified'
    ).length;
    const requiresPurchase = allIndents.filter(i => !i.poNumber).length;
    
    // For now, setting fully stocked to 0 as a placeholder until stock validation logic is implemented
    const fullyStocked = 0;

    return { pending, verified, requiresPurchase, fullyStocked };
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
    console.log('🔍 Navigating to indent:', indent);
    console.log('Indent ID being passed:', indent.indentId);
    
    // Clear any existing state and navigate with fresh state
    navigate('/qms-purchase-indents', {
      state: {
        indentId: indent.indentId,
        fromCustomerOrder: false,
        orderData: null
      },
      replace: false
    });
  };

  return (
    <div className="vsi-container">
      
      {/* Top Navbar Area */}
      <header className="vsi-header">
        <h1 className="vsi-page-title">Verify Store Indents</h1>
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
          </div>
        </div>

        {/* Table */}
        <div className="vsi-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading indents...
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
                  <th>PROJECT / CUSTOMER</th>
                  <th>RAISED BY</th>
                  <th>ITEMS</th>
                  <th>PO NUMBER</th>
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

                    {/* Project */}
                    <td>
                      <div className="vsi-text-bold">{item.project}</div>
                      <div className="vsi-subtext-blue">{item.orderId}</div>
                    </td>

                    {/* Raised By */}
                    <td>
                      <div className="vsi-user-cell">
                        <div className="vsi-user-avatar-sm" style={{ 
                          backgroundColor: '#e2e8f0', 
                          color: '#475569', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '12px', 
                          fontWeight: '600'
                        }}>
                          {(item.raisedBy || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="vsi-text-medium">{item.raisedBy}</span>
                      </div>
                    </td>

                    {/* Items */}
                    <td>
                      <div className="vsi-text-bold">{item.itemCount}</div>
                      <div className="vsi-subtext">{item.priority}</div>
                    </td>

                    {/* PO Number */}
                    <td>
                      <div className="vsi-text-bold">{item.poNumber || 'N/A'}</div>
                      <div className="vsi-subtext">{item.poDate || ''}</div>
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

export default VerifyStoreIndents;