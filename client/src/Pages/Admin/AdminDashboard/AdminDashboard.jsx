import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { dashboardService, purchaseIndentService } from '../../../services/apiService';

// SVG Icons
const Icons = {
  Bell: () => (
    <svg className="icon-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  File: () => (
    <svg className="icon-file" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  ),
  Users: () => (
    <svg className="icon-users" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  Dollar: () => (
    <svg className="icon-dollar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  ),
  Server: () => (
    <svg className="icon-server" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
      <line x1="6" y1="6" x2="6.01" y2="6"></line>
      <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
  ),
  ArrowUp: () => (
    <svg className="icon-arrow-up" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"></line>
      <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
  ),
  Check: () => (
    <svg className="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  Alert: () => (
    <svg className="icon-alert" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  )
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [showAllPending, setShowAllPending] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    users: 0,
    pendingIndents: 0,
    activeSuppliers: 0
  });
  const [pendingIndents, setPendingIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const [dashRes, pendingRes] = await Promise.all([
          dashboardService.getAdminDashboard(),
          purchaseIndentService.getAllIndents({ status: 'Pending Admin Approval' })
        ]);

        if (dashRes?.success && dashRes.data) {
          setDashboardData({
            users: Number(dashRes.data.users || 0),
            pendingIndents: Number(dashRes.data.pendingIndents || 0),
            activeSuppliers: Number(dashRes.data.activeSuppliers || 0)
          });
        }

        if (pendingRes?.success && Array.isArray(pendingRes.data)) {
          setPendingIndents(pendingRes.data);
        } else {
          setPendingIndents([]);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const stats = useMemo(() => {
    return [
      {
        label: 'Pending Admin Approvals',
        value: String(dashboardData.pendingIndents ?? 0),
        icon: <Icons.File />,
        meta: { text: 'Action required', type: 'warning', icon: <Icons.Alert /> }
      },
      {
        label: 'Total Users',
        value: String(dashboardData.users ?? 0),
        icon: <Icons.Users />,
        meta: { text: 'Registered users', type: 'success', icon: <Icons.Check /> }
      },
      {
        label: 'Active Suppliers',
        value: String(dashboardData.activeSuppliers ?? 0),
        icon: <Icons.Dollar />,
        meta: { text: 'Suppliers available', type: 'healthy', icon: <Icons.Check /> }
      },
      {
        label: 'System Status',
        value: 'Operational',
        icon: <Icons.Server />,
        isStatus: true,
        latency: loading ? 'Loading…' : 'Live'
      }
    ];
  }, [dashboardData, loading]);

  const mappedPendingIndents = useMemo(() => {
    return pendingIndents.map((indent) => {
      const materials = Array.isArray(indent.materials) ? indent.materials : [];
      const first = materials[0];
      const materialName = first?.material_description || 'Materials';
      const qtyText = first?.quantity
        ? `Qty: ${first.quantity}${first.unit_of_measurement || ''}`
        : 'Qty: -';

      const urgency = indent.priority === 'Urgent'
        ? 'Critical'
        : indent.priority === 'High'
          ? 'High'
          : 'Normal';

      return {
        indentId: indent.indent_id,
        id: indent.indent_number,
        material: materialName,
        qty: qtyText,
        requestedBy: indent.requested_by_name || indent.customer_name || 'N/A',
        department: indent.workflow_stage || 'Admin',
        urgency,
        urgencyClass: urgency.toLowerCase() === 'critical' || urgency.toLowerCase() === 'high' ? 'high' : 'normal'
      };
    });
  }, [pendingIndents]);

  const displayedIndents = showAllPending ? mappedPendingIndents : mappedPendingIndents.slice(0, 3);

  const recentActivity = useMemo(() => {
    const toInitials = (name) => {
      const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return 'NA';
      return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
    };

    const formatTime = (dateValue) => {
      if (!dateValue) return '-';
      const d = new Date(dateValue);
      if (Number.isNaN(d.getTime())) return '-';
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    // Use real pending indents as “recent” items (no dummy content)
    return (pendingIndents || []).slice(0, 3).map((indent, idx) => {
      const userName = indent.requested_by_name || indent.customer_name || 'N/A';
      return {
        time: formatTime(indent.created_at || indent.updated_at || indent.request_date),
        user: userName,
        initial: toInitials(userName),
        avatarColor: idx % 3 === 0 ? 'blue' : idx % 3 === 1 ? 'yellow' : 'green',
        activity: `Pending Admin Approval: ${indent.indent_number}`,
        module: 'Purchase Indents'
      };
    });
  }, [pendingIndents]);

  const handleReviewIndent = (indentId) => {
    if (!indentId) return;
    navigate('/admin-purchase-indents', {
      state: {
        indentId,
        isViewMode: true
      }
    });
  };

  return (
    <div className="ad-container">
      {/* Header */}
      <div className="ad-header">
        <h1 className="ad-title">Admin Dashboard</h1>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', margin: '12px 0', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="ad-stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="ad-stat-card">
            <div className="ad-stat-header">
              <p className="ad-stat-label">{stat.label}</p>
              <div className="ad-stat-icon">{stat.icon}</div>
            </div>
            {stat.isStatus ? (
              <>
                <p className="ad-stat-status">{stat.value}</p>
                <p className="ad-stat-latency">{stat.latency}</p>
              </>
            ) : (
              <>
                <h2 className="ad-stat-value">{stat.value}</h2>
                <div className={`ad-stat-meta ${stat.meta.type}`}>
                  {stat.meta.icon}
                  <span>{stat.meta.text}</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Pending QMS Indent Approvals */}
      <div className="ad-section-header">
        <h2 className="ad-section-title">Pending QMS Indent Approvals</h2>
        <button 
          className="ad-view-all-btn"
          onClick={() => setShowAllPending(!showAllPending)}
        >
          {showAllPending ? 'Show Less' : 'View All Pending'}
        </button>
      </div>

      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Indent ID</th>
              <th>Requested Material</th>
              <th>Requested By</th>
              <th>Department</th>
              <th>Urgency</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedIndents.map((indent, idx) => (
              <tr key={idx}>
                <td>
                  <span className="ad-indent-id">{indent.id}</span>
                </td>
                <td>
                  <div>
                    <p className="ad-material-name">{indent.material}</p>
                    <p className="ad-material-qty">{indent.qty}</p>
                  </div>
                </td>
                <td>
                  <span className="ad-user-name">{indent.requestedBy}</span>
                </td>
                <td>
                  <span className="ad-user-name">{indent.department}</span>
                </td>
                <td>
                  <span className={`ad-urgency-badge ${indent.urgencyClass}`}>
                    {indent.urgency}
                  </span>
                </td>
                <td>
                  <button className="ad-review-btn" onClick={() => handleReviewIndent(indent.indentId)}>
                    Review
                  </button>
                </td>
              </tr>
            ))}

            {!loading && displayedIndents.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '14px 16px', textAlign: 'center', color: '#64748b' }}>
                  No pending admin approvals.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent System Activity */}
      <div className="ad-activity-section">
        <div className="ad-section-header">
          <h2 className="ad-section-title">Recent System Activity</h2>
        </div>

        <div className="ad-table-card">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Activity</th>
                <th>Module</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((activity, idx) => (
                <tr key={idx}>
                  <td>
                    <span className="ad-activity-time">{activity.time}</span>
                  </td>
                  <td>
                    <div className="ad-activity-user">
                      <div className={`ad-user-avatar ${activity.avatarColor}`}>
                        {activity.initial}
                      </div>
                      <span className="ad-user-name">{activity.user}</span>
                    </div>
                  </td>
                  <td>
                    <span className="ad-activity-text">{activity.activity}</span>
                  </td>
                  <td>
                    <span className="ad-module-name">{activity.module}</span>
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

export default AdminDashboard;