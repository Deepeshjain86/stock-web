/**
 * Global Middleware to restrict Super Admin to Read-Only access in Monitoring Mode.
 * Prevents Super Admin from executing POST, PUT, DELETE, or PATCH requests on any store operational modules.
 */
export const readOnlyForSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Super Admin') {
    const isWriteMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
    const url = req.originalUrl || req.url || '';

    // Whitelist Super Admin system endpoints & auth session handlers
    const isExempt = url.includes('/api/superadmin') || 
                     url.includes('/api/auth/switch-tenant') || 
                     url.includes('/api/auth/exit-monitoring') ||
                     url.includes('/api/auth/login') ||
                     url.includes('/api/auth/logout') ||
                     url.includes('/api/auth/refresh');

    if (isWriteMethod && !isExempt) {
      return res.status(403).json({
        success: false,
        message: 'Action Not Permitted: Super Admin Monitoring Mode is strictly Read-Only. Store data cannot be modified.'
      });
    }
  }
  next();
};
