import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Eye,
  Filter,
  Calendar,
  Package
} from 'lucide-react';
import './CustomerOrders.css';

const CustomerOrders = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data
  const stats = [
    { label: 'OPEN ORDERS', count: '08', bgColor: '#e0f2fe' },
    { label: 'PENDING ADMIN APPROVAL', count: '03', bgColor: '#dbeafe' },
    { label: 'TODAY', count: '02', bgColor: '#e0e7ff' }
  ];

  const orders = [
    {
      orderId: 'ORD-2025-001',
      indentId: 'IND-2025-001',
      createdDate: 'Created on 25 Jan 2025',
      status: 'Draft (QMS)',
      statusColor: '#64748b',
      customerName: 'TechSol Industries',
      customerContact: '+91 98450 11223',
      customerEmail: 'sales@techsol.in',
      components: 'SS 304 Sheet 2mm',
      componentDesc: 'Laser cut panels for ...',
      items: 2,
      priority: 'Urgent',
      priorityColor: '#f97316'
    },
    {
      orderId: 'ORD-2025-002',
      indentId: 'IND-2025-002',
      createdDate: 'Created on 25 Jan 2025',
      status: 'Sent to Store',
      statusColor: '#f97316',
      customerName: 'Global Motors Pvt Ltd',
      customerContact: '+91 98620 77445',
      customerEmail: 'purchase@globalmotors.com',
      components: 'Aluminium Angle 5...',
      componentDesc: 'Frame brackets for C...',
      items: 1,
      priority: 'Standard',
      priorityColor: '#3b82f6'
    },
    {
      orderId: 'ORD-2025-003',
      indentId: 'IND-2025-003',
      createdDate: 'Created on 24 Jan 2025',
      status: 'Approved',
      statusColor: '#10b981',
      customerName: 'Apex Engineering',
      customerContact: '+91 90260 33881',
      customerEmail: 'materials@apex.in',
      components: 'MS Plates & Hard...',
      componentDesc: 'Base plates, bolts an...',
      items: 4,
      priority: 'Standard',
      priorityColor: '#10b981'
    }
  ];

  const filters = ['All', 'Status: Open', 'Priority: Urgent', 'My Orders'];

  const handleAddOrder = () => {
    console.log('Add new customer order');
  };

  const handleViewIndent = (orderId) => {
    console.log('View indent for order:', orderId);
  };

  const getStatusColor = (status) => {
    if (status.includes('Draft')) return '#64748b';
    if (status.includes('Sent')) return '#f97316';
    if (status.includes('Approved')) return '#10b981';
    return '#3b82f6';
  };

  return (
    <div className="customer-orders-container">
      {/* Header Section */}
      <div className="orders-header">
        <h1 className="page-title">Customer Orders</h1>
        <button className="add-order-btn" onClick={handleAddOrder}>
          <Plus size={20} />
          Add Customer Order
        </button>
      </div>

      {/* Filter Tabs and Search */}
      <div className="filters-section">
        <div className="filter-tabs">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by customer, order or indent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="stat-card"
            style={{ backgroundColor: stat.bgColor }}
          >
            <div className="stat-label">{stat.label}</div>
            <div className="stat-count">{stat.count}</div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        <div className="table-header">
          <Package size={20} />
          <span className="table-title">Customer Order List</span>
        </div>

        <div className="orders-table">
          {/* Table Header */}
          <div className="table-row table-head">
            <div className="table-cell order-id-cell">
              <span>Order ID / Date</span>
            </div>
            <div className="table-cell indent-id-cell">
              <span>Indent ID</span>
            </div>
            <div className="table-cell customer-cell">
              <span>Customer Details</span>
            </div>
            <div className="table-cell components-cell">
              <span>Components Requested</span>
            </div>
            <div className="table-cell items-cell">
              <span>Items</span>
            </div>
            <div className="table-cell priority-cell">
              <span>Priority</span>
            </div>
            <div className="table-cell action-cell">
              <span>Action</span>
            </div>
          </div>

          {/* Table Body */}
          {orders.map((order, index) => (
            <div key={index} className="table-row table-body-row">
              <div className="table-cell order-id-cell">
                <div className="order-id-content">
                  <span className="order-id">{order.orderId}</span>
                  <span className="order-date">{order.createdDate}</span>
                </div>
              </div>

              <div className="table-cell indent-id-cell">
                <div className="indent-content">
                  <span className="indent-id">{order.indentId}</span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: order.statusColor }}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="table-cell customer-cell">
                <div className="customer-content">
                  <span className="customer-name">{order.customerName}</span>
                  <span className="customer-contact">{order.customerContact}</span>
                  <span className="customer-email">{order.customerEmail}</span>
                </div>
              </div>

              <div className="table-cell components-cell">
                <div className="components-content">
                  <span className="component-name">{order.components}</span>
                  <span className="component-desc">{order.componentDesc}</span>
                </div>
              </div>

              <div className="table-cell items-cell">
                <span className="items-count">{order.items}</span>
              </div>

              <div className="table-cell priority-cell">
                <span 
                  className="priority-badge"
                  style={{ 
                    backgroundColor: order.priorityColor + '15',
                    color: order.priorityColor,
                    borderColor: order.priorityColor + '30'
                  }}
                >
                  {order.priority}
                </span>
              </div>

              <div className="table-cell action-cell">
                <button 
                  className="view-indent-btn"
                  onClick={() => handleViewIndent(order.orderId)}
                >
                  View Indent
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerOrders;