import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, Edit2, Plus, X, Phone, Mail, MapPin, Building, Package, User, Trash2 } from 'lucide-react';
import '../../QMS/CustomerOrder/CustomerOrders.css';
import './SupplierManagement.css';
import { supplierService, categoryService, inventoryService } from '../../../services/apiService';

const SupplierManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [materialFilter, setMaterialFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');  
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [addFormErrors, setAddFormErrors] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});
  const [pageNotice, setPageNotice] = useState(null);
  const itemsPerPage = 5;

  const [suppliers, setSuppliers] = useState([]);

  const fetchSuppliers = async () => {
    try {
      const res = await supplierService.getAllSuppliers();
      const rows = res?.data || res || [];
      if (Array.isArray(rows)) {
        const mapped = rows.map(s => ({
          id: s.supplier_id ? `SUP-${String(s.supplier_id).padStart(3, '0')}` : (s.id || `SUP-${Math.floor(Math.random()*1000)}`),
          dbId: s.supplier_id,
          name: s.supplier_name || s.name || '',
          contactPerson: s.contact_person || s.contactPerson || '-',
          phone: s.phone || '-',
          email: s.email || '-',
          address: s.address || '-',
          category: s.category || 'Raw Materials',
          gst: s.gstin || s.gst || '-',
          status: (s.is_active || s.status === 'active') ? 'active' : 'inactive',
          rating: s.rating || 0,
          totalOrders: s.total_orders || s.totalOrders || 0,
          lastOrder: s.last_order_date || s.lastOrder || '-'
        }));
        setSuppliers(mapped);
      }
    } catch (error) {
      setPageNotice({ type: 'error', message: 'Failed to load suppliers' });
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const [categories, setCategories] = useState(['All Categories']);
  const [dbMaterials, setDbMaterials] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, invRes] = await Promise.allSettled([
          categoryService.getAllCategories(),
          inventoryService.getAllInventory({ active: 'true' })
        ]);
        if (catRes.status === 'fulfilled' && catRes.value?.data) {
          setCategories(['All Categories', ...catRes.value.data.map(c => c.category)]);
        }
        if (invRes.status === 'fulfilled' && invRes.value?.data) {
          setDbMaterials(invRes.value.data);
        }
      } catch (err) {
      }
    };
    fetchData();
  }, []);

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    category: 'Raw Materials',
    preferredMaterial: '',
    gst: ''
  });

  const clearErrorField = (setter, field) => {
    setter((prev) => {
      if (!prev || !prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const validateSupplier = (supplier) => {
    const errors = {};

    if (!supplier?.name?.trim()) errors.name = 'Supplier name is required.';
    if (!supplier?.contactPerson?.trim()) errors.contactPerson = 'Contact person is required.';
    if (!supplier?.phone?.trim()) {
      errors.phone = 'Phone number is required.';
    } else {
      const digits = supplier.phone.replace(/\D/g, '');
      if (digits.length < 10) errors.phone = 'Enter a valid phone number.';
    }

    if (supplier?.email?.trim()) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier.email.trim());
      if (!emailOk) errors.email = 'Enter a valid email address.';
    }

    if (!supplier?.category?.trim()) errors.category = 'Category is required.';

    if (supplier?.rating != null && supplier.rating !== '' && (Number.isNaN(Number(supplier.rating)) || Number(supplier.rating) < 0 || Number(supplier.rating) > 5)) {
      errors.rating = 'Rating must be between 0 and 5.';
    }

    return errors;
  };

  const showNotice = (type, message) => {
    setPageNotice({ type, message });
  };

  // Filter and search logic with sorting
  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(s => s.category === categoryFilter);
    }

    // Apply material filter
    if (materialFilter !== 'all') {
      result = result.filter(s => s.preferredMaterial === materialFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.id.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query) ||
        s.contactPerson.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.phone.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        // Handle different data types
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [suppliers, statusFilter, categoryFilter, materialFilter, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier({ ...supplier });
    setSelectedSupplier(supplier);
    setEditFormErrors({});
    setShowEditModal(true);
  };

  const handleUpdateSupplier = () => {
    const errors = validateSupplier(editingSupplier);
    setEditFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSuppliers((prev) => prev.map((s) => (s.id === editingSupplier.id ? { ...editingSupplier } : s)));
    setShowEditModal(false);
    setEditingSupplier(null);
    showNotice('success', 'Supplier updated successfully.');
  };

  const handleDeleteConfirm = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };

  const handleDeleteSupplier = () => {
    if (selectedSupplier) {
      setSuppliers(prev => prev.filter(s => s.id !== selectedSupplier.id));
      setShowDeleteModal(false);
      setSelectedSupplier(null);
      setCurrentPage(1);
      showNotice('success', 'Supplier deleted successfully.');
    }
  };

  const handleToggleStatus = (supplier) => {
    const newStatus = supplier.status === 'active' ? 'inactive' : 'active';
    setSuppliers(prev => prev.map(s => 
      s.id === supplier.id ? { ...s, status: newStatus } : s
    ));
    showNotice('success', `Supplier ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddSupplier = () => {
    const errors = validateSupplier(newSupplier);
    setAddFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const newId = `SUP-${String(suppliers.length + 1).padStart(3, '0')}`;
    const newSupplierData = {
      ...newSupplier,
      id: newId,
      status: 'active',
      rating: 0,
      totalOrders: 0,
      lastOrder: '-'
    };

    setSuppliers((prev) => [...prev, newSupplierData]);
    setNewSupplier({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      category: 'Raw Materials',
      gst: ''
    });
    setAddFormErrors({});
    setShowAddModal(false);
    showNotice('success', 'Supplier added successfully.');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setMaterialFilter('all');
    setSortField('');
    setSortDirection('asc');
    setCurrentPage(1);
    showNotice('info', 'Filters cleared.');
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  const handleExportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID,Name,Contact Person,Phone,Email,Category,Preferred Material,Status,Rating,Total Orders,Last Order\n" +
      filteredSuppliers.map(s => 
        `${s.id},${s.name},${s.contactPerson},${s.phone},${s.email},${s.category},${s.preferredMaterial || ''},${s.status},${s.rating},${s.totalOrders},${s.lastOrder}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "suppliers_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Raw Materials': { bg: '#eff6ff', color: '#3b82f6' },
      'Packaging': { bg: '#f0fdf4', color: '#16a34a' },
      'Additives': { bg: '#fef3c7', color: '#d97706' },
      'Maintenance': { bg: '#fce7f3', color: '#db2777' },
      'Consumables': { bg: '#f3e8ff', color: '#9333ea' },
      'Lab Supplies': { bg: '#ecfeff', color: '#0891b2' }
    };
    return colors[category] || { bg: '#f1f5f9', color: '#64748b' };
  };

  // Calculate overview statistics
  const overviewStats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter(s => s.status === 'active').length;
    const inactive = suppliers.filter(s => s.status === 'inactive').length;
    const categoryStats = categories.slice(1).map(cat => ({
      name: cat,
      count: suppliers.filter(s => s.category === cat).length,
      color: getCategoryColor(cat)
    }));
    const totalOrders = suppliers.reduce((sum, s) => sum + s.totalOrders, 0);
    const avgRating = suppliers.length > 0 
      ? (suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1)
      : '0.0';
    
    return {
      total,
      active,
      inactive,
      categoryStats,
      totalOrders,
      avgRating
    };
  }, [suppliers]);

  return (
    <div className="sup-container container">
      <div className="header-row">
        <h1 className="page-title">Supplier Management</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setAddFormErrors({});
            setShowAddModal(true);
          }}
          type="button"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {/* Overview Dashboard */}
      <div className="sup-overview">    
        <div className="sup-stats-row">
          <div className="sup-stat-card-main">
            <div className="sup-stat-icon total">
              <Building size={24} />
            </div>
            <div className="sup-stat-content">
              <span className="sup-stat-number">{overviewStats.total}</span>
              <span className="sup-stat-label">Total Suppliers</span>
            </div>
          </div>
          
          <div className="sup-stat-card-main">
            <div className="sup-stat-icon active">
              <User size={24} />
            </div>
            <div className="sup-stat-content">
              <span className="sup-stat-number">{overviewStats.active}</span>
              <span className="sup-stat-label">Active Suppliers</span>
            </div>
          </div>
          
          <div className="sup-stat-card-main">
            <div className="sup-stat-icon inactive">
              <User size={24} />
            </div>
            <div className="sup-stat-content">
              <span className="sup-stat-number">{overviewStats.inactive}</span>
              <span className="sup-stat-label">Inactive Suppliers</span>
            </div>
          </div>
          
          <div className="sup-stat-card-main">
            <div className="sup-stat-icon orders">
              <Package size={24} />
            </div>
            <div className="sup-stat-content">
              <span className="sup-stat-number">{overviewStats.totalOrders}</span>
              <span className="sup-stat-label">Total Orders</span>
            </div>
          </div>
        </div>
        
        <div className="sup-categories-overview">
          <div className="sup-categories-grid">
            {overviewStats.categoryStats.map((cat) => (
              <div 
                key={cat.name} 
                className={`sup-category-stat ${categoryFilter === cat.name ? 'active' : ''}`}
                onClick={() => handleCategoryFilter(cat.name)}
                style={{ cursor: 'pointer' }}
                title={`Click to filter by ${cat.name}`}
              >
                <div 
                  className="sup-category-color"
                  style={{ backgroundColor: cat.color.color }}
                ></div>
                <span className="sup-category-name">{cat.name}</span>
                <span className="sup-category-count">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sup-content card">
        {pageNotice && (
          <div className={`sup-notice sup-notice-${pageNotice.type}`} role="status">
            <span className="sup-notice-text">{pageNotice.message}</span>
            <button className="sup-notice-close" onClick={() => setPageNotice(null)} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}
        {/* Header with Search and Filters */}
        <div className="sup-toolbar filters-row">
          <div className="sup-search search-wrapper">
            <Search size={16} className="sup-search-icon search-icon" />
            <input
              type="text"
              placeholder="Search supplier name, ID, contact..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="search-input"
            />
          </div>
          <div className="sup-filters">
            <div className="sup-filter-dropdown">
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">Status: All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown size={14} className="sup-dropdown-icon" />
            </div>
            <div className="sup-filter-dropdown">
              <select 
                value={categoryFilter}
                onChange={(e) => { 
                  setCategoryFilter(e.target.value); 
                  setMaterialFilter('all');
                  setCurrentPage(1); 
                }}
              >
                <option value="all">All Categories</option>
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown size={14} className="sup-dropdown-icon" />
            </div>
            <div className="sup-filter-dropdown">
              <select 
                value={materialFilter}
                onChange={(e) => { setMaterialFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Materials</option>
                {dbMaterials
                  .filter(m => categoryFilter === 'all' || m.category === categoryFilter)
                  .map(m => (
                    <option key={m.material_id || m.material_code} value={m.material_name}>{m.material_name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="sup-dropdown-icon" />
            </div>
            <button 
              className="sup-btn-secondary sup-btn-clear" 
              onClick={handleClearFilters}
              title="Clear all filters"
            >
              Clear
            </button>
            <button 
              className="sup-btn-secondary sup-btn-export" 
              onClick={handleExportData}
              title="Export to CSV"
            >
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="sup-table-container table-responsive">
          <table className="sup-table orders-table">
            <thead>
              <tr>
                <th 
                  onClick={() => handleSort('id')}
                  className={`sortable ${sortField === 'id' ? `sorted-${sortDirection}` : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  Supplier ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('name')}
                  className={`sortable ${sortField === 'name' ? `sorted-${sortDirection}` : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  Supplier Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('contactPerson')}
                  className={`sortable ${sortField === 'contactPerson' ? `sorted-${sortDirection}` : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  Contact Person {sortField === 'contactPerson' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Phone</th>
                <th 
                  onClick={() => handleSort('category')}
                  className={`sortable ${sortField === 'category' ? `sorted-${sortDirection}` : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('preferredMaterial')}
                  className={`sortable ${sortField === 'preferredMaterial' ? `sorted-${sortDirection}` : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  Pref. Material {sortField === 'preferredMaterial' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className={`sortable ${sortField === 'status' ? `sorted-${sortDirection}` : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSuppliers.length > 0 ? (
                paginatedSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="sup-td-id">{supplier.id}</td>
                    <td className="sup-td-name">
                      <div className="sup-name-primary">{supplier.name}</div>
                      <div className="sup-name-secondary">{supplier.email}</div>
                    </td>
                    <td className="sup-td-contact">{supplier.contactPerson}</td>
                    <td className="sup-td-phone">{supplier.phone}</td>
                    <td className="sup-td-category">
                      <span 
                        className="sup-category-badge"
                        style={{ 
                          background: getCategoryColor(supplier.category).bg,
                          color: getCategoryColor(supplier.category).color 
                        }}
                      >
                        {supplier.category}
                      </span>
                    </td>
                    <td className="sup-td-material">
                      {supplier.preferredMaterial || '-'}
                    </td>
                    <td className="sup-td-status">
                      <span 
                        className={`sup-status-badge ${supplier.status === 'active' ? 'status-active' : 'status-inactive'}`}
                        onClick={() => handleToggleStatus(supplier)}
                        style={{ cursor: 'pointer' }}
                        title={`Click to ${supplier.status === 'active' ? 'deactivate' : 'activate'}`}
                      >
                        <span className="sup-status-dot"></span>
                        {supplier.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="sup-td-actions">
                      <div className="sup-actions">
                        <button
                          className="sup-action-text view"
                          onClick={() => handleViewDetails(supplier)}
                          type="button"
                        >
                          View
                        </button>
                        <button
                          className="sup-action-text edit"
                          onClick={() => handleEditSupplier(supplier)}
                          type="button"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="sup-empty empty-state">
                    <div className="sup-empty-content">
                      <Building size={40} />
                      <p className="empty-title">No suppliers found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="sup-pagination pagination-bar">
          <span className="sup-pagination-info pagination-info">
            Showing {filteredSuppliers.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredSuppliers.length)} of {filteredSuppliers.length} suppliers
          </span>
          <div className="sup-pagination-controls pagination-controls">
            <button
              className="sup-page-btn page-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              className="sup-page-btn page-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {showDetailModal && selectedSupplier && (
        <div className="sup-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="sup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sup-modal-header">
              <h3>Supplier Details</h3>
              <button className="sup-modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="sup-modal-body">
              <div className="sup-detail-header">
                <div className="sup-detail-avatar">
                  <Building size={24} />
                </div>
                <div className="sup-detail-title">
                  <h4>{selectedSupplier.name}</h4>
                  <span className="sup-detail-id">{selectedSupplier.id}</span>
                </div>
                <span className={`sup-status-badge ${selectedSupplier.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                  <span className="sup-status-dot"></span>
                  {selectedSupplier.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="sup-detail-grid">
                <div className="sup-detail-item">
                  <div className="sup-detail-icon">
                    <User size={18} />
                  </div>
                  <div className="sup-detail-content">
                    <span className="sup-detail-label">Contact Person</span>
                    <span className="sup-detail-value">{selectedSupplier.contactPerson}</span>
                  </div>
                </div>

                <div className="sup-detail-item">
                  <div className="sup-detail-icon">
                    <Phone size={18} />
                  </div>
                  <div className="sup-detail-content">
                    <span className="sup-detail-label">Phone</span>
                    <span className="sup-detail-value">{selectedSupplier.phone}</span>
                  </div>
                </div>

                <div className="sup-detail-item">
                  <div className="sup-detail-icon">
                    <Mail size={18} />
                  </div>
                  <div className="sup-detail-content">
                    <span className="sup-detail-label">Email</span>
                    <span className="sup-detail-value">{selectedSupplier.email}</span>
                  </div>
                </div>

                <div className="sup-detail-item">
                  <div className="sup-detail-icon">
                    <Package size={18} />
                  </div>
                  <div className="sup-detail-content">
                    <span className="sup-detail-label">Category</span>
                    <span 
                      className="sup-category-badge"
                      style={{ 
                        background: getCategoryColor(selectedSupplier.category).bg,
                        color: getCategoryColor(selectedSupplier.category).color 
                      }}
                    >
                      {selectedSupplier.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sup-detail-section">
                <div className="sup-detail-icon">
                  <MapPin size={18} />
                </div>
                <div className="sup-detail-content">
                  <span className="sup-detail-label">Address</span>
                  <span className="sup-detail-value">{selectedSupplier.address}</span>
                </div>
              </div>

              <div className="sup-detail-section">
                <span className="sup-detail-label">Preferred Material</span>
                <span className="sup-detail-value">{selectedSupplier.preferredMaterial || 'Not Specified'}</span>
              </div>

              <div className="sup-detail-section">
                <span className="sup-detail-label">GST Number</span>
                <span className="sup-detail-value sup-gst">{selectedSupplier.gst}</span>
              </div>

              <div className="sup-stats-grid">
                <div className="sup-stat-card">
                  <span className="sup-stat-value">{selectedSupplier.totalOrders}</span>
                  <span className="sup-stat-label">Total Orders</span>
                </div>
                <div className="sup-stat-card">
                  <span className="sup-stat-value">{selectedSupplier.rating}</span>
                  <span className="sup-stat-label">Rating</span>
                </div>
                <div className="sup-stat-card">
                  <span className="sup-stat-value">{selectedSupplier.lastOrder}</span>
                  <span className="sup-stat-label">Last Order</span>
                </div>
              </div>
            </div>
            <div className="sup-modal-footer">
              <button className="sup-btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
              <button 
                className="sup-btn-primary" 
                onClick={() => {
                  setShowDetailModal(false);
                  handleEditSupplier(selectedSupplier);
                }}
              >
                <Edit2 size={16} />
                Edit Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="sup-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="sup-modal sup-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="sup-modal-header">
              <h3>Add New Supplier</h3>
              <button className="sup-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="sup-modal-body">
              {Object.keys(addFormErrors).length > 0 && (
                <div className="sup-form-alert sup-form-alert-error">
                  Please fix the highlighted fields.
                </div>
              )}
              <div className="sup-form-grid">
                <div className="sup-form-group">
                  <label>Supplier Name *</label>
                  <input
                    type="text"
                    placeholder="Enter company name"
                    value={newSupplier.name}
                    className={addFormErrors.name ? 'sup-input-error' : ''}
                    onChange={(e) => {
                      setNewSupplier((prev) => ({ ...prev, name: e.target.value }));
                      clearErrorField(setAddFormErrors, 'name');
                    }}
                  />
                  {addFormErrors.name && <div className="sup-field-error">{addFormErrors.name}</div>}
                </div>
                <div className="sup-form-group">
                  <label>Contact Person *</label>
                  <input
                    type="text"
                    placeholder="Enter contact person name"
                    value={newSupplier.contactPerson}
                    className={addFormErrors.contactPerson ? 'sup-input-error' : ''}
                    onChange={(e) => {
                      setNewSupplier((prev) => ({ ...prev, contactPerson: e.target.value }));
                      clearErrorField(setAddFormErrors, 'contactPerson');
                    }}
                  />
                  {addFormErrors.contactPerson && <div className="sup-field-error">{addFormErrors.contactPerson}</div>}
                </div>
                <div className="sup-form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={newSupplier.phone}
                    className={addFormErrors.phone ? 'sup-input-error' : ''}
                    onChange={(e) => {
                      setNewSupplier((prev) => ({ ...prev, phone: e.target.value }));
                      clearErrorField(setAddFormErrors, 'phone');
                    }}
                  />
                  {addFormErrors.phone && <div className="sup-field-error">{addFormErrors.phone}</div>}
                </div>
                <div className="sup-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="email@company.com"
                    value={newSupplier.email}
                    className={addFormErrors.email ? 'sup-input-error' : ''}
                    onChange={(e) => {
                      setNewSupplier((prev) => ({ ...prev, email: e.target.value }));
                      clearErrorField(setAddFormErrors, 'email');
                    }}
                  />
                  {addFormErrors.email && <div className="sup-field-error">{addFormErrors.email}</div>}
                </div>
                <div className="sup-form-group">
                  <label>Category *</label>
                  <select
                    value={newSupplier.category}
                    className={addFormErrors.category ? 'sup-input-error' : ''}
                    onChange={(e) => {
                      setNewSupplier((prev) => ({ ...prev, category: e.target.value }));
                      clearErrorField(setAddFormErrors, 'category');
                    }}
                  >
                    {categories.slice(1).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {addFormErrors.category && <div className="sup-field-error">{addFormErrors.category}</div>}
                </div>
                <div className="sup-form-group">
                  <label>Preferred Material</label>
                  <select
                    value={newSupplier.preferredMaterial || ''}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, preferredMaterial: e.target.value }))}
                  >
                    <option value="">Select a material</option>
                    {dbMaterials
                      .filter(m => m.category === newSupplier.category)
                      .map(m => (
                        <option key={m.material_id || m.material_code} value={m.material_name}>{m.material_name}</option>
                      ))}
                  </select>
                </div>
                <div className="sup-form-group">
                  <label>GST Number</label>
                  <input
                    type="text"
                    placeholder="Enter GST number"
                    value={newSupplier.gst}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, gst: e.target.value }))}
                  />
                </div>
                <div className="sup-form-group sup-form-full">
                  <label>Address</label>
                  <textarea
                    placeholder="Enter complete address"
                    rows={3}
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="sup-modal-footer">
              <button className="sup-btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="sup-btn-primary" onClick={handleAddSupplier}>
                <Plus size={16} />
                Add Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && editingSupplier && (
        <div className="sup-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="sup-modal sup-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="sup-modal-header">
              <h3>Edit Supplier - {editingSupplier.id}</h3>
              <button className="sup-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="sup-modal-body">
              {Object.keys(editFormErrors).length > 0 && (
                <div className="sup-form-alert sup-form-alert-error">
                  Please fix the highlighted fields.
                </div>
              )}
              <div className="sup-form-grid">
                <div className="sup-form-group">
                  <label>Supplier Name *</label>
                  <input
                    type="text"
                    placeholder="Enter company name"
                    value={editingSupplier.name}
                    className={editFormErrors.name ? 'sup-input-error' : ''}
                    onChange={(e) => {
                      setEditingSupplier((prev) => ({ ...prev, name: e.target.value }));
                      clearErrorField(setEditFormErrors, 'name');
                    }}
                  />
                  {editFormErrors.name && <div className="sup-field-error">{editFormErrors.name}</div>}
                </div>
                <div className="sup-form-group">
                  <label>Contact Person *</label>
                  <input
                    type="text"
                    placeholder="Enter contact person name"
                    value={editingSupplier.contactPerson}
                    className={editFormErrors.contactPerson ? 'sup-input-error' : ''}
                    onChange={(e) => {
                      setEditingSupplier((prev) => ({ ...prev, contactPerson: e.target.value }));
                      clearErrorField(setEditFormErrors, 'contactPerson');
                    }}
                  />
                  {editFormErrors.contactPerson && <div className="sup-field-error">{editFormErrors.contactPerson}</div>}
                </div>
                <div className="sup-form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={editingSupplier.phone}
                    className={editFormErrors.phone ? 'sup-input-error' : ''}
                    onChange={(e) => {
                      setEditingSupplier((prev) => ({ ...prev, phone: e.target.value }));
                      clearErrorField(setEditFormErrors, 'phone');
                    }}
                  />
                  {editFormErrors.phone && <div className="sup-field-error">{editFormErrors.phone}</div>}
                </div>
                <div className="sup-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="email@company.com"
                    value={editingSupplier.email}
                    className={editFormErrors.email ? 'sup-input-error' : ''}
                    onChange={(e) => {
                      setEditingSupplier((prev) => ({ ...prev, email: e.target.value }));
                      clearErrorField(setEditFormErrors, 'email');
                    }}
                  />
                  {editFormErrors.email && <div className="sup-field-error">{editFormErrors.email}</div>}
                </div>
                <div className="sup-form-group">
                  <label>Category *</label>
                  <select
                    value={editingSupplier.category}
                    className={editFormErrors.category ? 'sup-input-error' : ''}
                    onChange={(e) => {
                      setEditingSupplier((prev) => ({ ...prev, category: e.target.value }));
                      clearErrorField(setEditFormErrors, 'category');
                    }}
                  >
                    {categories.slice(1).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {editFormErrors.category && <div className="sup-field-error">{editFormErrors.category}</div>}
                </div>
                <div className="sup-form-group">
                  <label>Preferred Material</label>
                  <select
                    value={editingSupplier.preferredMaterial || ''}
                    onChange={(e) => setEditingSupplier(prev => ({ ...prev, preferredMaterial: e.target.value }))}
                  >
                    <option value="">Select a material</option>
                    {dbMaterials
                      .filter(m => m.category === editingSupplier.category)
                      .map(m => (
                        <option key={m.material_id || m.material_code} value={m.material_name}>{m.material_name}</option>
                      ))}
                  </select>
                </div>
                <div className="sup-form-group">
                  <label>Status</label>
                  <select
                    value={editingSupplier.status}
                    onChange={(e) => setEditingSupplier(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="sup-form-group">
                  <label>GST Number</label>
                  <input
                    type="text"
                    placeholder="Enter GST number"
                    value={editingSupplier.gst}
                    onChange={(e) => setEditingSupplier(prev => ({ ...prev, gst: e.target.value }))}
                  />
                </div>
                <div className="sup-form-group">
                  <label>Rating</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    placeholder="0.0"
                    value={editingSupplier.rating}
                    className={editFormErrors.rating ? 'sup-input-error' : ''}
                    onChange={(e) => {
                      setEditingSupplier((prev) => ({ ...prev, rating: parseFloat(e.target.value) || 0 }));
                      clearErrorField(setEditFormErrors, 'rating');
                    }}
                  />
                  {editFormErrors.rating && <div className="sup-field-error">{editFormErrors.rating}</div>}
                </div>
                <div className="sup-form-group sup-form-full">
                  <label>Address</label>
                  <textarea
                    placeholder="Enter complete address"
                    rows={3}
                    value={editingSupplier.address}
                    onChange={(e) => setEditingSupplier(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="sup-modal-footer">
              <button className="sup-btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button
                className="sup-btn-danger"
                onClick={() => {
                  setShowEditModal(false);
                  handleDeleteConfirm(editingSupplier);
                }}
                type="button"
              >
                <Trash2 size={16} />
                Delete
              </button>
              <button className="sup-btn-primary" onClick={handleUpdateSupplier}>
                <Edit2 size={16} />
                Update Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSupplier && (
        <div className="sup-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="sup-modal sup-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="sup-modal-header">
              <h3>Delete Supplier</h3>
              <button className="sup-modal-close" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="sup-modal-body">
              <div className="sup-delete-content">
                <div className="sup-delete-icon">
                  <Trash2 size={48} />
                </div>
                <div className="sup-delete-message">
                  <h4>Are you sure you want to delete this supplier?</h4>
                  <p>
                    <strong>{selectedSupplier.name}</strong> ({selectedSupplier.id})
                    <br />
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="sup-modal-footer">
              <button className="sup-btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="sup-btn-danger" onClick={handleDeleteSupplier}>
                <Trash2 size={16} />
                Delete Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
