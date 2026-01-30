import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Filter, Clock, CheckCircle, ShoppingBag, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import './VerifyStoreIndents.css';

const VerifyStoreIndents = () => {
  const navigate = useNavigate();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5); // Default pagination size
  const [selectedIndents, setSelectedIndents] = useState([]);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Mock Data corresponding to the image rows (expanded with more entries)
  const allIndents = [
    {
      id: "#IND-24-082",
      date: "25 Jan, 2024",
      project: "Alpha Industrial Pump",
      orderId: "Order #ORD-9921",
      raisedBy: "Priya S.",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
      itemCount: "12 Items",
      priority: "High Priority",
      storeAvailable: 8,
      storeToBuy: 4,
      isFullStock: false,
      status: "Pending QMS",
      statusClass: "badge-pending",
    },
    {
      id: "#IND-24-081",
      date: "24 Jan, 2024",
      project: "Beta Machinery Ltd",
      orderId: "Order #ORD-9918",
      raisedBy: "Rajesh K.",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
      itemCount: "5 Items",
      priority: "Normal Priority",
      storeAvailable: 0,
      storeToBuy: 5,
      isFullStock: false,
      status: "Pending QMS",
      statusClass: "badge-pending",
    },
    {
      id: "#IND-24-079",
      date: "24 Jan, 2024",
      project: "Gamma Tech Solutions",
      orderId: "Order #ORD-9915",
      raisedBy: "Sarah M.",
      avatar: "https://i.pravatar.cc/150?u=a04258114e29026302d",
      itemCount: "8 Items",
      priority: "Normal Priority",
      storeAvailable: 8,
      storeToBuy: 0,
      isFullStock: true,
      status: "Store Verified",
      statusClass: "badge-verified",
    },
    {
      id: "#IND-24-075",
      date: "22 Jan, 2024",
      project: "Omega Structures",
      orderId: "Order #ORD-9902",
      raisedBy: "David W.",
      avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
      itemCount: "24 Items",
      priority: "Low Priority",
      storeAvailable: 20,
      storeToBuy: 4,
      isFullStock: false,
      status: "Pending QMS",
      statusClass: "badge-pending",
    },
    {
      id: "#IND-24-074",
      date: "21 Jan, 2024",
      project: "Delta Manufacturing",
      orderId: "Order #ORD-9900",
      raisedBy: "Mike R.",
      avatar: "https://i.pravatar.cc/150?u=a048581f4e29026801d",
      itemCount: "15 Items",
      priority: "High Priority",
      storeAvailable: 10,
      storeToBuy: 5,
      isFullStock: false,
      status: "Store Verified",
      statusClass: "badge-verified",
    },
    {
      id: "#IND-24-073",
      date: "21 Jan, 2024",
      project: "Epsilon Corp",
      orderId: "Order #ORD-9899",
      raisedBy: "Lisa T.",
      avatar: "https://i.pravatar.cc/150?u=a048581f4e29026901d",
      itemCount: "6 Items",
      priority: "Normal Priority",
      storeAvailable: 6,
      storeToBuy: 0,
      isFullStock: true,
      status: "Store Verified",
      statusClass: "badge-verified",
    },
    {
      id: "#IND-24-072",
      date: "20 Jan, 2024",
      project: "Zeta Industries",
      orderId: "Order #ORD-9898",
      raisedBy: "John D.",
      avatar: "https://i.pravatar.cc/150?u=a048581f4e29027001d",
      itemCount: "18 Items",
      priority: "Low Priority",
      storeAvailable: 12,
      storeToBuy: 6,
      isFullStock: false,
      status: "Pending QMS",
      statusClass: "badge-pending",
    },
  ];

  // Filter and search logic
  const filteredIndents = useMemo(() => {
    let filtered = allIndents;

    // Filter by tab
    if (activeTab === 'pending') {
      filtered = filtered.filter(indent => indent.status === 'Pending QMS');
    } else if (activeTab === 'verified') {
      filtered = filtered.filter(indent => indent.status === 'Store Verified');
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
  }, [searchQuery, activeTab]);

  // Calculate stats
  const stats = useMemo(() => {
    const pending = allIndents.filter(i => i.status === 'Pending QMS').length;
    const verified = allIndents.filter(i => i.status === 'Store Verified').length;
    const requiresPurchase = allIndents.filter(i => i.storeToBuy > 0).length;
    const fullyStocked = allIndents.filter(i => i.isFullStock).length;

    return { pending, verified, requiresPurchase, fullyStocked };
  }, []);

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
        indentData: indentToVerify
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

  return (
    <div className="vsi-container">
      
      {/* Top Navbar Area */}
      <header className="vsi-header">
        <h1 className="vsi-page-title">Verify Store Indents</h1>
        <div className="vsi-header-right">
          <div className="vsi-notification">
            <Bell size={20} className="vsi-stat-icon" style={{color: '#64748b'}} />
            <span className="vsi-notification-dot"></span>
          </div>
          <img src="https://i.pravatar.cc/150?u=admin" alt="User" className="vsi-user-avatar-lg" />
        </div>
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
            <span className="vsi-card-label">Processed Today</span>
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
          <table className="vsi-table">
            <thead>
              <tr>
                <th>INDENT ID</th>
                <th>PROJECT / CUSTOMER</th>
                <th>RAISED BY</th>
                <th>ITEMS</th>
                <th>STORE STATUS</th>
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
                        <img src={item.avatar} alt={item.raisedBy} className="vsi-user-avatar-sm" />
                        <span className="vsi-text-medium">{item.raisedBy}</span>
                      </div>
                    </td>

                    {/* Items */}
                    <td>
                      <div className="vsi-text-bold">{item.itemCount}</div>
                      <div className="vsi-subtext">{item.priority}</div>
                    </td>

                    {/* Store Status (Progress Bar) */}
                    <td style={{ minWidth: '180px' }}>
                      <div className="vsi-stock-text">
                        <span className="vsi-bold-dark">{item.storeAvailable} Available</span>
                        {item.isFullStock ? (
                           <span className="vsi-success-text">Full Stock</span>
                        ) : (
                           <span className="vsi-subtext-blue"> {item.storeToBuy} to Buy</span>
                        )}
                      </div>
                      {/* Progress Bar Visual */}
                      <div className="vsi-progress-track">
                        <div 
                          className="vsi-progress-fill" 
                          style={{ width: `${(item.storeAvailable / (item.storeAvailable + item.storeToBuy || 1)) * 100}%` }}
                        ></div>
                      </div>
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
                        onClick={() => handleVerify(item.id)}
                        disabled={item.status === 'Store Verified'}
                      >
                        {item.status === 'Store Verified' ? 'Verified' : 'Verify'}
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
        </div>

        {/* Footer / Pagination */}
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

      </div>
    </div>
  );
};

export default VerifyStoreIndents;