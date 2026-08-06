import React from 'react';
import { X } from 'lucide-react';
import './OrderDetailsModal.css';

export const formatDisplayDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const getDeliveryStatus = (order) => {
  return String(order?.delivery_status || order?.deliveryStatus || 'Open');
};

export const statusToBadgeClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('draft')) return 'badge-draft';
  if (s.includes('approved')) return 'badge-approved';
  if (s.includes('admin')) return 'badge-orange';
  if (s.includes('store')) return 'badge-orange';
  return 'badge-draft';
};

export const getPriorityClass = (priority) => {
  const p = String(priority || '').toLowerCase();
  if (p === 'urgent') return 'badge-urgent';
  if (p === 'high') return 'badge-high';
  return 'badge-standard';
};

export const deliveryStatusToBadgeClass = (deliveryStatus) => {
  const value = String(deliveryStatus || 'Open').toLowerCase();
  if (value === 'delivered') return 'badge-delivery-delivered';
  return 'badge-delivery-open';
};

const OrderDetailsModal = ({ selectedOrder, onClose, updateOrderStatus }) => {
  if (!selectedOrder) return null;

  return (
    <div className="order-details-overlay" onClick={onClose}>
      <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="order-details-header">
          <div>
            <div className="order-details-title">Order Details</div>
            <div className="order-details-subtitle">
              {selectedOrder.indent_id || selectedOrder.indentId || selectedOrder.id} • {selectedOrder.customer_name || selectedOrder.customerName}
            </div>
          </div>
          <button className="order-details-close" type="button" onClick={onClose}>
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
              <div className="detail-value">{formatDisplayDate(selectedOrder.indent_date || selectedOrder.indentDate)}</div>
            </div>
            <div className="detail-card">
              <div className="detail-label">Status</div>
              <div className="detail-value">
                <span className={`badge ${selectedOrder.indentStatusClass || statusToBadgeClass(selectedOrder.status || selectedOrder.indentStatus)}`}>
                  {selectedOrder.status || selectedOrder.indentStatus}
                </span>
              </div>
            </div>
            <div className="detail-card">
              <div className="detail-label">Delivery Status</div>
              <div className="detail-value">
                <span className={`badge ${deliveryStatusToBadgeClass(getDeliveryStatus(selectedOrder))}`}>
                  {getDeliveryStatus(selectedOrder)}
                </span>
              </div>
            </div>
            <div className="detail-card">
              <div className="detail-label">Delivered At</div>
              <div className="detail-value">{selectedOrder.delivered_at ? formatDisplayDate(selectedOrder.delivered_at) : '-'}</div>
            </div>
            <div className="detail-card">
              <div className="detail-label">Priority</div>
              <div className="detail-value">
                <span className={`badge ${selectedOrder.priorityClass || getPriorityClass(selectedOrder.priority)}`}>
                  {selectedOrder.priority}
                </span>
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
                    <div>{formatDisplayDate(it.required_by_date || it.requiredByDate)}</div>
                    <div>
                      <span className="details-chip">{it.status || 'Requested'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Raw Materials / PO Date</div>
            <div className="detail-section-content">
              <div className="details-grid details-grid-compact">
                <div className="detail-card">
                  <div className="detail-label">PO Date</div>
                  <div className="detail-value">
                    {selectedOrder.purchase_indent_number || selectedOrder.purchaseIndentNumber || selectedOrder.po_date || selectedOrder.poDate || '-'}
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">Order Date</div>
                  <div className="detail-value">{formatDisplayDate(selectedOrder.indent_date || selectedOrder.indentDate)}</div>
                </div>
              </div>

              <div className="details-table details-table-raw">
                <div className="details-table-head">
                  <div>Component</div>
                  <div>Raw Material</div>
                  <div>Required By</div>
                </div>
                {(Array.isArray(selectedOrder.orderItems) ? selectedOrder.orderItems : []).map((it, idx) => (
                  <div key={`raw-${idx}`} className="details-table-row">
                    <div className="details-strong">{it.component_name || it.component || '-'}</div>
                    <div>{it.raw_material || it.rawMaterial || '-'}</div>
                    <div>{formatDisplayDate(it.required_by_date || it.requiredByDate)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="order-details-footer">
          <div className="status-actions">
            {(() => {
              const orderStatus = selectedOrder.status || selectedOrder.indentStatus || 'Draft';
              const delStatus = getDeliveryStatus(selectedOrder).toLowerCase();
              
              return (
                <>
                  {orderStatus !== 'Draft' && (
                    <button type="button" className="status-btn" onClick={() => updateOrderStatus(selectedOrder.order_id || selectedOrder.id, 'Draft')}>Draft</button>
                  )}
                  
                  {orderStatus === 'Draft' && (
                    <button type="button" className="status-btn" onClick={() => updateOrderStatus(selectedOrder.order_id || selectedOrder.id, 'Pending Store Review')}>Send to Store</button>
                  )}
                  
                  {(orderStatus !== 'Pending Admin Approval' && orderStatus !== 'Admin Approved') && (
                    <button type="button" className="status-btn" onClick={() => updateOrderStatus(selectedOrder.order_id || selectedOrder.id, 'Pending Admin Approval')}>Send to Admin</button>
                  )}
                  
                  {(orderStatus === 'Draft' || orderStatus === 'Pending Store Review') && (
                    <button type="button" className="status-btn" onClick={() => updateOrderStatus(selectedOrder.order_id || selectedOrder.id, 'Admin Approved')}>Approve</button>
                  )}
                  
                  {(orderStatus === 'Admin Approved' && delStatus !== 'delivered') && (
                    <button
                      type="button"
                      className="status-btn status-btn-delivered"
                      onClick={() => {
                        updateOrderStatus(selectedOrder.order_id || selectedOrder.id, {
                          deliveryStatus: 'Delivered',
                          status: 'Closed',
                          comments: 'Marked as delivered to customer'
                        });
                        onClose();
                      }}
                    >
                      Mark Delivered
                    </button>
                  )}
                </>
              );
            })()}
          </div>
          <button className="btn-secondary" type="button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
