import { Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// ===== COMMON PAGES =====
import Dashboard from '../Pages/StoreOfficer/Dashboard/Dashboard';

// ===== QMS ROLE PAGES =====
import QMSPurchaseIndents from '../Pages/QMS/PurchaseIndent/PurchaseIndents';
import CustomerOrders from '../Pages/QMS/CustomerOrder/CustomerOrders';
import VerifyStoreIndents from '../Pages/QMS/VerifyStoreIndents/VerifyStoreIndents';
import SentToAdmin from '../Pages/QMS/SentToAdmin';

// ===== STORE OFFICER ROLE PAGES =====
// Use unified QMSPurchaseIndents for Store Officer purchase indents (role-aware component)
import Inventory from '../Pages/StoreOfficer/Inventory/Inventory';
import GoodsInventory from '../Pages/StoreOfficer/GoodsInventory/GoodsInventory';
import LowStockAlerts from '../Pages/StoreOfficer/LowStockAlert/LowStockAlerts';
import StockAdjustment from '../Pages/StoreOfficer/StockAdjustment/StockAdjustment';
import VerifyPurchaseIndents from '../Pages/StoreOfficer/VerifyIndent/VerifyPurchaseIndents';
import MaterialRequest from '../Pages/StoreOfficer/MaterialRequest/MaterialRequest';

// ===== ADMIN ROLE PAGES =====
import AdminDashboard from '../Pages/Admin/AdminDashboard/AdminDashboard';
import UserManagement from '../Pages/Admin/UserManagement/Usermanagement';
import QMSApproval from '../Pages/Admin/QMSApproval/QMSApproval';

// ===== PURCHASE DEPARTMENT ROLE PAGES =====
import PurchaseOverview from '../Pages/PurchaseDepartment/Overview/Overview';
import StoreRequests from '../Pages/PurchaseDepartment/StoreRequests/StoreRequests';
import Suppliers from '../Pages/PurchaseDepartment/Suppliers/Suppliers';
import QMSIndents from '../Pages/PurchaseDepartment/QMSIndents/QMSIndents';

const AppNavigator = () => {
  const { user } = useAuthStore();
  const userRole = user?.roleName?.toLowerCase() || '';

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
      case 'purchase':
        return '/overview';
      default:
        return '/dashboard';
    }
  };

  return (
    <Routes>
      {/* ===== DEFAULT REDIRECT BASED ON ROLE ===== */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      
      {/* ===== STORE OFFICER ONLY DASHBOARD ===== */}
      <Route path="/store-dashboard" element={<Dashboard />} />
      {/* Legacy /dashboard redirect by role */}
      <Route path="/dashboard" element={<Navigate to={getDefaultRoute()} replace />} />

      {/* ===== QMS ROLE ROUTES ===== */}
      <Route path="/customer-orders" element={<CustomerOrders />} />
      <Route path="/qms-purchase-indents" element={<QMSPurchaseIndents />} />
      <Route path="/verify-store-indents" element={<VerifyStoreIndents />} />
      <Route path="/sent-to-admin" element={<SentToAdmin />} />

      {/* ===== STORE OFFICER ROLE ROUTES ===== */}
      <Route path="/purchase-indents" element={<QMSPurchaseIndents />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/goods-inventory" element={<GoodsInventory />} />
      <Route path="/low-stock-alert" element={<LowStockAlerts />} />
      <Route path="/stock-adjustment" element={<StockAdjustment />} />
      <Route path="/verify-indents" element={<VerifyPurchaseIndents />} />
      <Route path="/material-request" element={<MaterialRequest />} />

      {/* ===== ADMIN ROLE ROUTES ===== */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/user-management" element={<UserManagement />} />
      <Route path="/qms-approval" element={<QMSApproval />} />
      <Route path="/admin-purchase-indents" element={<QMSPurchaseIndents />} />

      {/* ===== PURCHASE DEPARTMENT ROLE ROUTES ===== */}
      <Route path="/overview" element={<PurchaseOverview />} />
      <Route path="/store-requests" element={<StoreRequests />} />
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/qms-indents" element={<QMSIndents />} />

      {/* ===== ACCOUNTANT ROLE ROUTES ===== */}
      <Route path="/accountant-purchase-indents" element={<QMSPurchaseIndents />} />

      {/* ===== CATCH ALL - REDIRECT TO DEFAULT ROUTE ===== */}
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

export default AppNavigator;