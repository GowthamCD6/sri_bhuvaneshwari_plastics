import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Edit, ArrowUpRight, X, Trash2, ChevronDown, Package } from 'lucide-react';
import './GoodsInventory.css';
import { inventoryService, materialService, categoryService } from '../../../services/apiService';

const MaterialManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Raw Materials');
  const [categorySearch, setCategorySearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryStatus, setEditCategoryStatus] = useState(null);
  const [editCategorySubmitting, setEditCategorySubmitting] = useState(false);
  const [showEditMaterialModal, setShowEditMaterialModal] = useState(false);
  
  // New Category Form
  const [newCategory, setNewCategory] = useState({ name: '' });
  
  // New/Edit Material Form
  const [materialForm, setMaterialForm] = useState({
    id: '',
    materialId: '',
    name: '',
    supplier: '',
    color: '',
    stock: '',
    unit: 'kg',
    minStock: '',
    maxStock: '',
    type: '',
    warehouseLocation: '',
    remarks: '',
    specifications: {}
  });

  // Unit options
  const unitOptions = ['kg', 'g', 'pcs', 'sheets', 'ltr', 'ml', 'boxes', 'rolls', 'bags'];
  
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalStatus, setModalStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editModalStatus, setEditModalStatus] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const parseSpecifications = (specifications) => {
    if (!specifications) return {};
    if (typeof specifications === 'object' && !Array.isArray(specifications)) {
      return specifications;
    }

    try {
      const parsed = JSON.parse(specifications);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  };

  const buildMaterialSpecifications = (specifications, color) => {
    const nextSpecifications = specifications && typeof specifications === 'object' && !Array.isArray(specifications)
      ? { ...specifications }
      : {};
    const trimmedColor = color.trim();

    if (trimmedColor) {
      nextSpecifications.color = trimmedColor;
    } else {
      delete nextSpecifications.color;
    }

    return Object.keys(nextSpecifications).length > 0 ? nextSpecifications : null;
  };

  const mapStatus = (stock, reorder) => {
    if (stock <= 0) return { status: 'Out of Stock', statusClass: 'mm-badge-red', stockClass: 'mm-text-red' };
    if (stock <= reorder) return { status: 'Low Stock', statusClass: 'mm-badge-orange', stockClass: 'mm-text-orange' };
    return { status: 'In Stock', statusClass: 'mm-badge-green', stockClass: 'mm-text-dark' };
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both inventory and categories in parallel
      const [inventoryResponse, categoryResponse] = await Promise.all([
        inventoryService.getAllInventory({ active: 'true' }),
        categoryService.getAllCategories()
      ]);
      
      const data = inventoryResponse.data || [];
      const categoriesData = categoryResponse.data || [];

      const mappedMaterials = data.map((item) => {
        const stock = Number(item.current_stock || 0);
        const reorder = Number(item.reorder_level || item.reorder_point || 0);
        const statusMeta = mapStatus(stock, reorder);
        const specifications = parseSpecifications(item.specifications);

        return {
          id: item.material_code,
          materialId: item.material_id,
          name: item.material_name,
          supplier: item.preferred_supplier || '-',
          stock: stock.toLocaleString(),
          unit: item.unit_of_measurement || 'kg',
          status: statusMeta.status,
          statusClass: statusMeta.statusClass,
          stockClass: statusMeta.stockClass,
          type: item.category || 'Material',
          actualMaterialType: item.material_type || '',
          minStock: item.min_stock_level || 0,
          maxStock: item.max_stock_level || 0,
          reorderLevel: reorder || 0,
          warehouseLocation: item.warehouse_location || '-',
          remarks: item.description || '',
          color: typeof specifications.color === 'string' ? specifications.color : '',
          specifications
        };
      });

      // Use categories from the API
      const mappedCategories = categoriesData.map(cat => ({
        name: cat.category,
        count: cat.count
      }));

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

  useEffect(() => {
    if (location.state?.openAddMaterial) {
      handleAddMaterial();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []); 

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    let list = categories;
    if (categorySearch.trim()) {
      list = categories.filter(cat => 
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
      );
    }
    
    // Sort to pin "Raw Materials" and "Components" to the top
    const pinned = ['Raw Materials', 'Components'];
    return [...list].sort((a, b) => {
      const aIsPinned = pinned.includes(a.name);
      const bIsPinned = pinned.includes(b.name);
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      if (aIsPinned && bIsPinned) return pinned.indexOf(a.name) - pinned.indexOf(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [categorySearch, categories]);


  // Filter materials based on search and active category
  const filteredMaterials = useMemo(() => {
    // First filter by active category
    let filtered = materials.filter(mat => mat.type === activeCategory);
    
    // Then filter by search query if present
    if (materialSearch.trim()) {
      const query = materialSearch.toLowerCase().trim();
      filtered = filtered.filter(mat =>
        mat.name.toLowerCase().includes(query) ||
        mat.id.toLowerCase().includes(query) ||
        mat.supplier.toLowerCase().includes(query) ||
        mat.warehouseLocation.toLowerCase().includes(query)
      );
    }

    // Sort by warehouse location ascending
    filtered.sort((a, b) => {
      const locA = (a.warehouseLocation || '').toLowerCase();
      const locB = (b.warehouseLocation || '').toLowerCase();
      return locA.localeCompare(locB);
    });
    
    return filtered;
  }, [materialSearch, materials, activeCategory]);

  // Handle Add Category
  const handleAddCategory = () => {
    setNewCategory({ name: '' });
    setShowAddCategoryModal(true);
  };

  // Handle Submit Category
  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      alert('Please enter a category name');
      return;
    }
    
    try {
      const response = await categoryService.createCategory({ name: newCategory.name.trim() });
      
      if (response.success) {
        const newCat = { name: newCategory.name.trim(), count: 0 };
        setCategories(prev => [...prev, newCat]);
        setActiveCategory(newCategory.name.trim());
        setShowAddCategoryModal(false);
        setNewCategory({ name: '' });
        showToast('success', `Category "${newCategory.name.trim()}" added successfully!`);
      } else {
        showToast('error', response.message || 'Failed to create category');
      }
    } catch (err) {
      console.error('Failed to create category:', err);
      showToast('error', err.message || 'Failed to create category. Please try again.');
    }
  };

  // Handle Edit Category
  const handleEditCategory = () => {
    setEditCategoryName(activeCategory);
    setEditCategoryStatus(null);
    setShowEditCategoryModal(true);
  };

  // Handle Delete Category
  const handleDeleteCategory = async () => {
    setEditCategorySubmitting(true);
    setEditCategoryStatus(null);
    try {
      const deletedName = activeCategory;
      await categoryService.deleteCategory(deletedName);
      setCategories(prev => prev.filter(c => c.name !== deletedName));
      setMaterials(prev => prev.filter(m => m.type !== deletedName));
      const remaining = categories.filter(c => c.name !== deletedName);
      setActiveCategory(remaining.length > 0 ? remaining[0].name : '');
      setShowEditCategoryModal(false);
      setEditCategoryStatus(null);
      showToast('success', `Category "${deletedName}" deleted.`);
    } catch (err) {
      setEditCategoryStatus({ type: 'error', message: err?.data?.message || err?.message || 'Failed to delete category.' });
    } finally {
      setEditCategorySubmitting(false);
    }
  };

  // Handle Submit Edit Category
  const handleSubmitEditCategory = async (e) => {
    e.preventDefault();
    const trimmed = editCategoryName.trim();
    if (!trimmed) { setEditCategoryStatus({ type: 'error', message: 'Category name is required.' }); return; }
    if (trimmed === activeCategory) { setEditCategoryStatus({ type: 'error', message: 'New name is the same as the current name.' }); return; }
    setEditCategorySubmitting(true);
    setEditCategoryStatus(null);
    try {
      await categoryService.updateCategory(activeCategory, trimmed);
      setCategories(prev => prev.map(c => c.name === activeCategory ? { ...c, name: trimmed } : c));
      setMaterials(prev => prev.map(m => m.type === activeCategory ? { ...m, type: trimmed } : m));
      setActiveCategory(trimmed);
      setEditCategoryStatus({ type: 'success', message: `Renamed to "${trimmed}" successfully!` });
      setTimeout(() => { setShowEditCategoryModal(false); setEditCategoryStatus(null); }, 1200);
    } catch (err) {
      setEditCategoryStatus({ type: 'error', message: err?.data?.message || err?.message || 'Failed to rename category.' });
    } finally {
      setEditCategorySubmitting(false);
    }
  };

  // Handle Add Material
  const handleAddMaterial = () => {
    setMaterialForm({
      id: '',
      materialId: '',
      name: '',
      supplier: '',
      color: '',
      stock: '',
      unit: 'kg',
      minStock: '',
      maxStock: '',
      type: '',
      warehouseLocation: '',
      remarks: '',
      specifications: {}
    });
    setModalStatus(null);
    setShowAddMaterialModal(true);
  };

  // Handle Submit Material
  const handleSubmitMaterial = async (e) => {
    e.preventDefault();
    if (!materialForm.name.trim() || !materialForm.id.trim()) {
      setModalStatus({ type: 'error', message: 'Material code and name are required.' });
      return;
    }
    setSubmitting(true);
    setModalStatus(null);
    try {
      const specifications = buildMaterialSpecifications(materialForm.specifications, materialForm.color);

      await materialService.createMaterial({
        materialCode: materialForm.id,
        materialName: materialForm.name,
        materialType: materialForm.type || 'Unspecified',
        category: activeCategory,
        unitOfMeasurement: materialForm.unit,
        minStockLevel: materialForm.minStock || 0,
        maxStockLevel: materialForm.maxStock || null,
        reorderLevel: materialForm.minStock || 0,
        description: materialForm.remarks || '',
        specifications,
        preferredSupplier: materialForm.supplier || null,
        warehouseLocation: materialForm.warehouseLocation || null,
        openingStock: materialForm.stock || 0
      });
      setModalStatus({ type: 'success', message: `"${materialForm.name}" added to ${activeCategory} successfully!` });
      // Refresh list in background — don't block success UX
      fetchInventory().catch(() => {});
      setTimeout(() => {
        setShowAddMaterialModal(false);
        setModalStatus(null);
      }, 1800);
    } catch (err) {
      console.error('Failed to create material:', err);
      const msg = err?.data?.message || err?.message || 'Failed to create material. Please try again.';
      setModalStatus({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Material
  const handleDeleteMaterial = async () => {
    if (!selectedMaterial || deleting) return;
    setDeleting(true);
    try {
      await materialService.deleteMaterial(selectedMaterial.materialId);
      setSelectedMaterial(null);
      fetchInventory().catch(() => {});
    } catch (err) {
      console.error('Failed to delete material:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Handle Update Stock
  const handleUpdateStock = () => {
    if (selectedMaterial) {
      navigate('/stock-adjustment', { 
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
        supplier: (selectedMaterial.supplier === '-' ? '' : selectedMaterial.supplier) || '',
        color: selectedMaterial.color || '',
        stock: selectedMaterial.stock,
        unit: selectedMaterial.unit,
        minStock: selectedMaterial.minStock || '',
        maxStock: selectedMaterial.maxStock || '',
        type: selectedMaterial.actualMaterialType || '',
        warehouseLocation: (selectedMaterial.warehouseLocation === '-' ? '' : selectedMaterial.warehouseLocation) || '',
        remarks: selectedMaterial.remarks || '',
        specifications: selectedMaterial.specifications || {}
      });
      setEditModalStatus(null);
      setShowEditMaterialModal(true);
    }
  };

  // Handle Submit Edit Material
  const handleSubmitEditMaterial = async (e) => {
    e.preventDefault();
    if (!materialForm.name.trim()) {
      setEditModalStatus({ type: 'error', message: 'Material name is required.' });
      return;
    }
    if (!materialForm.materialId) {
      setEditModalStatus({ type: 'error', message: 'Material ID is missing.' });
      return;
    }
    setEditSubmitting(true);
    setEditModalStatus(null);
    try {
      const specifications = buildMaterialSpecifications(materialForm.specifications, materialForm.color);

      await materialService.updateMaterial(materialForm.materialId, {
        materialName: materialForm.name,
        materialType: materialForm.type || 'Unspecified',
        category: activeCategory,
        unitOfMeasurement: materialForm.unit,
        minStockLevel: materialForm.minStock,
        maxStockLevel: materialForm.maxStock,
        reorderLevel: materialForm.minStock,
        description: materialForm.remarks,
        specifications,
        preferredSupplier: materialForm.supplier,
        warehouseLocation: materialForm.warehouseLocation
      });
      setEditModalStatus({ type: 'success', message: `"${materialForm.name}" updated successfully!` });
      fetchInventory().catch(() => {});
      setTimeout(() => {
        setShowEditMaterialModal(false);
        setEditModalStatus(null);
        setSelectedMaterial(null);
      }, 1500);
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to update material.';
      setEditModalStatus({ type: 'error', message: msg });
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Material Form Change
  const handleMaterialFormChange = (field, value) => {
    setMaterialForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mm-container">
      {/* ---- Toast Notification ---- */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          padding: '14px 20px', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          backgroundColor: toast.type === 'success' ? '#16a34a' : '#dc2626',
          color: '#fff', fontSize: '14px', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '10px', minWidth: '260px'
        }}>
          <span style={{ fontSize: '18px' }}>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {/* --- Left Column: Categories --- */}
      <div className="mm-sidebar">
        <div className="mm-sidebar-header">
          <h2 className="mm-panel-title">Material Categories</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button className="mm-btn-outline" onClick={handleAddCategory}>
              <Plus size={16} />
              Add Category
            </button>
            {activeCategory && activeCategory !== 'Raw Materials' && activeCategory !== 'Components' && (
              <button className="mm-btn-icon" onClick={handleEditCategory} title={`Rename "${activeCategory}"`}>
                <Edit size={15} />
              </button>
            )}
          </div>
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
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="mm-skeleton-category" />
              ))
            : filteredCategories.map((cat, idx) => (
            <div 
              key={idx} 
              className={`mm-category-item ${activeCategory === cat.name ? 'active' : ''}`}
              onClick={() => { setActiveCategory(cat.name); setSelectedMaterial(null); }}
            >
              <div className="mm-cat-name">{cat.name}</div>
              <div className="mm-cat-count">{materials.filter(m => m.type === cat.name).length} items</div>
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
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mm-skeleton-item-card" />
            ))
          ) : filteredMaterials.length > 0 ? (
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
              <Package size={48} className="mm-no-results-icon" />
              <p>
                {materialSearch.trim()
                  ? 'No materials found matching your criteria'
                  : 'No materials found in this category'}
              </p>
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
                    value={selectedMaterial.actualMaterialType || 'Unspecified'} 
                    readOnly 
                  />
                </div>
              </div>

              <div className="mm-form-group">
                <label className="mm-label">Color</label>
                <input
                  type="text"
                  className="mm-input"
                  value={selectedMaterial.color || 'Not specified'}
                  readOnly
                />
              </div>

            </div>

            {/* Footer Actions */}
            <div className="mm-details-footer">
              <button className="mm-btn-danger" onClick={handleDeleteMaterial} disabled={deleting}>
                <Trash2 size={16} />
                {deleting ? 'Deleting...' : 'Delete'}
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

      {/* ============ EDIT CATEGORY MODAL ============ */}
      {showEditCategoryModal && (
        <div className="mm-modal-overlay" onClick={() => { setShowEditCategoryModal(false); setEditCategoryStatus(null); }}>
          <div className="mm-modal" onClick={e => e.stopPropagation()}>
            <div className="mm-modal-header">
              <h2>Rename Category</h2>
              <button className="mm-modal-close" onClick={() => { setShowEditCategoryModal(false); setEditCategoryStatus(null); }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitEditCategory} className="mm-modal-body">
              {editCategoryStatus && (
                <div style={{
                  padding: '10px 14px', marginBottom: '14px', borderRadius: '8px',
                  backgroundColor: editCategoryStatus.type === 'success' ? '#dcfce7' : '#fee2e2',
                  color: editCategoryStatus.type === 'success' ? '#166534' : '#991b1b',
                  border: `1px solid ${editCategoryStatus.type === 'success' ? '#86efac' : '#fca5a5'}`,
                  fontSize: '14px', fontWeight: 500
                }}>
                  {editCategoryStatus.type === 'success' ? '✓ ' : '✕ '}{editCategoryStatus.message}
                </div>
              )}
              <div className="mm-form-group">
                <label className="mm-label">Category Name *</label>
                <input
                  type="text"
                  className="mm-input"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="mm-modal-actions">
                <button type="button" className="mm-btn-secondary" onClick={() => { setShowEditCategoryModal(false); setEditCategoryStatus(null); }} disabled={editCategorySubmitting}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCategory}
                  disabled={editCategorySubmitting || editCategoryStatus?.type === 'success'}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: '#ef4444', color: '#fff', fontWeight: 500, fontSize: '14px' }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
                <button type="submit" className="mm-btn-primary" disabled={editCategorySubmitting || editCategoryStatus?.type === 'success'}>
                  <Edit size={16} />
                  {editCategorySubmitting ? 'Saving...' : 'Save'}
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

              {/* Status Banner */}
              {modalStatus && (
                <div style={{
                  padding: '10px 14px',
                  marginBottom: '14px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: modalStatus.type === 'success' ? '#f0fdf4' : '#fff1f2',
                  border: `1px solid ${modalStatus.type === 'success' ? '#86efac' : '#fca5a5'}`,
                  color: modalStatus.type === 'success' ? '#166534' : '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {modalStatus.type === 'success' ? '✓' : '✕'} {modalStatus.message}
                </div>
              )}

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

              <div className="mm-form-group">
                <label className="mm-label">Color</label>
                <input
                  type="text"
                  className="mm-input"
                  value={materialForm.color}
                  onChange={(e) => handleMaterialFormChange('color', e.target.value)}
                  placeholder="Optional"
                />
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
                <button
                  type="button"
                  className="mm-btn-secondary"
                  onClick={() => { setShowAddMaterialModal(false); setModalStatus(null); }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="mm-btn-primary" disabled={submitting || modalStatus?.type === 'success'}>
                  <Package size={16} />
                  {submitting ? 'Adding...' : 'Add Material'}
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
              {editModalStatus && (
                <div style={{
                  padding: '10px 14px', marginBottom: '14px', borderRadius: '8px',
                  backgroundColor: editModalStatus.type === 'success' ? '#dcfce7' : '#fee2e2',
                  color: editModalStatus.type === 'success' ? '#166534' : '#991b1b',
                  border: `1px solid ${editModalStatus.type === 'success' ? '#86efac' : '#fca5a5'}`,
                  fontSize: '14px', fontWeight: 500
                }}>
                  {editModalStatus.type === 'success' ? '✓ ' : '✕ '}{editModalStatus.message}
                </div>
              )}
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

              <div className="mm-form-group">
                <label className="mm-label">Color</label>
                <input
                  type="text"
                  className="mm-input"
                  value={materialForm.color}
                  onChange={(e) => handleMaterialFormChange('color', e.target.value)}
                  placeholder="Optional"
                />
              </div>

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
                <button type="button" className="mm-btn-secondary" onClick={() => { setShowEditMaterialModal(false); setEditModalStatus(null); }} disabled={editSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="mm-btn-primary" disabled={editSubmitting || editModalStatus?.type === 'success'}>
                  <Edit size={16} />
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
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