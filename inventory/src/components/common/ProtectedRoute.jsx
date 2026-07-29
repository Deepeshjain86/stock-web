import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import Loader from './Loader';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading, isAuthenticated } = useAppSelector((state) => state.auth);

  // Show premium loading skeleton/spinner while checking local token validity
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader size="lg" />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">
            Verifying secure session credentials...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if user session is not active
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect expired SaaS subscription tenants/users to billing portal
  if (user && user.role !== 'Super Admin' && user.subscription_status === 'Expired') {
    const path = window.location.pathname;
    const isAllowedPath = path.includes('/billing') || path.includes('/settings') || path.includes('/logout');
    if (!isAllowedPath) {
      return <Navigate to="/dashboard/billing" replace state={{ expired: true }} />;
    }
  }

  // If Super Admin is trying to access store dashboard without selecting a store
  if (user.role === 'Super Admin' && !localStorage.getItem('monitoredTenant') && allowedRoles && allowedRoles.includes('Admin')) {
    return <Navigate to="/superadmin" replace />;
  }

  // Enforce Role-Based Access Control (RBAC) constraints
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = user.role === 'Super Admin' ? '/superadmin' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // Session authorized. Render active layout viewport child or children element
  return children ? children : <Outlet />;
};


export default ProtectedRoute;
