import React from 'react';
import './CustomerOrders.css'; // Import the standard CSS file

// Icons
const Icons = {
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  List: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
  )
};

const CustomerOrders = () => {
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
      customerContact: "+91 98450 11223 · sales@techsol.com",
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
      customerContact: "+91 99620 77445 · purchase@globalmotors.com",
      component: "Aluminium Angle 50x50",
      componentDesc: "Frame brackets for G...",
      items: 1,
      priority: "Standard",
      priorityClass: "badge-standard-blue",
    },
    {
      id: "ORD-2025-003",
      date: "Created on 24 Jan 2025",
      indentId: "IND-2025-003",
      indentStatus: "Approved",
      indentStatusClass: "badge-approved",
      customerName: "Apex Engineering",
      customerContact: "+91 90250 33881 · materials@apexeng.in",
      component: "MS Plates & Hardware",
      componentDesc: "Base plates, bolts and...",
      items: 4,
      priority: "Standard",
      priorityClass: "badge-standard-green",
    },
  ];

  return (
    <div className="container">
      
      {/* Top Header */}
      <div className="header-row">
        <h1 className="page-title">Customer Orders</h1>
        <button className="btn-primary">
          <Icons.Plus />
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
            <Icons.Search />
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
               <Icons.List />
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
                    <div className="text-main">{order.indentId}</div>
                    <span className={`badge ${order.indentStatusClass}`}>
                      {order.indentStatus}
                    </span>
                  </td>

                  {/* Customer Details */}
                  <td>
                    <div className="text-main">{order.customerName}</div>
                    <div className="text-sub" title={order.customerContact}>
                      {order.customerContact}
                    </div>
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
    </div>
  );
};

export default CustomerOrders;