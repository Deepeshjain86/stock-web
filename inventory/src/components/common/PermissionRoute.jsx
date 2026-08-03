import { useAppSelector } from '../../store/hooks';
import Loader from './Loader';
import AccessDenied from './AccessDenied';

const PermissionRoute = ({ permission, children }) => {
  const { user, loading, isAuthenticated } = useAppSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-slate-50/50 dark:bg-slate-950/20">
        <div className="text-center space-y-3">
          <Loader size="lg" />
          <p className="text-xs font-bold text-slate-500 animate-pulse uppercase tracking-wider">
            Verifying rights & credentials...
          </p>
        </div>
      </div>
    );
  }

  // Double security check if not authenticated
  if (!isAuthenticated || !user) {
    return <AccessDenied />;
  }

  // Bypass permission check for Admin & Super Admin roles
  if (user.role === 'Admin' || user.role === 'Super Admin') {
    return children;
  }

  // Enforce granular rights checking with department fallback
  const userPermissions = user.permissions || [];
  let isAllowed = userPermissions.includes(permission);

  // All authenticated staff roles are entitled to view system notifications
  if (permission === 'view_notifications') {
    return children;
  }

  if (user.role === 'Purchase Manager') {
    if (['view_dashboard', 'view_reports', 'view_purchases', 'create_purchases', 'delete_purchases', 'view_products', 'create_products', 'edit_products', 'delete_products', 'view_categories', 'view_stock', 'view_stock_history', 'view_returns', 'create_returns', 'approve_returns', 'adjust_stock', 'destroy_stock', 'transfer_stock', 'view_vendors', 'manage_vendors', 'manage_users', 'view_notifications'].includes(permission)) {
      isAllowed = true;
    }
  } else if (user.role === 'Purchase Employee' || (user.role === 'Employee' && user.department === 'Purchase')) {
    if (['view_dashboard', 'view_reports', 'view_purchases', 'create_purchases', 'view_products', 'create_products', 'edit_products', 'view_categories', 'view_stock', 'view_stock_history', 'view_returns', 'create_returns', 'approve_returns', 'adjust_stock', 'destroy_stock', 'view_vendors', 'manage_vendors', 'view_notifications'].includes(permission)) {
      isAllowed = true;
    }
  } else if (user.role === 'Sales Manager') {
    if (['view_dashboard', 'view_reports', 'view_sales', 'create_sales', 'delete_sales', 'manage_customers', 'view_borrow', 'create_borrow', 'manage_borrow', 'view_vendors', 'view_products', 'view_categories', 'view_stock', 'manage_users', 'view_notifications'].includes(permission)) {
      isAllowed = true;
    }
  } else if (user.role === 'Sales Employee' || (user.role === 'Employee' && user.department === 'Sales')) {
    if (['view_dashboard', 'view_sales', 'create_sales', 'manage_customers', 'view_borrow', 'create_borrow', 'view_vendors', 'view_products', 'view_categories', 'view_stock', 'view_notifications'].includes(permission)) {
      isAllowed = true;
    }
  } else if (user.role === 'Employee') {
    // General Store Employee has full operational access across Sales, Purchase, Stock, History, Adjustments, Returns, & Supplier Master
    if (['view_dashboard', 'view_reports', 'view_sales', 'create_sales', 'view_pos', 'manage_customers', 'view_borrow', 'create_borrow', 'manage_borrow', 'view_purchases', 'create_purchases', 'view_vendors', 'manage_vendors', 'view_products', 'create_products', 'edit_products', 'view_categories', 'view_stock', 'view_stock_history', 'adjust_stock', 'destroy_stock', 'view_returns', 'create_returns', 'approve_returns', 'view_notifications'].includes(permission)) {
      isAllowed = true;
    }
  }


  if (!isAllowed) {
    return <AccessDenied />;
  }

  return children;
};

export default PermissionRoute;
