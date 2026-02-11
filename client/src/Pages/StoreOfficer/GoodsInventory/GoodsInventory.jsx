import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, ArrowUpRight, X, Trash2, ChevronDown, Package } from 'lucide-react';
import './GoodsInventory.css';
import { inventoryService, materialService } from '../../../services/apiService';

const MaterialManager = () => {
  const navigate = useNavigate();
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Raw Materials');
  const [categorySearch, setCategorySearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditMaterialModal, setShowEditMaterialModal] = useState(false);
  
  // New Category Form
  const [newCategory, setNewCategory] = useState({ name: '' });
  
  // New/Edit Material Form
  const [materialForm, setMaterialForm] = useState({
    id: '',
    materialId: '',
    name: '',
    supplier: '',
    stock: '',
    unit: 'kg',
    minStock: '',
    maxStock: '',
    type: '',
    warehouseLocation: ''
  });

  // Unit options
  const unitOptions = ['kg', 'g', 'pcs', 'sheets', 'ltr', 'ml', 'boxes', 'rolls', 'bags'];
  
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapStatus = (stock, reorder) => {
    if (stock <= 0) return { status: 'Out of Stock', statusClass: 'mm-badge-red', stockClass: 'mm-text-red' };
    if (stock <= reorder) return { status: 'Low Stock', statusClass: 'mm-badge-orange', stockClass: 'mm-text-orange' };
    return { status: 'In Stock', statusClass: 'mm-badge-green', stockClass: 'mm-text-dark' };
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryService.getAllInventory();
      const data = response.data || [];

      const mappedMaterials = data.map((item) => {
        const stock = Number(item.current_stock || 0);
        const reorder = Number(item.reorder_level || item.reorder_point || 0);
        const statusMeta = mapStatus(stock, reorder);

        return {
          id: item.material_code,
          materialId: item.material_id,
          name: item.material_name,
          supplier: item.supplier || '-',
          stock: stock.toLocaleString(),
          unit: item.unit_of_measurement || 'kg',
          status: statusMeta.status,
          statusClass: statusMeta.statusClass,
          stockClass: statusMeta.stockClass,
          type: item.material_type || item.category || 'Material',
          minStock: item.min_stock_level || 0,
          maxStock: item.max_stock_level || 0,
          reorderLevel: reorder || 0,
          warehouseLocation: item.warehouse_location || '-',
          remarks: item.description || ''
        };
      });

      const categoryMap = new Map();
      data.forEach((item) => {
        const name = item.category || 'Uncategorized';
        categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
      });

      const mappedCategories = Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));

      setMaterials(mappedMaterials);
      setCategories(mappedCategories);
      if (mappedCategories.length > 0 && !mappedCategories.find(c => c.name === activeCategory)) {
        setActiveCategory(mappedCategories[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      setError('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categorySearch]);


  // Filter materials based on search
  const filteredMaterials = useMemo(() => {
    if (!materialSearch.trim()) return materials;
    const query = materialSearch.toLowerCase();
    return materials.filter(mat =>
      mat.name.toLowerCase().includes(query) ||
      mat.id.toLowerCase().includes(query) ||
      mat.supplier.toLowerCase().includes(query) ||
      mat.warehouseLocation.toLowerCase().includes(query)
    );
  }, [materialSearch]);

  // Handle Add Category
  const handleAddCategory = () => {
    setNewCategory({ name: '' });
    setShowAddCategoryModal(true);
  };

  // Handle Submit Category
  const handleSubmitCategory = (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      alert('Please enter a category name');
      return;
    }
    alert(`Category "${newCategory.name}" added successfully!`);
    setShowAddCategoryModal(false);
    setNewCategory({ name: '' });
  };

  // Handle Add Material
  const handleAddMaterial = () => {
    setMaterialForm({
      id: '',
      materialId: '',
      name: '',
      supplier: '',
      stock: '',
      unit: 'kg',
      minStock: '',
      maxStock: '',
      type: '',
      warehouseLocation: ''
    });
    setShowAddMaterialModal(true);
  };

  // Handle Submit Material
  const handleSubmitMaterial = (e) => {
    e.preventDefault();
    if (!materialForm.name.trim() || !materialForm.id.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    materialService.createMaterial({
      materialCode: materialForm.id,
      materialName: materialForm.name,
      materialType: materialForm.type || activeCategory,
      category: activeCategory,
      unitOfMeasurement: materialForm.unit,
      minStockLevel: materialForm.minStock,
      maxStockLevel: materialForm.maxStock,
      reorderLevel: materialForm.minStock,
      description: materialForm.remarks
    })
      .then(() => fetchInventory())
      .catch((err) => {
        console.error('Failed to create material:', err);
        alert('Failed to create material');
      })
      .finally(() => setShowAddMaterialModal(false));
  };

  // Handle Delete Material
  const handleDeleteMaterial = () => {
    if (selectedMaterial && window.confirm(`Are you sure you want to delete ${selectedMaterial.name}?`)) {
      alert(`${selectedMaterial.name} deleted successfully!`);
      setSelectedMaterial(null);
    }
  };

  // Handle Update Stock
  const handleUpdateStock = () => {
    if (selectedMaterial) {
      navigate('/store-officer/stock-adjustment', { 
        state: { material: selectedMaterial } 
      });
    }
  };

  // Handle Edit Material
  const handleEditMaterial = () => {
    if (selectedMaterial) {
      setMaterialForm({
        id: selectedMaterial.id,
        materialId: selectedMaterial.materialId,
        name: selectedMaterial.name,
        supplier: selectedMaterial.supplier,
        stock: selectedMaterial.stock,
        unit: selectedMaterial.unit,
        minStock: selectedMaterial.minStock || '',
        maxStock: selectedMaterial.maxStock || '',
        type: selectedMaterial.type,
        warehouseLocation: selectedMaterial.warehouseLocation
      });
      setShowEditMaterialModal(true);
    }
  };

  // Handle Submit Edit Material
  const handleSubmitEditMaterial = (e) => {
    e.preventDefault();
    if (!materialForm.name.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    if (!materialForm.materialId) {
      alert('Material ID is missing');
      return;
    }
    materialService.updateMaterial(materialForm.materialId, {
      materialName: materialForm.name,
      materialType: materialForm.type || activeCategory,
      category: activeCategory,
      unitOfMeasurement: materialForm.unit,
      minStockLevel: materialForm.minStock,
      maxStockLevel: materialForm.maxStock,
      reorderLevel: materialForm.minStock,
      description: materialForm.remarks
    })
      .then(() => fetchInventory())
      .catch((err) => {
        console.error('Failed to update material:', err);
        alert('Failed to update material');
      })
      .finally(() => setShowEditMaterialModal(false));
  };

  // Handle Material Form Change
  const handleMaterialFormChange = (field, value) => {
    setMaterialForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mm-container">
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
          Loading materials...
        </div>
      )}
      
      {/* --- Left Column: Categories --- */}
      <div className="mm-sidebar">
        <div className="mm-sidebar-header">
          <h2 className="mm-panel-title">Material<br/>Categories</h2>
          <button className="mm-btn-outline" onClick={handleAddCategory}>
            <Plus size={16} />
            Add Category
          </button>
        </div>

        <div className="mm-search-box">
          <div className="mm-search-icon"><Search size={18} className="icon-gray" /></div>
          <input 
            type="text" 
            placeholder="Search categories..." 
            className="mm-input-search"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
          />
        </div>

        <div className="mm-category-list">
          {filteredCategories.map((cat, idx) => (
            <div 
              key={idx} 
              className={`mm-category-item ${activeCategory === cat.name ? 'active' : ''}`}
              onClick={() => { setActiveCategory(cat.name); setSelectedMaterial(null); }}
            >
              <div className="mm-cat-name">{cat.name}</div>
              <div className="mm-cat-count">{cat.count} items</div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Middle Column: Items List --- */}
      <div className="mm-main-list">
        <div className="mm-main-header">
          <div>
            <h2 className="mm-panel-title-lg">Items in {activeCategory}</h2>
            <p className="mm-subtitle">Click a material to view full stock details and update quantities.</p>
          </div>
          <button className="mm-btn-primary" onClick={handleAddMaterial}>
            <Plus size={18} />
            Add Material
          </button>
        </div>

        {/* Search Materials */}
        <div className="mm-material-search">
          <div className="mm-search-icon"><Search size={18} className="icon-gray" /></div>
          <input 
            type="text" 
            placeholder="Search materials by name, code, supplier..." 
            className="mm-input-search"
            value={materialSearch}
            onChange={(e) => setMaterialSearch(e.target.value)}
          />
        </div>

        <div className="mm-items-scroll">
          {filteredMaterials.length > 0 ? (
            filteredMaterials.map((item, idx) => (
              <div 
                key={idx} 
                className={`mm-item-card ${selectedMaterial?.id === item.id ? 'active' : ''}`}
                onClick={() => setSelectedMaterial(item)}
              >
                <div className="mm-item-row-top">
                  <div className="mm-item-name">{item.name}</div>
                  <div className="mm-item-right-info">
                    <div className="mm-item-stock-group">
                      <span className={`mm-stock-val ${item.stockClass}`}>{item.stock}</span>
                      <span className={`mm-stock-unit ${item.stockClass}`}>{item.unit}</span>
                    </div>
                    <div className="mm-item-badges">
                      <span className={`mm-status-badge ${item.statusClass}`}>{item.status}</span>
                      <span className="mm-type-badge">{item.type}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mm-item-row-btm">
                  <div className="mm-item-meta">
                    Code: <span className="mm-code">{item.id}</span> • Supplier: <span className="mm-supplier">{item.supplier}</span> • Location: <span className="mm-location">{item.warehouseLocation}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="mm-no-results">
              <p>No materials found matching "{materialSearch}"</p>
            </div>
          )}
        </div>
      </div>

      {/* --- Right Column: Details & Actions --- */}
      <div className={`mm-details-panel ${selectedMaterial ? 'open' : ''}`}>
        <div className="mm-details-header">
          <h2 className="mm-panel-title-md">Material Details & Actions</h2>
          <button className="mm-close-btn" onClick={() => setSelectedMaterial(null)}>
            <X size={20} />
          </button>
        </div>

        {selectedMaterial ? (
          <>
            <div className="mm-form-body">
              
              {/* Selected Material */}
              <div className="mm-form-group">
                <label className="mm-label">Selected Material</label>
                <input 
                  type="text" 
                  className="mm-input" 
                  value={`${selectedMaterial.name} (${selectedMaterial.id})`} 
                  readOnly 
                />
              </div>

              {/* Row 1: Current Stock & Unit */}
              <div className="mm-form-row">
                <div className="mm-form-group half">
                  <label className="mm-label">Current Stock</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={`${selectedMaterial.stock} ${selectedMaterial.unit}`} 
                    readOnly 
                  />
                </div>
                <div className="mm-form-group half">
                  <label className="mm-label">Reorder Level</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={`${selectedMaterial.reorderLevel} ${selectedMaterial.unit}`} 
                    readOnly 
                  />
                </div>
              </div>

              {/* Row 2: Min & Max Stock */}
              <div className="mm-form-row">
                <div className="mm-form-group half">
                  <label className="mm-label">Minimum Stock</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={`${selectedMaterial.minStock || '0'} ${selectedMaterial.unit}`} 
                    readOnly 
                  />
                </div>
                <div className="mm-form-group half">
                  <label className="mm-label">Maximum Stock</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={`${selectedMaterial.maxStock || '0'} ${selectedMaterial.unit}`} 
                    readOnly 
                  />
                </div>
              </div>

              {/* Row 3: Location & Status */}
              <div className="mm-form-row">
                <div className="mm-form-group half">
                  <label className="mm-label">Warehouse Location</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={selectedMaterial.warehouseLocation} 
                    readOnly 
                  />
                </div>
                <div className="mm-form-group half">
                  <label className="mm-label">Status</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={selectedMaterial.status} 
                    readOnly 
                  />
                </div>
              </div>

              {/* Supplier & Type */}
              <div className="mm-form-row">
                <div className="mm-form-group half">
                  <label className="mm-label">Supplier</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={selectedMaterial.supplier} 
                    readOnly 
                  />
                </div>
                <div className="mm-form-group half">
                  <label className="mm-label">Material Type</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={selectedMaterial.type} 
                    readOnly 
                  />
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="mm-details-footer">
              <button className="mm-btn-danger" onClick={handleDeleteMaterial}>
                <Trash2 size={16} />
                Delete
              </button>
              <div className="mm-footer-right">
                <button className="mm-btn-secondary" onClick={handleEditMaterial}>
                  <Edit size={16} />
                  Edit
                </button>
                <button className="mm-btn-primary" onClick={handleUpdateStock}>
                  <ArrowUpRight size={16} />
                  Update Stock
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="mm-empty-state">
            <p>Select a material to view details</p>
          </div>
        )}
      </div>

      {/* ============ ADD CATEGORY MODAL ============ */}
      {showAddCategoryModal && (
        <div className="mm-modal-overlay" onClick={() => setShowAddCategoryModal(false)}>
          <div className="mm-modal" onClick={e => e.stopPropagation()}>
            <div className="mm-modal-header">
              <h2>Add New Category</h2>
              <button className="mm-modal-close" onClick={() => setShowAddCategoryModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitCategory} className="mm-modal-body">
              <div className="mm-form-group">
                <label className="mm-label">Category Name *</label>
                <input 
                  type="text" 
                  className="mm-input" 
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  required
                />
              </div>
              <div className="mm-modal-actions">
                <button type="button" className="mm-btn-secondary" onClick={() => setShowAddCategoryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="mm-btn-primary">
                  <Plus size={16} />
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ ADD MATERIAL MODAL ============ */}
      {showAddMaterialModal && (
        <div className="mm-modal-overlay" onClick={() => setShowAddMaterialModal(false)}>
          <div className="mm-modal mm-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="mm-modal-header">
              <h2>Add New Material</h2>
              <button className="mm-modal-close" onClick={() => setShowAddMaterialModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitMaterial} className="mm-modal-body">
              {/* Material Code & Name */}
              <div className="mm-form-row">
                <div className="mm-form-group half">
                  <label className="mm-label">Material Code *</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={materialForm.id}
                    onChange={(e) => handleMaterialFormChange('id', e.target.value)}
                    required
                  />
                </div>
                <div className="mm-form-group half">
                  <label className="mm-label">Material Name *</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={materialForm.name}
                    onChange={(e) => handleMaterialFormChange('name', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Supplier & Type */}
              <div className="mm-form-row">
                <div className="mm-form-group half">
                  <label className="mm-label">Supplier</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={materialForm.supplier}
                    onChange={(e) => handleMaterialFormChange('supplier', e.target.value)}
                  />
                </div>
                <div className="mm-form-group half">
                  <label className="mm-label">Material Type</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={materialForm.type}
                    onChange={(e) => handleMaterialFormChange('type', e.target.value)}
                  />
                </div>
              </div>

              {/* Current Stock & Unit */}
              <div className="mm-form-row">
                <div className="mm-form-group half">
                  <label className="mm-label">Opening Stock</label>
                  <input 
                    type="number" 
                    className="mm-input" 
                    value={materialForm.stock}
                    onChange={(e) => handleMaterialFormChange('stock', e.target.value)}
                  />
                </div>
                <div className="mm-form-group half">
                  <label className="mm-label">Unit of Measurement *</label>
                  <div className="mm-select-wrapper">
                    <select 
                      className="mm-select"
                      value={materialForm.unit}
                      onChange={(e) => handleMaterialFormChange('unit', e.target.value)}
                    >
                      {unitOptions.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="mm-select-icon" />
                  </div>
                </div>
              </div>

              {/* Min & Max Stock */}
              <div className="mm-form-row">
                <div className="mm-form-group half">
                  <label className="mm-label">Minimum Stock Level</label>
                  <input 
                    type="number" 
                    className="mm-input" 
                    value={materialForm.minStock}
                    onChange={(e) => handleMaterialFormChange('minStock', e.target.value)}
                  />
                </div>
                <div className="mm-form-group half">
                  <label className="mm-label">Maximum Stock Level</label>
                  <input 
                    type="number" 
                    className="mm-input" 
                    value={materialForm.maxStock}
                    onChange={(e) => handleMaterialFormChange('maxStock', e.target.value)}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="mm-form-group">
                <label className="mm-label">Warehouse Location</label>
                <input 
                  type="text" 
                  className="mm-input" 
                  value={materialForm.warehouseLocation}
                  onChange={(e) => handleMaterialFormChange('warehouseLocation', e.target.value)}
                />
              </div>

              <div className="mm-modal-actions">
                <button type="button" className="mm-btn-secondary" onClick={() => setShowAddMaterialModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="mm-btn-primary">
                  <Package size={16} />
                  Add Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ EDIT MATERIAL MODAL ============ */}
      {showEditMaterialModal && (
        <div className="mm-modal-overlay" onClick={() => setShowEditMaterialModal(false)}>
          <div className="mm-modal mm-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="mm-modal-header">
              <h2>Edit Material</h2>
              <button className="mm-modal-close" onClick={() => setShowEditMaterialModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitEditMaterial} className="mm-modal-body">
              {/* Material Code & Name */}
              <div className="mm-form-row">
                <div className="mm-form-group half">
                  <label className="mm-label">Material Code</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={materialForm.id}
                    readOnly
                    style={{ backgroundColor: '#f1f5f9' }}
                  />
                </div>
                <div className="mm-form-group half">
                  <label className="mm-label">Material Name *</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={materialForm.name}
                    onChange={(e) => handleMaterialFormChange('name', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Supplier & Type */}
              <div className="mm-form-row">
                <div className="mm-form-group half">
                  <label className="mm-label">Supplier</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={materialForm.supplier}
                    onChange={(e) => handleMaterialFormChange('supplier', e.target.value)}
                  />
                </div>
                <div className="mm-form-group half">
                  <label className="mm-label">Material Type</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={materialForm.type}
                    onChange={(e) => handleMaterialFormChange('type', e.target.value)}
                  />
                </div>
              </div>

              {/* Current Stock & Unit */}
              <div className="mm-form-row">
                <div className="mm-form-group half">
                  <label className="mm-label">Current Stock</label>
                  <input 
                    type="text" 
                    className="mm-input" 
                    value={materialForm.stock}
                    readOnly
                    style={{ backgroundColor: '#f1f5f9' }}
                  />
                </div>
                <div className="mm-form-group half">
                  <label className="mm-label">Unit of Measurement *</label>
                  <div className="mm-select-wrapper">
                    <select 
                      className="mm-select"
                      value={materialForm.unit}
                      onChange={(e) => handleMaterialFormChange('unit', e.target.value)}
                    >
                      {unitOptions.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="mm-select-icon" />
                  </div>
                </div>
              </div>

              {/* Min & Max Stock */}
              <div className="mm-form-row">
                <div className="mm-form-group half">
                  <label className="mm-label">Minimum Stock Level</label>
                  <input 
                    type="number" 
                    className="mm-input" 
                    value={materialForm.minStock}
                    onChange={(e) => handleMaterialFormChange('minStock', e.target.value)}
                  />
                </div>
                <div className="mm-form-group half">
                  <label className="mm-label">Maximum Stock Level</label>
                  <input 
                    type="number" 
                    className="mm-input" 
                    value={materialForm.maxStock}
                    onChange={(e) => handleMaterialFormChange('maxStock', e.target.value)}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="mm-form-group">
                <label className="mm-label">Warehouse Location</label>
                <input 
                  type="text" 
                  className="mm-input" 
                  value={materialForm.warehouseLocation}
                  onChange={(e) => handleMaterialFormChange('warehouseLocation', e.target.value)}
                />
              </div>

              <div className="mm-modal-actions">
                <button type="button" className="mm-btn-secondary" onClick={() => setShowEditMaterialModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="mm-btn-primary">
                  <Edit size={16} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MaterialManager;