import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, ChevronDown, Plus, FileText, Eye, Edit, Trash2, Calendar, X, Check, Package } from 'lucide-react';
import './MaterialRequest.css';
import { storeRequestService, materialService } from '../../../services/apiService';
import useAuthStore from '../../../store/authStore';

const DEFAULT_NEW_REQUEST = {
  materialId: '',
  itemType: 'stock',
  rmCode: '',
  rmName: '',
  color: '',
  storageLocation: '',
  neededQuantity: '',
  unit: 'kg',
  neededDate: '',
  reason: '',
  priority: 'Normal'
};

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateParts = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  
  // If it's just a date string like YYYY-MM-DD
  if (raw.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = raw.split('-');
    return {
      year: Number(year),
      month: Number(month),
      day: Number(day)
    };
  }

  // Otherwise, it's likely an ISO string (e.g. 2026-07-20T18:30:00.000Z)
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  };
};

const MaterialRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [viewRequestModalOpen, setViewRequestModalOpen] = useState(false);
  const [viewRequestData, setViewRequestData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  // New request form state
  const [newRequest, setNewRequest] = useState({ ...DEFAULT_NEW_REQUEST });

  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapPriorityClass = (priority) => {
    if (priority === 'Critical') return 'badge-critical';
    if (priority === 'Urgent') return 'badge-urgent';
    return 'badge-normal';
  };

  const normalizePriority = (priority) => {
    const normalized = String(priority || '').trim().toLowerCase();
    if (normalized === 'critical') return 'Critical';
    if (['urgent', 'high'].includes(normalized)) return 'Urgent';
    if (['normal', 'standard', 'low'].includes(normalized)) return 'Normal';
    return 'Normal';
  };

  const mapStatusClass = (status) => {
    // Processed is now mapped to Approved, but keeping safe check
    if (status === 'Approved' || status === 'Processed') return 'status-green';
    if (status === 'Rejected') return 'status-red';
    return 'status-orange';
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
      const requestedBy = user?.userId || user?.user_id;
      const filters = requestedBy ? { requestedBy } : {};
      const response = await storeRequestService.getAllRequests(filters);
      const data = response.data || [];
      const mapped = data.map((req) => {
        const priority = normalizePriority(req.priority);
        const itemTypeValue = normalizeItemType(req.item_type || 'stock');
        const rawMaterialCode = req.material_code || '';
        const rawColor = req.color || '';
        const rawReason = req.reason || '';
        const neededDateValue = formatDateForInput(req.needed_by_date);
        const neededQuantityValue = req.quantity !== undefined && req.quantity !== null ? String(req.quantity) : '';
        const unitValue = normalizeUnit(req.unit_of_measurement);
        return {
        id: req.request_number,
        dbId: req.request_id,
        materialId: req.material_id || '',
        rmCode: rawMaterialCode || '-',
        rawMaterialCode,
        rmName: req.material_name,
        // Ensure proper casing for display
        itemType: (req.item_type || 'Stock').charAt(0).toUpperCase() + (req.item_type || 'Stock').slice(1).toLowerCase(),
        color: req.color || '-',
        quantity: `${req.quantity} ${req.unit_of_measurement}`,
        neededDate: formatDate(req.needed_by_date),
        neededDateValue,
        storageLocation: req.storage_location || '',
        requestedBy: req.requested_by_name || 'Store Officer',
        requestDate: formatDate(req.request_date),
        priority: req.priority || 'Normal',
        priorityClass: mapPriorityClass(req.priority || 'Normal'),
        // Map 'Processed' to 'Approved' for UI consistency as per user request
        status: (req.status === 'Processed' ? 'Approved' : (req.status || 'Pending')),
        statusClass: mapStatusClass(req.status === 'Processed' ? 'Approved' : (req.status || 'Pending')),
        reason: req.reason || '-'
      }});
      setAllRequests(mapped);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.userId, user?.user_id]);

  const normalizeUnit = (unit) => {
    const normalized = String(unit || '').trim().toLowerCase();
    if (['kg', 'kgs', 'kilogram', 'kilograms'].includes(normalized)) return 'kg';
    if (['g', 'gram', 'grams'].includes(normalized)) return 'g';
    if (['ml', 'milliliter', 'millilitre', 'milliliters', 'millilitres'].includes(normalized)) return 'ml';
    if (['ltr', 'l', 'litre', 'liter', 'liters', 'litres'].includes(normalized)) return 'ltr';
    if (['pcs', 'pc', 'piece', 'pieces'].includes(normalized)) return 'pcs';
    if (['set', 'sets'].includes(normalized)) return 'sets';
    if (['sheet', 'sheets'].includes(normalized)) return 'sheets';
    return normalized || 'kg';
  };

  const normalizeItemType = (itemType) => {
    return String(itemType || '').toLowerCase().includes('component') ? 'component' : 'stock';
  };

  const formatDateForInput = (value) => {
    if (!value) return '';
    const parts = parseDateParts(value);
    if (!parts) return '';
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  };

  const buildRequestFormState = (record, fallback = {}) => {
    const materialId = record?.material_id ?? record?.materialId ?? fallback?.materialId ?? '';
    const itemType = normalizeItemType(
      record?.item_type ?? record?.itemTypeValue ?? record?.itemType ?? fallback?.itemTypeValue ?? fallback?.itemType
    );
    const rmCode =
      record?.material_code ?? record?.rawMaterialCode ?? record?.rmCode ?? fallback?.rawMaterialCode ?? fallback?.rmCode ?? '';
    const rmName = record?.material_name ?? record?.rmName ?? fallback?.rmName ?? '';
    const color = record?.color ?? record?.rawColor ?? fallback?.rawColor ?? fallback?.color ?? '';
    const storageLocation =
      record?.storage_location ?? record?.storageLocation ?? fallback?.storageLocation ?? '';
    const neededQuantity =
      record?.quantity !== undefined && record?.quantity !== null
        ? String(record.quantity)
        : (record?.neededQuantityValue ?? fallback?.neededQuantityValue ?? '');
    const unit = normalizeUnit(
      record?.unit_of_measurement ?? record?.unitValue ?? record?.unit ?? fallback?.unitValue ?? fallback?.unit ?? 'kg'
    );
    const neededDate =
      formatDateForInput(record?.needed_by_date) ||
      record?.neededDateValue ||
      fallback?.neededDateValue ||
      '';
    const reason = record?.reason ?? record?.rawReason ?? fallback?.rawReason ?? fallback?.reason ?? '';
    const priority = normalizePriority(record?.priority ?? fallback?.priority);

    return {
      materialId,
      itemType,
      rmCode,
      rmName,
      color,
      storageLocation,
      neededQuantity,
      unit,
      neededDate,
      reason,
      priority
    };
  };

  useEffect(() => {
    const restockMaterial = location.state?.restockMaterial;
    const materialCode = String(restockMaterial?.materialCode || '').trim();
    if (!materialCode) return;

    let isActive = true;

    const prefillFromRestock = async () => {
      let matchedLowStockMaterial = null;
      let matchedExistingRequest = null;

      try {
        const [lowStockResponse, existingRequestResponse] = await Promise.all([
          materialService.getLowStockMaterials(),
          storeRequestService.getAllRequests({ search: materialCode })
        ]);

        const lowStockRows = lowStockResponse.materials || [];
        matchedLowStockMaterial = lowStockRows.find(
          (material) => String(material.material_code || '').toLowerCase() === materialCode.toLowerCase()
        ) || null;

        const existingRequests = existingRequestResponse.data || [];
        matchedExistingRequest = existingRequests.find(
          (request) => String(request.material_code || '').toLowerCase() === materialCode.toLowerCase()
        ) || null;
      } catch (err) {
        console.error('Failed to fetch material details for restock prefill:', err);
      }

      if (!isActive) return;

      const stockFromDb = Number(matchedLowStockMaterial?.available_stock ?? matchedLowStockMaterial?.current_stock);
      const stockFromRoute = Number(restockMaterial?.currentStock);
      const effectiveStock = Number.isFinite(stockFromDb)
        ? stockFromDb
        : (Number.isFinite(stockFromRoute) ? stockFromRoute : undefined);

      const minFromDb = Number(matchedLowStockMaterial?.min_stock_level ?? matchedLowStockMaterial?.reorder_level);
      const minFromRoute = Number(restockMaterial?.minRequired);
      const effectiveMinRequired = Number.isFinite(minFromDb)
        ? minFromDb
        : (Number.isFinite(minFromRoute) ? minFromRoute : 0);

      const deficitQty = Math.max(effectiveMinRequired - (effectiveStock ?? 0), 0);
      const neededQuantity = matchedExistingRequest?.quantity
        ? String(matchedExistingRequest.quantity)
        : (deficitQty > 0 ? String(deficitQty) : '');

      const unitValue = normalizeUnit(
        matchedExistingRequest?.unit_of_measurement ||
        matchedLowStockMaterial?.unit_of_measurement ||
        restockMaterial?.unit
      );

      const priorityValue = normalizePriority(matchedExistingRequest?.priority);
      const reasonValue = matchedExistingRequest?.reason || '';

      const prefilledRequest = {
        ...DEFAULT_NEW_REQUEST,
        materialId: matchedExistingRequest?.material_id || matchedLowStockMaterial?.material_id || '',
        itemType: normalizeItemType(matchedExistingRequest?.item_type || matchedLowStockMaterial?.material_type || restockMaterial?.category),
        rmCode: materialCode,
        rmName: matchedExistingRequest?.material_name || matchedLowStockMaterial?.material_name || restockMaterial?.materialName || '',
        color: matchedExistingRequest?.color || '',
        storageLocation: matchedExistingRequest?.storage_location || matchedLowStockMaterial?.warehouse_location || restockMaterial?.warehouseLocation || '',
        neededQuantity,
        unit: unitValue,
        neededDate: formatDateForInput(matchedExistingRequest?.needed_by_date),
        reason: reasonValue,
        priority: priorityValue
      };

      setEditingId(null);
      setNewRequest(prefilledRequest);
      setShowNewRequestModal(true);

      // Prevent reopening modal again on refresh/re-render.
      navigate(location.pathname, { replace: true, state: {} });
    };

    prefillFromRestock();

    return () => {
      isActive = false;
    };
  }, [location.state, location.pathname, navigate]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: allRequests.length,
      pending: allRequests.filter(r => r.status === 'Pending').length,
      approved: allRequests.filter(r => r.status === 'Approved').length,
      rejected: allRequests.filter(r => r.status === 'Rejected').length,
    };
  }, [allRequests]);

  // Filtered data based on tab, search, and priority filter
  const filteredRequests = useMemo(() => {
    let filtered = allRequests;

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(req => req.status.toLowerCase() === activeTab);
    }

    // Filter by priority
    if (urgencyFilter) {
      filtered = filtered.filter(req => normalizePriority(req.priority) === urgencyFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req =>
        req.id.toLowerCase().includes(query) ||
        req.rmCode.toLowerCase().includes(query) ||
        req.rmName.toLowerCase().includes(query) ||
        req.reason.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allRequests, activeTab, searchQuery, urgencyFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Handlers
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedRequests([]);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePriorityFilter = (priority) => {
    setUrgencyFilter(priority);
    setShowFilterDropdown(false);
    setCurrentPage(1);
  };

  const clearPriorityFilter = () => {
    setUrgencyFilter('');
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRequests(paginatedRequests.map(req => req.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (id) => {
    setSelectedRequests(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleViewRequest = (request) => {
    setViewRequestData(request);
    setViewRequestModalOpen(true);
  };

  const handleEditRequest = async (request) => {
    setEditingId(request.dbId);

    try {
      const response = await storeRequestService.getRequestById(request.dbId);
      const rawRequest = response.data || {};
      setNewRequest(buildRequestFormState(rawRequest, request));
    } catch (err) {
      console.error('Failed to fetch request details for edit:', err);
      setNewRequest(buildRequestFormState(request));
    }

    setShowNewRequestModal(true);
  };

  const handleDeleteRequest = (request) => {
    if (window.confirm(`Are you sure you want to delete ${request.id}?`)) {
      storeRequestService.deleteRequest(request.dbId)
        .then(() => fetchRequests())
        .catch((err) => {
          console.error('Failed to delete request:', err);
          alert('Failed to delete request');
        });
    }
  };

  const handleNewRequestChange = (field, value) => {
    setNewRequest(prev => ({ ...prev, [field]: value }));
  };

  const handleRmCodeBlur = async () => {
    if (!newRequest.rmCode || newRequest.rmCode.trim().length < 2) return;
    try {
      const response = await materialService.getAllMaterials({ search: newRequest.rmCode });
      const materials = response.data || [];
      const match = materials.find(m => String(m.material_code || '').toLowerCase() === newRequest.rmCode.toLowerCase().trim());
      
      if (match) {
        setNewRequest(prev => ({
          ...prev,
          rmName: prev.rmName || match.material_name || '',
          storageLocation: prev.storageLocation || match.warehouse_location || '',
          unit: prev.unit || normalizeUnit(match.unit_of_measurement)
        }));
      }
    } catch (err) {
      console.error('Failed to fetch material on blur:', err);
    }
  };

  const handleSubmitNewRequest = (e) => {
    e.preventDefault();
    if (!newRequest.rmCode || !newRequest.rmName || !newRequest.neededQuantity || !newRequest.neededDate) {
      alert('Please fill in all required fields');
      return;
    }
    const payload = {
      itemType: newRequest.itemType,
      materialId: newRequest.materialId || null,
      materialCode: newRequest.rmCode,
      materialName: newRequest.rmName,
      color: newRequest.color,
      storageLocation: newRequest.storageLocation,
      quantity: newRequest.neededQuantity,
      unitOfMeasurement: newRequest.unit,
      neededByDate: newRequest.neededDate,
      reason: newRequest.reason,
      priority: normalizePriority(newRequest.priority),
      requestDate: getTodayDate()
    };
    const apiCall = editingId
      ? storeRequestService.updateRequest(editingId, payload)
      : storeRequestService.createRequest(payload);
    apiCall
      .then(() => fetchRequests())
      .catch((err) => {
        console.error(`Failed to ${editingId ? 'update' : 'create'} request:`, err);
        alert(`Failed to ${editingId ? 'update' : 'create'} request`);
      })
      .finally(() => {
        setShowNewRequestModal(false);
        setEditingId(null);
        resetNewRequestForm();
      });
  };

  const resetNewRequestForm = () => {
    setNewRequest({ ...DEFAULT_NEW_REQUEST });
  };

  return (
    <div className="mr-container">
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Tabs and Search Section */}
      <div className="mr-controls-section">
        <div className="mr-tabs">
          <button 
            className={`mr-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            All Requests
            <span className="mr-tab-count">{tabCounts.all}</span>
          </button>
          <button 
            className={`mr-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => handleTabChange('pending')}
          >
            Pending
            <span className="mr-tab-count">{tabCounts.pending}</span>
          </button>
          <button 
            className={`mr-tab ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => handleTabChange('approved')}
          >
            Approved
            <span className="mr-tab-count">{tabCounts.approved}</span>
          </button>
          <button 
            className={`mr-tab ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => handleTabChange('rejected')}
          >
            Rejected
            <span className="mr-tab-count">{tabCounts.rejected}</span>
          </button>
        </div>

        <div className="mr-search-filter">
          <div className="mr-search-box">
            <Search size={18} className="mr-search-icon" />
            <input
              type="text"
              placeholder="Search by ID, code, or name..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="mr-search-input"
            />
          </div>
          <div className="mr-filter-wrapper">
            <button 
              className="mr-filter-btn"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter size={16} />
              Filter by Priority
            </button>
            {showFilterDropdown && (
              <div className="mr-filter-dropdown">
                <button onClick={() => handlePriorityFilter('Critical')} className="mr-filter-option">
                  Critical
                </button>
                <button onClick={() => handlePriorityFilter('Urgent')} className="mr-filter-option">
                  Urgent
                </button>
                <button onClick={() => handlePriorityFilter('Normal')} className="mr-filter-option">
                  Normal
                </button>
              </div>
            )}
          </div>
          {urgencyFilter && (
            <div className="mr-active-filter">
              <span>Priority: {urgencyFilter}</span>
              <button onClick={clearPriorityFilter} className="mr-clear-filter">
                <X size={14} />
              </button>
            </div>
          )}
            <button className="mr-btn-primary mr-btn-new-request" onClick={() => setShowNewRequestModal(true)}>
              <Plus size={18} />
              New Request
            </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="mr-card mr-table-card">
        <div className="mr-card-header">
          <Package size={20} className="mr-header-icon" />
          <h2 className="mr-card-heading">Material Requests List</h2>
          <span className="mr-result-count">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} results
          </span>
        </div>

        <div className="mr-table-responsive">
          <table className="mr-table">
            <thead>
              <tr>
                <th style={{width: '10%'}}>Request ID</th>
                <th style={{width: '20%'}}>Material Details</th>
                <th style={{width: '10%'}}>Type</th>
                <th style={{width: '10%'}}>Quantity</th>
                <th style={{width: '12%'}}>Needed Date</th>
                <th style={{width: '10%'}}>Priority</th>
                <th style={{width: '12%'}}>Status</th>
                <th style={{width: '16%', textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: pageSize }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j}><div className="mr-skeleton-cell" /></td>
                  ))}
                </tr>
              ))}
              {!loading && paginatedRequests.length > 0 ? (
                paginatedRequests.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div className="mr-id-text">{item.id}</div>
                      <div className="mr-sub-text">{item.requestDate}</div>
                    </td>
                    <td>
                      <div className="mr-bold-text">{item.rmName}</div>
                      <div className="mr-sub-text">{item.rmCode} • {item.color}</div>
                    </td>
                    <td>
                      <span className={`mr-type-badge ${item.itemType === 'Stock' ? 'type-stock' : 'type-component'}`}>
                        {item.itemType}
                      </span>
                    </td>
                    <td className="mr-std-text">{item.quantity}</td>
                    <td>
                      <div className="mr-date-cell">
                        <Calendar size={14} />
                        <span>{item.neededDate}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`mr-priority-badge ${item.priorityClass}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`mr-status-pill ${item.statusClass}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="mr-action-btns">
                        <button 
                          className="mr-btn-icon mr-btn-view"
                          onClick={() => handleViewRequest(item)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {item.status === 'Pending' && (
                          <>
                            <button 
                              className="mr-btn-icon mr-btn-edit"
                              onClick={() => handleEditRequest(item)}
                              title="Edit Request"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              className="mr-btn-icon mr-btn-delete"
                              onClick={() => handleDeleteRequest(item)}
                              title="Delete Request"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="mr-no-data">
                    <div className="mr-empty-state">
                      <Package size={48} className="mr-empty-icon" />
                      <p>No material requests found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredRequests.length > 0 && (
          <div className="mr-pagination">
            <div className="mr-pagination-info">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} entries
            </div>
            <div className="mr-pagination-controls">
              <button 
                className="mr-page-btn"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              
              <div className="mr-page-numbers">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={index} className="mr-page-ellipsis">...</span>
                  ) : (
                    <button
                      key={index}
                      className={`mr-page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageClick(page)}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>
              
              <button 
                className="mr-page-btn"
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

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="mr-modal-overlay" onClick={() => setShowNewRequestModal(false)}>
          <div className="mr-modal" onClick={e => e.stopPropagation()}>
            <div className="mr-modal-header">
              <h2>{editingId ? 'Edit Material Request' : 'New Material Request'}</h2>
              <button className="mr-modal-close" onClick={() => { setShowNewRequestModal(false); setEditingId(null); resetNewRequestForm(); }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitNewRequest} className="mr-modal-body">
              {/* Item Type */}
              <div className="mr-form-group">
                <label className="mr-label">Item Type</label>
                <div className="mr-radio-group">
                  <label className="mr-radio-label">
                    <input 
                      type="radio" 
                      name="itemType" 
                      checked={newRequest.itemType === 'stock'} 
                      onChange={() => handleNewRequestChange('itemType', 'stock')}
                      className="mr-radio-input"
                    />
                    <span className="mr-radio-text">Stock / Raw Material</span>
                  </label>
                  <label className="mr-radio-label">
                    <input 
                      type="radio" 
                      name="itemType" 
                      checked={newRequest.itemType === 'component'} 
                      onChange={() => handleNewRequestChange('itemType', 'component')}
                      className="mr-radio-input"
                    />
                    <span className="mr-radio-text">Component</span>
                  </label>
                </div>
              </div>

              {/* Code & Name */}
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label className="mr-label">RM / Component Code *</label>
                  <input 
                    type="text" 
                    className="mr-input" 
                    placeholder="e.g. RM-10024" 
                    value={newRequest.rmCode}
                    onChange={(e) => handleNewRequestChange('rmCode', e.target.value)}
                    onBlur={handleRmCodeBlur}
                    required
                  />
                </div>
                <div className="mr-form-group">
                  <label className="mr-label">RM / Component Name *</label>
                  <input 
                    type="text" 
                    className="mr-input" 
                    placeholder="e.g. Polypropylene Granules" 
                    value={newRequest.rmName}
                    onChange={(e) => handleNewRequestChange('rmName', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Color & Storage */}
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label className="mr-label">Color</label>
                  <input 
                    type="text" 
                    className="mr-input" 
                    placeholder="e.g. Natural White" 
                    value={newRequest.color}
                    onChange={(e) => handleNewRequestChange('color', e.target.value)}
                  />
                </div>
                <div className="mr-form-group">
                  <label className="mr-label">Storage Location</label>
                  <input 
                    type="text" 
                    className="mr-input" 
                    placeholder="e.g. Warehouse A / Rack 3" 
                    value={newRequest.storageLocation}
                    onChange={(e) => handleNewRequestChange('storageLocation', e.target.value)}
                  />
                </div>
              </div>

              {/* Quantity & Unit */}
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label className="mr-label">Needed Quantity *</label>
                  <div className="mr-qty-row">
                    <input 
                      type="number" 
                      className="mr-input" 
                      placeholder="0.00" 
                      value={newRequest.neededQuantity}
                      onChange={(e) => handleNewRequestChange('neededQuantity', e.target.value)}
                      required
                    />
                    <div className="mr-select-wrapper mr-unit-select">
                      <select 
                        className="mr-select"
                        value={newRequest.unit}
                        onChange={(e) => handleNewRequestChange('unit', e.target.value)}
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="ltr">ltr</option>
                        <option value="pcs">pcs</option>
                        <option value="sets">sets</option>
                        <option value="sheets">sheets</option>
                      </select>
                      <ChevronDown size={16} className="mr-select-icon" />
                    </div>
                  </div>
                </div>
                <div className="mr-form-group">
                  <label className="mr-label">Material Needed Date *</label>
                  <div className="mr-date-input-wrapper">
                    <input 
                      type="date" 
                      className="mr-input mr-date-input" 
                      value={newRequest.neededDate}
                      onChange={(e) => handleNewRequestChange('neededDate', e.target.value)}
                      required
                    />
                    <Calendar size={16} className="mr-date-icon" />
                  </div>
                </div>
              </div>

              {/* Priority */}
              <div className="mr-form-group">
                <label className="mr-label">Priority</label>
                <div className="mr-select-wrapper">
                  <select 
                    className="mr-select"
                    value={newRequest.priority}
                    onChange={(e) => handleNewRequestChange('priority', e.target.value)}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Critical">Critical</option>
                  </select>
                  <ChevronDown size={16} className="mr-select-icon" />
                </div>
              </div>

              {/* Reason */}
              <div className="mr-form-group">
                <label className="mr-label">Used For / Reason</label>
                <textarea 
                  className="mr-textarea" 
                  placeholder="Mention why this item is needed (e.g. customer order, regular stock, machine maintenance)..."
                  value={newRequest.reason}
                  onChange={(e) => handleNewRequestChange('reason', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Modal Actions */}
              <div className="mr-modal-actions">
                <button 
                  type="button" 
                  className="mr-btn-secondary" 
                  onClick={() => { setShowNewRequestModal(false); setEditingId(null); resetNewRequestForm(); }}
                >
                  Cancel
                </button>
                <button type="submit" className="mr-btn-primary">
                  <Check size={16} />
                  {editingId ? 'Update Request' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Request Modal */}
      {viewRequestModalOpen && viewRequestData && (
        <div className="mr-modal-overlay" onClick={() => setViewRequestModalOpen(false)}>
          <div className="mr-modal" onClick={e => e.stopPropagation()}>
            <div className="mr-modal-header">
              <h2>View Request Details</h2>
              <button className="mr-modal-close" onClick={() => setViewRequestModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="mr-modal-body">
              <div className="mr-view-grid">
                <div className="mr-view-item">
                  <span className="mr-view-label">Request ID</span>
                  <span className="mr-view-value">{viewRequestData.id}</span>
                </div>
                <div className="mr-view-item">
                  <span className="mr-view-label">Date</span>
                  <span className="mr-view-value">{viewRequestData.requestDate}</span>
                </div>
                
                <div className="mr-view-item mr-view-full-width material-highlight">
                  <span className="mr-view-label">Material Details</span>
                  <span className="mr-view-value">{viewRequestData.rmName} ({viewRequestData.rmCode})</span>
                </div>

                <div className="mr-view-item">
                  <span className="mr-view-label">Item Type</span>
                  <span className="mr-view-value">{viewRequestData.itemType}</span>
                </div>
                <div className="mr-view-item">
                  <span className="mr-view-label">Color</span>
                  <span className="mr-view-value">{viewRequestData.color || '-'}</span>
                </div>
                
                <div className="mr-view-item">
                  <span className="mr-view-label">Quantity</span>
                  <span className="mr-view-value">{viewRequestData.quantity}</span>
                </div>
                <div className="mr-view-item">
                  <span className="mr-view-label">Needed By</span>
                  <span className="mr-view-value">{viewRequestData.neededDate}</span>
                </div>

                <div className="mr-view-item">
                  <span className="mr-view-label">Priority</span>
                  <div className="mr-view-value">
                     <span className={`mr-priority-badge ${viewRequestData.priorityClass}`}>
                      {viewRequestData.priority}
                    </span>
                  </div>
                </div>
                <div className="mr-view-item">
                  <span className="mr-view-label">Status</span>
                  <div className="mr-view-value">
                    <span className={`mr-status-pill ${viewRequestData.statusClass}`}>
                      {viewRequestData.status}
                    </span>
                  </div>
                </div>

                <div className="mr-view-item mr-view-full-width">
                  <span className="mr-view-label">Reason / Usage</span>
                  <span className="mr-view-value">{viewRequestData.reason}</span>
                </div>
              </div>

              <div className="mr-modal-actions">
                <button 
                  type="button" 
                  className="mr-btn-secondary" 
                  onClick={() => setViewRequestModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialRequest;