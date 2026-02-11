import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, FileText, Eye, X } from 'lucide-react';
import './VerifyPurchaseIndents.css';
import { purchaseIndentService } from '../../../services/apiService';
import useAuthStore from '../../../store/authStore';

const VerifyPurchaseIndents = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5); // Default pagination size
  const [selectedIndents, setSelectedIndents] = useState([]);
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [allIndents, setAllIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch purchase indents assigned to Store Officer
  useEffect(() => {
    const fetchIndents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching indents for Store Officer with workflowStage: Store Officer');
        // Fetch indents where workflow_stage = 'Store Officer'
        const response = await purchaseIndentService.getAllIndents({ workflowStage: 'Store Officer' });
        
        console.log('API Response:', response);
        console.log('Data received:', response.data);
        
        if (response.success) {
          // Transform API data to match UI format
          const transformedData = response.data.map(indent => {
            // Map status from database to UI
            let displayStatus = 'Pending';
            let statusClass = 'status-orange';
            
            if (indent.status === 'Rejected') {
              displayStatus = 'Rejected';
              statusClass = 'status-red';
            } else if (indent.status === 'Store Verified' || indent.status === 'Pending QMS Verification') {
              displayStatus = 'Verified';
              statusClass = 'status-green';
            } else if (indent.status === 'Pending Store Review') {
              displayStatus = 'Pending';
              statusClass = 'status-orange';
            }
            
            // Format request_date properly (it's a DATE string, not timestamp)
            let formattedDate = '';
            if (indent.request_date) {
              const dateStr = String(indent.request_date);
              const dateParts = dateStr.split('T')[0].split('-'); // Get YYYY-MM-DD part
              const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
              formattedDate = dateObj.toLocaleString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric'
              });
            }
            
            return {
              id: indent.indent_number,
              indentId: indent.indent_id,
              subId: indent.customer_order_indent_id ? `Customer Order #${indent.customer_order_indent_id}` : 'Stock Replenishment',
              reqName: indent.customer_name || indent.requested_by_name || 'N/A',
              reqRole: 'QMS Officer',
              dept: 'QMS',
              date: formattedDate,
              urgency: indent.priority || 'Standard',
              urgencyClass: indent.priority === 'Urgent' ? 'badge-urgent' : indent.priority === 'High' ? 'badge-high' : 'badge-normal',
              items: `${indent.total_materials || 0} Materials`,
              status: displayStatus,
              statusClass: statusClass,
            };
          });
          
          console.log('Transformed indents:', transformedData);
          setAllIndents(transformedData);
        }
      } catch (err) {
        console.error('Error fetching indents:', err);
        setError('Failed to load purchase indents');
      } finally {
        setLoading(false);
      }
    };

    fetchIndents();
  }, []);

  // Mock Data (fallback - remove this in production)
  const mockIndents = [
    {
      id: "PI-2024-089",
      subId: "Customer Order #CO-1023",
      reqName: "Ravi Kumar",
      reqRole: "QMS Officer",
      dept: "QMS",
      date: "12 Jan 2024, 10:32 AM",
      urgency: "Critical",
      urgencyClass: "badge-critical",
      items: "3 Materials",
      status: "Pending",
      statusClass: "status-orange",
    },
    {
      id: "PI-2024-086",
      subId: "Customer Order #CO-1018",
      reqName: "Priya Sharma",
      reqRole: "QMS Engineer",
      dept: "QMS",
      date: "11 Jan 2024, 03:15 PM",
      urgency: "Urgent",
      urgencyClass: "badge-urgent",
      items: "5 Materials",
      status: "Verified",
      statusClass: "status-green",
    },
    {
      id: "PI-2024-080",
      subId: "Stock Replenishment",
      reqName: "Anita Devi",
      reqRole: "QMS Coordinator",
      dept: "QMS",
      date: "09 Jan 2024, 11:05 AM",
      urgency: "Normal",
      urgencyClass: "badge-normal",
      items: "2 Materials",
      status: "Verified",
      statusClass: "status-green",
    },
    {
      id: "PI-2024-075",
      subId: "Customer Order #CO-1002",
      reqName: "Suresh B",
      reqRole: "QMS Officer",
      dept: "QMS",
      date: "07 Jan 2024, 09:40 AM",
      urgency: "Urgent",
      urgencyClass: "badge-urgent",
      items: "4 Materials",
      status: "Rejected",
      statusClass: "status-red",
    },
    {
      id: "PI-2024-072",
      subId: "Customer Order #CO-998",
      reqName: "Meena R",
      reqRole: "QMS Officer",
      dept: "QMS",
      date: "05 Jan 2024, 02:20 PM",
      urgency: "Normal",
      urgencyClass: "badge-normal",
      items: "6 Materials",
      status: "Pending",
      statusClass: "status-orange",
    },
    {
      id: "PI-2024-068",
      subId: "Stock Replenishment",
      reqName: "Vijay K",
      reqRole: "QMS Engineer",
      dept: "QMS",
      date: "03 Jan 2024, 11:30 AM",
      urgency: "Critical",
      urgencyClass: "badge-critical",
      items: "8 Materials",
      status: "Pending",
      statusClass: "status-orange",
    },
    {
      id: "PI-2024-065",
      subId: "Customer Order #CO-995",
      reqName: "Lakshmi P",
      reqRole: "QMS Coordinator",
      dept: "QMS",
      date: "02 Jan 2024, 04:15 PM",
      urgency: "Urgent",
      urgencyClass: "badge-urgent",
      items: "3 Materials",
      status: "Verified",
      statusClass: "status-green",
    },
    {
      id: "PI-2024-062",
      subId: "Customer Order #CO-990",
      reqName: "Ramesh S",
      reqRole: "QMS Officer",
      dept: "QMS",
      date: "01 Jan 2024, 10:00 AM",
      urgency: "Normal",
      urgencyClass: "badge-normal",
      items: "2 Materials",
      status: "Rejected",
      statusClass: "status-red",
    },
  ];

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: allIndents.length,
      pending: allIndents.filter(i => i.status.toLowerCase() === 'pending').length,
      verified: allIndents.filter(i => i.status.toLowerCase() === 'verified').length,
      rejected: allIndents.filter(i => i.status.toLowerCase() === 'rejected').length,
    };
  }, [allIndents]);

  // Filtered data based on tab, search, and urgency
  const filteredIndents = useMemo(() => {
    let filtered = allIndents;

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(indent => 
        indent.status.toLowerCase() === activeTab.toLowerCase()
      );
    }

    // Filter by urgency
    if (urgencyFilter) {
      filtered = filtered.filter(indent => 
        indent.urgency.toLowerCase() === urgencyFilter.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(indent =>
        indent.id.toLowerCase().includes(query) ||
        indent.reqName.toLowerCase().includes(query) ||
        indent.subId.toLowerCase().includes(query) ||
        indent.dept.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allIndents, activeTab, searchQuery, urgencyFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredIndents.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedIndents = filteredIndents.slice(startIndex, endIndex);

  // Reset to page 1 when tab or search changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedIndents([]);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIndents(paginatedIndents.map(indent => indent.id));
    } else {
      setSelectedIndents([]);
    }
  };

  const handleSelectIndent = (id) => {
    setSelectedIndents(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Action handlers
  const handleViewIndent = (indent) => {
    // Navigate to unified purchase indent page with indent ID
    navigate('/qms-purchase-indents', { 
      state: { 
        indentId: indent.indentId
      } 
    });
  };



  const handleUrgencyFilter = (urgency) => {
    setUrgencyFilter(urgency);
    setShowFilterDropdown(false);
    setCurrentPage(1);
  };

  const clearUrgencyFilter = () => {
    setUrgencyFilter('');
  };

  return (
    <div className="vpi-container">
      
      {/* Page Header */}
      <div className="vpi-header-section">
        <div className="vpi-header-left">
          <h1 className="vpi-title">Purchase Indents - Store Officer</h1>
          <p className="vpi-subtitle">Review purchase indents from QMS and fill PO details before sending back for verification.</p>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div style={{padding: '20px', textAlign: 'center', color: '#64748b'}}>Loading indents...</div>
      )}
      {error && (
        <div style={{padding: '20px', backgroundColor: '#fee', color: '#c00', borderRadius: '8px', marginBottom: '20px'}}>{error}</div>
      )}

      {/* Tabs and Search Section */}
      <div className="vpi-controls-section">
        <div className="vpi-tabs">
          <button 
            className={`vpi-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            All Indents
            <span className="vpi-tab-count">{tabCounts.all}</span>
          </button>
          <button 
            className={`vpi-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => handleTabChange('pending')}
          >
            Pending
            <span className="vpi-tab-count">{tabCounts.pending}</span>
          </button>
          <button 
            className={`vpi-tab ${activeTab === 'verified' ? 'active' : ''}`}
            onClick={() => handleTabChange('verified')}
          >
            Verified
            <span className="vpi-tab-count">{tabCounts.verified}</span>
          </button>
          <button 
            className={`vpi-tab ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => handleTabChange('rejected')}
          >
            Rejected
            <span className="vpi-tab-count">{tabCounts.rejected}</span>
          </button>
        </div>

        <div className="vpi-search-filter">
          <div className="vpi-search-box">
            <Search size={18} className="vpi-search-icon" />
            <input
              type="text"
              placeholder="Search by ID, name, or order..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="vpi-search-input"
            />
          </div>
          <div className="vpi-filter-wrapper">
            <button 
              className="vpi-filter-btn"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter size={16} />
              Filter by Urgency
            </button>
            {showFilterDropdown && (
              <div className="vpi-filter-dropdown">
                <button onClick={() => handleUrgencyFilter('Urgent')} className="vpi-filter-option">
                  Urgent
                </button>
                <button onClick={() => handleUrgencyFilter('High')} className="vpi-filter-option">
                  High
                </button>
                <button onClick={() => handleUrgencyFilter('Standard')} className="vpi-filter-option">
                  Standard
                </button>
              </div>
            )}
          </div>
          {urgencyFilter && (
            <div className="vpi-active-filter">
              <span>Urgency: {urgencyFilter}</span>
              <button onClick={clearUrgencyFilter} className="vpi-clear-filter">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="vpi-card vpi-table-card">
        
        {/* Card Header */}
        <div className="vpi-card-header">
          <FileText size={20} className="vpi-header-icon" />
          <h2 className="vpi-card-heading">QMS Requested Purchase Indents</h2>
          <span className="vpi-result-count">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredIndents.length)} of {filteredIndents.length} results
          </span>
        </div>

        {/* Table */}
        <div className="vpi-table-responsive">
          <table className="vpi-table">
            <thead>
              <tr>
                <th style={{width: '4%'}}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedIndents.length === paginatedIndents.length && paginatedIndents.length > 0}
                    className="vpi-checkbox"
                  />
                </th>
                <th style={{width: '16%'}}>Indent ID</th>
                <th style={{width: '14%'}}>Requested By</th>
                <th style={{width: '10%'}}>Department</th>
                <th style={{width: '16%'}}>Created Date</th>
                <th style={{width: '10%'}}>Urgency</th>
                <th style={{width: '8%'}}>Items</th>
                <th style={{width: '12%'}}>Status</th>
                <th style={{width: '10%', textAlign: 'center'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedIndents.length > 0 ? (
                paginatedIndents.map((item, index) => (
                  <tr key={index} className={selectedIndents.includes(item.id) ? 'selected-row' : ''}>
                    {/* Checkbox */}
                    <td>
                      <input 
                        type="checkbox"
                        checked={selectedIndents.includes(item.id)}
                        onChange={() => handleSelectIndent(item.id)}
                        className="vpi-checkbox"
                      />
                    </td>

                    {/* Indent ID */}
                    <td>
                      <div className="vpi-id-text">{item.id}</div>
                      <div className="vpi-sub-text-blue">{item.subId}</div>
                    </td>

                    {/* Requested By */}
                    <td>
                      <div className="vpi-bold-text">{item.reqName}</div>
                      <div className="vpi-role-text">{item.reqRole}</div>
                    </td>

                    {/* Department */}
                    <td className="vpi-std-text">{item.dept}</td>

                    {/* Date */}
                    <td className="vpi-std-text">{item.date}</td>

                    {/* Urgency Badge */}
                    <td>
                      <span className={`vpi-urgency-badge ${item.urgencyClass}`}>
                        {item.urgency}
                      </span>
                    </td>

                    {/* Items */}
                    <td className="vpi-std-text">{item.items}</td>

                    {/* Status Pill */}
                    <td>
                      <span className={`vpi-status-pill ${item.statusClass}`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td>
                      <div className="vpi-action-btns">
                        <button 
                          className="vpi-btn-icon vpi-btn-view"
                          onClick={() => handleViewIndent(item)}
                          title="View and Fill PO Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="vpi-no-data">
                    No indents found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredIndents.length > 0 && (
          <div className="vpi-pagination">
            <div className="vpi-pagination-info">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredIndents.length)} of {filteredIndents.length} entries
            </div>
            <div className="vpi-pagination-controls">
              <button 
                className="vpi-page-btn"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              
              <div className="vpi-page-numbers">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={index} className="vpi-page-ellipsis">...</span>
                  ) : (
                    <button
                      key={index}
                      className={`vpi-page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageClick(page)}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>
              
              <button 
                className="vpi-page-btn"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
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

export default VerifyPurchaseIndents;