import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../Pages/Dashboard';
import PurchaseIndents from '../Pages/QMS/PurchaseIndent/PurchaseIndents';
import CustomerOrders from '../Pages/QMS/CustomerOrder/CustomerOrders';
import VerifyStoreIndents from '../Pages/QMS/VerifyStoreIndents';
import SentToAdmin from '../Pages/QMS/SentToAdmin';

const AppNavigator = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/customer-orders" element={<CustomerOrders />} />
      <Route path="/purchase-indents" element={<PurchaseIndents />} />
      <Route path="/verify-store-indents" element={<VerifyStoreIndents />} />
      <Route path="/sent-to-admin" element={<SentToAdmin />} />
    </Routes>
  );
};

export default AppNavigator;
