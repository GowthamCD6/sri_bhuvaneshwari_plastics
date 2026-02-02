import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Eye, Edit2, Plus, X, Phone, Mail, MapPin, Building, Package, User, Trash2 } from 'lucide-react';
import './Suppliers.css';

const Suppliers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const itemsPerPage = 5;

  const [suppliers, setSuppliers] = useState([
    {
      id: 'SUP-001',
      name: 'Reliance Polymers Ltd',
      contactPerson: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      email: 'rajesh@reliancepolymers.com',
      address: '45, Industrial Area, Chennai - 600032',
      category: 'Raw Materials',
      gst: '33AABCT1234A1Z5',
      status: 'active',
      rating: 4.5,
      totalOrders: 156,
      lastOrder: 'Oct 20, 2024'
    },
    {
      id: 'SUP-002',
      name: 'Chennai Packaging Solutions',
      contactPerson: 'Priya Sharma',
      phone: '+91 87654 32109',
      email: 'priya@chennaipack.com',
      address: '78, Ambattur Industrial Estate, Chennai - 600058',
      category: 'Packaging',
      gst: '33AABCP5678B2Z6',
      status: 'active',
      rating: 4.2,
      totalOrders: 89,
      lastOrder: 'Oct 22, 2024'
    },
    {
      id: 'SUP-003',
      name: 'Metro Chemicals Pvt Ltd',
      contactPerson: 'Suresh Menon',
      phone: '+91 76543 21098',
      email: 'suresh@metrochemicals.in',
      address: '23, SIPCOT Industrial Park, Hosur - 635126',
      category: 'Additives',
      gst: '33AABCM9012C3Z7',
      status: 'active',
      rating: 4.0,
      totalOrders: 67,
      lastOrder: 'Oct 18, 2024'
    },
    {
      id: 'SUP-004',
      name: 'Southern Lubricants Co',
      contactPerson: 'Anand Krishnan',
      phone: '+91 65432 10987',
      email: 'anand@southernlube.com',
      address: '12, Industrial Complex, Coimbatore - 641014',
      category: 'Maintenance',
      gst: '33AABCS3456D4Z8',
      status: 'inactive',
      rating: 3.8,
      totalOrders: 34,
      lastOrder: 'Sep 15, 2024'
    },
    {
      id: 'SUP-005',
      name: 'Prime Plastics Industries',
      contactPerson: 'Deepak Nair',
      phone: '+91 54321 09876',
      email: 'deepak@primeplastics.in',
      address: '56, Guindy Industrial Estate, Chennai - 600032',
      category: 'Raw Materials',
      gst: '33AABCP7890E5Z9',
      status: 'active',
      rating: 4.7,
      totalOrders: 203,
      lastOrder: 'Oct 24, 2024'
    },
    {
      id: 'SUP-006',
      name: 'SafetyFirst Equipments',
      contactPerson: 'Kavitha Rajan',
      phone: '+91 43210 98765',
      email: 'kavitha@safetyfirst.co.in',
      address: '34, Anna Salai, Chennai - 600002',
      category: 'Consumables',
      gst: '33AABCS1234F6Z0',
      status: 'active',
      rating: 4.3,
      totalOrders: 78,
      lastOrder: 'Oct 21, 2024'
    },
    {
      id: 'SUP-007',
      name: 'Lab Solutions India',
      contactPerson: 'Dr. Ramesh Iyer',
      phone: '+91 32109 87654',
      email: 'ramesh@labsolutions.in',
      address: '89, Tech Park, Bangalore - 560100',
      category: 'Lab Supplies',
      gst: '29AABCL5678G7Z1',
      status: 'active',
      rating: 4.6,
      totalOrders: 45,
      lastOrder: 'Oct 19, 2024'
    },
    {
      id: 'SUP-008',
      name: 'Bharat Colorants',
      contactPerson: 'Manoj Pillai',
      phone: '+91 21098 76543',
      email: 'manoj@bharatcolor.com',
      address: '67, Industrial Zone, Hyderabad - 500032',
      category: 'Additives',
      gst: '36AABCB9012H8Z2',
      status: 'inactive',
      rating: 3.5,
      totalOrders: 23,
      lastOrder: 'Aug 10, 2024'
    },
    {
      id: 'SUP-009',
      name: 'TechPack Industries',
      contactPerson: 'Sanjay Gupta',
      phone: '+91 10987 65432',
      email: 'sanjay@techpack.in',
      address: '45, Noida Industrial Area, Noida - 201301',
      category: 'Packaging',
      gst: '09AABCT3456I9Z3',
      status: 'active',
      rating: 4.1,
      totalOrders: 112,
      lastOrder: 'Oct 23, 2024'
    },
    {
      id: 'SUP-010',
      name: 'Universal Polymers',
      contactPerson: 'Vikram Singh',
      phone: '+91 09876 54321',
      email: 'vikram@universalpoly.com',
      address: '90, Sector 18, Gurugram - 122015',
      category: 'Raw Materials',
      gst: '06AABCU7890J0Z4',
      status: 'active',
      rating: 4.4,
      totalOrders: 178,
      lastOrder: 'Oct 24, 2024'
    }
  ]);

  const categories = ['All Categories', 'Raw Materials', 'Packaging', 'Additives', 'Maintenance', 'Consumables', 'Lab Supplies'];

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    category: 'Raw Materials',
    gst: ''
  });

  // Filter and search logic
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

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.id.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query) ||
        s.contactPerson.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [suppliers, statusFilter, categoryFilter, searchQuery]);

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

  const handleAddSupplier = () => {
    if (newSupplier.name && newSupplier.contactPerson && newSupplier.phone) {
      const newId = `SUP-${String(suppliers.length + 1).padStart(3, '0')}`;
      setSuppliers(prev => [...prev, {
        ...newSupplier,
        id: newId,
        status: 'active',
        rating: 0,
        totalOrders: 0,
        lastOrder: '-'
      }]);
      setNewSupplier({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        category: 'Raw Materials',
        gst: ''
      });
      setShowAddModal(false);
    }
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

  return (
    <div className="sup-container">
      <div className="sup-content">
        {/* Header with Search and Filters */}
        <div className="sup-toolbar">
          <div className="sup-search">
            <Search size={16} className="sup-search-icon" />
            <input
              type="text"
              placeholder="Search supplier name, ID, contact..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Categories</option>
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown size={14} className="sup-dropdown-icon" />
            </div>
            <button className="sup-btn-add" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add Supplier
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="sup-table-container">
          <table className="sup-table">
            <thead>
              <tr>
                <th>Supplier ID</th>
                <th>Supplier Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Category</th>
                <th>Status</th>
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
                    <td className="sup-td-status">
                      <span className={`sup-status-badge ${supplier.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                        <span className="sup-status-dot"></span>
                        {supplier.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="sup-td-actions">
                      <div className="sup-actions">
                        <button 
                          className="sup-btn-action"
                          onClick={() => handleViewDetails(supplier)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="sup-btn-action"
                          title="Edit Supplier"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="sup-empty">
                    <div className="sup-empty-content">
                      <Building size={40} />
                      <p>No suppliers found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="sup-pagination">
          <span className="sup-pagination-info">
            Showing {filteredSuppliers.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredSuppliers.length)} of {filteredSuppliers.length} suppliers
          </span>
          <div className="sup-pagination-controls">
            <button
              className="sup-page-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              className="sup-page-btn"
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
              <button className="sup-btn-primary">
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
              <div className="sup-form-grid">
                <div className="sup-form-group">
                  <label>Supplier Name *</label>
                  <input
                    type="text"
                    placeholder="Enter company name"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="sup-form-group">
                  <label>Contact Person *</label>
                  <input
                    type="text"
                    placeholder="Enter contact person name"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
                  />
                </div>
                <div className="sup-form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="sup-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="email@company.com"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="sup-form-group">
                  <label>Category *</label>
                  <select
                    value={newSupplier.category}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.slice(1).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
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
    </div>
  );
};

export default Suppliers;
