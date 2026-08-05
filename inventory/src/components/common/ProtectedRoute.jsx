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

  // Comprehensive Expiry Guard: Redirect expired SaaS subscription or ended trial tenants to billing portal
  const isExpired = user && user.role !== 'Super Admin' && (
    user.subscription_status === 'Expired' ||
    user.subscription_status === 'Deactivated' ||
    (user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date()) ||
    (user.trial_ended_at && user.subscription_status === 'Trial' && new Date(user.trial_ended_at) < new Date())
  );

  if (isExpired) {
    const path = window.location.pathname;
    const isAllowedPath = path.includes('/billing') || path.includes('/logout');
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
