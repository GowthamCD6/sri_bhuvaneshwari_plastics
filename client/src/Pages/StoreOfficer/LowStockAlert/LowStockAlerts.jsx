import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, AlertTriangle, XCircle, Clock, ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import './LowStockAlerts.css';
import { materialService } from '../../../services/apiService';

const LowStockAlerts = () => {
  const navigate = useNavigate();
  
  // State for filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('lowest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  const itemsPerPage = 10;

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await materialService.getLowStockMaterials();
        const data = response.materials || response.data || [];
        const mapped = data.map((item) => {
          const currentStock = Number(item.available_stock ?? item.current_stock ?? 0);
          const minRequired = Number(item.reorder_level ?? item.min_stock_level ?? 0);
          const maxStock = Number(item.max_stock_level ?? 0);
          let status = 'Low Stock';
          if (currentStock <= 0) status = 'Out of Stock';
          else if (currentStock <= minRequired * 0.5) status = 'Critical';

          return {
            id: item.material_id,
            name: item.material_name,
            code: item.material_code,
            category: item.category || '-',
            currentStock,
            minRequired,
            maxStock,
            unit: item.unit_of_measurement || '-',
            status,
            supplier: item.supplier || 'Internal',
            warehouseLocation: item.warehouse_location || '-'
          };
        });
        setAlerts(mapped);
      } catch (err) {
        console.error('Failed to fetch low stock materials:', err);
        setError('Failed to load low stock alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchLowStock();
  }, []);

  // Get unique categories
  const categories = ['All', ...new Set(alerts.map(item => item.category))];
  const statusOptions = ['All', 'Out of Stock', 'Critical', 'Low Stock'];
  const sortOptions = [
    { value: 'lowest', label: 'Lowest Stock First' },
    { value: 'highest', label: 'Highest Stock First' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'category', label: 'Category' }
  ];

  // Calculate stats
  const stats = useMemo(() => {
    return {
      critical: alerts.filter(a => a.status === 'Critical').length,
      lowStock: alerts.filter(a => a.status === 'Low Stock').length,
      outOfStock: alerts.filter(a => a.status === 'Out of Stock').length
    };
  }, [alerts]);

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.supplier.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(item => item.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'All') {
      result = result.filter(item => item.category === categoryFilter);
    }

    // Sort
    switch (sortBy) {
      case 'lowest':
        result.sort((a, b) => a.currentStock - b.currentStock);
        break;
      case 'highest':
        result.sort((a, b) => b.currentStock - a.currentStock);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'category':
        result.sort((a, b) => a.category.localeCompare(b.category));
        break;
      default:
        break;
    }

    return result;
  }, [alerts, searchQuery, statusFilter, categoryFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const paginatedAlerts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAlerts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAlerts, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    switch (filterType) {
      case 'status':
        setStatusFilter(value);
        setShowStatusDropdown(false);
        break;
      case 'category':
        setCategoryFilter(value);
        setShowCategoryDropdown(false);
        break;
      case 'sort':
        setSortBy(value);
        setShowSortDropdown(false);
        break;
      default:
        break;
    }
  };

  // Handle restock - navigate to stock adjustment page
  const handleRestock = (material) => {
    navigate('/store-officer/stock-adjustment', {
      state: {
        material: {
          id: material.code,
          name: material.name,
          stock: material.currentStock.toString(),
          unit: material.unit.toLowerCase(),
          minStock: material.minRequired.toString(),
          maxStock: material.maxStock.toString(),
          supplier: material.supplier,
          warehouseLocation: material.warehouseLocation,
          type: material.category,
          status: material.status
        }
      }
    });
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'Out of Stock':
        return 'lsa-badge-red';
      case 'Critical':
        return 'lsa-badge-orange';
      case 'Low Stock':
        return 'lsa-badge-yellow';
      default:
        return 'lsa-badge-gray';
    }
  };

  // Get stock percentage for progress bar
  const getStockPercentage = (current, min) => {
    if (current === 0) return 0;
    return Math.min((current / min) * 100, 100);
  };

  // Close dropdowns when clicking outside
  const handleContainerClick = () => {
    setShowStatusDropdown(false);
    setShowCategoryDropdown(false);
    setShowSortDropdown(false);
  };

  return (
    <div className="lsa-container" onClick={handleContainerClick}>
      
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Header */}
      <header className="lsa-header">
        <div className="lsa-header-content">
        </div>
      </header>

      {/* Stats Cards */}
      <div className="lsa-stats-row">
        <div className="lsa-card" onClick={() => !loading && handleFilterChange('status', 'Critical')}>
          <div className="lsa-card-top">
            <span className="lsa-card-label">CRITICAL ITEMS</span>
            <div className="lsa-card-icon lsa-icon-orange">
              <Clock size={20} />
            </div>
          </div>
          {loading ? <div className="lsa-skeleton-val" /> : <div className="lsa-card-val">{stats.critical}</div>}
          <div className="lsa-card-sub">Below minimum limit</div>
        </div>
        
        <div className="lsa-card" onClick={() => !loading && handleFilterChange('status', 'Low Stock')}>
          <div className="lsa-card-top">
            <span className="lsa-card-label">LOW STOCK</span>
            <div className="lsa-card-icon lsa-icon-yellow">
              <AlertTriangle size={20} />
            </div>
          </div>
          {loading ? <div className="lsa-skeleton-val" /> : <div className="lsa-card-val">{stats.lowStock}</div>}
          <div className="lsa-card-sub">Restock soon</div>
        </div>

        <div className="lsa-card" onClick={() => !loading && handleFilterChange('status', 'Out of Stock')}>
          <div className="lsa-card-top">
            <span className="lsa-card-label">OUT OF STOCK</span>
            <div className="lsa-card-icon lsa-icon-red">
              <XCircle size={20} />
            </div>
          </div>
          {loading ? <div className="lsa-skeleton-val" /> : <div className="lsa-card-val">{stats.outOfStock}</div>}
          <div className="lsa-card-sub">Unavailable in store</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="lsa-filter-bar">
        <div className="lsa-filter-group">
          {/* Status Filter */}
          <div className="lsa-filter-item">
            <span className="lsa-filter-label">Status:</span>
            <div className="lsa-dropdown" onClick={(e) => e.stopPropagation()}>
              <button 
                className="lsa-dropdown-btn" 
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowCategoryDropdown(false);
                  setShowSortDropdown(false);
                }}
              >
                {statusFilter === 'All' ? 'All alerts' : statusFilter}
                <ChevronDown size={14} />
              </button>
              {showStatusDropdown && (
                <div className="lsa-dropdown-menu">
                  {statusOptions.map(option => (
                    <div 
                      key={option} 
                      className={`lsa-dropdown-item ${statusFilter === option ? 'active' : ''}`}
                      onClick={() => handleFilterChange('status', option)}
                    >
                      {option === 'All' ? 'All alerts' : option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="lsa-filter-item">
            <span className="lsa-filter-label">Category:</span>
            <div className="lsa-dropdown" onClick={(e) => e.stopPropagation()}>
              <button 
                className="lsa-dropdown-btn"
                onClick={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowStatusDropdown(false);
                  setShowSortDropdown(false);
                }}
              >
                {categoryFilter === 'All' ? 'All categories' : categoryFilter}
                <ChevronDown size={14} />
              </button>
              {showCategoryDropdown && (
                <div className="lsa-dropdown-menu">
                  {categories.map(option => (
                    <div 
                      key={option} 
                      className={`lsa-dropdown-item ${categoryFilter === option ? 'active' : ''}`}
                      onClick={() => handleFilterChange('category', option)}
                    >
                      {option === 'All' ? 'All categories' : option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sort Filter */}
          <div className="lsa-filter-item">
            <span className="lsa-filter-label">Sort by:</span>
            <div className="lsa-dropdown" onClick={(e) => e.stopPropagation()}>
              <button 
                className="lsa-dropdown-btn"
                onClick={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowStatusDropdown(false);
                  setShowCategoryDropdown(false);
                }}
              >
                {sortOptions.find(o => o.value === sortBy)?.label}
                <ChevronDown size={14} />
              </button>
              {showSortDropdown && (
                <div className="lsa-dropdown-menu">
                  {sortOptions.map(option => (
                    <div 
                      key={option.value} 
                      className={`lsa-dropdown-item ${sortBy === option.value ? 'active' : ''}`}
                      onClick={() => handleFilterChange('sort', option.value)}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Search */}
        <div className="lsa-search-wrapper">
          <div className="lsa-search-icon"><Search size={16} /></div>
          <input 
            type="text" 
            placeholder="Search materials, codes..." 
            className="lsa-search-input"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="lsa-table-container">
        <table className="lsa-table">
          <thead>
            <tr>
              <th>MATERIAL</th>
              <th>CATEGORY</th>
              <th>STOCK LEVEL</th>
              <th>MIN. REQUIRED</th>
              <th>UNIT</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: itemsPerPage }).map((_, i) => (
              <tr key={`skel-${i}`}>
                {Array.from({ length: 7 }).map((__, j) => (
                  <td key={j}><div className="lsa-skeleton-cell" /></td>
                ))}
              </tr>
            ))}
            {!loading && paginatedAlerts.length > 0 ? (
              paginatedAlerts.map((item) => (
                <tr key={item.id}>
                  {/* Material */}
                  <td>
                    <div className="lsa-prod-cell">
                      <div className="lsa-prod-icon">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="lsa-prod-name">{item.name}</div>
                        <div className="lsa-prod-code">{item.code}</div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <span className="lsa-category-badge">{item.category}</span>
                  </td>

                  {/* Stock Level */}
                  <td className="lsa-text-std">{item.currentStock}</td>

                  {/* Min Required */}
                  <td className="lsa-text-std">{item.minRequired}</td>

                  {/* Unit */}
                  <td className="lsa-text-std">{item.unit}</td>

                  {/* Status Badge */}
                  <td>
                    <span className={`lsa-badge ${getStatusClass(item.status)}`}>
                      <span className="lsa-dot"></span>
                      {item.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="lsa-btn-restock"
                      onClick={() => handleRestock(item)}
                    >
                      <RefreshCw size={14} />
                      Restock
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="lsa-no-results">
                  <div className="lsa-empty-state">
                    <Package size={48} />
                    <p>No materials found matching your criteria</p>
                    <button 
                      className="lsa-btn-clear"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('All');
                        setCategoryFilter('All');
                        setCurrentPage(1);
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      {filteredAlerts.length > 0 && (
        <div className="lsa-footer">
          <span className="lsa-footer-text">
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAlerts.length)} of {filteredAlerts.length} materials
          </span>
          <div className="lsa-pagination">
            <button 
              className="lsa-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <div className="lsa-page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`lsa-page-num ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button 
              className="lsa-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default LowStockAlerts;