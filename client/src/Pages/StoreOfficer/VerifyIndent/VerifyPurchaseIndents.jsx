import React from 'react';
import './VerifyPurchaseIndents.css';

// SVG Icons
const Icons = {
  FileText: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
  )
};

const VerifyPurchaseIndents = () => {
  const indents = [
    {
      id: "PI-2024-089",
      subId: "Customer Order #CO-1023",
      reqName: "Ravi Kumar",
      reqRole: "QMS Officer",
      dept: "QMS",
      date: "12 Jan 2024, 10:32 AM",
      urgency: "Critical",
      urgencyClass: "badge-critical",
      items: "3 Materials",
      status: "Pending Store Verification",
      statusClass: "status-orange",
      isPrimaryAction: true // The top button is red
    },
    {
      id: "PI-2024-086",
      subId: "Customer Order #CO-1018",
      reqName: "Priya Sharma",
      reqRole: "QMS Engineer",
      dept: "QMS",
      date: "11 Jan 2024, 03:15 PM",
      urgency: "Urgent",
      urgencyClass: "badge-urgent",
      items: "5 Materials",
      status: "Verified & Sent to QMS",
      statusClass: "status-green",
      isPrimaryAction: false
    },
    {
      id: "PI-2024-080",
      subId: "Stock Replenishment",
      reqName: "Anita Devi",
      reqRole: "QMS Coordinator",
      dept: "QMS",
      date: "09 Jan 2024, 11:05 AM",
      urgency: "Normal",
      urgencyClass: "badge-normal",
      items: "2 Materials",
      status: "With Admin",
      statusClass: "status-emerald",
      isPrimaryAction: false
    },
    {
      id: "PI-2024-075",
      subId: "Customer Order #CO-1002",
      reqName: "Suresh B",
      reqRole: "QMS Officer",
      dept: "QMS",
      date: "07 Jan 2024, 09:40 AM",
      urgency: "Urgent",
      urgencyClass: "badge-urgent",
      items: "4 Materials",
      status: "Rejected by Store",
      statusClass: "status-red",
      isPrimaryAction: false
    }
  ];

  return (
    <div className="vpi-container">
      
      {/* Page Header */}
      <div className="vpi-header-section">
        <h1 className="vpi-title">Verify Purchase Indents</h1>
        <p className="vpi-subtitle">Review and verify purchase indents submitted by QMS before sending back for approval.</p>
      </div>

      {/* Stepper Card */}
      <div className="vpi-card vpi-stepper-card">
        <div className="vpi-stepper-wrapper">
          
          {/* Step 2 (Active) */}
          <div className="vpi-step active">
            <div className="vpi-step-circle">2</div>
            <span className="vpi-step-label">Store Officer Verification</span>
          </div>
          
          <div className="vpi-step-line"></div>
          
          {/* Step 3 (Inactive) */}
          <div className="vpi-step inactive">
            <div className="vpi-step-circle">3</div>
            <span className="vpi-step-label">QMS Review</span>
          </div>

          <div className="vpi-step-line"></div>

          {/* Step 4 (Inactive) */}
          <div className="vpi-step inactive">
            <div className="vpi-step-circle">4</div>
            <span className="vpi-step-label">Admin Approval</span>
          </div>

        </div>
      </div>

      {/* Main Table Card */}
      <div className="vpi-card vpi-table-card">
        
        {/* Card Header */}
        <div className="vpi-card-header">
          <Icons.FileText />
          <h2 className="vpi-card-heading">QMS Requested Purchase Indents</h2>
        </div>

        {/* Table */}
        <div className="vpi-table-responsive">
          <table className="vpi-table">
            <thead>
              <tr>
                <th style={{width: '18%'}}>Indent ID</th>
                <th style={{width: '15%'}}>Requested By (QMS)</th>
                <th style={{width: '10%'}}>Department</th>
                <th style={{width: '18%'}}>Created Date</th>
                <th style={{width: '10%'}}>Urgency</th>
                <th style={{width: '10%'}}>Items</th>
                <th style={{width: '18%'}}>Status</th>
                <th style={{width: '10%', textAlign: 'center'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {indents.map((item, index) => (
                <tr key={index}>
                  {/* Indent ID */}
                  <td>
                    <div className="vpi-id-text">{item.id}</div>
                    <div className="vpi-sub-text-blue">{item.subId}</div>
                  </td>

                  {/* Requested By */}
                  <td>
                    <div className="vpi-bold-text">{item.reqName}</div>
                    <div className="vpi-role-text">{item.reqRole}</div>
                  </td>

                  {/* Department */}
                  <td className="vpi-std-text">{item.dept}</td>

                  {/* Date */}
                  <td className="vpi-std-text" style={{ maxWidth: '140px' }}>{item.date}</td>

                  {/* Urgency Badge */}
                  <td>
                    <span className={`vpi-urgency-badge ${item.urgencyClass}`}>
                      {item.urgency}
                    </span>
                  </td>

                  {/* Items */}
                  <td className="vpi-std-text">{item.items}</td>

                  {/* Status Pill */}
                  <td>
                    <span className={`vpi-status-pill ${item.statusClass}`}>
                      {item.status}
                    </span>
                  </td>

                  {/* Action Button */}
                  <td style={{textAlign: 'center'}}>
                    <button className={item.isPrimaryAction ? "vpi-btn-primary" : "vpi-btn-outline"}>
                      {item.isPrimaryAction ? 'View' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VerifyPurchaseIndents;