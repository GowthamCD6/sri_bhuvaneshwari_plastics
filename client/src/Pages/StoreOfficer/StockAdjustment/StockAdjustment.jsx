import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Package, ArrowDownCircle, ArrowUpCircle, Minus, Plus, Search, ChevronLeft, ChevronRight, Check, X, Download } from 'lucide-react';
import './StockAdjustment.css';
import { inventoryService, stockAdjustmentService } from '../../../services/apiService';
import { generateStockAdjustmentPDF } from '../../../services/stockAdjustmentPdfService';

const StockAdjustment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get material from navigation state
  const passedMaterial = location.state?.material;

  // Adjustment mode: 'in' or 'out'
  const [mode, setMode] = useState('in');
  
  // Form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');
  
  // History state
  const [historySearch, setHistorySearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [historyFilter, setHistoryFilter] = useState('All');
  const itemsPerPage = 5;
  
  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [adjustmentResult, setAdjustmentResult] = useState(null);

  const [materials, setMaterials] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [inventoryRes, historyRes] = await Promise.all([
        // Only active materials should be available for stock adjustments
        inventoryService.getAllInventory({ active: 'true' }),
        stockAdjustmentService.getAllAdjustments()
      ]);

      const inventoryData = inventoryRes.data || [];
      const mappedMaterials = inventoryData.map((item) => ({
        id: item.material_id,
        code: item.material_code,
        name: item.material_name,
        // Some older rows use material_type as the category label
        category: item.category || item.material_type || '-',
        stock: Number(item.current_stock || 0),
        unit: item.unit_of_measurement || 'kg',
        minStock: Number(item.min_stock_level || 0),
        maxStock: Number(item.max_stock_level || 0),
        supplier: item.preferred_supplier || item.supplier || '-',
        location: item.warehouse_location || '-'
      }));

      const historyData = historyRes.data || [];
      const mappedHistory = historyData.map((h) => ({
        id: h.adjustment_id,
        date: h.adjusted_at,
        materialId: h.material_id,
        materialName: h.material_name || '-',
        type: h.adjustment_type?.toLowerCase() === 'in' ? 'in' : 'out',
        qty: Number(h.quantity || 0),
        prevStock: Number(h.previous_stock || 0),
        newStock: Number(h.new_stock || 0),
        unit: h.unit_of_measurement || 'kg',
        reason: h.reason || '-',
        notes: h.notes || '',
        adjustedBy: h.adjusted_by_name || 'User'
      }));

      setMaterials(mappedMaterials);
      setHistory(mappedHistory);
    } catch (err) {
      setError('Failed to load stock adjustment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reasons based on mode
  const stockInReasons = ['Purchase Receipt', 'Supplier Return Credit', 'Inventory Correction', 'Production Return', 'Quality Acceptance', 'Transfer In', 'Other'];
  const stockOutReasons = ['Production Usage', 'Damaged/Defective', 'Expired Stock', 'Inventory Correction', 'Transfer Out', 'Sample/Testing', 'Other'];

  // Initialize from passed material
  useEffect(() => {
    if (passedMaterial) {
      setSelectedMaterial(passedMaterial.id);
      setQuantity(0);

      // Prefer category/type from navigation state when available
      const initialCategory = passedMaterial.category || passedMaterial.type || '';
      if (initialCategory) {
        setSelectedCategory(initialCategory);
      }

      // If material has low/out of stock status, default to Stock In
      if (passedMaterial.status === 'Out of Stock' || passedMaterial.status === 'Low Stock' || passedMaterial.status === 'Critical') {
        setMode('in');
      }
    }
  }, [passedMaterial]);

  // If we navigated with a material but category wasn't provided, infer it after materials load
  useEffect(() => {
    if (!passedMaterial) return;
    if (selectedCategory) return;

    const found = materials.find(m => m.code === passedMaterial.id || m.id === passedMaterial.materialId);
    if (found?.category && found.category !== '-') {
      setSelectedCategory(found.category);
    }
  }, [passedMaterial, materials, selectedCategory]);

  // Get current material data
  const currentMaterial = useMemo(() => {
    const fromList = materials.find(m => m.id === selectedMaterial || m.code === selectedMaterial);
    if (fromList) return fromList;

    if (passedMaterial && selectedMaterial === passedMaterial.id) {
      return {
        id: passedMaterial.materialId || passedMaterial.id,
        code: passedMaterial.id,
        name: passedMaterial.name,
        stock: parseInt(passedMaterial.stock) || 0,
        unit: passedMaterial.unit || 'kg',
        minStock: parseInt(passedMaterial.minStock) || 0,
        maxStock: parseInt(passedMaterial.maxStock) || 0,
        supplier: passedMaterial.supplier || '',
        location: passedMaterial.warehouseLocation || ''
      };
    }
    return null;
  }, [selectedMaterial, materials, passedMaterial]);

  // Calculate new stock
  const newStock = useMemo(() => {
    if (!currentMaterial) return 0;
    return mode === 'in' 
      ? currentMaterial.stock + quantity 
      : Math.max(0, currentMaterial.stock - quantity);
  }, [currentMaterial, quantity, mode]);

  // Derive categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(materials.map(m => m.category).filter(c => c && c !== '-')));
    return cats.sort();
  }, [materials]);

  // Materials filtered by selected category
  const materialsInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return materials.filter(m => m.category === selectedCategory);
  }, [materials, selectedCategory]);

  // Filter materials for dropdown (within category)
  const filteredMaterials = useMemo(() => {
    const base = selectedCategory ? materialsInCategory : materials;
    if (!materialSearch.trim()) return base;
    const query = materialSearch.toLowerCase();
    return base.filter(m =>
      m.name.toLowerCase().includes(query) ||
      (m.code && m.code.toString().toLowerCase().includes(query)) ||
      (m.id && m.id.toString().toLowerCase().includes(query))
    );
  }, [materialsInCategory, materials, selectedCategory, materialSearch]);

  // Filter counts (based on full history, ignoring search)
  const filterCounts = useMemo(() => ({
    'All': history.length,
    'Stock In': history.filter(h => h.type === 'in').length,
    'Stock Out': history.filter(h => h.type === 'out').length,
  }), [history]);

  // Filter history
  const filteredHistory = useMemo(() => {
    let result = [...history];
    
    // Filter by type
    if (historyFilter === 'Stock In') {
      result = result.filter(h => h.type === 'in');
    } else if (historyFilter === 'Stock Out') {
      result = result.filter(h => h.type === 'out');
    }
    
    // Search filter
    if (historySearch.trim()) {
      const query = historySearch.toLowerCase();
      result = result.filter(h => 
        String(h.materialName || '').toLowerCase().includes(query) ||
        String(h.materialId ?? '').toLowerCase().includes(query) ||
        String(h.reason || '').toLowerCase().includes(query) ||
        String(h.adjustedBy || '').toLowerCase().includes(query)
      );
    }
    
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [history, historyFilter, historySearch]);

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(start, start + itemsPerPage);
  }, [filteredHistory, currentPage, itemsPerPage]);

  // Handle mode change
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setReason('');
    setQuantity(0);
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedMaterial('');
    setQuantity(0);
    setReason('');
  };

  // Handle material select
  const handleMaterialSelect = (material) => {
    setSelectedMaterial(material.id);
    setShowMaterialDropdown(false);
    setMaterialSearch('');
    setQuantity(0);
  };

  const handleExportPDF = () => {
    const exportData = filteredHistory.map(h => {
      const mat = materials.find(m => m.id === h.materialId || m.code === h.materialId);
      return {
        ...h,
        location: mat ? mat.location : '-'
      };
    });
    generateStockAdjustmentPDF(exportData, historyFilter);
  };

  // Handle submit
  const handleSubmit = () => {
    if (!selectedMaterial) {
      alert('Please select a material');
      return;
    }
    if (quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    if (!reason) {
      alert('Please select a reason');
      return;
    }
    if (mode === 'out' && quantity > currentMaterial.stock) {
      alert('Cannot remove more than available stock');
      return;
    }

    stockAdjustmentService.createAdjustment({
      materialId: currentMaterial.id,
      adjustmentType: mode === 'in' ? 'IN' : 'OUT',
      quantity: quantity,
      unitOfMeasurement: currentMaterial.unit,
      reason: reason,
      notes: notes
    })
      .then(() => fetchData())
      .then(() => {
        setAdjustmentResult({
          material: currentMaterial.name,
          type: mode,
          quantity: quantity,
          unit: currentMaterial.unit,
          prevStock: currentMaterial.stock,
          newStock: newStock
        });
        setShowSuccessModal(true);

        // Reset form
        setSelectedCategory('');
        setSelectedMaterial('');
        setQuantity(0);
        setReason('');
        setNotes('');
      })
      .catch((err) => {
        alert('Failed to create adjustment');
      });
  };

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  // Get initials
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get avatar color
  const getAvatarColor = (name) => {
    const colors = ['sa-avatar-blue', 'sa-avatar-green', 'sa-avatar-orange', 'sa-avatar-purple', 'sa-avatar-red'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="sa-container" onClick={() => setShowMaterialDropdown(false)}>
      
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Main Form Card */}
      <div className="sa-card sa-main-card">
        <div className="sa-card-header-flex">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className={`sa-icon-box ${mode === 'out' ? 'out' : ''}`}>
              <Package size={28} />
            </div>
            <div>
              <h2 className="sa-card-title">
                {mode === 'in' ? 'Stock In - Add Materials to Inventory' : 'Stock Out - Remove Materials from Inventory'}
              </h2>
              <p className="sa-card-subtitle">Fill in the details below to record the stock adjustment</p>
            </div>
          </div>
          <div className="sa-toggle-group">
            <button
              className={`sa-toggle-btn ${mode === 'in' ? 'active in' : ''}`}
              onClick={() => handleModeChange('in')}
            >
              <ArrowDownCircle size={20} />
              Stock In
            </button>
            <button
              className={`sa-toggle-btn ${mode === 'out' ? 'active out' : ''}`}
              onClick={() => handleModeChange('out')}
            >
              <ArrowUpCircle size={20} />
              Stock Out
            </button>
          </div>
        </div>

        <div className="sa-form-grid">
          
          {/* Category Selector */}
          <div className="sa-form-group">
            <label className="sa-label">Select Category *</label>
            <div className="sa-select-wrapper">
              <select
                className="sa-select"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                <option value="">-- Select a category --</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Material Selector (shown only after category is chosen) */}
          {selectedCategory && (
            <div className="sa-form-group">
              <label className="sa-label">Select Material *</label>
              <div className="sa-input-with-action">
                <div className="sa-select-wrapper" onClick={(e) => e.stopPropagation()}>
                  <div
                    className="sa-select-display"
                    onClick={() => setShowMaterialDropdown(!showMaterialDropdown)}
                  >
                    {currentMaterial ? (
                      <span>{currentMaterial.name}</span>
                    ) : (
                      <span className="sa-placeholder">Search or select a material...</span>
                    )}
                  </div>

                  {showMaterialDropdown && (
                    <div className="sa-material-dropdown">
                      <div className="sa-dropdown-search">
                        <Search size={16} />
                        <input
                          type="text"
                          placeholder="Search materials..."
                          value={materialSearch}
                          onChange={(e) => setMaterialSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="sa-dropdown-list">
                        {filteredMaterials.map(material => (
                          <div
                            key={material.id}
                            className={`sa-dropdown-item ${selectedMaterial === material.id ? 'active' : ''}`}
                            onClick={() => handleMaterialSelect(material)}
                          >
                            <div className="sa-dropdown-item-main">
                              <span className="sa-dropdown-item-name">{material.name}</span>
                              <span className="sa-dropdown-item-code">{material.code || material.id}</span>
                            </div>
                            <div className="sa-dropdown-item-stock">
                              {material.stock.toLocaleString()} {material.unit}
                            </div>
                          </div>
                        ))}
                        {filteredMaterials.length === 0 && (
                          <div className="sa-dropdown-empty">No materials found in this category</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {currentMaterial && (
                <div className="sa-material-info">
                  <span>Location: <strong>{currentMaterial.location}</strong></span>
                  <span>Supplier: <strong>{currentMaterial.supplier}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="sa-form-group">
            <label className="sa-label">Quantity to {mode === 'in' ? 'Add' : 'Remove'} ({currentMaterial?.unit || 'units'}) *</label>
            <div className="sa-counter-row">
              <div className="sa-counter-controls">
                <button 
                  className="sa-circle-btn remove" 
                  onClick={() => setQuantity(q => Math.max(0, q - 50))}
                  disabled={quantity <= 0}
                >
                  <Minus size={18} />
                </button>
                <input 
                  type="number" 
                  className="sa-counter-input"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                />
                <button 
                  className="sa-circle-btn add" 
                  onClick={() => setQuantity(q => q + 50)}
                >
                  <Plus size={18} />
                </button>
              </div>
              {currentMaterial && (
                <div className="sa-stock-preview">
                  <span className="sa-stock-current">
                    Current: <strong>{currentMaterial.stock.toLocaleString()} {currentMaterial.unit}</strong>
                  </span>
                  <span className="sa-stock-arrow">→</span>
                  <span className={`sa-stock-new ${mode === 'in' ? 'increase' : 'decrease'}`}>
                    New: <strong>{newStock.toLocaleString()} {currentMaterial.unit}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="sa-form-group">
            <label className="sa-label">Reason for Adjustment *</label>
            <div className="sa-select-wrapper">
              <select 
                className="sa-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Select a reason...</option>
                {(mode === 'in' ? stockInReasons : stockOutReasons).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        <div className="sa-form-footer">
          <button className="sa-btn-cancel" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button 
            className={`sa-btn-submit ${mode === 'out' ? 'out' : ''}`} 
            onClick={handleSubmit}
            disabled={!selectedMaterial || quantity <= 0 || !reason}
          >
            {mode === 'in' ? <Plus size={18} /> : <Minus size={18} />}
            {mode === 'in' ? 'Add to Stock' : 'Remove from Stock'}
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="sa-card sa-history-card">
        <div className="sa-history-header">
          <h2 className="sa-card-title-sm">Recent Adjustment History</h2>
          <div className="sa-history-filters">
            <button 
              className="sa-btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', height: '36px', fontSize: '14px', whiteSpace: 'nowrap' }}
              onClick={handleExportPDF}
            >
              <Download size={16} />
              Export Note
            </button>
            <div className="sa-filter-tabs">
              {['All', 'Stock In', 'Stock Out'].map(filter => (
                <button 
                  key={filter}
                  className={`sa-filter-tab ${historyFilter === filter ? 'active' : ''}`}
                  onClick={() => { setHistoryFilter(filter); setCurrentPage(1); }}
                >
                  {filter}
                  <span className="sa-filter-badge">{filterCounts[filter] ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="sa-search-wrapper">
              <Search size={16} className="sa-search-icon" />
              <input 
                type="text" 
                className="sa-search-input" 
                placeholder="Search history..."
                value={historySearch}
                onChange={(e) => { setHistorySearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Material</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Previous</th>
                <th>New Stock</th>
                <th>Reason</th>
                <th>Adjusted By</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: itemsPerPage }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j}><div className="sa-skeleton-cell" /></td>
                  ))}
                </tr>
              ))}
              {!loading && paginatedHistory.length > 0 ? (
                paginatedHistory.map((row) => (
                  <tr key={row.id}>
                    <td className="sa-date-cell">{formatDate(row.date)}</td>
                    <td>
                      <div className="sa-material-cell">
                        <span className="sa-material-name">{row.materialName}</span>
                        <span className="sa-material-code">{row.materialId}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`sa-type-badge ${row.type}`}>
                        {row.type === 'in' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                        {row.type === 'in' ? 'Stock In' : 'Stock Out'}
                      </span>
                    </td>
                    <td>
                      <span className={`sa-qty-badge ${row.type}`}>
                        {row.type === 'in' ? '+' : '-'}{row.qty} {row.unit}
                      </span>
                    </td>
                    <td className="sa-stock-cell">{row.prevStock.toLocaleString()} {row.unit}</td>
                    <td className="sa-stock-cell sa-font-bold">{row.newStock.toLocaleString()} {row.unit}</td>
                    <td>{row.reason}</td>
                    <td>
                      <div className="sa-user-cell">
                        <div className={`sa-avatar ${getAvatarColor(row.adjustedBy)}`}>
                          {getInitials(row.adjustedBy)}
                        </div>
                        <span>{row.adjustedBy}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="sa-empty-row">
                    <Package size={40} />
                    <p>No adjustment history found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredHistory.length > 0 && (
          <div className="sa-pagination-footer">
            <span className="sa-pagination-info">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} entries
            </span>
            <div className="sa-pagination">
              <button 
                className="sa-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <div className="sa-page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`sa-page-num ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button 
                className="sa-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && adjustmentResult && (
        <div className="sa-modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <div className={`sa-modal-icon ${adjustmentResult.type}`}>
              <Check size={32} />
            </div>
            <h3 className="sa-modal-title">Stock Adjustment Successful!</h3>
            <div className="sa-modal-content">
              <p><strong>{adjustmentResult.material}</strong></p>
              <div className="sa-modal-stats">
                <div className="sa-modal-stat">
                  <span className="sa-modal-stat-label">Previous Stock</span>
                  <span className="sa-modal-stat-value">{adjustmentResult.prevStock.toLocaleString()} {adjustmentResult.unit}</span>
                </div>
                <div className="sa-modal-stat-arrow">
                  {adjustmentResult.type === 'in' ? <Plus size={20} /> : <Minus size={20} />}
                  {adjustmentResult.quantity} {adjustmentResult.unit}
                </div>
                <div className="sa-modal-stat">
                  <span className="sa-modal-stat-label">New Stock</span>
                  <span className={`sa-modal-stat-value ${adjustmentResult.type}`}>{adjustmentResult.newStock.toLocaleString()} {adjustmentResult.unit}</span>
                </div>
              </div>
            </div>
            <div className="sa-modal-actions">
              <button className="sa-btn-secondary" onClick={() => setShowSuccessModal(false)}>
                Add Another
              </button>
              <button className="sa-btn-primary" onClick={() => navigate('/store-officer/goods-inventory')}>
                View Inventory
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StockAdjustment;