import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, FileCheck, ClipboardList, ArrowRight, TrendingUp } from 'lucide-react';
import './Dashboard.css';
import { dashboardService, inventoryService, storeRequestService } from '../../../services/apiService';
import useAuthStore from '../../../store/authStore';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [stats, setStats] = useState({
    lowStock: 0,
    pendingIndents: 0,
    pendingRequests: 0,
    totalMaterials: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [dashRes, inventoryRes, requestsRes] = await Promise.all([
          dashboardService.getStoreDashboard(),
          inventoryService.getAllInventory(),
          storeRequestService.getAllRequests({ requestedBy: user?.userId }),
        ]);

        const dashData = dashRes.data || {};
        const inventoryData = inventoryRes.data || [];
        const requestsData = requestsRes.data || [];

        setStats({
          lowStock: dashData.lowStock || 0,
          pendingIndents: dashData.pendingIndents || 0,
          pendingRequests: dashData.pendingRequests || 0,
          totalMaterials: inventoryData.length,
        });

        setRecentRequests(requestsData.slice(0, 5));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const statCards = [
    {
      label: 'Total Materials',
      value: stats.totalMaterials,
      icon: <Package size={24} />,
      color: 'card-blue',
      path: '/store-officer/inventory',
    },
    {
      label: 'Low Stock Alerts',
      value: stats.lowStock,
      icon: <AlertTriangle size={24} />,
      color: 'card-orange',
      path: '/store-officer/low-stock',
    },
    {
      label: 'Pending Indents',
      value: stats.pendingIndents,
      icon: <FileCheck size={24} />,
      color: 'card-purple',
      path: '/store-officer/verify-indent',
    },
    {
      label: 'Material Requests',
      value: stats.pendingRequests,
      icon: <ClipboardList size={24} />,
      color: 'card-green',
      path: '/store-officer/material-request',
    },
  ];

  return (
    <div className="so-dashboard">
      {/* Header */}
      <div className="so-dash-header">
        <div>
          <h1 className="so-dash-title">Store Officer Dashboard</h1>
          <p className="so-dash-subtitle">
            Welcome back, {user?.username || 'Officer'}. Here is your overview for today.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="so-dash-loading">Loading dashboard data...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="so-stat-grid">
            {statCards.map((card, i) => (
              <div
                key={i}
                className={`so-stat-card ${card.color}`}
                onClick={() => navigate(card.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(card.path)}
              >
                <div className="so-stat-icon">{card.icon}</div>
                <div className="so-stat-body">
                  <div className="so-stat-value">{card.value}</div>
                  <div className="so-stat-label">{card.label}</div>
                </div>
                <ArrowRight size={18} className="so-stat-arrow" />
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="so-quick-actions">
            <h2 className="so-section-title">Quick Actions</h2>
            <div className="so-action-grid">
              <button className="so-action-btn" onClick={() => navigate('/store-officer/goods-inventory')}>
                <Package size={20} />
                Manage Inventory
              </button>
              <button className="so-action-btn" onClick={() => navigate('/store-officer/stock-adjustment')}>
                <TrendingUp size={20} />
                Stock Adjustment
              </button>
              <button className="so-action-btn" onClick={() => navigate('/store-officer/material-request')}>
                <ClipboardList size={20} />
                New Material Request
              </button>
              <button className="so-action-btn" onClick={() => navigate('/store-officer/verify-indent')}>
                <FileCheck size={20} />
                Verify Indents
              </button>
            </div>
          </div>

          {/* Recent Requests */}
          {recentRequests.length > 0 && (
            <div className="so-recent-section">
              <div className="so-recent-header">
                <h2 className="so-section-title">Recent Material Requests</h2>
                <button className="so-view-all" onClick={() => navigate('/store-officer/material-request')}>
                  View All <ArrowRight size={14} />
                </button>
              </div>
              <div className="so-recent-table-wrapper">
                <table className="so-recent-table">
                  <thead>
                    <tr>
                      <th>Request #</th>
                      <th>Material</th>
                      <th>Quantity</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((req, i) => (
                      <tr key={i}>
                        <td className="mono">{req.request_number}</td>
                        <td>{req.material_name}</td>
                        <td>{req.quantity} {req.unit_of_measurement}</td>
                        <td>
                          <span className={`dash-priority-badge priority-${(req.priority || 'Normal').toLowerCase()}`}>
                            {req.priority || 'Normal'}
                          </span>
                        </td>
                        <td>
                          <span className={`dash-status-badge status-${(req.status || 'Pending').toLowerCase()}`}>
                            {req.status || 'Pending'}
                          </span>
                        </td>
                        <td className="text-muted">
                          {req.request_date
                            ? new Date(req.request_date).toLocaleDateString('en-GB')
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;