import { BrowserRouter, Routes, Route } from 'react-router-dom';

import ProtectedRoute from './components/common/ProtectedRoute';

import MainLayout from './components/layout/MainLayout';
import Landing from './pages/Landing/Landing';
import Dashboard from './pages/Dashboard/Dashboard';
import ProductList from './pages/Products/ProductList';
import CategoryList from './pages/Categories/CategoryList';
import PurchaseList from './pages/Purchase/PurchaseList';
import SalesList from './pages/Sales/SalesList';
import SalesDashboard from './pages/Sales/SalesDashboard';
import SalesReturn from './pages/Sales/SalesReturn';
import StockDashboard from './pages/Stock/StockDashboard';
import StockIn from './pages/Stock/StockIn';
import StockOut from './pages/Stock/StockOut';
import StockAdjustment from './pages/Stock/StockAdjustment';
import StockHistory from './pages/Stock/StockHistory';
import VendorReturnManagement from './pages/Stock/VendorReturnManagement';
import BorrowLedger from './pages/Borrow/BorrowLedger';
import Reports from './pages/Reports/Reports';
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard';
import Billing from './pages/Billing/Billing';
import StoreManagement from './pages/SuperAdmin/StoreManagement';
import StaffList from './pages/Users/StaffList';
import NotificationHistory from './pages/Notifications/NotificationHistory';
import VendorList from './pages/Vendors/VendorList';
import CustomerList from './pages/Customers/CustomerList';
import ActivityLogs from './pages/Settings/ActivityLogs';

// Auth Pages
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

import PermissionRoute from './components/common/PermissionRoute';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { hideToast } from './store/slices/notificationSlice';

const GlobalToast = () => {
  const toast = useAppSelector((state) => state.notifications.toast);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl max-w-sm">
      <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border text-[10px] ${
        isError 
          ? 'bg-rose-50 border-rose-100 text-rose-500' 
          : 'bg-emerald-50 border-emerald-100 text-emerald-500'
      }`}>
        {isError ? '⚠️' : '✅'}
      </div>
      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
        {toast.msg}
      </p>
      <button 
        onClick={() => dispatch(hideToast())}
        className="text-slate-450 hover:text-slate-600 dark:hover:text-slate-305 text-[10px] font-black cursor-pointer ml-auto"
      >
        ✕
      </button>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <GlobalToast />
      <Routes>
        {/* Public Home & Auth Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Super Admin Platform Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Super Admin']} />}>
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/stores" element={<StoreManagement />} />
        </Route>

        {/* Protected ERP Modules Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Sales Manager', 'Purchase Manager', 'Employee', 'Purchase Employee', 'Sales Employee']} />}>
          <Route path="/dashboard" element={<MainLayout />}>
            <Route index element={<PermissionRoute permission="view_dashboard"><Dashboard /></PermissionRoute>} />
            <Route path="products" element={<PermissionRoute permission="view_products"><ProductList /></PermissionRoute>} />
            <Route path="categories" element={<PermissionRoute permission="view_categories"><CategoryList /></PermissionRoute>} />
            <Route path="vendors" element={<PermissionRoute permission="view_vendors"><VendorList /></PermissionRoute>} />
            <Route path="customers" element={<PermissionRoute permission="manage_customers"><CustomerList /></PermissionRoute>} />
            <Route path="purchase" element={<PermissionRoute permission="view_purchases"><StockDashboard /></PermissionRoute>} />
            <Route path="purchase/orders" element={<PermissionRoute permission="view_purchases"><StockDashboard /></PermissionRoute>} />
            <Route path="sales" element={<PermissionRoute permission="view_sales"><SalesList /></PermissionRoute>} />
            <Route path="sales/returns" element={<PermissionRoute permission="view_sales"><SalesReturn /></PermissionRoute>} />
            <Route path="sales-dashboard" element={<PermissionRoute permission="view_sales"><SalesDashboard /></PermissionRoute>} />
            <Route path="stock" element={<PermissionRoute permission="view_stock"><StockDashboard /></PermissionRoute>} />
            <Route path="stock/in" element={<PermissionRoute permission="view_stock"><StockDashboard /></PermissionRoute>} />
            <Route path="stock/out" element={<PermissionRoute permission="view_stock"><StockDashboard /></PermissionRoute>} />
            <Route path="stock/adjustment" element={<PermissionRoute permission="adjust_stock"><StockDashboard /></PermissionRoute>} />
            <Route path="stock/history" element={<PermissionRoute permission="view_stock_history"><StockDashboard /></PermissionRoute>} />
            <Route path="stock/returns" element={<PermissionRoute permission="view_returns"><StockDashboard /></PermissionRoute>} />
            <Route path="stock/destroy" element={<PermissionRoute permission="destroy_stock"><StockDashboard /></PermissionRoute>} />
            <Route path="borrow" element={<PermissionRoute permission="view_borrow"><BorrowLedger /></PermissionRoute>} />
            <Route path="reports" element={<PermissionRoute permission="view_reports"><Reports /></PermissionRoute>} />
            <Route path="staff" element={<PermissionRoute permission="manage_users"><StaffList /></PermissionRoute>} />
            <Route path="billing" element={<PermissionRoute permission="view_billing"><Billing /></PermissionRoute>} />
            <Route path="notifications" element={<PermissionRoute permission="view_notifications"><NotificationHistory /></PermissionRoute>} />
            <Route path="activity-logs" element={<PermissionRoute permission="view_activity_logs"><ActivityLogs /></PermissionRoute>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;