import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Plus, Search, List, X } from 'lucide-react';
import './CustomerOrders.css'; // Import the standard CSS file
import NewOrderModal from './Add-New-Customer/NewOrderModal';

const STORAGE_KEY = 'sbp_customer_orders_v1';

const monthMap = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const parseCreatedOnDate = (dateText) => {
  if (!dateText) return null;
  const match = String(dateText).match(/Created\s+on\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (!match) return null;
  const day = Number(match[1]);
  const mon = monthMap[match[2]];
  const year = Number(match[3]);
  if (Number.isNaN(day) || Number.isNaN(year) || mon === undefined) return null;
  return new Date(year, mon, day);
};

const getCreatedAt = (order) => {
  if (order?.createdAt) {
    const d = new Date(order.createdAt);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return parseCreatedOnDate(order?.date);
};

const isOpenStatus = (status) => {
  const s = String(status || '').toLowerCase();
  return s !== 'approved' && !s.includes('rejected');
};

const statusToBadgeClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('draft')) return 'badge-draft';
  if (s.includes('approved')) return 'badge-approved';
  if (s.includes('admin')) return 'badge-orange';
  if (s.includes('store')) return 'badge-orange';
  return 'badge-draft';
};

const buildItemsSummary = (order) => {
  const items = Array.isArray(order?.orderItems) ? order.orderItems : [];
  if (items.length === 0) {
    return {
      title: order?.component || '-',
      subtitle: order?.componentDesc || '',
    };
  }
  const first = items[0];
  const remaining = items.length - 1;
  const firstText = first?.component || '-';
  return {
    title: remaining > 0 ? `${firstText} +${remaining} more` : firstText,
    subtitle: order?.componentDesc || `Total items: ${items.length}`,
  };
};

const CustomerOrders = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const currentUser = { name: 'QMS', role: 'QMS' };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // If user has saved orders, use them; if storage is empty, fall back to demo data.
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(parsed);
          setHasHydrated(true);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Fallback demo data
    setOrders([
      {
        id: 'ORD-2025-001',
        date: 'Created on 25 Jan 2025',
        createdAt: '2025-01-25T09:10:00.000Z',
        createdBy: 'System',
        indentId: 'IND-2025-001',
        indentStatus: 'Draft (QMS)',
        indentStatusClass: 'badge-draft',
        customerName: 'TechSol Industries',
        customerPhone: '+91 98450 11223',
        customerEmail: 'sales@techsol.in',
        component: 'SS 304 Sheet 2mm',
        componentDesc: 'Laser cut panels for enclosure',
        items: 2,
        priority: 'Urgent',
        priorityClass: 'badge-urgent',
        indentDate: '2025-01-25',
        requiredByDate: '2025-02-10',
        orderItems: [
          { component: 'SS 304 Sheet 2mm', quantity: 10, requiredByDate: '2025-02-10', itemStatus: 'Requested' },
          { component: 'SS 304 Angle 25x25', quantity: 20, requiredByDate: '2025-02-10', itemStatus: 'Requested' },
        ],
      },
      {
        id: 'ORD-2025-002',
        date: 'Created on 25 Jan 2025',
        createdAt: '2025-01-25T12:40:00.000Z',
        createdBy: 'System',
        indentId: 'IND-2025-002',
        indentStatus: 'Pending Admin Approval',
        indentStatusClass: 'badge-orange',
        customerName: 'Global Motors Pvt Ltd',
        customerPhone: '+91 99620 77445',
        customerEmail: 'purchase@globalmotors.com',
        component: 'Aluminium Angle 50x50',
        componentDesc: 'Frame brackets for G...',
        items: 1,
        priority: 'Standard',
        priorityClass: 'badge-standard',
        indentDate: '2025-01-25',
        requiredByDate: '2025-02-05',
        orderItems: [
          { component: 'Aluminium Angle 50x50', quantity: 12, requiredByDate: '2025-02-05', itemStatus: 'Requested' },
        ],
      },
      {
        id: 'ORD-2025-003',
        date: 'Created on 24 Jan 2025',
        createdAt: '2025-01-24T16:20:00.000Z',
        createdBy: 'System',
        indentId: 'IND-2025-003',
        indentStatus: 'Approved',
        indentStatusClass: 'badge-approved',
        customerName: 'Apex Engineering',
        customerPhone: '+91 90250 33881',
        customerEmail: 'materials@apexeng.in',
        component: 'MS Plates & Hardware',
        componentDesc: 'Base plates, bolts and...',
        items: 4,
        priority: 'Standard',
        priorityClass: 'badge-standard',
        indentDate: '2025-01-24',
        requiredByDate: '2025-02-15',
        orderItems: [
          { component: 'MS Base Plate 10mm', quantity: 4, requiredByDate: '2025-02-15', itemStatus: 'Requested' },
          { component: 'MS Bolt M10', quantity: 80, requiredByDate: '2025-02-15', itemStatus: 'Requested' },
          { component: 'MS Washer M10', quantity: 80, requiredByDate: '2025-02-15', itemStatus: 'Requested' },
          { component: 'MS Nut M10', quantity: 80, requiredByDate: '2025-02-15', itemStatus: 'Requested' },
        ],
      },
    ]);
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    // Don't overwrite localStorage before initial load finishes.
    if (!hasHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders, hasHydrated]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAddOrder = (newOrder) => {
    // Ensure computed fields exist for consistent UI
    const safeOrder = {
      ...newOrder,
      id: newOrder.id || newOrder.indentId,
      indentId: newOrder.indentId || newOrder.id,
      indentStatusClass: newOrder.indentStatusClass || statusToBadgeClass(newOrder.indentStatus),
      createdBy: newOrder.createdBy || currentUser.name,
    };
    setOrders(prevOrders => [safeOrder, ...prevOrders]);
  };

  const updateOrder = (orderId, updates) => {
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, ...updates } : o)));
  };

  const updateOrderStatus = (orderId, indentStatus) => {
    updateOrder(orderId, {
      indentStatus,
      indentStatusClass: statusToBadgeClass(indentStatus),
    });
  };

  const tabs = useMemo(() => {
    const all = orders.length;
    const open = orders.filter(o => isOpenStatus(o.indentStatus)).length;
    const urgent = orders.filter(o => String(o.priority || '').toLowerCase() === 'urgent').length;
    const mine = orders.filter(o => (o.createdBy || '') === currentUser.name).length;
    return [
      { id: 'all', label: 'All', count: all },
      { id: 'open', label: 'Status: Open', count: open },
      { id: 'urgent', label: 'Priority: Urgent', count: urgent },
      { id: 'mine', label: 'My Orders', count: mine },
    ];
  }, [orders, currentUser.name]);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = [...orders];

    // Sort newest first
    list.sort((a, b) => {
      const da = getCreatedAt(a);
      const db = getCreatedAt(b);
      const ta = da ? da.getTime() : 0;
      const tb = db ? db.getTime() : 0;
      return tb - ta;
    });

    if (activeTab === 'open') {
      list = list.filter(o => isOpenStatus(o.indentStatus));
    }
    if (activeTab === 'urgent') {
      list = list.filter(o => String(o.priority || '').toLowerCase() === 'urgent');
    }
    if (activeTab === 'mine') {
      list = list.filter(o => (o.createdBy || '') === currentUser.name);
    }

    if (term) {
      list = list.filter(o => {
        const haystack = [
          o.id,
          o.indentId,
          o.customerName,
          o.customerPhone,
          o.customerEmail,
          o.component,
          o.componentDesc,
          o.indentStatus,
          o.priority,
        ]
          .filter(Boolean)
          .join(' | ')
          .toLowerCase();

        return haystack.includes(term);
      });
    }

    return list;
  }, [orders, activeTab, searchTerm, currentUser.name]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm]);

  const pagination = useMemo(() => {
    const total = filteredOrders.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, total);
    const pageItems = filteredOrders.slice(startIndex, endIndex);
    return { total, totalPages, safePage, startIndex, endIndex, pageItems };
  }, [filteredOrders, page]);

  useEffect(() => {
    // If total pages shrinks (e.g., filtering), keep page in bounds.
    if (page !== pagination.safePage) {
      setPage(pagination.safePage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.safePage]);

  const stats = useMemo(() => {
    const openOrders = orders.filter(o => isOpenStatus(o.indentStatus)).length;
    const pendingAdminApproval = orders.filter(o => String(o.indentStatus || '').toLowerCase().includes('admin')).length;

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const createdToday = orders.filter(o => {
      const d = getCreatedAt(o);
      if (!d) return false;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return key === todayKey;
    }).length;

    return { openOrders, pendingAdminApproval, createdToday };
  }, [orders]);

  return (
    <div className="container">
      
      {/* Top Header */}
      <div className="header-row">
        <h1 className="page-title">Customer Orders</h1>
        <button className="btn-primary" onClick={handleOpenModal}>
          <Plus size={16} />
          Add Customer Order
        </button>
      </div>

      {/* Filters & Search */}
      <div className="filters-row">
        <div className="tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
              type="button"
            >
              <span>{t.label}</span>
              <span className="tab-count">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="search-wrapper">
          <div className="search-icon">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search by customer, order or indent..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="card">
        
        {/* Card Header & Stats */}
        <div className="card-header">
          <div className="card-title-group">
            <div className="icon-box">
               <List size={20} color="#2563eb" />
            </div>
            <h2 className="card-title">Customer Order List</h2>
          </div>

          <div className="stats-container">
            <div className="stat-box">
              <div className="stat-label">OPEN ORDERS</div>
              <div className="stat-value">{String(stats.openOrders).padStart(2, '0')}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">PENDING ADMIN<br/>APPROVAL</div>
              <div className="stat-value">{String(stats.pendingAdminApproval).padStart(2, '0')}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">TODAY</div>
              <div className="stat-value">{String(stats.createdToday).padStart(2, '0')}</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Indent ID / Date</th>
                <th>Customer Details</th>
                <th>Components Requested</th>
                <th>Items</th>
                <th>Status / Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagination.total === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-title">No orders found</div>
                      <div className="empty-subtitle">Try changing filters or search keywords.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                pagination.pageItems.map((order) => {
                  const itemsSummary = buildItemsSummary(order);
                  return (
                    <tr key={order.id}>
                      {/* Indent ID & Date */}
                      <td>
                        <div className="text-main">{order.indentId || order.id}</div>
                        <div className="text-sub">{order.date}</div>
                      </td>

                      {/* Customer Details */}
                      <td>
                        <div className="text-main">{order.customerName}</div>
                        <div className="text-sub">{order.customerPhone}</div>
                        <div className="text-sub">{order.customerEmail}</div>
                      </td>

                      {/* Components */}
                      <td>
                        <div className="text-main">{itemsSummary.title}</div>
                        {itemsSummary.subtitle ? <div className="text-sub">{itemsSummary.subtitle}</div> : null}
                      </td>

                      {/* Items Count */}
                      <td>
                        <div className="text-main">{order.items ?? (Array.isArray(order.orderItems) ? order.orderItems.length : 0)}</div>
                      </td>

                      {/* Status + Priority */}
                      <td>
                        <div className="status-priority-cell">
                          <div className="badges-row">
                            <span className={`badge ${order.indentStatusClass || statusToBadgeClass(order.indentStatus)}`}>
                              {order.indentStatus}
                            </span>
                            <span className={`badge ${order.priorityClass || 'badge-standard'}`}>
                              {order.priority}
                            </span>
                          </div>
                          <div className="text-sub">By: {order.createdBy || '-'}</div>
                        </div>
                      </td>

                      {/* Action Link */}
                      <td>
                        <button
                          className="action-link"
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="pagination-bar">
            <div className="pagination-info">
              Showing <span className="pagination-strong">{pagination.startIndex + 1}</span>-
              <span className="pagination-strong">{pagination.endIndex}</span> of{' '}
              <span className="pagination-strong">{pagination.total}</span>
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="page-btn"
                onClick={() => setPage(1)}
                disabled={pagination.safePage === 1}
                aria-label="First page"
              >
                First
              </button>
              <button
                type="button"
                className="page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.safePage === 1}
                aria-label="Previous page"
              >
                Prev
              </button>

              <div className="page-indicator">
                Page <span className="pagination-strong">{pagination.safePage}</span> / {pagination.totalPages}
              </div>

              <button
                type="button"
                className="page-btn"
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.safePage === pagination.totalPages}
                aria-label="Next page"
              >
                Next
              </button>
              <button
                type="button"
                className="page-btn"
                onClick={() => setPage(pagination.totalPages)}
                disabled={pagination.safePage === pagination.totalPages}
                aria-label="Last page"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Order Modal */}
      {isModalOpen && <NewOrderModal onClose={handleCloseModal} onSubmit={handleAddOrder} />}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="order-details-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-details-header">
              <div>
                <div className="order-details-title">Indent Details</div>
                <div className="order-details-subtitle">{selectedOrder.indentId || selectedOrder.id} • {selectedOrder.customerName}</div>
              </div>
              <button className="order-details-close" type="button" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="order-details-body">
              <div className="details-grid">
                <div className="detail-card">
                  <div className="detail-label">Indent ID</div>
                  <div className="detail-value">{selectedOrder.indentId || '-'}</div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">Indent Date</div>
                  <div className="detail-value">{selectedOrder.indentDate || '-'}</div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">Status</div>
                  <div className="detail-value">
                    <span className={`badge ${selectedOrder.indentStatusClass || statusToBadgeClass(selectedOrder.indentStatus)}`}>{selectedOrder.indentStatus}</span>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">Priority</div>
                  <div className="detail-value">
                    <span className={`badge ${selectedOrder.priorityClass || 'badge-standard'}`}>{selectedOrder.priority}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Customer</div>
                <div className="detail-section-content">
                  <div className="text-main">{selectedOrder.customerName}</div>
                  <div className="text-sub">{selectedOrder.customerPhone}</div>
                  <div className="text-sub">{selectedOrder.customerEmail}</div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Items</div>
                <div className="detail-section-content">
                  <div className="details-table">
                    <div className="details-table-head">
                      <div>Component</div>
                      <div>Qty</div>
                      <div>Required By</div>
                      <div>Status</div>
                    </div>
                    {(Array.isArray(selectedOrder.orderItems) ? selectedOrder.orderItems : []).map((it, idx) => (
                      <div key={idx} className="details-table-row">
                        <div className="details-strong">{it.component || '-'}</div>
                        <div>{it.quantity ?? '-'}</div>
                        <div>{it.requiredByDate || '-'}</div>
                        <div>
                          <span className="details-chip">{it.itemStatus || 'Requested'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="order-details-footer">
              <div className="status-actions">
                <button type="button" className="status-btn" onClick={() => updateOrderStatus(selectedOrder.id, 'Draft (QMS)')}>Draft</button>
                <button type="button" className="status-btn" onClick={() => updateOrderStatus(selectedOrder.id, 'Pending Admin Approval')}>Send to Admin</button>
                <button type="button" className="status-btn" onClick={() => updateOrderStatus(selectedOrder.id, 'Sent to Store')}>Send to Store</button>
                <button type="button" className="status-btn" onClick={() => updateOrderStatus(selectedOrder.id, 'Approved')}>Approve</button>
              </div>
              <button className="btn-secondary" type="button" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;