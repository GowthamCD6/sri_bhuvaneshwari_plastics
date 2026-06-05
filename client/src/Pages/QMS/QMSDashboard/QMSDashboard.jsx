import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  dashboardService,
  customerOrderService,
  purchaseIndentService,
} from '../../../services/apiService';
import './QMSDashboard.css';

// ─── Icons ─────────────────────────────────────────────────────────────────
const Ico = {
  ArrowRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  ShoppingCart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Package: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  FileText: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  AlertTri: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('en-IN'));
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const initials = (name = '') => {
  const parts = String(name).trim().split(' ').filter(Boolean);
  if (!parts.length) return 'NA';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
};

const fmtDay = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const lastNDays = (n) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split('T')[0];
  });

const statusMeta = (s = '') => {
  const k = String(s).toLowerCase();
  if (k.includes('approved') || k.includes('complete')) return { cls: 'qms-badge-green', label: s };
  if (k.includes('admin')) return { cls: 'qms-badge-orange', label: s };
  if (k.includes('store')) return { cls: 'qms-badge-yellow', label: s };
  if (k.includes('pending')) return { cls: 'qms-badge-yellow', label: s };
  return { cls: 'qms-badge-gray', label: s || '—' };
};

const priorityMeta = (p = '') => {
  const k = String(p).toLowerCase();
  if (k === 'urgent' || k === 'high') return { cls: 'qms-badge-red', label: p || 'Urgent' };
  if (k === 'medium') return { cls: 'qms-badge-orange', label: p };
  return { cls: 'qms-badge-blue', label: p || 'Standard' };
};

// ─── Custom Tooltips ─────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="qms-chart-tooltip">
      {label && <p className="qms-tt-date">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="qms-tt-row">
          <span className="qms-tt-dot" style={{ background: p.color || p.payload?.fill }} />
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
const QMSDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    orders: 0,
    pendingStore: 0,
    pendingAdmin: 0,
    urgentOrders: 0,
    completedOrders: 0,
    todayOrders: 0,
  });
  const [allOrders, setAllOrders] = useState([]);
  const [allIndents, setAllIndents] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, ordersRes, indentsRes] = await Promise.allSettled([
        dashboardService.getQMSDashboard(),
        customerOrderService.getAllOrders({}),
        purchaseIndentService.getAllIndents({}),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        setDashboardData(dashRes.value.data);
      }

      if (ordersRes.status === 'fulfilled') {
        const orders = ordersRes.value?.data || [];
        setAllOrders(Array.isArray(orders) ? orders.slice(0, 10) : []);
      }

      if (indentsRes.status === 'fulfilled') {
        const indents = indentsRes.value?.data || indentsRes.value?.indents || [];
        setAllIndents(Array.isArray(indents) ? indents.slice(0, 6) : []);
      }
    } catch (err) {
      console.error('Dashboard fetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Derived values ────────────────────────────────────────────────────────
  const totalPending = dashboardData.pendingStore + dashboardData.pendingAdmin;
  const completionPct = dashboardData.orders > 0
    ? Math.round(((dashboardData.completedOrders / dashboardData.orders) * 100))
    : 0;

  // Chart data - orders by status
  const orderStatusChart = useMemo(() => [
    { name: 'Completed', value: dashboardData.completedOrders, fill: '#10b981' },
    { name: 'Pending Store', value: dashboardData.pendingStore, fill: '#f59e0b' },
    { name: 'Pending Admin', value: dashboardData.pendingAdmin, fill: '#f87171' },
    { name: 'Urgent', value: dashboardData.urgentOrders, fill: '#ef4444' },
  ].filter(d => d.value > 0), [dashboardData]);

  const trendChartData = useMemo(() => {
    const days = lastNDays(14);
    const map = {};
    days.forEach((d) => {
      map[d] = { day: fmtDay(d), orders: 0, indents: 0 };
    });

    allOrders.forEach((o) => {
      const day = String(o.created_at || o.createdAt || '').split('T')[0];
      if (map[day]) map[day].orders += 1;
    });

    allIndents.forEach((i) => {
      const day = String(i.request_date || i.created_at || '').split('T')[0];
      if (map[day]) map[day].indents += 1;
    });

    return days.map((d) => map[d]);
  }, [allOrders, allIndents]);

  // Recent indents for table
  const pendingIndentsForTable = useMemo(() => {
    return allIndents
      .filter(i => ['Pending Store Review', 'Pending Admin Approval'].includes(String(i.status || '')))
      .slice(0, 6);
  }, [allIndents]);

  return (
    <div className="qms-page">
      {/* ═══════════════ ROW 1 – KPI CARDS ═══════════════ */}
      <div className="qms-kpi-grid">
        <div className="qms-kpi-card">
          <div className="qms-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Ico.ShoppingCart />
          </div>
          <div className="qms-kpi-body">
            <p className="qms-kpi-label">Total Orders</p>
            <p className="qms-kpi-value" style={{ color: '#2563eb' }}>{fmt(dashboardData.orders)}</p>
            <p className="qms-kpi-note">Active orders in system</p>
          </div>
        </div>

        <div className="qms-kpi-card">
          <div className="qms-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Ico.Clock />
          </div>
          <div className="qms-kpi-body">
            <p className="qms-kpi-label">Pending Approvals</p>
            <p className="qms-kpi-value" style={{ color: '#d97706' }}>{fmt(totalPending)}</p>
            <p className="qms-kpi-note">Awaiting review & approval</p>
          </div>
        </div>

        <div className="qms-kpi-card">
          <div className="qms-kpi-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Ico.Package />
          </div>
          <div className="qms-kpi-body">
            <p className="qms-kpi-label">Store Review</p>
            <p className="qms-kpi-value" style={{ color: '#16a34a' }}>{fmt(dashboardData.pendingStore)}</p>
            <p className="qms-kpi-note">Pending store verification</p>
          </div>
        </div>

        <div className="qms-kpi-card">
          <div className="qms-kpi-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <Ico.FileText />
          </div>
          <div className="qms-kpi-body">
            <p className="qms-kpi-label">Admin Approval</p>
            <p className="qms-kpi-value" style={{ color: '#dc2626' }}>{fmt(dashboardData.pendingAdmin)}</p>
            <p className="qms-kpi-note">Awaiting admin sign-off</p>
          </div>
        </div>

        <div className="qms-kpi-card">
          <div className="qms-kpi-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <Ico.AlertTri />
          </div>
          <div className="qms-kpi-body">
            <p className="qms-kpi-label">Urgent Items</p>
            <p className="qms-kpi-value" style={{ color: '#7c3aed' }}>{fmt(dashboardData.urgentOrders)}</p>
            <p className="qms-kpi-note">High priority items</p>
          </div>
        </div>
      </div>

      {/* ═══════════════ ROW 2 – CHARTS ═══════════════ */}
      <div className="qms-charts-row">
        {/* Area Chart – 14 Day QMS Activity */}
        <div className="qms-panel qms-panel-chart-lg">
          <div className="qms-panel-head">
            <div className="qms-panel-title-wrap">
              <div className="qms-panel-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Ico.ShoppingCart />
              </div>
              <h2 className="qms-panel-title">QMS Activity Trend (Last 14 Days)</h2>
            </div>
            <button className="qms-link-btn" onClick={() => navigate('/customer-orders')}>
              View All <Ico.ArrowRight />
            </button>
          </div>
          {loading ? (
            <div className="qms-skeleton-chart" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendChartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="qmsGradOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="qmsGradIndents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="orders" name="Orders" stroke="#2563eb" strokeWidth={2.4} fill="url(#qmsGradOrders)" dot={false} activeDot={{ r: 5, fill: '#2563eb' }} />
                <Area type="monotone" dataKey="indents" name="Indents" stroke="#f59e0b" strokeWidth={2.4} fill="url(#qmsGradIndents)" dot={false} activeDot={{ r: 5, fill: '#f59e0b' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by Status Bar Chart */}
        <div className="qms-panel qms-panel-chart-sm">
          <div className="qms-panel-head">
            <div className="qms-panel-title-wrap">
              <div className="qms-panel-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <Ico.FileText />
              </div>
              <h2 className="qms-panel-title">Orders by Status</h2>
            </div>
          </div>
          {loading ? (
            <div className="qms-skeleton-chart" />
          ) : orderStatusChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={orderStatusChart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barSize={14} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No status data available</div>
          )}
        </div>
      </div>

      <div className="qms-completion-strip">
        <p className="qms-completion-title">Completion Rate</p>
        <div className="qms-completion-track">
          <div className="qms-completion-fill" style={{ width: `${completionPct}%` }} />
        </div>
        <p className="qms-completion-note">{completionPct}% completed ({fmt(dashboardData.completedOrders)} of {fmt(dashboardData.orders)} orders)</p>
      </div>

      {/* ═══════════════ ROW 3 – TABLES ═══════════════ */}
      <div className="qms-bottom-row">
        {/* Recent Orders Table */}
        <div className="qms-panel qms-panel-table">
          <div className="qms-panel-head">
            <div className="qms-panel-title-wrap">
              <div className="qms-panel-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Ico.ShoppingCart />
              </div>
              <div>
                <h2 className="qms-panel-title">Recent Customer Orders</h2>
                <p className="qms-panel-subtitle">Latest orders requiring quality tracking</p>
              </div>
            </div>
            <div className="qms-panel-head-actions">
              <span className="qms-mini-stat">{allOrders.length} records</span>
              <button className="qms-link-btn" onClick={() => navigate('/customer-orders')}>
                View All <Ico.ArrowRight />
              </button>
            </div>
          </div>
          {loading ? (
            <div className="qms-skeleton-rows">{[1, 2, 3, 4, 5].map(i => <div key={i} className="qms-skeleton-row" />)}</div>
          ) : allOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No orders found</div>
          ) : (
            <div className="qms-table-wrap">
              <table className="qms-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="qms-th-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.slice(0, 5).map((order) => {
                    const status = statusMeta(order.status || order.indentStatus);
                    const customerName = order.customer_name || order.customerName || '—';
                    return (
                      <tr key={order.order_id || order.id}>
                        <td><span className="qms-indent-id">{order.order_id || order.id}</span></td>
                        <td className="qms-customer-cell">
                          <span className="qms-avatar-pill">{initials(customerName)}</span>
                          <div>
                            <p className="qms-cell-main">{customerName}</p>
                            <p className="qms-cell-sub">{order.customer_phone || order.customerPhone || ''}</p>
                          </div>
                        </td>
                        <td><span className={`qms-badge ${status.cls}`}>{status.label}</span></td>
                        <td className="qms-date-cell">{fmtDate(order.created_at || order.createdAt)}</td>
                        <td className="qms-action-cell">
                          <button className="qms-row-action-btn" onClick={() => navigate('/customer-orders')}>
                            Open <Ico.ArrowRight />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════ ROW 4 – PENDING INDENTS ═══════════════ */}
      <div className="qms-bottom-row" style={{ marginTop: '20px' }}>
        <div className="qms-panel qms-panel-table qms-panel-warn">
          <div className="qms-panel-head">
            <div className="qms-panel-title-wrap">
              <div className="qms-panel-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Ico.AlertTri />
              </div>
              <div>
                <h2 className="qms-panel-title">Pending Indents Requiring Action</h2>
                <p className="qms-panel-subtitle">Store/Admin pending approvals to process quickly</p>
              </div>
            </div>
            <div className="qms-panel-head-actions">
              <span className="qms-mini-stat qms-mini-stat-warn">{pendingIndentsForTable.length} pending</span>
              <button className="qms-link-btn" onClick={() => navigate('/qms-purchase-indents')}>
                View All <Ico.ArrowRight />
              </button>
            </div>
          </div>
          {loading ? (
            <div className="qms-skeleton-rows">{[1, 2, 3, 4, 5].map(i => <div key={i} className="qms-skeleton-row" />)}</div>
          ) : pendingIndentsForTable.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>All indents are cleared!</div>
          ) : (
            <div className="qms-table-wrap">
              <table className="qms-table">
                <thead>
                  <tr>
                    <th>Indent ID</th>
                    <th>Material</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="qms-th-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingIndentsForTable.map((indent) => {
                    const status = statusMeta(indent.status);
                    const priority = priorityMeta(indent.priority);
                    return (
                      <tr key={indent.indent_id || indent.id}>
                        <td><span className="qms-indent-id">{indent.indent_id || indent.indentNumber || indent.id}</span></td>
                        <td>
                          <p className="qms-cell-main">{indent.material_name || indent.material || '—'}</p>
                          <p className="qms-cell-sub">Qty: {indent.quantity_required || indent.qty || '—'}</p>
                        </td>
                        <td><span className={`qms-badge ${priority.cls}`}>{priority.label}</span></td>
                        <td><span className={`qms-badge ${status.cls}`}>{status.label}</span></td>
                        <td className="qms-date-cell">{fmtDate(indent.request_date || indent.created_at)}</td>
                        <td className="qms-action-cell">
                          <button className="qms-row-action-btn" onClick={() => navigate('/qms-purchase-indents')}>
                            Review <Ico.ArrowRight />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default QMSDashboard;
