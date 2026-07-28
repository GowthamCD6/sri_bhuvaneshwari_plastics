import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  dashboardService,
  inventoryService,
  purchaseIndentService,
  storeRequestService,
  stockAdjustmentService,
} from '../../../services/apiService';
import './Dashboard.css';

// ─── Icons ─────────────────────────────────────────────────────────────────
const Ico = {
  ArrowRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Shield:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  FileText:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Clipboard:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  TrendUp:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  BarChart2:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  PieIco:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  AlertTri:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('en-IN'));

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDay = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const priorityMeta = (p = '') => {
  const k = String(p).toLowerCase();
  if (k === 'urgent' || k === 'high') return { cls: 'sod-badge-red',    label: p || 'Urgent' };
  if (k === 'medium')                  return { cls: 'sod-badge-orange',  label: p };
  return                                      { cls: 'sod-badge-blue',   label: p || 'Standard' };
};

const statusMeta = (s = '') => {
  const k = String(s).toLowerCase();
  if (k.includes('approved') || k.includes('complete')) return { cls: 'sod-badge-green',  label: s };
  if (k.includes('reject'))                              return { cls: 'sod-badge-red',    label: s };
  if (k.includes('pending'))                             return { cls: 'sod-badge-yellow', label: s };
  return                                                        { cls: 'sod-badge-gray',   label: s || '—' };
};

const todayISO = () => new Date().toISOString().split('T')[0];

const lastNDays = (n) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split('T')[0];
  });

// ─── SVG Semi-circle Gauge ──────────────────────────────────────────────────
const SemiGauge = ({ pct = 0, color = '#10b981', trackColor = '#d1fae5', label, sub, minLabel, maxLabel }) => {
  const cx = 100, cy = 106, r = 76, sw = 13;
  const pathLen = Math.PI * r;
  const filled  = Math.min(Math.max(pct, 0), 100) / 100 * pathLen;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <svg viewBox="0 0 200 120" className="sod-gauge-svg" aria-label={`${label} gauge`}>
      <path d={arcPath} fill="none" stroke={trackColor} strokeWidth={sw} strokeLinecap="round" />
      <path
        d={arcPath}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${pathLen}`}
      />
      <text x={cx} y={cy - 20} textAnchor="middle" fontSize="21" fontWeight="800" fill="#0f172a">{label}</text>
      {sub && <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9.5" fill="#64748b">{sub}</text>}
      {minLabel && <text x={cx - r + 6} y={cy + 16} textAnchor="middle" fontSize="8" fill="#94a3b8">{minLabel}</text>}
      {maxLabel && <text x={cx + r - 6} y={cy + 16} textAnchor="middle" fontSize="8" fill="#94a3b8">{maxLabel}</text>}
    </svg>
  );
};

// ─── Custom Tooltips ─────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="sod-chart-tooltip">
      {label && <p className="sod-tt-date">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="sod-tt-row">
          <span className="sod-tt-dot" style={{ background: p.color || p.payload?.fill }} />
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading]           = useState(true);
  const [stockHealth, setStockHealth]   = useState({ inStock: 0, lowStock: 0, outOfStock: 0 });
  const [allInventory, setAllInventory] = useState([]);
  const [adjustments, setAdjustments]  = useState([]);
  const [pendingIndents, setPendingIndents] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [kpi, setKpi]                  = useState({ pendingIndents: 0, pendingRequests: 0 });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, invRes, adjRes, indentsRes, reqRes] = await Promise.allSettled([
        dashboardService.getStoreDashboard(),
        inventoryService.getAllInventory({ active: 'true' }),
        stockAdjustmentService.getAllAdjustments(),
        purchaseIndentService.getAllIndents({ workflow_stage: 'Store Officer' }),
        storeRequestService.getAllRequests({ status: 'Pending' }),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        const d = dashRes.value.data;
        setKpi({ pendingIndents: d.pendingIndents || 0, pendingRequests: d.pendingRequests || 0 });
      }

      if (invRes.status === 'fulfilled') {
        const items = invRes.value?.data || [];
        setAllInventory(items);
        let inS = 0, lowS = 0, outS = 0;
        items.forEach((item) => {
          const stock   = Number(item.current_stock || 0);
          const reorder = Number(item.reorder_level || item.reorder_point || 0);
          if (stock <= 0)            outS++;
          else if (stock <= reorder) lowS++;
          else                       inS++;
        });
        setStockHealth({ inStock: inS, lowStock: lowS, outOfStock: outS });
      }

      if (adjRes.status === 'fulfilled') {
        setAdjustments(adjRes.value?.data || []);
      }

      if (indentsRes.status === 'fulfilled') {
        const all = indentsRes.value?.data || indentsRes.value?.indents || [];
        setPendingIndents(Array.isArray(all) ? all.slice(0, 6) : []);
      }

      if (reqRes.status === 'fulfilled') {
        const all = reqRes.value?.data || reqRes.value?.requests || [];
        setRecentRequests(Array.isArray(all) ? all.slice(0, 5) : []);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived values ────────────────────────────────────────────────────────
  const totalMaterials  = stockHealth.inStock + stockHealth.lowStock + stockHealth.outOfStock;
  const utilizationPct  = totalMaterials > 0 ? Math.round((stockHealth.inStock / totalMaterials) * 100) : 0;
  const criticalCount   = stockHealth.lowStock + stockHealth.outOfStock;

  // Last 14 days area chart data
  const areaChartData = useMemo(() => {
    const days = lastNDays(14);
    const map  = {};
    days.forEach((d) => { map[d] = { day: fmtDay(d), stockIn: 0, stockOut: 0 }; });
    adjustments.forEach((adj) => {
      const day = (adj.adjusted_at || '').split('T')[0];
      if (!map[day]) return;
      const qty = Number(adj.quantity || 0);
      if ((adj.adjustment_type || '').toUpperCase() === 'IN')  map[day].stockIn  += qty;
      if ((adj.adjustment_type || '').toUpperCase() === 'OUT') map[day].stockOut += qty;
    });
    return days.map((d) => map[d]);
  }, [adjustments]);

  // Today's movements bar chart
  const barChartData = useMemo(() => {
    const today  = todayISO();
    const todayAdj = adjustments.filter((a) => (a.adjusted_at || '').startsWith(today));
    const map    = {};
    todayAdj.forEach((adj) => {
      const key = adj.material_name || adj.material_code || 'Unknown';
      if (!map[key]) map[key] = { material: key.length > 12 ? key.slice(0, 11) + '…' : key, stockIn: 0, stockOut: 0 };
      const qty = Number(adj.quantity || 0);
      if ((adj.adjustment_type || '').toUpperCase() === 'IN')  map[key].stockIn  += qty;
      if ((adj.adjustment_type || '').toUpperCase() === 'OUT') map[key].stockOut += qty;
    });
    return Object.values(map);
  }, [adjustments]);

  // Today's IN/OUT totals for gauge
  const todayTotals = useMemo(() => {
    const today = todayISO();
    let inTotal = 0, outTotal = 0;
    adjustments
      .filter((a) => (a.adjusted_at || '').startsWith(today))
      .forEach((a) => {
        const qty = Number(a.quantity || 0);
        if ((a.adjustment_type || '').toUpperCase() === 'IN')  inTotal  += qty;
        if ((a.adjustment_type || '').toUpperCase() === 'OUT') outTotal += qty;
      });
    return { inTotal, outTotal };
  }, [adjustments]);

  // SLA compliance
  const slaPct = useMemo(() => {
    const totalReq = kpi.pendingRequests + recentRequests.length;
    if (totalReq === 0) return 100;
    return Math.round(((totalReq - kpi.pendingRequests) / totalReq) * 100);
  }, [kpi.pendingRequests, recentRequests.length]);

  // Donut chart data
  const donutData = [
    { name: 'In Stock',     value: stockHealth.inStock,    fill: '#10b981' },
    { name: 'Low Stock',    value: stockHealth.lowStock,   fill: '#f59e0b' },
    { name: 'Out of Stock', value: stockHealth.outOfStock, fill: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Critical items list
  const lowStockItems = allInventory
    .filter((item) => {
      const stock   = Number(item.current_stock || 0);
      const reorder = Number(item.reorder_level || item.reorder_point || 0);
      return stock <= reorder;
    })
    .slice(0, 4);

  return (
    <div className="sod-page">

      {/* ═══════════════ ROW 1 – GAUGE KPI CARDS ═══════════════ */}
      <div className="sod-gauge-row">

        {/* Gauge 1 – Inventory Utilization */}
        <div className="sod-gauge-card">
          <p className="sod-gauge-title">Total Inventory Utilization</p>
          {loading ? <div className="sod-skeleton-gauge" /> : (
            <SemiGauge
              pct={utilizationPct}
              color="#10b981"
              trackColor="#d1fae5"
              label={`${utilizationPct}%`}
              sub="Utilization"
              minLabel="Min 40%"
              maxLabel="Max 90%"
            />
          )}
          <p className="sod-gauge-note">
            <span style={{ color: '#10b981' }}>{fmt(stockHealth.inStock)}</span> of <strong>{fmt(totalMaterials)}</strong> materials healthy
          </p>
        </div>

        {/* Gauge 2 – Critical Low Stock */}
        <div className="sod-gauge-card">
          <p className="sod-gauge-title">Critical Low Stock Items</p>
          {loading ? <div className="sod-skeleton-gauge" /> : (
            <SemiGauge
              pct={totalMaterials > 0 ? Math.round((criticalCount / totalMaterials) * 100) : 0}
              color={criticalCount > 0 ? '#ef4444' : '#10b981'}
              trackColor="#fee2e2"
              label={String(criticalCount)}
              sub={criticalCount === 1 ? 'item critical' : 'items critical'}
              minLabel="Threshold"
              maxLabel="10 items"
            />
          )}
          <p className="sod-gauge-note">
            <span style={{ color: '#ef4444' }}>{fmt(stockHealth.outOfStock)}</span> out &nbsp;·&nbsp;
            <span style={{ color: '#f59e0b' }}>{fmt(stockHealth.lowStock)}</span> low
          </p>
        </div>

        {/* Gauge 3 – Today's Stock In vs Out */}
        <div className="sod-gauge-card">
          <p className="sod-gauge-title">{"Today's Stock In vs Out"}</p>
          {loading ? <div className="sod-skeleton-gauge" /> : (
            <SemiGauge
              pct={todayTotals.inTotal + todayTotals.outTotal > 0
                ? Math.round((todayTotals.inTotal / (todayTotals.inTotal + todayTotals.outTotal)) * 100)
                : 50}
              color="#2563eb"
              trackColor="#dbeafe"
              label={`${fmt(todayTotals.inTotal)} / ${fmt(todayTotals.outTotal)}`}
              sub={`Net Inflow +${fmt(Math.max(0, todayTotals.inTotal - todayTotals.outTotal))}`}
              minLabel="Stock In"
              maxLabel="Stock Out"
            />
          )}
          <p className="sod-gauge-note">Units moved across all materials today</p>
        </div>

        {/* Gauge 4 – SLA Compliance */}
        <div className="sod-gauge-card">
          <p className="sod-gauge-title">Material Request SLA Compliance</p>
          {loading ? <div className="sod-skeleton-gauge" /> : (
            <SemiGauge
              pct={slaPct}
              color={slaPct >= 80 ? '#10b981' : slaPct >= 50 ? '#f59e0b' : '#ef4444'}
              trackColor="#ecfdf5"
              label={`${slaPct}%`}
              sub="SLA Met"
              minLabel="0%"
              maxLabel="100%"
            />
          )}
          <p className="sod-gauge-note">Closed within target time</p>
        </div>

      </div>

      {/* ═══════════════ ROW 2 – AREA + BAR CHARTS ═══════════════ */}
      <div className="sod-charts-row">

        {/* Area Chart – Last 14 Days Stock Movement */}
        <div className="sod-panel sod-panel-chart-lg">
          <div className="sod-panel-head">
            <div className="sod-panel-title-wrap">
              <span className="sod-panel-icon sod-icon-blue"><Ico.TrendUp /></span>
              <h2 className="sod-panel-title">Overall Stock Levels (Last 14 Days)</h2>
            </div>
          </div>
          {loading ? (
            <div className="sod-skeleton-chart" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={areaChartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="stockIn"  name="Stock In"  stroke="#10b981" strokeWidth={2.5} fill="url(#gradIn)"  dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
                <Area type="monotone" dataKey="stockOut" name="Stock Out" stroke="#ef4444" strokeWidth={2.5} fill="url(#gradOut)" dot={false} activeDot={{ r: 5, fill: '#ef4444' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart – Today's Movements by Material */}
        <div className="sod-panel sod-panel-chart-sm">
          <div className="sod-panel-head">
            <div className="sod-panel-title-wrap">
              <span className="sod-panel-icon sod-icon-purple"><Ico.BarChart2 /></span>
              <h2 className="sod-panel-title">{"Today's Movements by Material"}</h2>
            </div>
          </div>
          {loading ? (
            <div className="sod-skeleton-chart" />
          ) : barChartData.length === 0 ? (
            <div className="sod-empty-state">
              <span className="sod-empty-ico"><Ico.BarChart2 /></span>
              <p>No stock movements recorded today</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={barChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barSize={12} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="material" tick={{ fontSize: 9.5, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="stockIn"  name="Stock In"  fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="stockOut" name="Stock Out" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* ═══════════════ ROW 3 – DONUT + PENDING INDENTS ═══════════════ */}
      <div className="sod-mid-row">

        {/* Inventory Health Donut */}
        <div className="sod-panel sod-panel-donut">
          <div className="sod-panel-head">
            <div className="sod-panel-title-wrap">
              <span className="sod-panel-icon sod-icon-teal"><Ico.PieIco /></span>
              <h2 className="sod-panel-title">Inventory Health Overview</h2>
            </div>
            <button className="sod-link-btn" onClick={() => navigate('/inventory')}>
              Full Inventory <span><Ico.ArrowRight /></span>
            </button>
          </div>
          {loading ? (
            <div className="sod-skeleton-donut" />
          ) : (
            <>
              <div className="sod-donut-center-wrap">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={donutData.length > 0 ? donutData : [{ name: 'No Data', value: 1, fill: '#e2e8f0' }]}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={88}
                      paddingAngle={donutData.length > 1 ? 3 : 0}
                      dataKey="value"
                      startAngle={90} endAngle={-270}
                    >
                      {(donutData.length > 0 ? donutData : [{ fill: '#e2e8f0' }]).map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="sod-donut-overlay">
                  <span className="sod-donut-pct">{utilizationPct}%</span>
                  <span className="sod-donut-sub">Healthy Stock</span>
                </div>
              </div>
              <div className="sod-donut-legend">
                {[
                  { label: 'In Stock',     count: stockHealth.inStock,    color: '#10b981' },
                  { label: 'Low Stock',    count: stockHealth.lowStock,   color: '#f59e0b' },
                  { label: 'Out of Stock', count: stockHealth.outOfStock, color: '#ef4444' },
                ].map((row, i) => (
                  <div key={i} className="sod-legend-row">
                    <span className="sod-legend-dot" style={{ background: row.color }} />
                    <span className="sod-legend-label">{row.label}</span>
                    <span className="sod-legend-count">{fmt(row.count)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pending Indents Table */}
        <div className="sod-panel sod-panel-indents">
          <div className="sod-panel-head">
            <div className="sod-panel-title-wrap">
              <span className="sod-panel-icon sod-icon-purple"><Ico.FileText /></span>
              <h2 className="sod-panel-title">Indents Awaiting Verification</h2>
            </div>
            <button className="sod-link-btn" onClick={() => navigate('/verify-indents')}>
              View All <span><Ico.ArrowRight /></span>
            </button>
          </div>
          {loading ? (
            <div className="sod-skeleton-rows">
              {[1, 2, 3, 4].map((i) => <div key={i} className="sod-skeleton-row" />)}
            </div>
          ) : pendingIndents.length === 0 ? (
            <div className="sod-empty-state sod-empty-green">
              <span className="sod-empty-ico"><Ico.Shield /></span>
              <p>No indents pending — All clear!</p>
            </div>
          ) : (
            <div className="sod-table-wrap">
              <table className="sod-table">
                <thead>
                  <tr>
                    <th>Indent #</th>
                    <th>Customer</th>
                    <th>Priority</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingIndents.map((indent, idx) => {
                    const pri = priorityMeta(indent.priority);
                    const sta = statusMeta(indent.status);
                    return (
                      <tr key={indent.indent_id || idx}>
                        <td><span className="sod-indent-id">{indent.indent_number || `IND-${indent.indent_id}`}</span></td>
                        <td>
                          <p className="sod-cell-main">{indent.customer_name || '—'}</p>
                          {indent.customer_company && <p className="sod-cell-sub">{indent.customer_company}</p>}
                        </td>
                        <td><span className={`sod-badge ${pri.cls}`}>{pri.label}</span></td>
                        <td className="sod-date-cell">{fmtDate(indent.created_at || indent.indent_date)}</td>
                        <td><span className={`sod-badge ${sta.cls}`}>{sta.label || 'Pending'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ═══════════════ ROW 4 – LOW STOCK + REQUESTS ═══════════════ */}
      <div className="sod-bot-row">

        {/* Critical Low Stock */}
        <div className="sod-panel sod-panel-half">
          <div className="sod-panel-head">
            <div className="sod-panel-title-wrap">
              <span className="sod-panel-icon sod-icon-orange"><Ico.AlertTri /></span>
              <h2 className="sod-panel-title">Critical Low Stock Items</h2>
            </div>
            <button className="sod-link-btn" onClick={() => navigate('/low-stock-alert')}>
              View All <span><Ico.ArrowRight /></span>
            </button>
          </div>
          {loading ? (
            <div className="sod-skeleton-rows">
              {[1, 2, 3].map((i) => <div key={i} className="sod-skeleton-row" />)}
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="sod-empty-state sod-empty-green">
              <span className="sod-empty-ico"><Ico.Shield /></span>
              <p>No critical stock alerts right now</p>
            </div>
          ) : (
            <div className="sod-alert-list">
              {lowStockItems.map((item, idx) => {
                const stock   = Number(item.current_stock || 0);
                const reorder = Number(item.reorder_level || item.reorder_point || 0);
                const pct     = reorder > 0 ? Math.min((stock / reorder) * 100, 100) : 0;
                const isOut   = stock <= 0;
                return (
                  <div className={`sod-alert-item ${isOut ? 'sod-alert-out' : ''}`} key={item.material_id || idx}>
                    <div className="sod-alert-item-top">
                      <div>
                        <p className="sod-alert-name">{item.material_name}</p>
                        <p className="sod-alert-code">{item.material_code} · {item.category || '—'}</p>
                      </div>
                      <span className={`sod-badge ${isOut ? 'sod-badge-red' : 'sod-badge-orange'}`}>
                        {isOut ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </div>
                    <div className="sod-stock-bar-row">
                      <div className="sod-stock-bar-bg">
                        <div className="sod-stock-bar-fill" style={{ width: `${pct}%`, background: isOut ? '#ef4444' : '#f59e0b' }} />
                      </div>
                      <span className="sod-stock-nums">{fmt(stock)} / {fmt(reorder)} {item.unit_of_measurement || ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Material Requests */}
        <div className="sod-panel sod-panel-half">
          <div className="sod-panel-head">
            <div className="sod-panel-title-wrap">
              <span className="sod-panel-icon sod-icon-blue"><Ico.Clipboard /></span>
              <h2 className="sod-panel-title">Pending Material Requests</h2>
            </div>
            <button className="sod-link-btn" onClick={() => navigate('/material-request')}>
              View All <span><Ico.ArrowRight /></span>
            </button>
          </div>
          {loading ? (
            <div className="sod-skeleton-rows">
              {[1, 2, 3, 4].map((i) => <div key={i} className="sod-skeleton-row" />)}
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="sod-empty-state sod-empty-green">
              <span className="sod-empty-ico"><Ico.Shield /></span>
              <p>No pending material requests</p>
            </div>
          ) : (
            <div className="sod-request-feed">
              {recentRequests.map((req, idx) => {
                const sta = statusMeta(req.status);
                const requesterText = String(req.requested_by_name || req.requestedBy || req.requested_by || req.department || 'R');
                return (
                  <div className="sod-request-item" key={req.request_id || idx}>
                    <div className="sod-req-avatar">
                      {requesterText.charAt(0).toUpperCase()}
                    </div>
                    <div className="sod-req-body">
                      <p className="sod-req-title">{req.material_name || req.description || `Request #${req.request_id}`}</p>
                      <p className="sod-req-meta">{requesterText || '—'} · {fmtDate(req.created_at || req.request_date)}</p>
                    </div>
                    <div className="sod-req-right">
                      <span className="sod-req-qty">{fmt(req.quantity)} {req.unit || ''}</span>
                      <span className={`sod-badge ${sta.cls}`}>{sta.label || 'Pending'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
