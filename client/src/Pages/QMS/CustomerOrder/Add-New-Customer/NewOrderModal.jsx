import React from 'react';
import './NewOrderModal.css';

// Inline SVGs for pixel-perfect icons without external libraries
const Icons = {
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ),
  Phone: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
  ),
  Mail: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
  ),
  Box: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  ),
  Calendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  )
};

const NewOrderModal = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">New Customer Order</h2>
          <button className="close-btn" onClick={onClose}>
            <Icons.Close />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body">
          <div className="form-content-wrapper">
            
            {/* --- Section 1: Customer Information --- */}
            <div className="form-section">
              <h3 className="section-title">Customer Information</h3>
              <p className="section-subtitle">Enter the contact details for the customer placing the order.</p>

              {/* Customer Name */}
              <div className="form-group">
                <label className="input-label">Customer Name</label>
                <div className="input-wrapper">
                  <div className="input-icon"><Icons.User /></div>
                  <input type="text" className="form-input has-icon" placeholder="e.g. Acme Industries Ltd." />
                </div>
              </div>

              {/* Phone & Email Row */}
              <div className="form-row">
                <div className="form-group half-width">
                  <label className="input-label">Phone Number</label>
                  <div className="input-wrapper">
                    <div className="input-icon"><Icons.Phone /></div>
                    <input type="text" className="form-input has-icon" placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div className="form-group half-width">
                  <label className="input-label">Email Address</label>
                  <div className="input-wrapper">
                    <div className="input-icon"><Icons.Mail /></div>
                    <input type="email" className="form-input has-icon" placeholder="contact@company.com" />
                  </div>
                </div>
              </div>
            </div>

            <hr className="divider" />

            {/* --- Section 2: Order Details --- */}
            <div className="form-section">
              <h3 className="section-title">Order Details</h3>
              <p className="section-subtitle">Specify the component and quantity required.</p>

              {/* Component Requested */}
              <div className="form-group">
                <label className="input-label">Component Requested</label>
                <div className="input-wrapper">
                  <div className="input-icon"><Icons.Box /></div>
                  <input type="text" className="form-input has-icon" placeholder="e.g. 500ml PET Bottle Preform" />
                </div>
              </div>

              {/* Quantity & Date Row */}
              <div className="form-row">
                <div className="form-group half-width">
                  <label className="input-label">Quantity</label>
                  <input type="number" className="form-input" placeholder="0" />
                </div>
                <div className="form-group half-width">
                  <label className="input-label">Required By Date</label>
                  <div className="input-wrapper">
                    <div className="input-icon"><Icons.Calendar /></div>
                    <input type="text" className="form-input has-icon" placeholder="DD/MM/YYYY" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">
            <Icons.Plus />
            Create Order
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewOrderModal;