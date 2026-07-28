import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { purchaseIndentService } from '../../../services/apiService';
import './AccountantDashboard.css';

// ─── Icons ─────────────────────────────────────────────────────────────────
const Ico = {
  ArrowRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  IndianRupee: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="M6 13l8.5 8"/><path d="M6 13h3c3.314 0 6-2.686 6-6s-2.686-6-6-6"/></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  FileText: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Package: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  AlertTri: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('en-IN'));
const fmtCurrency = (n) => (n === null || n === undefined ? '—' : '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }));
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
  if (k.includes('approved') || k.includes('complete')) return { cls: 'qms-badge-green', label: 'Completed' };
  if (k.includes('accountant')) return { cls: 'qms-badge-yellow', label: 'Pending Processing' };
  return { cls: 'qms-badge-gray', label: s || '—' };
};

const calculateIndentValue = (indent) => {
  if (!indent.materials || !Array.isArray(indent.materials)) return 0;
  return indent.materials.reduce((sum, m) => {
    const cost = parseFloat(m.rm_cost) || parseFloat(m.estimated_cost) || 0;
    return sum + cost;
  }, 0);
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
const AccountantDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [indents, setIndents] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, compRes] = await Promise.allSettled([
        purchaseIndentService.getAllIndents({ workflowStage: 'Accountant' }),
        purchaseIndentService.getAllIndents({ workflowStage: 'Completed' })
      ]);
      const allData = [
        ...(accRes.status === 'fulfilled' ? accRes.value?.data || [] : []),
        ...(compRes.status === 'fulfilled' ? compRes.value?.data || [] : [])
      ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setIndents(allData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived Metrics ────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    let pendingCustomerCount = 0, pendingStoreCount = 0, processedCount = 0;
    let processedValue = 0, pendingValue = 0, customerValue = 0, storeValue = 0;

    indents.forEach(i => {
      const val = calculateIndentValue(i);
      const isCustomer = !!i.customer_order_id || !!i.customer_order_indent_id;
      if (isCustomer) customerValue += val; else storeValue += val;

      if (i.workflow_stage === 'Accountant') {
        if (isCustomer) pendingCustomerCount++; else pendingStoreCount++;
        pendingValue += val;
      } else if (i.workflow_stage === 'Completed') {
        processedCount++;
        processedValue += val;
      }
    });

    const totalPending = pendingCustomerCount + pendingStoreCount;
    return { pendingCustomerCount, pendingStoreCount, pendingValue, processedCount, processedValue, customerValue, storeValue, totalPending, totalCount: totalPending + processedCount };
  }, [indents]);

  const completionPct = metrics.totalCount > 0 ? Math.round((metrics.processedCount / metrics.totalCount) * 100) : 0;

  // ── Chart Data ─────────────────────────────────────────────────────────────
  const trendChartData = useMemo(() => {
    const days = lastNDays(14);
    const map = {};
    days.forEach(d => { map[d] = { day: fmtDay(d), customer: 0, store: 0 }; });
    indents.forEach(i => {
      const day = String(i.created_at || '').split('T')[0];
      const isCustomer = !!i.customer_order_id || !!i.customer_order_indent_id;
      if (map[day]) { if (isCustomer) map[day].customer += 1; else map[day].store += 1; }
    });
    return days.map(d => map[d]);
  }, [indents]);

  const donutData = useMemo(() => {
    const customerTotal = indents.filter(i => !!i.customer_order_id || !!i.customer_order_indent_id).length;
    const storeTotal = indents.filter(i => !i.customer_order_id && !i.customer_order_indent_id).length;
    return [
      { name: 'Customer', value: customerTotal, fill: '#2563eb' },
      { name: 'Store Req', value: storeTotal, fill: '#f59e0b' },
    ].filter(d => d.value > 0);
  }, [indents]);

  const pendingIndents = useMemo(() => indents.filter(i => i.workflow_stage === 'Accountant').slice(0, 6), [indents]);
  const recentProcessed = useMemo(() => indents.filter(i => i.workflow_stage === 'Completed').slice(0, 5), [indents]);

  return (
    <div className="qms-page">
      {/* ═══════════════ ROW 1 – KPI CARDS ═══════════════ */}
      <div className="qms-kpi-grid">
        <div className="qms-kpi-card" onClick={() => navigate('/accountant/customer-indents')} style={{ cursor: 'pointer' }}>
          <div className="qms-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Ico.FileText />
          </div>
          <div className="qms-kpi-body">
            <p className="qms-kpi-label">Total Indents</p>
            <p className="qms-kpi-value" style={{ color: '#2563eb' }}>{fmt(metrics.totalCount)}</p>
            <p className="qms-kpi-note">Active indents in system</p>
          </div>
        </div>

        <div className="qms-kpi-card" onClick={() => navigate('/accountant/customer-indents')} style={{ cursor: 'pointer' }}>
          <div className="qms-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Ico.Clock />
          </div>
          <div className="qms-kpi-body">
            <p className="qms-kpi-label">Pending Customer</p>
            <p className="qms-kpi-value" style={{ color: '#d97706' }}>{fmt(metrics.pendingCustomerCount)}</p>
            <p className="qms-kpi-note">Awaiting processing</p>
          </div>
        </div>

        <div className="qms-kpi-card" onClick={() => navigate('/accountant/store-indents')} style={{ cursor: 'pointer' }}>
          <div className="qms-kpi-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Ico.Package />
          </div>
          <div className="qms-kpi-body">
            <p className="qms-kpi-label">Pending Store Req</p>
            <p className="qms-kpi-value" style={{ color: '#16a34a' }}>{fmt(metrics.pendingStoreCount)}</p>
            <p className="qms-kpi-note">Internal requirements</p>
          </div>
        </div>

        <div className="qms-kpi-card">
          <div className="qms-kpi-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <Ico.AlertTri />
          </div>
          <div className="qms-kpi-body">
            <p className="qms-kpi-label">Total Pending</p>
            <p className="qms-kpi-value" style={{ color: '#dc2626' }}>{fmt(metrics.totalPending)}</p>
            <p className="qms-kpi-note">Requires your action</p>
          </div>
        </div>

        <div className="qms-kpi-card">
          <div className="qms-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Ico.CheckCircle />
          </div>
          <div className="qms-kpi-body">
            <p className="qms-kpi-label">Processed</p>
            <p className="qms-kpi-value" style={{ color: '#059669' }}>{fmt(metrics.processedCount)}</p>
            <p className="qms-kpi-note">Completed indents</p>
          </div>
        </div>

        <div className="qms-kpi-card">
          <div className="qms-kpi-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <Ico.IndianRupee />
          </div>
          <div className="qms-kpi-body">
            <p className="qms-kpi-label">Total Value</p>
            <p className="qms-kpi-value" style={{ color: '#7c3aed', fontSize: '24px' }}>{fmtCurrency(metrics.pendingValue + metrics.processedValue)}</p>
            <p className="qms-kpi-note">All operations volume</p>
          </div>
        </div>
      </div>

      {/* ═══════════════ ROW 2 – CHARTS ═══════════════ */}
      <div className="qms-charts-row">
        <div className="qms-panel qms-panel-chart-lg">
          <div className="qms-panel-head">
            <div className="qms-panel-title-wrap">
              <div className="qms-panel-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Ico.FileText />
              </div>
              <h2 className="qms-panel-title">Indent Activity Trend (Last 14 Days)</h2>
            </div>
            <button className="qms-link-btn" onClick={() => navigate('/accountant/customer-indents')}>
              View All <Ico.ArrowRight />
            </button>
          </div>
          {loading ? (
            <div className="qms-skeleton-chart" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendChartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="accGradCustomer" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="accGradStore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="customer" name="Customer" stroke="#2563eb" strokeWidth={2.4} fill="url(#accGradCustomer)" dot={false} activeDot={{ r: 5, fill: '#2563eb' }} />
                <Area type="monotone" dataKey="store" name="Store Req" stroke="#f59e0b" strokeWidth={2.4} fill="url(#accGradStore)" dot={false} activeDot={{ r: 5, fill: '#f59e0b' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="qms-panel qms-panel-chart-sm">
          <div className="qms-panel-head">
            <div className="qms-panel-title-wrap">
              <div className="qms-panel-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <Ico.Package />
              </div>
              <h2 className="qms-panel-title">Indents by Type</h2>
            </div>
          </div>
          {loading ? (
            <div className="qms-skeleton-gauge" />
          ) : donutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donutData} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" cx="50%" cy="50%">
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => fmt(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No data available</div>
          )}
        </div>
      </div>

      {/* ═══════════════ COMPLETION STRIP ═══════════════ */}
      <div className="qms-completion-strip">
        <p className="qms-completion-title">Processing Completion Rate</p>
        <div className="qms-completion-track">
          <div className="qms-completion-fill" style={{ width: `${completionPct}%` }} />
        </div>
        <p className="qms-completion-note">{completionPct}% completed ({fmt(metrics.processedCount)} of {fmt(metrics.totalCount)} indents)</p>
      </div>

      {/* ═══════════════ ROW 3 – RECENT PROCESSED ═══════════════ */}
      <div className="qms-bottom-row">
        <div className="qms-panel qms-panel-table">
          <div className="qms-panel-head">
            <div className="qms-panel-title-wrap">
              <div className="qms-panel-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                <Ico.CheckCircle />
              </div>
              <div>
                <h2 className="qms-panel-title">Recently Processed Indents</h2>
                <p className="qms-panel-subtitle">Indents completed by the accounts team</p>
              </div>
            </div>
            <div className="qms-panel-head-actions">
              <span className="qms-mini-stat">{recentProcessed.length} records</span>
              <button className="qms-link-btn" onClick={() => navigate('/accountant/customer-indents')}>
                View All <Ico.ArrowRight />
              </button>
            </div>
          </div>
          {loading ? (
            <div className="qms-skeleton-rows">{[1, 2, 3, 4, 5].map(i => <div key={i} className="qms-skeleton-row" />)}</div>
          ) : recentProcessed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No processed indents yet</div>
          ) : (
            <div className="qms-table-wrap">
              <table className="qms-table">
                <thead>
                  <tr>
                    <th>Indent #</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="qms-th-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProcessed.map((indent) => {
                    const status = statusMeta(indent.workflow_stage);
                    const val = calculateIndentValue(indent);
                    const isCustomer = !!indent.customer_order_id || !!indent.customer_order_indent_id;
                    return (
                      <tr key={indent.indent_id}>
                        <td><span className="qms-indent-id">{indent.indent_number || indent.indent_id}</span></td>
                        <td><span className={`qms-badge ${isCustomer ? 'qms-badge-blue' : 'qms-badge-orange'}`}>{isCustomer ? 'Customer' : 'Store Req'}</span></td>
                        <td><p className="qms-cell-main">{fmtCurrency(val)}</p></td>
                        <td><span className={`qms-badge ${status.cls}`}>{status.label}</span></td>
                        <td className="qms-date-cell">{fmtDate(indent.updated_at || indent.created_at)}</td>
                        <td className="qms-action-cell">
                          <button className="qms-row-action-btn" onClick={() => navigate('/accountant-purchase-indents', { state: { indentId: indent.indent_id } })}>
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
                <p className="qms-panel-subtitle">Indents awaiting your processing & verification</p>
              </div>
            </div>
            <div className="qms-panel-head-actions">
              <span className="qms-mini-stat qms-mini-stat-warn">{pendingIndents.length} pending</span>
              <button className="qms-link-btn" onClick={() => navigate('/accountant/customer-indents')}>
                View All <Ico.ArrowRight />
              </button>
            </div>
          </div>
          {loading ? (
            <div className="qms-skeleton-rows">{[1, 2, 3, 4, 5].map(i => <div key={i} className="qms-skeleton-row" />)}</div>
          ) : pendingIndents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>All indents are cleared!</div>
          ) : (
            <div className="qms-table-wrap">
              <table className="qms-table">
                <thead>
                  <tr>
                    <th>Indent #</th>
                    <th>Type</th>
                    <th>Materials</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="qms-th-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingIndents.map((indent) => {
                    const status = statusMeta(indent.workflow_stage);
                    const val = calculateIndentValue(indent);
                    const isCustomer = !!indent.customer_order_id || !!indent.customer_order_indent_id;
                    const materialCount = indent.materials?.length || 0;
                    return (
                      <tr key={indent.indent_id}>
                        <td><span className="qms-indent-id">{indent.indent_number || indent.indent_id}</span></td>
                        <td><span className={`qms-badge ${isCustomer ? 'qms-badge-blue' : 'qms-badge-orange'}`}>{isCustomer ? 'Customer' : 'Store Req'}</span></td>
                        <td>
                          <p className="qms-cell-main">{materialCount} item{materialCount !== 1 ? 's' : ''}</p>
                          <p className="qms-cell-sub">{indent.materials?.[0]?.material_description || '—'}</p>
                        </td>
                        <td><p className="qms-cell-main">{fmtCurrency(val)}</p></td>
                        <td><span className={`qms-badge ${status.cls}`}>{status.label}</span></td>
                        <td className="qms-date-cell">{fmtDate(indent.created_at)}</td>
                        <td className="qms-action-cell">
                          <button className="qms-row-action-btn" onClick={() => navigate('/accountant-purchase-indents', { state: { indentId: indent.indent_id } })}>
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

export default AccountantDashboard;
