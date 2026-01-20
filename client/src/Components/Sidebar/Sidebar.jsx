import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, ShoppingCart, Package, Users, BarChart3 } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
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
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo">SBP</div>
          <h2 className="company-name">SBP ERP</h2>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="nav-icon" size={20} />
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <img 
            src="https://ui-avatars.com/api/?name=Rajesh+Kumar&background=4A5568&color=fff" 
            alt="User Avatar" 
            className="user-avatar"
          />
          <div className="user-info">
            <div className="user-name">Rajesh Kumar</div>
            <div className="user-role">Procurement Manager</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
