import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, ShoppingCart, Package, Users, BarChart3, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import logo from '../../assets/SBP logo.png';
import './Sidebar.css';

const Sidebar = ({ onToggle }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (onToggle) {
      onToggle(collapsed);
    }
  }, [collapsed, onToggle]);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      label: 'Purchase', 
      icon: ShoppingCart,
      isDropdown: true,
      children: [
        { path: '/purchase-indents', label: 'Indents', icon: FileText },
        { path: '/purchase-orders', label: 'Orders', icon: ShoppingCart },
      ]
    },
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
            <img src={logo} alt="SBP Logo" className="logo" />
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
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          
          if (item.isDropdown) {
            const isAnyChildActive = item.children.some(child => location.pathname === child.path);
            
            return (
              <div key={index} className="nav-dropdown">
                <div
                  className={`nav-item dropdown-trigger ${isAnyChildActive ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
                  onClick={() => !collapsed && setPurchaseOpen(!purchaseOpen)}
                  title={collapsed ? item.label : ''}
                >
                  {isAnyChildActive && <div className="active-indicator" />}
                  <Icon className="nav-icon" size={22} />
                  {!collapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      <ChevronDown 
                        className={`dropdown-arrow ${purchaseOpen ? 'open' : ''}`} 
                        size={16} 
                      />
                    </>
                  )}
                </div>
                
                {!collapsed && purchaseOpen && (
                  <div className="dropdown-content">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isActive = location.pathname === child.path;
                      
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`nav-item sub-item ${isActive ? 'active' : ''}`}
                          title={child.label}
                        >
                          {isActive && <div className="active-indicator" />}
                          <ChildIcon className="nav-icon" size={18} />
                          <span className="nav-label">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          
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