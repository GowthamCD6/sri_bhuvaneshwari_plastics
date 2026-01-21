import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, ShoppingCart, Package, Users, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/purchase-indents', label: 'Purchase Indents', icon: FileText },
    { path: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/suppliers', label: 'Suppliers', icon: Users },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">SBP</div>
            {!collapsed && (
              <div className="company-info">
                <h2 className="company-name">SBP ERP</h2>
                <p className="company-subtitle">Procurement System</p>
              </div>
            )}
          </div>
          
          {/* Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="toggle-btn"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
              title={collapsed ? item.label : ''}
            >
              {isActive && <div className="active-indicator" />}
              <Icon className="nav-icon" size={22} />
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="sidebar-footer">
        <div className={`user-profile ${collapsed ? 'collapsed' : ''}`}>
          <div className="user-avatar">RK</div>
          {!collapsed && (
            <div className="user-info">
              <div className="user-name">Rajesh Kumar</div>
              <div className="user-role">Procurement Manager</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;