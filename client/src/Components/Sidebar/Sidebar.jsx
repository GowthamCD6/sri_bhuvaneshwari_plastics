import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Package,
  PackageCheck,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Send,
  AlertTriangle,
  Settings,
  SlidersHorizontal,
  Shield,
  ClipboardCheck,
  UserCog,
  Inbox,
  Truck,
  User,
  LogOut,
  ClipboardList,
} from "lucide-react";
import "./Sidebar.css";
import "./SidebarUserProfile.css";
import logo from "../../assets/SBP_logo.png";
const Sidebar = ({ userRole, userData, onLogout }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [approvalsOpen, setApprovalsOpen] = useState(true);
  const location = useLocation();

  // Remove onToggle effect since we're not using collapse anymore
  // useEffect(() => {
  //   if (onToggle) {
  //     onToggle(collapsed);
  //   }
  // }, [collapsed, onToggle]);

  // Role-based menu configuration
  const roleMenus = {
    admin: [
      { label: "Overview", section: true },
      { path: "/admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
      { label: "Approvals", section: true },
      { path: "/purchase-indents", label: "Purchase Indents", icon: FileText },
      {
        label: "QMS Approval",
        icon: ClipboardCheck,
        isDropdown: true,
        children: [
          { path: "/customer-order", label: "Customer Order", icon: ClipboardCheck },
          { path: "/store-request-approvals", label: "Store Requests", icon: Inbox },
        ],
      },
      { label: "Administration", section: true },
      { path: "/user-management", label: "User Management", icon: UserCog },
    ],
    qms: [
      { label: "Overview", section: true },
      { path: "/customer-orders", label: "Dashboard", icon: LayoutDashboard },
      { label: "Order Management", section: true },
      { path: "/customer-orders", label: "Customer Orders", icon: ShoppingCart },
      { path: "/purchase-indents", label: "Purchase Indents", icon: FileText },
      { label: "Approvals", section: true },
      { path: "/verify-store-indents", label: "Verify Store Indents", icon: CheckCircle },
      { path: "/sent-to-admin", label: "Sent to Admin", icon: Send },
    ],
    storeofficer: [
      { label: "Overview", section: true },
      { path: "/store-dashboard", label: "Dashboard", icon: LayoutDashboard },
      { label: "Inventory Management", section: true },
      { path: "/inventory", label: "Inventory", icon: Package },
      { path: "/goods-inventory", label: "Goods Inventory", icon: PackageCheck },
      { path: "/low-stock-alert", label: "Low Stock Alert", icon: AlertTriangle },
      { path: "/stock-adjustment", label: "Stock Adjustment", icon: SlidersHorizontal },
      { label: "Procurement", section: true },
      { path: "/verify-indents", label: "Verify Indents", icon: CheckCircle },
      { path: "/purchase-indents", label: "Purchase Indents", icon: FileText },
      { path: "/material-request", label: "Material Request", icon: ShoppingCart },
    ],
    purchasedepartment: [
      { label: "Overview", section: true },
        { path: "/purchase-dashboard", label: "Dashboard", icon: LayoutDashboard },
      { label: "Purchase Operations", section: true },
      { path: "/create-purchase-indent", label: "Purchase Indent", icon: ClipboardList },
      { path: "/suppliers", label: "Suppliers", icon: Truck },
      { path: "/qms-indents", label: "QMS Indents", icon: FileText },
      { path: "/store-requests", label: "Store Requests", icon: Inbox },
    ],
  };

  // Get menu items for the user's role, with fallback to qms if role not found
  const menuItems = roleMenus[userRole?.toLowerCase()] || roleMenus.qms || [];

  return (
    <div className="sidebar"> 
    {/* Header */} 
    <div className="sidebar-header"> 
      <div className="header-content"> 
        <div className="logo-section"> 
          <div className="logo-icon"> 
            <span className="logo-text">
              <img src={logo} alt="SBP Logo" className="logo-image" />
            </span> 
               </div> 
               <div className="company-name"> 
                 <div className="company-title">Sri Bhuvaneshwari</div>
                 <div className="company-subtitle">Plastics</div>
               </div> 
       </div> 
      </div> 
    </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => {
          // Render section headers
          if (item.section) {
            return (
              <div key={index} className="nav-section">
                <span className="section-label">{item.label}</span>
              </div>
            );
          }

          const Icon = item.icon;

          if (item.isDropdown) {
            const isAnyChildActive = item.children.some(
              (child) => location.pathname === child.path,
            );

            return (
              <div key={index} className="nav-dropdown">
                <div
                  className={`nav-item dropdown-trigger ${isAnyChildActive ? "active" : ""}`}
                  onClick={() => setApprovalsOpen(!approvalsOpen)}
                  title={item.label}
                >
                  {isAnyChildActive && <div className="active-indicator" />}
                  <Icon className="nav-icon" size={22} />
                  <span className="nav-label">{item.label}</span>
                  <ChevronDown
                    className={`dropdown-arrow ${approvalsOpen ? "open" : ""}`}
                    size={16}
                  />
                </div>

                {approvalsOpen && (
                  <div className="dropdown-content">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isActive = location.pathname === child.path;

                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`nav-item sub-item ${isActive ? "active" : ""}`}
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
              key={item.path || index}
              to={item.path}
              className={`nav-item ${isActive ? "active" : ""}`}
              title={item.label}
            >
              {isActive && <div className="active-indicator" />}
              <Icon className="nav-icon" size={22} />
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="sidebar-footer">
        <div className="user-profile" onClick={() => setUserMenuOpen(!userMenuOpen)}>
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <div className="user-name">{userData?.username || 'User'}</div>
            <div className="user-role">{userData?.roleName || 'Role'}</div>
          </div>
          <ChevronDown size={18} className={`user-menu-icon ${userMenuOpen ? 'open' : ''}`} />
        </div>
        
        {userMenuOpen && (
          <div className="user-dropdown">
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;