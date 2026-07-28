import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// ===== COMMON PAGES =====
import Dashboard from '../Pages/StoreOfficer/Dashboard/Dashboard';

// ===== QMS ROLE PAGES =====
import QMSDashboard from '../Pages/QMS/QMSDashboard/QMSDashboard';
import QMSPurchaseIndents from '../Pages/QMS/PurchaseIndent/PurchaseIndents';
import CustomerOrders from '../Pages/QMS/CustomerOrder/CustomerOrders';
import VerifyStoreIndents from '../Pages/QMS/VerifyStoreIndents/VerifyStoreIndents';
import VerifyPurchaseDeptIndents from '../Pages/QMS/VerifyPurchaseDeptIndents/VerifyPurchaseDeptIndents';

// ===== ACCOUNTANT ROLE PAGES =====
import AccountantDashboard from '../Pages/Accountant/Dashboard/AccountantDashboard';
import CustomerIndents from '../Pages/Accountant/CustomerIndents/CustomerIndents';
import StoreIndents from '../Pages/Accountant/StoreIndents/StoreIndents';

// ===== STORE OFFICER ROLE PAGES =====
import Inventory from '../Pages/StoreOfficer/Inventory/Inventory';
import GoodsInventory from '../Pages/StoreOfficer/GoodsInventory/GoodsInventory';
import LowStockAlerts from '../Pages/StoreOfficer/LowStockAlert/LowStockAlerts';
import StockAdjustment from '../Pages/StoreOfficer/StockAdjustment/StockAdjustment';
import VerifyPurchaseIndents from '../Pages/StoreOfficer/VerifyIndent/VerifyPurchaseIndents';
import MaterialRequest from '../Pages/StoreOfficer/MaterialRequest/MaterialRequest';
import FormulaCalculator from '../Pages/StoreOfficer/FormulaCalculator/FormulaCalculator';

// ===== ADMIN ROLE PAGES =====
import AdminDashboard from '../Pages/Admin/AdminDashboard/AdminDashboard';
import UserManagement from '../Pages/Admin/UserManagement/Usermanagement';
import RoleManagement from '../Pages/Admin/RoleManagement/RoleManagement';
import CustomerOrder from '../Pages/Admin/CustomerOrder/CustomerOrder';
import StoreRequestApproval from '../Pages/Admin/StoreRequestApproval/StoreRequestApproval';

// ===== PURCHASE DEPARTMENT ROLE PAGES =====
import StoreRequests from '../Pages/PurchaseDepartment/StoreRequests/StoreRequests';
import SupplierManagement from '../Pages/PurchaseDepartment/SupplierManagement/SupplierManagement';
import PurchaseIndents from '../Pages/PurchaseDepartment/PurchaseIndents/PurchaseIndents';
import PurchaseDashboard from '../Pages/PurchaseDepartment/Dashboard/PurchaseDashboard';
import CreatePurchaseIndent from '../Pages/PurchaseDepartment/CreateIndent/CreateIndent';

const normalizeRole = (role) => {
  const normalized = String(role || '').toLowerCase().trim();
  if (normalized === 'store') return 'storeofficer';
  if (normalized === 'purchase') return 'purchasedepartment';
  return normalized;
};

const AccessDenied = () => (
  <div style={{ padding: '32px', color: '#0f172a' }}>
    <h2 style={{ margin: 0, marginBottom: '8px' }}>Access Denied</h2>
    <p style={{ margin: 0, color: '#64748b' }}>You do not have permission to view this page.</p>
  </div>
);

const AppNavigator = () => {
  const { user } = useAuthStore();
  const userRole = normalizeRole(user?.roleName);

  // Role-based default routes
  const getDefaultRoute = () => {
    switch (userRole) {
      case 'admin':
        return '/admin-dashboard';
      case 'qms':
        return '/qms-dashboard';
      case 'storeofficer':
      case 'store':
        return '/store-dashboard';
      case 'purchasedepartment':
        return '/purchase-dashboard';
      case 'accountant':
        return '/accountant-dashboard';
      default:
        return '/access-denied';
    }
  };

  const protectRoute = (element, allowedRoles = []) => {
    const isAllowed = allowedRoles.map(normalizeRole).includes(userRole);
    return isAllowed ? element : <Navigate to={getDefaultRoute()} replace />;
  };

  return (
    <Routes>
      {/* ===== DEFAULT REDIRECT BASED ON ROLE ===== */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="/access-denied" element={<AccessDenied />} />
      
      {/* ===== STORE OFFICER ONLY DASHBOARD ===== */}
      <Route path="/store-dashboard" element={protectRoute(<Dashboard />, ['storeofficer'])} />
      {/* Legacy /dashboard redirect by role */}
      <Route path="/dashboard" element={<Navigate to={getDefaultRoute()} replace />} />

      {/* ===== QMS ROLE ROUTES ===== */}
      <Route path="/qms-dashboard" element={protectRoute(<QMSDashboard />, ['qms'])} />
      <Route path="/customer-orders" element={protectRoute(<CustomerOrders />, ['qms'])} />
      <Route path="/qms-purchase-indents" element={protectRoute(<QMSPurchaseIndents />, ['qms'])} />
      <Route path="/verify-store-indents" element={protectRoute(<VerifyStoreIndents />, ['qms'])} />
      <Route path="/verify-purchase-dept-indents" element={protectRoute(<VerifyPurchaseDeptIndents />, ['qms'])} />

      {/* ===== STORE OFFICER ROLE ROUTES ===== */}
      <Route path="/purchase-indents" element={protectRoute(<QMSPurchaseIndents />, ['qms', 'storeofficer', 'admin', 'accountant'])} />
      <Route path="/inventory" element={protectRoute(<Inventory />, ['storeofficer'])} />
      <Route path="/goods-inventory" element={protectRoute(<GoodsInventory />, ['storeofficer'])} />
      <Route path="/low-stock-alert" element={protectRoute(<LowStockAlerts />, ['storeofficer'])} />
      <Route path="/stock-adjustment" element={protectRoute(<StockAdjustment />, ['storeofficer'])} />
      <Route path="/verify-indents" element={protectRoute(<VerifyPurchaseIndents />, ['storeofficer'])} />
      <Route path="/material-request" element={protectRoute(<MaterialRequest />, ['storeofficer'])} />
      <Route path="/formula-calculator" element={protectRoute(<FormulaCalculator />, ['storeofficer'])} />

      {/* ===== ADMIN ROLE ROUTES ===== */}
      <Route path="/admin-dashboard" element={protectRoute(<AdminDashboard />, ['admin'])} />
      <Route path="/user-management" element={protectRoute(<UserManagement />, ['admin'])} />
      <Route path="/role-management" element={protectRoute(<RoleManagement />, ['admin'])} />
      <Route path="/customer-order" element={protectRoute(<CustomerOrder />, ['admin'])} />
      <Route path="/store-request-approvals" element={protectRoute(<StoreRequestApproval />, ['admin'])} />
      <Route path="/admin-purchase-indents" element={protectRoute(<QMSPurchaseIndents />, ['admin'])} />

      {/* ===== PURCHASE DEPARTMENT ROLE ROUTES ===== */}
      <Route path="/purchase-dashboard" element={protectRoute(<PurchaseDashboard />, ['purchasedepartment'])} />
      <Route path="/overview" element={<Navigate to="/purchase-dashboard" replace />} />
      <Route path="/store-requests" element={protectRoute(<StoreRequests />, ['purchasedepartment'])} />
      <Route path="/suppliers" element={protectRoute(<SupplierManagement />, ['purchasedepartment'])} />
      <Route path="/qms-indents" element={protectRoute(<PurchaseIndents />, ['purchasedepartment'])} />
      <Route path="/create-purchase-indent" element={protectRoute(<CreatePurchaseIndent />, ['purchasedepartment', 'qms', 'admin'])} />

      {/* ===== ACCOUNTANT ROLE ROUTES ===== */}
      <Route path="/accountant-dashboard" element={protectRoute(<AccountantDashboard />, ['accountant'])} />
      <Route path="/accountant/customer-indents" element={protectRoute(<CustomerIndents />, ['accountant'])} />
      <Route path="/accountant/store-indents" element={protectRoute(<StoreIndents />, ['accountant'])} />
      <Route path="/accountant-purchase-indents" element={protectRoute(<QMSPurchaseIndents />, ['accountant'])} />

      {/* ===== CATCH ALL - REDIRECT TO DEFAULT ROUTE ===== */}
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

export default AppNavigator;