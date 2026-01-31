import { Routes, Route, Navigate } from 'react-router-dom';

// ===== COMMON PAGES =====
import Dashboard from '../Pages/StoreOfficer/Dashboard/Dashboard';

// ===== QMS ROLE PAGES =====
import QMSPurchaseIndents from '../Pages/QMS/PurchaseIndent/PurchaseIndents';
import CustomerOrders from '../Pages/QMS/CustomerOrder/CustomerOrders';
import VerifyStoreIndents from '../Pages/QMS/VerifyStoreIndents/VerifyStoreIndents';
import SentToAdmin from '../Pages/QMS/SentToAdmin';

// ===== STORE OFFICER ROLE PAGES =====
import PurchaseIndents from '../Pages/StoreOfficer/PurchaseIndent/PurchaseIndents';
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

const AppNavigator = () => {
  return (
    <Routes>
      {/* ===== COMMON ROUTES ===== */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />

      {/* ===== QMS ROLE ROUTES ===== */}
      <Route path="/customer-orders" element={<CustomerOrders />} />
      <Route path="/qms-purchase-indents" element={<QMSPurchaseIndents />} />
      <Route path="/verify-store-indents" element={<VerifyStoreIndents />} />
      <Route path="/sent-to-admin" element={<SentToAdmin />} />

      {/* ===== STORE OFFICER ROLE ROUTES ===== */}
      <Route path="/purchase-indents" element={<PurchaseIndents />} />
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

      {/* ===== PURCHASE DEPARTMENT ROLE ROUTES ===== */}
      <Route path="/purchase/overview" element={<PurchaseOverview />} />
      <Route path="/purchase/store-requests" element={<StoreRequests />} />
    </Routes>
  );
};

export default AppNavigator;