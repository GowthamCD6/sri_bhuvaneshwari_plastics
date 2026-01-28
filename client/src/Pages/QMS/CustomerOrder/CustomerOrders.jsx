import React, { useState } from 'react';
import { Plus, Search, List } from 'lucide-react';
import './CustomerOrders.css'; // Import the standard CSS file
import NewOrderModal from './Add-New-Customer/NewOrderModal';

const CustomerOrders = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  // Mock Data
  const orders = [
    {
      id: "ORD-2025-001",
      date: "Created on 25 Jan 2025",
      indentId: "IND-2025-001",
      indentStatus: "Draft (QMS)",
      // Use CSS class names for styling logic
      indentStatusClass: "badge-draft",
      customerName: "TechSol Industries",
      customerPhone: "+91 98450 11223",
      customerEmail: "sales@techsol.in",
      component: "SS 304 Sheet 2mm",
      componentDesc: "Laser cut panels for enclosure",
      items: 2,
      priority: "Urgent",
      priorityClass: "badge-urgent",
    },
    {
      id: "ORD-2025-002",
      date: "Created on 25 Jan 2025",
      indentId: "IND-2025-002",
      indentStatus: "Sent to Store",
      indentStatusClass: "badge-orange",
      customerName: "Global Motors Pvt Ltd",
      customerPhone: "+91 99620 77445",
      customerEmail: "purchase@globalmotors.com",
      component: "Aluminium Angle 50x50",
      componentDesc: "Frame brackets for G...",
      items: 1,
      priority: "Standard",
      priorityClass: "badge-standard",
    },
    {
      id: "ORD-2025-003",
      date: "Created on 24 Jan 2025",
      indentId: "IND-2025-003",
      indentStatus: "Approved",
      indentStatusClass: "badge-approved",
      customerName: "Apex Engineering",
      customerPhone: "+91 90250 33881",
      customerEmail: "materials@apexeng.in",
      component: "MS Plates & Hardware",
      componentDesc: "Base plates, bolts and...",
      items: 4,
      priority: "Standard",
      priorityClass: "badge-standard",
    },
  ];

  return (
    <div className="container">
      
      {/* Top Header */}
      <div className="header-row">
        <h1 className="page-title">Customer Orders</h1>
        <button className="btn-primary" onClick={handleOpenModal}>
          <Plus size={16} />
          Add Customer Order
        </button>
      </div>

      {/* Filters & Search */}
      <div className="filters-row">
        <div className="tabs">
          <button className="tab-btn active">All</button>
          <button className="tab-btn">Status: Open</button>
          <button className="tab-btn">Priority: Urgent</button>
          <button className="tab-btn">My Orders</button>
        </div>

        <div className="search-wrapper">
          <div className="search-icon">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search by customer, order or indent..." 
            className="search-input"
          />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="card">
        
        {/* Card Header & Stats */}
        <div className="card-header">
          <div className="card-title-group">
            <div className="icon-box">
               <List size={20} color="#2563eb" />
            </div>
            <h2 className="card-title">Customer Order List</h2>
          </div>

          <div className="stats-container">
            <div className="stat-box">
              <div className="stat-label">OPEN ORDERS</div>
              <div className="stat-value">08</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">PENDING ADMIN<br/>APPROVAL</div>
              <div className="stat-value">03</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">TODAY</div>
              <div className="stat-value">02</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID / Date</th>
                <th>Indent ID</th>
                <th>Customer Details</th>
                <th>Components Requested</th>
                <th>Items</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index}>
                  {/* Order ID & Date */}
                  <td>
                    <div className="text-main">{order.id}</div>
                    <div className="text-sub">{order.date}</div>
                  </td>

                  {/* Indent ID & Status */}
                  <td>
                    <div className="indent-cell">
                      <div className="text-main">{order.indentId}</div>
                      <span className={`badge ${order.indentStatusClass}`}>
                        {order.indentStatus}
                      </span>
                    </div>
                  </td>

                  {/* Customer Details */}
                  <td>
                    <div className="text-main">{order.customerName}</div>
                    <div className="text-sub">{order.customerPhone}</div>
                    <div className="text-sub">{order.customerEmail}</div>
                  </td>

                  {/* Components */}
                  <td>
                    <div className="text-main">{order.component}</div>
                    <div className="text-sub">{order.componentDesc}</div>
                  </td>

                  {/* Items Count */}
                  <td>
                    <div className="text-main">{order.items}</div>
                  </td>

                  {/* Priority */}
                  <td>
                    <span className={`badge ${order.priorityClass}`}>
                      {order.priority}
                    </span>
                  </td>

                  {/* Action Link */}
                  <td>
                    <button className="action-link">
                      View Indent
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Order Modal */}
      {isModalOpen && <NewOrderModal onClose={handleCloseModal} />}
    </div>
  );
};

export default CustomerOrders;