import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import {
  dashboardService,
  purchaseIndentService,
  storeRequestService,
  supplierService,
} from "../../../services/apiService";
import "./PurchaseDashboard.css";

// --- Icons -------------------------------------------------------------------
const Ico = {
  ArrowRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Refresh:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  TrendUp:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  BarChart2:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  PieIco:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  Inbox:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  FileText:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Truck:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  AlertTri:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Shield:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  Rupee:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12M15 13H6l6 8"/><path d="M9 8c0 2.5 2 4 6 4"/></svg>,
  Plus:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Users:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

// --- Helpers -----------------------------------------------------------------
const fmtLakh = (n) => {
  if (!n || isNaN(n)) return "0";
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `${(n / 1000).toFixed(1)}K`;
  return Number(n).toLocaleString("en-IN");
};

const fmtDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtDay = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const lastNDays = (n) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split("T")[0];
  });

const statusMeta = (s = "") => {
  const k = String(s).toLowerCase();
  if (k.includes("critical") || k.includes("urgent"))  return { cls: "pd-badge-red",    label: s };
  if (k.includes("approved") || k.includes("verif"))   return { cls: "pd-badge-green",  label: s };
  if (k.includes("progress") || k.includes("process")) return { cls: "pd-badge-blue",   label: s };
  if (k.includes("reject"))                            return { cls: "pd-badge-red",    label: s };
  if (k.includes("pending"))                           return { cls: "pd-badge-yellow", label: s };
  return { cls: "pd-badge-gray", label: s || "Pending" };
};

// --- SVG Semi-circle Gauge ----------------------------------------------------
const SemiGauge = ({ pct = 0, color = "#2563eb", trackColor = "#dbeafe", label, sub, minLabel, maxLabel }) => {
  const cx = 100, cy = 106, r = 76, sw = 13;
  const pathLen = Math.PI * r;
  const filled  = Math.min(Math.max(pct, 0), 100) / 100 * pathLen;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  return (
    <svg viewBox="0 0 200 120" className="pd-gauge-svg" aria-label={`${label} gauge`}>
      <path d={arcPath} fill="none" stroke={trackColor} strokeWidth={sw} strokeLinecap="round" />
      <path d={arcPath} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={`${filled} ${pathLen}`} />
      <text x={cx} y={cy - 20} textAnchor="middle" fontSize="21" fontWeight="800" fill="#0f172a">{label}</text>
      {sub && <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9.5" fill="#64748b">{sub}</text>}
      {minLabel && <text x={cx - r + 6} y={cy + 16} textAnchor="middle" fontSize="8" fill="#94a3b8">{minLabel}</text>}
      {maxLabel && <text x={cx + r - 6} y={cy + 16} textAnchor="middle" fontSize="8" fill="#94a3b8">{maxLabel}</text>}
    </svg>
  );
};

// --- Custom Tooltip -----------------------------------------------------------
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="pd-chart-tooltip">
      {label && <p className="pd-tt-date">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="pd-tt-row">
          <span className="pd-tt-dot" style={{ background: p.color || p.payload?.fill }} />
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

// --- Main Component -----------------------------------------------------------
const PurchaseDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading]         = useState(true);
  const [storeRequests, setStoreReqs] = useState([]);
  const [qmsIndents, setQmsIndents]   = useState([]);
  const [suppliers, setSuppliers]     = useState([]);
  const [apiDash, setApiDash]         = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [srR, idR, supR, dashR] = await Promise.allSettled([
        storeRequestService.getAllRequests(),
        purchaseIndentService.getAllIndents(),
        supplierService.getAllSuppliers(),
        dashboardService.getPurchaseDashboard(),
      ]);
      if (srR.status  === "fulfilled") { const r = srR.value?.data  || srR.value  || []; setStoreReqs(Array.isArray(r) ? r : []); }
      if (idR.status  === "fulfilled") { const r = idR.value?.data  || idR.value  || []; setQmsIndents(Array.isArray(r) ? r : []); }
      if (supR.status === "fulfilled") { const r = supR.value?.data || supR.value || []; setSuppliers(Array.isArray(r) ? r : []); }
      if (dashR.status === "fulfilled") setApiDash(dashR.value?.data || dashR.value || null);
    } catch (err) {
      console.error("Dashboard fetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // -- Derived metrics ------------------------------------------------------
  const metrics = useMemo(() => {
    const totalSR     = storeRequests.length;
    const criticalSR  = storeRequests.filter(r => ["urgent","high","critical"].includes(String(r.priority||"").toLowerCase())).length;
    const verifiedQMS = qmsIndents.filter(i => String(i.status||"").toLowerCase().includes("verif")).length;
    const openPOs     = qmsIndents.filter(i => ["pending","processing","in progress","approved"].some(s => String(i.status||"").toLowerCase().includes(s))).length;
    const activeSuppliers = suppliers.filter(s => String(s.status||"").toLowerCase() === "active").length;
    const procValue   = qmsIndents.reduce((sum, ind) => {
      const mats = Array.isArray(ind.materials) ? ind.materials : [];
      return sum + mats.reduce((s2, mat) => s2 + (Number(mat.estimated_cost||mat.unit_price||0) * Number(mat.quantity||1)), 0);
    }, 0);
    const urgentIndents = qmsIndents.filter(i => ["urgent","high"].includes(String(i.priority||"").toLowerCase())).length;
    // PO Conversion Rate: store requests that have been processed (converted into a purchase indent/PO)
    const processedSR = storeRequests.filter(r => String(r.status||"").toLowerCase() === "processed").length;
    const conversionRate = totalSR > 0 ? Math.round((processedSR / totalSR) * 100) : 0;
    // SLA Compliance: indents closed within 7-day window (exclude rejected, require a valid date)
    const withinSLA = qmsIndents.filter(i => {
      const s = String(i.status||"").toLowerCase();
      if (s.includes("reject")) return false;
      const dt = i.request_date || i.created_at;
      if (!dt) return false;
      return (Date.now() - new Date(dt).getTime()) < 7*24*3600*1000;
    }).length;
    const slaRate = qmsIndents.length > 0
      ? Math.round((withinSLA / qmsIndents.length) * 100)
      : 0;
    // Approval Rate: indents that admin has approved (exclude "Pending X Approval" — still pending)
    const approvedIndents = qmsIndents.filter(i => {
      const s = String(i.status||"").toLowerCase();
      if (s.includes("pending")) return false;
      return s.includes("approv") || s.includes("verif");
    }).length;
    const approvalRate = qmsIndents.length > 0
      ? Math.round((approvedIndents / qmsIndents.length) * 100)
      : 0;
    return {
      totalSR, criticalSR, verifiedQMS, openPOs, activeSuppliers, procValue,
      urgentIndents, conversionRate, slaRate, approvalRate,
      dispatchRate: apiDash?.dispatchRate ?? 61,
    };
  }, [storeRequests, qmsIndents, suppliers, apiDash]);

  // -- Area chart - last 14 days --------------------------------------------
  const areaData = useMemo(() => {
    const days = lastNDays(14);
    const map  = {};
    days.forEach(d => { map[d] = { day: fmtDay(d), requests: 0, processed: 0 }; });
    storeRequests.forEach(r => {
      const day = (r.request_date||r.created_at||"").split("T")[0];
      if (map[day]) map[day].requests++;
    });
    qmsIndents.forEach(i => {
      const day = (i.request_date||i.created_at||"").split("T")[0];
      if (map[day]) map[day].processed++;
    });
    return days.map(d => map[d]);
  }, [storeRequests, qmsIndents]);

  // -- Supplier bar chart ---------------------------------------------------
  const supplierData = useMemo(() =>
    suppliers.slice(0, 6).map(s => ({
      name:   s.supplier_code || s.id || (s.name||"").substring(0,6) || "-",
      Rating: Math.round(Number(s.rating||0) * 20),
      Orders: Number(s.totalOrders||s.total_orders||0),
    })),
  [suppliers]);

  // -- Procurement split donut ----------------------------------------------
  const DONUT_COLORS = ["#2563eb","#10b981","#f59e0b","#ef4444"];
  const donutData = useMemo(() => {
    const sr  = storeRequests.length;
    const qms = qmsIndents.filter(i => i.customer_order_id).length;
    const fu  = qmsIndents.filter(i => String(i.status||"").toLowerCase().includes("follow")).length;
    const pnd = qmsIndents.filter(i => String(i.status||"").toLowerCase().includes("pend")).length;
    return [
      { name: "Store Requests", value: Math.max(sr,1),  fill: DONUT_COLORS[0] },
      { name: "QMS Indents",    value: Math.max(qms,1), fill: DONUT_COLORS[1] },
      { name: "Follow-up POs",  value: Math.max(fu,1),  fill: DONUT_COLORS[2] },
      { name: "Pending Review", value: Math.max(pnd,1), fill: DONUT_COLORS[3] },
    ];
  }, [qmsIndents, storeRequests]);

  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);
  const donutPct   = donutTotal > 0 ? Math.round((donutData[0].value / donutTotal) * 100) : 0;

  // -- Queue table rows -----------------------------------------------------
  const queueRows = useMemo(() => {
    const srRows = storeRequests.slice(0,3).map(r => ({
      ref:    r.request_number || r.id || "-",
      mat:    r.material_description || r.material_name || "Material",
      sub:    r.material_code ? `MAT-${r.material_code}` : "",
      source: "Store Officer",
      date:   r.request_date || r.created_at,
      status: (r.priority||"").toLowerCase() === "urgent" ? "Critical" : (r.status||"Pending"),
      action: () => navigate("/create-purchase-indent"),
      actionLabel: "Create Indent",
    }));
    const idRows = qmsIndents.slice(0,4).map(ind => {
      const mats = Array.isArray(ind.materials) ? ind.materials : [];
      const f = mats[0];
      return {
        ref:    ind.indent_number || ind.id || "-",
        mat:    f?.material_description || "Materials",
        sub:    ind.customer_order_id ? `CO-${ind.customer_order_id}` : (ind.reason||""),
        source: ind.customer_order_id ? "QMS / Customer" : "Purchase",
        date:   ind.request_date || ind.created_at,
        status: ind.status || "Pending",
        action: () => navigate("/qms-indents"),
        actionLabel: "View",
      };
    });
    return [...srRows, ...idRows].slice(0, 6);
  }, [storeRequests, qmsIndents, navigate]);

  // -- Recent store requests feed --------------------------------------------
  const recentSR = useMemo(() => storeRequests.slice(0, 5), [storeRequests]);

  // -- Urgent indents list ---------------------------------------------------
  const urgentList = useMemo(() =>
    qmsIndents
      .filter(i => ["urgent","high","critical"].includes(String(i.priority||"").toLowerCase()) ||
                   String(i.status||"").toLowerCase().includes("pend"))
      .slice(0, 4),
  [qmsIndents]);

  return (
    <div className="pd-page">

      {/* Header */}
      <div className="pd-header">
        <div>
          <h1 className="pd-page-title">Purchase Department Dashboard</h1>
          <p className="pd-page-sub">Live procurement operations overview</p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <button className="pd-outline-btn" onClick={() => navigate("/store-requests")}>
            <Ico.Inbox /> Store Requests
          </button>
          <button className="pd-primary-btn" onClick={() => navigate("/create-purchase-indent")}>
            <Ico.Plus /> Create Indent
          </button>
          <button className={`pd-refresh-btn${loading?" pd-spin":""}`} onClick={fetchAll} disabled={loading}>
            <Ico.Refresh /> {loading ? "Refreshing-" : "Refresh"}
          </button>
        </div>
      </div>

      {/* --- ROW 1 - 4 SEMI-CIRCLE GAUGES ----------------------------------- */}
      <div className="pd-gauge-row">

        <div className="pd-gauge-card">
          <p className="pd-gauge-title">PO Conversion Rate</p>
          {loading ? <div className="pd-skeleton-gauge" /> : (
            <SemiGauge pct={metrics.conversionRate} color="#2563eb" trackColor="#dbeafe"
              label={`${metrics.conversionRate}%`} sub="Indents to POs"
              minLabel="0%" maxLabel="100%" />
          )}
          <p className="pd-gauge-note">
            <span style={{ color:"#2563eb" }}>{metrics.openPOs}</span> open POs in pipeline
          </p>
        </div>

        <div className="pd-gauge-card">
          <p className="pd-gauge-title">SLA Compliance Rate</p>
          {loading ? <div className="pd-skeleton-gauge" /> : (
            <SemiGauge
              pct={metrics.slaRate}
              color={metrics.slaRate >= 80 ? "#10b981" : metrics.slaRate >= 50 ? "#f59e0b" : "#ef4444"}
              trackColor="#d1fae5"
              label={`${metrics.slaRate}%`} sub="Requests within SLA"
              minLabel="0%" maxLabel="100%" />
          )}
          <p className="pd-gauge-note">Closed within 7-day target window</p>
        </div>

        <div className="pd-gauge-card">
          <p className="pd-gauge-title">Approval Rate</p>
          {loading ? <div className="pd-skeleton-gauge" /> : (
            <SemiGauge pct={metrics.approvalRate} color="#7c3aed" trackColor="#ede9fe"
              label={`${metrics.approvalRate}%`} sub="Indents approved"
              minLabel="0%" maxLabel="100%" />
          )}
          <p className="pd-gauge-note">
            <span style={{ color:"#10b981" }}>{metrics.verifiedQMS}</span> QMS verified indents
          </p>
        </div>

        <div className="pd-gauge-card">
          <p className="pd-gauge-title">Urgent Requests</p>
          {loading ? <div className="pd-skeleton-gauge" /> : (
            <SemiGauge
              pct={metrics.totalSR > 0 ? Math.round((metrics.criticalSR / Math.max(metrics.totalSR,1)) * 100) : 0}
              color={metrics.criticalSR > 0 ? "#ef4444" : "#10b981"}
              trackColor="#fee2e2"
              label={String(metrics.criticalSR + metrics.urgentIndents)}
              sub={metrics.criticalSR + metrics.urgentIndents === 1 ? "urgent item" : "urgent items"}
              minLabel="Critical" maxLabel="Urgent" />
          )}
          <p className="pd-gauge-note">
            <span style={{ color:"#ef4444" }}>{metrics.criticalSR}</span> critical -{" "}
            <span style={{ color:"#f59e0b" }}>{metrics.urgentIndents}</span> urgent indents
          </p>
        </div>

      </div>

      {/* --- ROW 2 - AREA CHART + BAR CHART --------------------------------- */}
      <div className="pd-charts-row">

        {/* Area chart - 14 days movement */}
        <div className="pd-panel">
          <div className="pd-panel-head">
            <div className="pd-panel-title-wrap">
              <span className="pd-panel-icon pd-icon-blue"><Ico.TrendUp /></span>
              <h2 className="pd-panel-title">Store Requests vs Processed Indents (14 Days)</h2>
            </div>
          </div>
          {loading ? <div className="pd-skeleton-chart" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={areaData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradPro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill:"#94a3b8" }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:"12px", paddingTop:"8px" }} />
                <Area type="monotone" dataKey="requests"  name="Store Requests"    stroke="#2563eb" strokeWidth={2.5} fill="url(#gradReq)" dot={false} activeDot={{ r:5, fill:"#2563eb" }} />
                <Area type="monotone" dataKey="processed" name="Processed Indents" stroke="#10b981" strokeWidth={2.5} fill="url(#gradPro)" dot={false} activeDot={{ r:5, fill:"#10b981" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

                {/* Procurement split donut */}
        <div className="pd-panel pd-panel-donut">
          <div className="pd-panel-head">
            <div className="pd-panel-title-wrap">
              <span className="pd-panel-icon pd-icon-teal"><Ico.PieIco /></span>
              <h2 className="pd-panel-title">Procurement Split</h2>
            </div>
          </div>
          {loading ? <div className="pd-skeleton-donut" /> : (
            <>
              <div className="pd-donut-center-wrap">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={88}
                      paddingAngle={3} dataKey="value"
                      startAngle={90} endAngle={-270}
                    >
                      {donutData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pd-donut-overlay">
                  <span className="pd-donut-pct">{donutPct}%</span>
                  <span className="pd-donut-sub">Store Reqs</span>
                </div>
              </div>
              <div className="pd-donut-legend">
                {donutData.map((row) => (
                  <div key={row.name} className="pd-legend-row">
                    <span className="pd-legend-dot" style={{ background: row.fill }} />
                    <span className="pd-legend-label">{row.name}</span>
                    <span className="pd-legend-count">{row.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* --- ROW 3 - DONUT + QUEUE TABLE ------------------------------------- */}
      {false && <div className="pd-mid-row">

        {/* Procurement split donut */}
        <div className="pd-panel pd-panel-donut">
          <div className="pd-panel-head">
            <div className="pd-panel-title-wrap">
              <span className="pd-panel-icon pd-icon-teal"><Ico.PieIco /></span>
              <h2 className="pd-panel-title">Procurement Split</h2>
            </div>
          </div>
          {loading ? <div className="pd-skeleton-donut" /> : (
            <>
              <div className="pd-donut-center-wrap">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={88}
                      paddingAngle={3} dataKey="value"
                      startAngle={90} endAngle={-270}
                    >
                      {donutData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pd-donut-overlay">
                  <span className="pd-donut-pct">{donutPct}%</span>
                  <span className="pd-donut-sub">Store Reqs</span>
                </div>
              </div>
              <div className="pd-donut-legend">
                {donutData.map((row) => (
                  <div key={row.name} className="pd-legend-row">
                    <span className="pd-legend-dot" style={{ background: row.fill }} />
                    <span className="pd-legend-label">{row.name}</span>
                    <span className="pd-legend-count">{row.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Live queue table - removed */}
        {false && <div className="pd-panel pd-panel-queue">
          <div className="pd-panel-head">
            <div className="pd-panel-title-wrap">
              <span className="pd-panel-icon pd-icon-purple"><Ico.FileText /></span>
              <h2 className="pd-panel-title">Live Procurement Queue</h2>
            </div>
            <button className="pd-link-btn" onClick={() => navigate("/qms-indents")}>
              All Indents <span><Ico.ArrowRight /></span>
            </button>
          </div>
          {loading ? (
            <div className="pd-skeleton-rows">
              {[1,2,3,4].map(i => <div key={i} className="pd-skeleton-row" />)}
            </div>
          ) : queueRows.length === 0 ? (
            <div className="pd-empty-state pd-empty-green">
              <span className="pd-empty-ico"><Ico.Shield /></span>
              <p>No pending items - Queue is clear!</p>
            </div>
          ) : (
            <div className="pd-table-wrap">
              <table className="pd-table">
                <thead>
                  <tr>
                    <th>Ref#</th>
                    <th>Material</th>
                    <th>Source</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queueRows.map((row, i) => {
                    const sm = statusMeta(row.status);
                    return (
                      <tr key={i}>
                        <td><span className="pd-ref-id">{row.ref}</span></td>
                        <td>
                          <p className="pd-cell-main">{row.mat}</p>
                          {row.sub && <p className="pd-cell-sub">{row.sub}</p>}
                        </td>
                        <td className="pd-date-cell">{row.source}</td>
                        <td className="pd-date-cell">{fmtDate(row.date)}</td>
                        <td><span className={`pd-badge ${sm.cls}`}>{sm.label}</span></td>
                        <td>
                          <button className="pd-tbl-act-btn" onClick={row.action}>
                            {row.actionLabel} <Ico.ArrowRight />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>}

      </div>}

      {/* --- ROW 4 - STORE REQUEST FEED + URGENT INDENTS --------------------- */}
      <div className="pd-bot-row">

        {/* Recent store requests feed */}
        <div className="pd-panel pd-panel-half">
          <div className="pd-panel-head">
            <div className="pd-panel-title-wrap">
              <span className="pd-panel-icon pd-icon-orange"><Ico.Inbox /></span>
              <h2 className="pd-panel-title">Recent Store Requests</h2>
            </div>
            <button className="pd-link-btn" onClick={() => navigate("/store-requests")}>
              View All <span><Ico.ArrowRight /></span>
            </button>
          </div>
          {loading ? (
            <div className="pd-skeleton-rows">{[1,2,3,4].map(i=><div key={i} className="pd-skeleton-row"/>)}</div>
          ) : recentSR.length === 0 ? (
            <div className="pd-empty-state pd-empty-green">
              <span className="pd-empty-ico"><Ico.Shield /></span>
              <p>No pending store requests</p>
            </div>
          ) : (
            <div className="pd-request-feed">
              {recentSR.map((r, i) => {
                const initials = (r.requested_by || r.department || "SR").substring(0,2).toUpperCase();
                const sm = statusMeta(r.priority === "urgent" ? "Critical" : r.status);
                return (
                  <div className="pd-request-item" key={r.id || i}>
                    <div className="pd-req-avatar">{initials}</div>
                    <div className="pd-req-body">
                      <p className="pd-req-title">{r.material_description || r.material_name || "Material Request"}</p>
                      <p className="pd-req-meta">
                        {r.request_number || `SR-${r.id}`} - {fmtDate(r.request_date||r.created_at)}
                      </p>
                    </div>
                    <div className="pd-req-right">
                      <span className={`pd-badge ${sm.cls}`}>{sm.label}</span>
                      <span className="pd-req-qty">{r.quantity} {r.unit_of_measurement||""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Urgent indents needing action */}
        <div className="pd-panel pd-panel-half">
          <div className="pd-panel-head">
            <div className="pd-panel-title-wrap">
              <span className="pd-panel-icon pd-icon-red"><Ico.AlertTri /></span>
              <h2 className="pd-panel-title">Indents Needing Action</h2>
            </div>
            <button className="pd-link-btn" onClick={() => navigate("/qms-indents")}>
              View All <span><Ico.ArrowRight /></span>
            </button>
          </div>
          {loading ? (
            <div className="pd-skeleton-rows">{[1,2,3].map(i=><div key={i} className="pd-skeleton-row"/>)}</div>
          ) : urgentList.length === 0 ? (
            <div className="pd-empty-state pd-empty-green">
              <span className="pd-empty-ico"><Ico.Shield /></span>
              <p>No urgent indents - All clear!</p>
            </div>
          ) : (
            <div className="pd-alert-list">
              {urgentList.map((ind, idx) => {
                const mats = Array.isArray(ind.materials) ? ind.materials : [];
                const isUrgent = ["urgent","high","critical"].includes(String(ind.priority||"").toLowerCase());
                return (
                  <div className={`pd-alert-item${isUrgent?" pd-alert-urgent":""}`} key={ind.indent_id||ind.id||idx}>
                    <div className="pd-alert-item-top">
                      <div>
                        <p className="pd-alert-name">{ind.indent_number || `IND-${ind.indent_id||ind.id}`}</p>
                        <p className="pd-alert-code">
                          {ind.customer_name || ind.reason || "Procurement Indent"} - {mats.length} material{mats.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className={`pd-badge ${statusMeta(ind.status).cls}`}>{ind.status || "Pending"}</span>
                    </div>
                    <div className="pd-alert-meta">
                      <span className="pd-alert-date">{fmtDate(ind.created_at||ind.request_date)}</span>
                      <button className="pd-tbl-act-btn" onClick={() => navigate("/qms-indents")}>
                        Process <Ico.ArrowRight />
                      </button>
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

export default PurchaseDashboard;
