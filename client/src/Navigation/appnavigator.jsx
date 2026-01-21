import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../Pages/Dashboard';
import PurchaseIndents from '../Pages/PurchaseIndent/PurchaseIndents';
import PurchaseOrders from '../Pages/PurchaseOrders';
import Inventory from '../Pages/Inventory';
import Suppliers from '../Pages/Suppliers';
import Reports from '../Pages/Reports';

const AppNavigator = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/purchase-indents" element={<PurchaseIndents />} />
      <Route path="/purchase-orders" element={<PurchaseOrders />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/reports" element={<Reports />} />
    </Routes>
  );
};

export default AppNavigator;
