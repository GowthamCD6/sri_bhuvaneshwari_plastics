import React, { useEffect, useMemo, useState } from 'react';
import { Package, AlertTriangle, XCircle, DollarSign, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Inventory.css';
import { inventoryService } from '../../../services/apiService';

const PAGE_SIZE = 5;

const InventoryDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [allMaterials, setAllMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All Materials');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const mapStatus = (stock, reorder) => {
    if (stock <= 0) return { status: 'Out of Stock', statusClass: 'badge-red', stockColor: 'text-red' };
    if (stock <= reorder) return { status: 'Low Stock', statusClass: 'badge-orange', stockColor: 'text-orange' };
    return { status: 'In Stock', statusClass: 'badge-green', stockColor: 'text-dark' };
  };

  const fetchInventory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await inventoryService.getAllInventory({ active: 'true' });
        const data = response.data || [];
        const mapped = data.map((item) => {
          const stock = Number(item.current_stock || 0);
          const reorder = Number(item.reorder_level || item.reorder_point || 0);
          const cost = Number(item.standard_cost || 0);
          const statusMeta = mapStatus(stock, reorder);
          return {
            code: item.material_code,
            name: item.material_name,
            supplierName: item.preferred_supplier || '-',
            supplier: item.preferred_supplier ? `Supplier: ${item.preferred_supplier}` : 'Supplier: -',
            category: item.category || '-',
            rawStock: stock,
            standardCost: cost,
            stock: stock.toLocaleString(),
            stockColor: statusMeta.stockColor,
            unit: item.unit_of_measurement || '-',
            reorder: reorder.toLocaleString(),
            status: statusMeta.status,
            statusClass: statusMeta.statusClass,
            materialId: item.material_id,
          };
        });
        setAllMaterials(mapped);
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
        setError('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Re-fetch when returning from GoodsInventory after adding a material
  useEffect(() => {
    if (location.state?.refreshInventory) {
      fetchInventory();
      // Clear the state so it doesn't fire again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const categoryTabs = useMemo(() => {
    const categories = Array.from(
      new Set(
        allMaterials
          .map((item) => (item.category || '').trim())
          .filter((c) => Boolean(c) && c !== '-')
      )
    );
    return ['All Materials', ...categories];
  }, [allMaterials]);

  const tabCounts = useMemo(() => {
    const counts = { 'All Materials': allMaterials.length };
    categoryTabs.slice(1).forEach((cat) => {
      counts[cat] = allMaterials.filter(
        (item) => (item.category || '').toLowerCase().trim() === cat.toLowerCase().trim()
      ).length;
    });
    return counts;
  }, [allMaterials, categoryTabs]);

  useEffect(() => {
    if (!categoryTabs.includes(activeTab)) {
      setActiveTab('All Materials');
    }
  }, [categoryTabs, activeTab]);

  const filteredMaterials = useMemo(() => {
    let filtered = allMaterials;

    if (activeTab !== 'All Materials') {
      const selectedCategory = activeTab.toLowerCase().trim();
      filtered = filtered.filter(
        (item) => (item.category || '').toLowerCase().trim() === selectedCategory
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        (item.code || '').toLowerCase().includes(query) ||
        (item.name || '').toLowerCase().includes(query) ||
        (item.category || '').toLowerCase().includes(query) ||
        (item.supplierName || '').toLowerCase().includes(query) ||
        (item.status || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allMaterials, activeTab, searchQuery]);

  const totalValue = useMemo(() =>
    allMaterials.reduce((sum, m) => sum + m.rawStock * m.standardCost, 0)
  , [allMaterials]);

  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedMaterials = filteredMaterials.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

  const handleAddMaterial = () => {
    navigate('/goods-inventory', { state: { openAddMaterial: true } });
  };

  const handleUpdateStock = (item) => {
    navigate('/stock-adjustment', {
      state: { material: item }
    });
  };

  return (
    <div className="inv-container">
      
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* --- Stats Row --- */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Total Materials</span>
            <Package size={20} className="icon-blue" />
          </div>
          {loading ? <div className="inv-skeleton-val" /> : <div className="inv-stat-value">{allMaterials.length}</div>}
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Low Stock Items</span>
            <AlertTriangle size={20} className="icon-orange" />
          </div>
          {loading ? <div className="inv-skeleton-val" /> : <div className="inv-stat-value">{allMaterials.filter(m => m.status === 'Low Stock').length}</div>}
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Out of Stock</span>
            <XCircle size={20} className="icon-red" />
          </div>
          {loading ? <div className="inv-skeleton-val" /> : <div className="inv-stat-value">{allMaterials.filter(m => m.status === 'Out of Stock').length}</div>}
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Total Value</span>
            <DollarSign size={20} className="icon-green" />
          </div>
          {loading ? <div className="inv-skeleton-val" /> : <div className="inv-stat-value">₹{totalValue.toLocaleString('en-IN')}</div>}
        </div>
      </div>

      {/* --- Main Content Card --- */}
      <div className="inv-main-card">
        
        {/* Toolbar (Tabs + Search + Add) */}
        <div className="inv-toolbar">
          <div className="inv-tabs-scroll-box">
            <div className="inv-tabs-fixed">
              <div className="inv-tabs-container" role="tablist" aria-label="Material categories">
                {categoryTabs.map((tab) => (
                  <button
                    key={tab}
                    className={`inv-tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                    <span className="inv-tab-badge">{tabCounts[tab] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="inv-actions">
            <div className="inv-search-wrapper">
              <div className="inv-search-icon">
                <Search size={18} className="icon-gray" />
              </div>
              <input 
                type="text" 
                placeholder="Search inventory..." 
                className="inv-search-input" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="inv-btn-primary" onClick={handleAddMaterial}>
              <Plus size={18} />
              Add Material
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="inv-table-wrapper">
          <table className="inv-table">
            <thead>
              <tr>
                <th>MATERIAL</th>
                <th>CATEGORY</th>
                <th>STOCK LEVEL</th>
                <th>UNIT</th>
                <th>MIN. REQUIRED</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <tr key={`skel-${i}`} className="inv-skeleton-row">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j}><div className="inv-skeleton-cell" /></td>
                  ))}
                </tr>
              ))}
              {!loading && pagedMaterials.map((item, index) => (
                <tr key={index}>
                  {/* Material (name + code) */}
                  <td>
                    <div className="text-bold">{item.name}</div>
                    <div className="text-sub">Code: {item.code} · {item.supplierName !== '-' ? item.supplierName : ''}</div>
                  </td>
                  
                  {/* Category */}
                  <td className="text-normal">{item.category}</td>
                  
                  {/* Stock */}
                  <td className={`font-stock ${item.stockColor}`}>{item.stock}</td>
                  
                  {/* Unit */}
                  <td className="text-normal">{item.unit}</td>
                  
                  {/* Reorder */}
                  <td className="text-light-blue">{item.reorder}</td>
                  
                  {/* Status */}
                  <td>
                    <span className={`status-badge ${item.statusClass}`}>{item.status}</span>
                  </td>
                  
                  {/* Actions */}
                  <td>
                    <div className="action-cell">
                      <button className="btn-update" onClick={() => handleUpdateStock(item)}>Update Stock</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && pagedMaterials.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                    No materials found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="inv-footer">
          <span className="footer-text">Showing {pagedMaterials.length > 0 ? (safePage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(safePage * PAGE_SIZE, filteredMaterials.length)} of {filteredMaterials.length} items</span>
          <div className="pagination-group">
            <button className="btn-page" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
              <ChevronLeft size={16} /> Previous
            </button>
            <button className="btn-page" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InventoryDashboard;