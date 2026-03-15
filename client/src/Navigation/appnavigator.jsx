import { Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
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
import SupplierManagement from '../Pages/PurchaseDepartment/SupplierManagement/SupplierManagement';
import PurchaseIndents from '../Pages/PurchaseDepartment/PurchaseIndents/PurchaseIndents';
import CreateIndent from '../Pages/PurchaseDepartment/CreateIndent/CreateIndent';
import PurchaseDashboard from '../Pages/PurchaseDepartment/Dashboard/PurchaseDashboard';

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
        return '/purchase-dashboard';
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
      <Route path="/verify-purchase-dept-indents" element={<VerifyPurchaseDeptIndents />} />

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

      {/* ===== ACCOUNTANT ROLE ROUTES ===== */}
      <Route path="/accountant-purchase-indents" element={<QMSPurchaseIndents />} />

      {/* ===== CATCH ALL - REDIRECT TO DEFAULT ROUTE ===== */}
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

export default AppNavigator;