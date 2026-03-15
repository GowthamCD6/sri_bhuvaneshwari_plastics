import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Plus, Search, List, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CustomerOrders.css';
import NewOrderModal from './Add-New-Customer/NewOrderModal';
import { customerOrderService, purchaseIndentService } from '../../../services/apiService';
import useAuthStore from '../../../store/authStore';

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

const getPriorityClass = (priority) => {
  const p = String(priority || '').toLowerCase();
  if (p === 'urgent') return 'badge-urgent';
  if (p === 'high') return 'badge-high';
  return 'badge-standard';
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
  const firstText = first?.component_name || first?.component || '-';
  return {
    title: remaining > 0 ? `${firstText} +${remaining} more` : firstText,
    subtitle: order?.componentDesc || `${items.length} item${items.length > 1 ? 's' : ''}`,
  };
};

const CustomerOrders = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentUser = { name: user?.username || 'QMS', role: user?.roleName || 'QMS' };

  // Fetch orders from API
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerOrderService.getAllOrders({});
      setOrders(response.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAddOrder = async (newOrder) => {
    try {
      const response = await customerOrderService.createOrder(newOrder);
      if (response.success) {
        setOrders(prev => [response.data, ...prev]);
        handleCloseModal();
      }
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Failed to create order: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle View button - navigate to purchase indent with order data
  const handleViewOrder = async (order) => {
    const linkedPurchaseIndentId = order.purchase_indent_id || order.purchaseIndentId || null;

    if (linkedPurchaseIndentId) {
      navigate('/qms-purchase-indents', {
        state: {
          indentId: linkedPurchaseIndentId,
          fromCustomerOrder: false,
        }
      });
      return;
    }

    // Fallback for older records where direct linkage may be missing.
    try {
      const indentsResponse = await purchaseIndentService.getAllIndents({});
      const allIndents = Array.isArray(indentsResponse?.data)
        ? indentsResponse.data
        : (Array.isArray(indentsResponse?.data?.indents) ? indentsResponse.data.indents : []);

      const matchedIndent = allIndents.find((indent) => {
        const sameOrderId = Number(indent.customer_order_id) === Number(order.order_id);
        const sameOrderIndentNumber = String(indent.customer_order_indent_id || '') === String(order.indent_id || '');
        return sameOrderId || sameOrderIndentNumber;
      });

      if (matchedIndent?.indent_id) {
        navigate('/qms-purchase-indents', {
          state: {
            indentId: matchedIndent.indent_id,
            fromCustomerOrder: false,
          }
        });
        return;
      }
    } catch (lookupError) {
      console.error('Could not resolve linked purchase indent from order list:', lookupError);
    }

    navigate('/qms-purchase-indents', {
      state: {
        fromCustomerOrder: true,
        orderData: {
          orderId: order.order_id,
          indentId: order.indent_id,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          customerEmail: order.customer_email,
          indentDate: order.indent_date,
          requiredByDate: order.required_by_date || order.indent_date,
          orderItems: order.orderItems || []
        }
      }
    });
  };

  const updateOrderStatus = async (orderId, status, comments = '') => {
    try {
      setLoading(true);
      await customerOrderService.updateOrderStatus(orderId, { status, comments });
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const tabs = useMemo(() => {
    const all = orders.length;
    const open = orders.filter(o => isOpenStatus(o.status || o.indentStatus)).length;
    const urgent = orders.filter(o => String(o.priority || '').toLowerCase() === 'urgent').length;
    const mine = orders.filter(o => Number(o.created_by) === Number(user?.userId)).length;
    return [
      { id: 'all', label: 'All', count: all },
      { id: 'open', label: 'Status: Open', count: open },
      { id: 'urgent', label: 'Priority: Urgent', count: urgent },
      { id: 'mine', label: 'My Orders', count: mine },
    ];
  }, [orders, user?.userId]);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = [...orders];

    // Sort newest first
    list.sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at) : getCreatedAt(a);
      const db = b.created_at ? new Date(b.created_at) : getCreatedAt(b);
      const ta = da ? da.getTime() : 0;
      const tb = db ? db.getTime() : 0;
      return tb - ta;
    });

    if (activeTab === 'open') {
      list = list.filter(o => isOpenStatus(o.status || o.indentStatus));
    }
    if (activeTab === 'urgent') {
      list = list.filter(o => String(o.priority || '').toLowerCase() === 'urgent');
    }
    if (activeTab === 'mine') {
      list = list.filter(o => Number(o.created_by) === Number(user?.userId));
    }

    if (term) {
      list = list.filter(o => {
        const haystack = [
          o.order_id,
          o.id,
          o.indent_id,
          o.indentId,
          o.customer_name,
          o.customerName,
          o.customer_phone,
          o.customerPhone,
          o.customer_email,
          o.customerEmail,
          o.component,
          o.componentDesc,
          o.status,
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
  }, [orders, activeTab, searchTerm, user?.userId]);

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
    const openOrders = orders.filter(o => isOpenStatus(o.status || o.indentStatus)).length;
    const pendingAdminApproval = orders.filter(o => String(o.status || o.indentStatus || '').toLowerCase().includes('admin')).length;

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const createdToday = orders.filter(o => {
      const d = o.created_at ? new Date(o.created_at) : getCreatedAt(o);
      if (!d) return false;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return key === todayKey;
    }).length;

    return { openOrders, pendingAdminApproval, createdToday };
  }, [orders]);

  return (
    <div className="container">
      
      {/* Error Display */}
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading Display */}
      {loading && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
          Loading orders...
        </div>
      )}

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
                  const indentId = order.indent_id || order.indentId || order.id;
                  const linkedPurchaseIndent = order.purchase_indent_number || (order.purchase_indent_id ? `PI Record #${order.purchase_indent_id}` : null);
                  const customerName = order.customer_name || order.customerName;
                  const customerPhone = order.customer_phone || order.customerPhone;
                  const customerEmail = order.customer_email || order.customerEmail;
                  const status = order.status || order.indentStatus;
                  const priority = order.priority || 'Standard';
                  const createdBy = order.created_by || order.createdBy || '-';
                  const createdAt = order.created_at || order.createdAt;
                  const dateDisplay = createdAt 
                    ? new Date(createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : (order.date || '-');
                  const itemsCount = order.items_count || order.items || (Array.isArray(order.orderItems) ? order.orderItems.length : 0);

                  return (
                    <tr key={order.order_id || order.id}>
                      {/* Indent ID & Date */}
                      <td>
                        <div className="text-main">{indentId}</div>
                        <div className="text-sub">{dateDisplay}</div>
                        {linkedPurchaseIndent && <div className="text-sub">{linkedPurchaseIndent}</div>}
                      </td>

                      {/* Customer Details */}
                      <td>
                        <div className="text-main">{customerName}</div>
                        <div className="text-sub">{customerPhone}</div>
                        <div className="text-sub">{customerEmail}</div>
                      </td>

                      {/* Components */}
                      <td>
                        <div className="text-main">{itemsSummary.title}</div>
                        {itemsSummary.subtitle ? <div className="text-sub">{itemsSummary.subtitle}</div> : null}
                      </td>

                      {/* Items Count */}
                      <td>
                        <div className="text-main">{itemsCount}</div>
                      </td>

                      {/* Status + Priority */}
                      <td>
                        <div className="status-priority-cell">
                          <div className="badges-row">
                            <span className={`badge ${order.indentStatusClass || statusToBadgeClass(status)}`}>
                              {status}
                            </span>
                            <span className={`badge ${order.priorityClass || getPriorityClass(priority)}`}>
                              {priority}
                            </span>
                          </div>
                          <div className="text-sub">By: {createdBy}</div>
                        </div>
                      </td>

                      {/* Action Link */}
                      <td>
                        <button
                          className="action-link"
                          type="button"
                          onClick={() => handleViewOrder(order)}
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
                <div className="order-details-title">Order Details</div>
                <div className="order-details-subtitle">{selectedOrder.indent_id || selectedOrder.indentId || selectedOrder.id} • {selectedOrder.customer_name || selectedOrder.customerName}</div>
              </div>
              <button className="order-details-close" type="button" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="order-details-body">
              <div className="details-grid">
                <div className="detail-card">
                  <div className="detail-label">Indent ID</div>
                  <div className="detail-value">{selectedOrder.indent_id || selectedOrder.indentId || '-'}</div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">Indent Date</div>
                  <div className="detail-value">{selectedOrder.indent_date || selectedOrder.indentDate || '-'}</div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">Status</div>
                  <div className="detail-value">
                    <span className={`badge ${selectedOrder.indentStatusClass || statusToBadgeClass(selectedOrder.status || selectedOrder.indentStatus)}`}>{selectedOrder.status || selectedOrder.indentStatus}</span>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">Priority</div>
                  <div className="detail-value">
                    <span className={`badge ${selectedOrder.priorityClass || getPriorityClass(selectedOrder.priority)}`}>{selectedOrder.priority}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Customer</div>
                <div className="detail-section-content">
                  <div className="text-main">{selectedOrder.customer_name || selectedOrder.customerName}</div>
                  <div className="text-sub">{selectedOrder.customer_phone || selectedOrder.customerPhone}</div>
                  <div className="text-sub">{selectedOrder.customer_email || selectedOrder.customerEmail}</div>
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
                        <div className="details-strong">{it.component_name || it.component || '-'}</div>
                        <div>{it.quantity ?? '-'}</div>
                        <div>{it.required_by_date || it.requiredByDate || '-'}</div>
                        <div>
                          <span className="details-chip">{it.status || 'Requested'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="order-details-footer">
              <div className="status-actions">
                <button type="button" className="status-btn" onClick={() => updateOrderStatus(selectedOrder.order_id || selectedOrder.id, 'Draft')}>Draft</button>
                <button type="button" className="status-btn" onClick={() => updateOrderStatus(selectedOrder.order_id || selectedOrder.id, 'Pending Store Review')}>Send to Store</button>
                <button type="button" className="status-btn" onClick={() => updateOrderStatus(selectedOrder.order_id || selectedOrder.id, 'Pending Admin Approval')}>Send to Admin</button>
                <button type="button" className="status-btn" onClick={() => updateOrderStatus(selectedOrder.order_id || selectedOrder.id, 'Admin Approved')}>Approve</button>
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