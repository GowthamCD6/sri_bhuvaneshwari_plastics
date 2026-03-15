import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// ===== COMMON PAGES =====
import Dashboard from '../Pages/StoreOfficer/Dashboard/Dashboard';

// ===== QMS ROLE PAGES =====
import QMSPurchaseIndents from '../Pages/QMS/PurchaseIndent/PurchaseIndents';
import CustomerOrders from '../Pages/QMS/CustomerOrder/CustomerOrders';
import VerifyStoreIndents from '../Pages/QMS/VerifyStoreIndents/VerifyStoreIndents';
import VerifyPurchaseDeptIndents from '../Pages/QMS/VerifyPurchaseDeptIndents/VerifyPurchaseDeptIndents';

// ===== STORE OFFICER ROLE PAGES =====
import Inventory from '../Pages/StoreOfficer/Inventory/Inventory';
import GoodsInventory from '../Pages/StoreOfficer/GoodsInventory/GoodsInventory';
import LowStockAlerts from '../Pages/StoreOfficer/LowStockAlert/LowStockAlerts';
import StockAdjustment from '../Pages/StoreOfficer/StockAdjustment/StockAdjustment';
import VerifyPurchaseIndents from '../Pages/StoreOfficer/VerifyIndent/VerifyPurchaseIndents';
import MaterialRequest from '../Pages/StoreOfficer/MaterialRequest/MaterialRequest';

// ===== ADMIN ROLE PAGES =====
import AdminDashboard from '../Pages/Admin/AdminDashboard/AdminDashboard';
import UserManagement from '../Pages/Admin/UserManagement/Usermanagement';
import CustomerOrder from '../Pages/Admin/CustomerOrder/CustomerOrder';
import StoreRequestApproval from '../Pages/Admin/StoreRequestApproval/StoreRequestApproval';

// ===== PURCHASE DEPARTMENT ROLE PAGES =====
import StoreRequests from '../Pages/PurchaseDepartment/StoreRequests/StoreRequests';
<<<<<<< HEAD
import Suppliers from '../Pages/PurchaseDepartment/Suppliers/Suppliers';
import QMSIndents from '../Pages/PurchaseDepartment/QMSIndents/QMSIndents';
import CreatePurchaseIndent from '../Pages/PurchaseDepartment/CreatePurchaseIndent/CreatePurchaseIndent';
import RequestIndent from '../Pages/PurchaseDepartment/RequestIndent/RequestIndent';
=======
import SupplierManagement from '../Pages/PurchaseDepartment/SupplierManagement/SupplierManagement';
import PurchaseIndents from '../Pages/PurchaseDepartment/PurchaseIndents/PurchaseIndents';
import CreateIndent from '../Pages/PurchaseDepartment/CreateIndent/CreateIndent';
>>>>>>> 066811541142b9c82cecbcea0b356337ef8aba88
import PurchaseDashboard from '../Pages/PurchaseDepartment/Dashboard/PurchaseDashboard';

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
        return '/customer-orders';
      case 'storeofficer':
      case 'store':
        return '/store-dashboard';
      case 'purchasedepartment':
        return '/purchase-dashboard';
      case 'accountant':
        return '/accountant-purchase-indents';
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
<<<<<<< HEAD
      <Route path="/customer-orders" element={protectRoute(<CustomerOrders />, ['qms'])} />
      <Route path="/qms-purchase-indents" element={protectRoute(<QMSPurchaseIndents />, ['qms'])} />
      <Route path="/verify-store-indents" element={protectRoute(<VerifyStoreIndents />, ['qms'])} />
      <Route path="/sent-to-admin" element={protectRoute(<SentToAdmin />, ['qms'])} />
=======
      <Route path="/customer-orders" element={<CustomerOrders />} />
      <Route path="/qms-purchase-indents" element={<QMSPurchaseIndents />} />
      <Route path="/verify-store-indents" element={<VerifyStoreIndents />} />
      <Route path="/verify-purchase-dept-indents" element={<VerifyPurchaseDeptIndents />} />
>>>>>>> 066811541142b9c82cecbcea0b356337ef8aba88

      {/* ===== STORE OFFICER ROLE ROUTES ===== */}
      <Route path="/purchase-indents" element={protectRoute(<QMSPurchaseIndents />, ['qms', 'storeofficer', 'admin', 'accountant'])} />
      <Route path="/inventory" element={protectRoute(<Inventory />, ['storeofficer'])} />
      <Route path="/goods-inventory" element={protectRoute(<GoodsInventory />, ['storeofficer'])} />
      <Route path="/low-stock-alert" element={protectRoute(<LowStockAlerts />, ['storeofficer'])} />
      <Route path="/stock-adjustment" element={protectRoute(<StockAdjustment />, ['storeofficer'])} />
      <Route path="/verify-indents" element={protectRoute(<VerifyPurchaseIndents />, ['storeofficer'])} />
      <Route path="/material-request" element={protectRoute(<MaterialRequest />, ['storeofficer'])} />

      {/* ===== ADMIN ROLE ROUTES ===== */}
<<<<<<< HEAD
      <Route path="/admin-dashboard" element={protectRoute(<AdminDashboard />, ['admin'])} />
      <Route path="/user-management" element={protectRoute(<UserManagement />, ['admin'])} />
      <Route path="/qms-approval" element={protectRoute(<QMSApproval />, ['admin'])} />
      <Route path="/admin-purchase-indents" element={protectRoute(<QMSPurchaseIndents />, ['admin'])} />

      {/* ===== PURCHASE DEPARTMENT ROLE ROUTES ===== */}
      <Route path="/purchase-dashboard" element={protectRoute(<PurchaseDashboard />, ['purchasedepartment'])} />
      <Route path="/overview" element={protectRoute(<Navigate to="/purchase-dashboard" replace />, ['purchasedepartment'])} />
      <Route path="/store-requests" element={protectRoute(<StoreRequests />, ['purchasedepartment'])} />
      <Route path="/suppliers" element={protectRoute(<Suppliers />, ['purchasedepartment'])} />
      <Route path="/qms-indents" element={protectRoute(<QMSIndents />, ['purchasedepartment'])} />
      <Route path="/create-purchase-indent" element={protectRoute(<CreatePurchaseIndent />, ['purchasedepartment'])} />
      <Route path="/request-indent" element={protectRoute(<RequestIndent />, ['purchasedepartment'])} />
=======
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/user-management" element={<UserManagement />} />
      <Route path="/customer-order" element={<CustomerOrder />} />
      <Route path="/store-request-approvals" element={<StoreRequestApproval />} />
      <Route path="/admin-purchase-indents" element={<QMSPurchaseIndents />} />

      {/* ===== PURCHASE DEPARTMENT ROLE ROUTES ===== */}
      <Route path="/purchase-dashboard" element={<PurchaseDashboard />} />
      <Route path="/overview" element={<Navigate to="/purchase-dashboard" replace />} />
      <Route path="/store-requests" element={<StoreRequests />} />
      <Route path="/suppliers" element={<SupplierManagement />} />
      <Route path="/qms-indents" element={<PurchaseIndents />} />
      <Route path="/create-purchase-indent" element={<CreateIndent />} />
>>>>>>> 066811541142b9c82cecbcea0b356337ef8aba88

      {/* ===== ACCOUNTANT ROLE ROUTES ===== */}
      <Route path="/accountant-purchase-indents" element={protectRoute(<QMSPurchaseIndents />, ['accountant'])} />

      {/* ===== CATCH ALL - REDIRECT TO DEFAULT ROUTE ===== */}
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

export default AppNavigator;