import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { purchaseIndentService } from '../../../services/apiService';
import './AccountantDashboard.css';

// "?"?"? Icons "?"?"?
const Ico = {
  ArrowRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  IndianRupee: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="M6 13l8.5 8"/><path d="M6 13h3c3.314 0 6-2.686 6-6s-2.686-6-6-6"/></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  FileText: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
};

// "?"?"? Helpers "?"?"?
const fmt = (n) => (n === null || n === undefined ? '-' : Number(n).toLocaleString('en-IN'));
const fmtCurrency = (n) => (n === null || n === undefined ? '-' : '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }));
const fmtDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
  if (k.includes('accountant')) return { cls: 'qms-badge-yellow', label: 'Pending Processing' };
  return { cls: 'qms-badge-gray', label: s || '-' };
};

// Calculate total cost of an indent
const calculateIndentValue = (indent) => {
  if (!indent.materials || !Array.isArray(indent.materials)) return 0;
  return indent.materials.reduce((sum, m) => {
    // try rm_cost first, then estimated_cost
    const cost = parseFloat(m.rm_cost) || parseFloat(m.estimated_cost) || 0;
    // if it's a rate, we would multiply by quantity, but we assume rm_cost is total or rate depending on data
    // typically if they just put cost, we add it. 
    return sum + cost;
  }, 0);
};

// "?"?"? Custom Tooltip "?"?"?
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="qms-chart-tooltip">
      {label && <p className="qms-tt-date">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="qms-tt-row">
          <span className="qms-tt-dot" style={{ background: p.color || p.payload?.fill }} />
          <span>{p.name}: <strong>{fmtCurrency(p.value)}</strong></span>
        </div>
      ))}
    </div>
  );
};

// "?"?"? Main Dashboard "?"?"?
const AccountantDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [indents, setIndents] = useState([]);
  
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, compRes] = await Promise.all([
        purchaseIndentService.getAllIndents({ workflowStage: 'Accountant' }),
        purchaseIndentService.getAllIndents({ workflowStage: 'Completed' })
      ]);
      
      const allData = [
        ...(accRes.data || []),
        ...(compRes.data || [])
      ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      
      setIndents(allData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Derived Metrics
  const metrics = useMemo(() => {
    let pendingCount = 0;
    let pendingValue = 0;
    let processedCount = 0;
    let processedValue = 0;

    indents.forEach(i => {
      const val = calculateIndentValue(i);
      if (i.workflow_stage === 'Accountant') {
        pendingCount++;
        pendingValue += val;
      } else if (i.workflow_stage === 'Completed') {
        processedCount++;
        processedValue += val;
      }
    });

    return { pendingCount, pendingValue, processedCount, processedValue, totalCount: pendingCount + processedCount };
  }, [indents]);

  // Chart Data (Last 7 Days Financial Value Processed)
  const chartData = useMemo(() => {
    const days = lastNDays(7);
    const completedIndents = indents.filter(i => i.workflow_stage === 'Completed');
    
    return days.map(d => {
      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setDate(dayEnd.getDate() + 1);

      let dayTotal = 0;
      completedIndents.forEach(i => {
        const iDate = new Date(i.updated_at || i.created_at);
        if (iDate >= dayStart && iDate < dayEnd) {
          dayTotal += calculateIndentValue(i);
        }
      });
      
      return {
        date: new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        Value: dayTotal
      };
    });
  }, [indents]);

  const recentApprovals = indents.slice(0, 8);

  if (loading) {
    return (
      <div className="qms-dash-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: '#64748b', fontSize: '18px' }}>Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="qms-dash-container">
      {/* Header */}
      <header className="qms-dash-header">
        <div className="qms-header-content">
          <h1 className="qms-page-title">Financial Dashboard</h1>
          <p className="qms-page-subtitle">Track and process your pending financial approvals.</p>
        </div>
      </header>

      <div className="qms-dash-scroll-area">
        {/* KPI Grid */}
        <div className="qms-kpi-grid">
          <div className="qms-kpi-card" onClick={() => navigate('/view-accountant-indents')} style={{ cursor: 'pointer' }}>
            <div className="qms-kpi-icon-wrap" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <Ico.Clock />
            </div>
            <div className="qms-kpi-info">
              <span className="qms-kpi-val">{fmtCurrency(metrics.pendingValue)}</span>
              <span className="qms-kpi-label">{metrics.pendingCount} Pending Indents</span>
            </div>
          </div>
          <div className="qms-kpi-card" onClick={() => navigate('/view-accountant-indents')} style={{ cursor: 'pointer' }}>
            <div className="qms-kpi-icon-wrap" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <Ico.CheckCircle />
            </div>
            <div className="qms-kpi-info">
              <span className="qms-kpi-val">{fmtCurrency(metrics.processedValue)}</span>
              <span className="qms-kpi-label">{metrics.processedCount} Processed (Total)</span>
            </div>
          </div>
          <div className="qms-kpi-card">
            <div className="qms-kpi-icon-wrap" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
              <Ico.IndianRupee />
            </div>
            <div className="qms-kpi-info">
              <span className="qms-kpi-val">{fmtCurrency(metrics.pendingValue + metrics.processedValue)}</span>
              <span className="qms-kpi-label">Total Indent Volume</span>
            </div>
          </div>
          <div className="qms-kpi-card">
            <div className="qms-kpi-icon-wrap" style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}>
              <Ico.FileText />
            </div>
            <div className="qms-kpi-info">
              <span className="qms-kpi-val">{metrics.totalCount}</span>
              <span className="qms-kpi-label">Total Indents Handled</span>
            </div>
          </div>
        </div>

        {/* Charts & Tables Row */}
        <div className="qms-dash-bottom-row">
          
          {/* Chart Panel */}
          <div className="qms-panel qms-panel-main">
            <div className="qms-panel-header">
              <h2 className="qms-panel-title">Financial Value Processed (Last 7 Days)</h2>
            </div>
            <div className="qms-chart-wrapper" style={{ height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(val) => `₹${val/1000}k`}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area 
                    type="monotone" 
                    dataKey="Value" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorVal)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Panel: Recent Approvals */}
          <div className="qms-panel qms-panel-side">
            <div className="qms-panel-header">
              <h2 className="qms-panel-title">Recent Approvals</h2>
              <button className="qms-btn-text" onClick={() => navigate('/view-accountant-indents')}>
                View All <Ico.ArrowRight />
              </button>
            </div>
            <div className="qms-table-wrap">
              <table className="qms-table qms-table-compact">
                <thead>
                  <tr>
                    <th>Indent #</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApprovals.map((item, idx) => {
                    const st = statusMeta(item.workflow_stage);
                    const val = calculateIndentValue(item);
                    return (
                      <tr key={idx} onClick={() => navigate('/accountant-purchase-indents', { state: { indentId: item.indent_id } })} style={{ cursor: 'pointer' }}>
                        <td>
                          <div className="qms-txt-bold" style={{ color: '#3b82f6' }}>{item.indent_number || item.indent_id}</div>
                          <div className="qms-txt-sub">{fmtDate(item.created_at)}</div>
                        </td>
                        <td>
                          <div className="qms-txt-bold">{fmtCurrency(val)}</div>
                        </td>
                        <td>
                          <span className={`qms-badge ${st.cls}`}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {recentApprovals.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No recent activity.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;
