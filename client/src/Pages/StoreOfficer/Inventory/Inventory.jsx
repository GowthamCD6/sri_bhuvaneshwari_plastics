import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, XCircle, DollarSign, Search, Plus, MoreVertical } from 'lucide-react';
import './Inventory.css';
import { inventoryService } from '../../../services/apiService';

const InventoryDashboard = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapStatus = (stock, reorder) => {
    if (stock <= 0) return { status: 'Out of Stock', statusClass: 'badge-red', stockColor: 'text-red' };
    if (stock <= reorder) return { status: 'Low Stock', statusClass: 'badge-orange', stockColor: 'text-orange' };
    return { status: 'In Stock', statusClass: 'badge-green', stockColor: 'text-dark' };
  };

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await inventoryService.getAllInventory();
        const data = response.data || [];
        const mapped = data.map((item) => {
          const stock = Number(item.current_stock || 0);
          const reorder = Number(item.reorder_level || item.reorder_point || 0);
          const statusMeta = mapStatus(stock, reorder);
          return {
            code: item.material_code,
            name: item.material_name,
            supplier: item.supplier ? `Supplier: ${item.supplier}` : 'Supplier: -',
            category: item.category || '-',
            stock: stock.toLocaleString(),
            stockColor: statusMeta.stockColor,
            unit: item.unit_of_measurement || '-',
            reorder: reorder.toLocaleString(),
            status: statusMeta.status,
            statusClass: statusMeta.statusClass
          };
        });
        setMaterials(mapped);
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
        setError('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  return (
    <div className="inv-container">
      
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
          Loading inventory...
        </div>
      )}

      {/* --- Stats Row --- */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Total Materials</span>
            <Package size={20} className="icon-blue" />
          </div>
          <div className="inv-stat-value">{materials.length}</div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Low Stock Items</span>
            <AlertTriangle size={20} className="icon-orange" />
          </div>
          <div className="inv-stat-value">
            {materials.filter(m => m.status === 'Low Stock').length}
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Out of Stock</span>
            <XCircle size={20} className="icon-red" />
          </div>
          <div className="inv-stat-value">
            {materials.filter(m => m.status === 'Out of Stock').length}
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-header">
            <span className="inv-stat-label">Total Value</span>
            <DollarSign size={20} className="icon-green" />
          </div>
          <div className="inv-stat-value">$--</div>
        </div>
      </div>

      {/* --- Main Content Card --- */}
      <div className="inv-main-card">
        
        {/* Toolbar (Tabs + Search + Add) */}
        <div className="inv-toolbar">
          <div className="inv-tabs-container">
            <button className="inv-tab active">All Materials</button>
            <button className="inv-tab">Raw Materials</button>
            <button className="inv-tab">Finished Goods</button>
            <button className="inv-tab">Packaging</button>
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
              />
            </div>
            <button className="inv-btn-primary">
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
                <th>ITEM CODE</th>
                <th>MATERIAL NAME</th>
                <th>CATEGORY</th>
                <th>CURRENT STOCK</th>
                <th>UNIT</th>
                <th>REORDER LEVEL</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((item, index) => (
                <tr key={index}>
                  {/* Code */}
                  <td className="font-code">{item.code}</td>
                  
                  {/* Name & Supplier */}
                  <td>
                    <div className="text-bold">{item.name}</div>
                    <div className="text-sub">{item.supplier}</div>
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
                    <span className={`status-badge ${item.statusClass}`}>
                      {item.status.split(' ').map((word, i) => (
                        <span key={i} style={{display:'block'}}>{word}</span>
                      ))}
                    </span>
                  </td>
                  
                  {/* Actions */}
                  <td>
                    <div className="action-cell">
                      <button className="btn-update">Update Stock</button>
                      <button className="btn-more">
                        <MoreVertical size={18} className="icon-gray" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="inv-footer">
          <span className="footer-text">Showing 1-5 of 142 items</span>
          <div className="pagination-group">
            <button className="btn-page">Previous</button>
            <button className="btn-page">Next</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InventoryDashboard;