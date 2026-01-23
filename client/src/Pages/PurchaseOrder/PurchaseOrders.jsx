import { FileText, CheckCircle2, Truck, Clock, MoreHorizontal, Filter, Download, Plus } from 'lucide-react';
import './PurchaseOrders.css';

const PurchaseOrders = () => {
  const stats = [
    { title: 'Pending Approval', value: '8', subtitle: 'Same as yesterday', icon: Clock },
    { title: 'In Transit', value: '15', subtitle: 'Expected this week', icon: Truck },
    { title: 'Completed this Month', value: '142', subtitle: '', icon: CheckCircle2 },
    { title: 'Avg. Delivery Time', value: '5.2 days', subtitle: '', icon: Clock },
  ];

  const recentOrders = [
    {
      id: 'PO-2025-128',
      requester: { name: 'Priya Sharma', avatar: 'P' },
      supplier: 'ABC Steels Pvt Ltd',
      date: 'Jan 24, 2025',
      priority: 'high',
      priorityText: 'High',
      amount: '₹2,45,000',
      status: 'pending',
      statusText: 'Pending',
      action: 'Review'
    },
    {
      id: 'PO-2025-127',
      requester: { name: 'Amit Patel', avatar: 'A' },
      supplier: 'Metro Metals',
      date: 'Jan 23, 2025',
      priority: 'medium',
      priorityText: 'Medium',
      amount: '₹1,89,500',
      status: 'approved',
      statusText: 'Approved',
      action: 'View'
    },
    {
      id: 'PO-2025-126',
      requester: { name: 'Vikram Singh', avatar: 'V' },
      supplier: 'Universal Castings',
      date: 'Jan 22, 2025',
      priority: 'low',
      priorityText: 'Low',
      amount: '₹3,12,000',
      status: 'draft',
      statusText: 'Draft',
      action: 'Edit'
    },
    {
      id: 'PO-2025-125',
      requester: { name: 'Anjali Gupta', avatar: 'A' },
      supplier: 'Quality Supplies Co',
      date: 'Jan 22, 2025',
      priority: 'medium',
      priorityText: 'Medium',
      amount: '₹95,000',
      status: 'approved',
      statusText: 'Approved',
      action: 'View'
    },
    {
      id: 'PO-2025-124',
      requester: { name: 'Ramesh Iyer', avatar: 'R' },
      supplier: 'Prime Materials',
      date: 'Jan 21, 2025',
      priority: 'high',
      priorityText: 'High',
      amount: '₹1,67,500',
      status: 'pending',
      statusText: 'Pending',
      action: 'Review'
    },
  ];

  return (
    <div className="purchase-orders-page">
      {/* Header */}
      <div className="po-header">
        <div className="po-header-top">
          <div className="po-header-left">
            <h1>Purchase Orders</h1>
            <p>Real-time overview of purchase orders and deliveries.</p>
          </div>
          <div className="po-header-actions">
            <button className="po-btn po-btn-export">
              <Download size={18} />
              Export Report
            </button>
            <button className="po-btn po-btn-primary">
              <Plus size={18} />
              New Order
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="po-stats-grid">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="po-stat-card">
                <div className="po-stat-header">
                  <span className="po-stat-title">{stat.title}</span>
                  <Icon className="po-stat-icon" size={20} />
                </div>
                <div className="po-stat-value">{stat.value}</div>
                {stat.subtitle && (
                  <div className="po-stat-subtitle same">{stat.subtitle}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="po-main-content">
        {/* Recent Orders */}
        <div className="po-content-full">
          <div className="po-section-header">
            <h2 className="po-section-title">Recent Orders</h2>
            <div className="po-section-actions">
              <button className="po-btn-filter">
                <Filter size={16} />
                Filter
              </button>
              <button className="po-btn-view-all">View All</button>
            </div>
          </div>

          <table className="po-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" className="po-checkbox" />
                </th>
                <th>Order ID</th>
                <th>Requester</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <input type="checkbox" className="po-checkbox" />
                  </td>
                  <td className="po-order-id">{order.id}</td>
                  <td>
                    <div className="po-requester-cell">
                      <div className="po-requester-avatar">
                        {order.requester.avatar}
                      </div>
                      <span className="po-requester-name">{order.requester.name}</span>
                    </div>
                  </td>
                  <td className="po-supplier">{order.supplier}</td>
                  <td className="po-date">{order.date}</td>
                  <td>
                    <span className={`po-priority po-priority-${order.priority}`}>
                      <span className="po-priority-dot"></span>
                      {order.priorityText}
                    </span>
                  </td>
                  <td>
                    <span className={`po-status-badge po-status-${order.status}`}>
                      {order.statusText}
                    </span>
                  </td>
                  <td className="po-actions">{order.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrders;
