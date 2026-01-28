import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../Pages/Dashboard';
import PurchaseOrders from '../Pages/QMS/PurchaseOrder/PurchaseOrders';
import CustomerOrders from '../Pages/CustomerOrders';
import VerifyStoreIndents from '../Pages/QMS/VerifyStoreIndents';
import SentToAdmin from '../Pages/QMS/SentToAdmin';

const AppNavigator = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/purchase-orders" element={<PurchaseOrders />} />
      <Route path="/customer-orders" element={<CustomerOrders />} />
      <Route path="/verify-store-indents" element={<VerifyStoreIndents />} />
      <Route path="/sent-to-admin" element={<SentToAdmin />} />
    </Routes>
  );
};

export default AppNavigator;
