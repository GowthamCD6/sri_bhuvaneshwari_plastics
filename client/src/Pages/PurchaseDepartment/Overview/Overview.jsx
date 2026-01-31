import React, { useState } from 'react';
import { 
  Package, 
  FileText, 
  Truck, 
  Eye,
  Plus,
  ChevronRight,
  Clock
} from 'lucide-react';
import './Overview.css';

const Overview = () => {
  // Stats data
  const stats = [
    {
      id: 1,
      title: 'Pending Store Requests',
      value: 12,
      subtitle: 'Require immediate attention',
      icon: Package,
      color: 'red'
    },
    {
      id: 2,
      title: 'QMS Indents',
      value: '05',
      subtitle: 'Waiting for PO creation',
      icon: FileText,
      color: 'blue'
    },
    {
      id: 3,
      title: 'Active Purchase Orders',
      value: 28,
      subtitle: '4 deliveries expected today',
      icon: Truck,
      color: 'green'
    }
  ];

  // Material requests from store officer
  const [storeRequests] = useState([
    {
      id: 'REQ-2024-089',
      material: 'Polypropylene Granules (Red)',
      materialCode: 'RM-004-RED',
      quantity: '500 kg',
      reason: 'Low Stock Alert',
      priority: 'Critical'
    },
    {
      id: 'REQ-2024-092',
      material: 'Packaging Box Type B',
      materialCode: 'PKG-BOX-B',
      quantity: '2000 Units',
      reason: 'Upcoming Production',
      priority: 'High'
    },
    {
      id: 'REQ-2024-095',
      material: 'Machine Oil (Hydraulic)',
      materialCode: 'MNT-OIL-22',
      quantity: '50 Liters',
      reason: 'Maintenance',
      priority: 'Normal'
    }
  ]);

  // Pending indents from QMS
  const [qmsIndents] = useState([
    {
      id: 'IND-QMS-402',
      customerOrderRef: 'PO-CUST-8821',
      customerName: 'Saravana Plastics',
      components: '4 Items',
      dateRaised: 'Oct 12, 2024',
      status: 'Verified'
    },
    {
      id: 'IND-QMS-405',
      customerOrderRef: 'PO-CUST-8824',
      customerName: 'Metro Polymers',
      components: '2 Items',
      dateRaised: 'Oct 14, 2024',
      status: 'Pending Info'
    }
  ]);

  const getPriorityClass = (priority) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'priority-critical';
      case 'high':
        return 'priority-high';
      case 'normal':
        return 'priority-normal';
      default:
        return 'priority-normal';
    }
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'status-verified';
      case 'pending info':
        return 'status-pending';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="po-overview-container">
      {/* Stats Cards */}
      <div className="po-stats-grid">
        {stats.map((stat) => (
          <div key={stat.id} className={`po-stat-card po-stat-${stat.color}`}>
            <div className="po-stat-content">
              <span className="po-stat-title">{stat.title}</span>
              <div className={`po-stat-icon po-icon-${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="po-stat-value">{stat.value}</div>
            <div className="po-stat-subtitle">{stat.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Material Requests from Store Officer */}
      <div className="po-section">
        <div className="po-section-header">
          <div className="po-section-title-row">
            <Package size={18} className="po-section-icon" />
            <h2 className="po-section-title">Material Requests from Store Officer</h2>
            <span className="po-new-badge">3 New</span>
          </div>
          <button className="po-link-btn">
            View All Requests
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="po-table-container">
          <table className="po-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Material / Component</th>
                <th>Requested Qty</th>
                <th>Reason</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {storeRequests.map((request) => (
                <tr key={request.id}>
                  <td className="po-cell-id">{request.id}</td>
                  <td>
                    <div className="po-material-info">
                      <span className="po-material-name">{request.material}</span>
                      <span className="po-material-code">{request.materialCode}</span>
                    </div>
                  </td>
                  <td>{request.quantity}</td>
                  <td>{request.reason}</td>
                  <td>
                    <span className={`po-priority-badge ${getPriorityClass(request.priority)}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td>
                    <button className="po-action-btn po-btn-create">
                      <Plus size={14} />
                      Create Indent
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Indents from QMS */}
      <div className="po-section">
        <div className="po-section-header">
          <div className="po-section-title-row">
            <FileText size={18} className="po-section-icon" />
            <h2 className="po-section-title">Pending Indents from QMS</h2>
          </div>
          <button className="po-link-btn">
            View History
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="po-table-container">
          <table className="po-table">
            <thead>
              <tr>
                <th>Indent No.</th>
                <th>Customer Order Ref</th>
                <th>Components</th>
                <th>Date Raised</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {qmsIndents.map((indent) => (
                <tr key={indent.id}>
                  <td className="po-cell-id">{indent.id}</td>
                  <td>
                    <div className="po-material-info">
                      <span className="po-material-name">{indent.customerOrderRef}</span>
                      <span className="po-material-code">{indent.customerName}</span>
                    </div>
                  </td>
                  <td>{indent.components}</td>
                  <td>{indent.dateRaised}</td>
                  <td>
                    <span className={`po-status-badge ${getStatusClass(indent.status)}`}>
                      {indent.status}
                    </span>
                  </td>
                  <td>
                    <button className="po-view-details-btn">
                      <Eye size={14} />
                      View Details
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

export default Overview;
