import jwt from 'jsonwebtoken';
import { ensureTenantMigrations, getTenantPool, masterPool } from '../config/tenantDb.js';
import { createNotification } from '../services/notificationService.js';
import { requestContext } from '../utils/context.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let tenantDbName = decoded.tenantDbName || 'kirana_erp_master';
    let db = null;
    let user = null;
    let monitoredTenantId = null;

    if (decoded.role === 'Super Admin') {
      // Query master database for Super Admin details
      const [users] = await masterPool.query(
        'SELECT id, email, role, status FROM users WHERE id = ? AND role = "Super Admin"',
        [decoded.id]
      );
      if (users.length === 0) {
        return res.status(401).json({ success: false, message: 'Super Admin no longer exists' });
      }
      user = users[0];
      user.name = 'Super Admin'; // Display Name for Super Admin
      user.permissions = ['all'];

      // Check if Super Admin is monitoring a specific store database
      const tenantIdHeader = req.headers['x-tenant-id'];
      if (tenantIdHeader) {
        const [tenants] = await masterPool.query(
          'SELECT database_name FROM tenants WHERE id = ?',
          [tenantIdHeader]
        );
        if (tenants.length > 0) {
          tenantDbName = tenants[0].database_name;
          monitoredTenantId = tenantIdHeader;
          db = getTenantPool(tenantDbName);
        }
      }

      // If Super Admin has no monitored tenant specified, fall back to first active tenant database for operational queries
      if (!db) {
        const [defaultTenants] = await masterPool.query(
          'SELECT id, database_name FROM tenants ORDER BY id ASC LIMIT 1'
        );
        if (defaultTenants.length > 0) {
          tenantDbName = defaultTenants[0].database_name;
          monitoredTenantId = defaultTenants[0].id;
          db = getTenantPool(tenantDbName);
        } else {
          db = masterPool;
        }
      }
    } else {
      // Query local tenant database for Admin / Employee profile
      db = getTenantPool(tenantDbName);
      let [tenantUsers] = await db.query(
        `SELECT u.id, u.name, u.email, u.status, u.role_id, u.department, r.name as role 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE LOWER(u.email) = LOWER(?) OR UPPER(u.login_id) = UPPER(?)`,
        [decoded.email, decoded.email]
      );

      if (tenantUsers.length === 0) {
        // Fallback to master pool for global store admin user profile
        const [masterUsers] = await masterPool.query(
          `SELECT id, email, role, status, login_id FROM users WHERE LOWER(email) = LOWER(?) OR UPPER(login_id) = UPPER(?)`,
          [decoded.email, decoded.email]
        );
        if (masterUsers.length > 0) {
          user = {
            id: masterUsers[0].id,
            name: decoded.email.split('@')[0],
            email: masterUsers[0].email,
            status: masterUsers[0].status,
            role: masterUsers[0].role
          };
        } else {
          return res.status(401).json({ success: false, message: 'User profile no longer exists in store database' });
        }
      } else {
        user = tenantUsers[0];
      }
    }

      // Fetch user's permissions array
      try {
        const [rolePerms] = await db.query(
          `SELECT p.name FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id WHERE rp.role_id = ?`,
          [user.role_id]
        );
        const [userPerms] = await db.query(
          `SELECT p.name FROM user_permissions up JOIN permissions p ON up.permission_id = p.id WHERE up.user_id = ?`,
          [user.id]
        );
        user.permissions = [...new Set([...rolePerms.map(p => p.name), ...userPerms.map(p => p.name)])];
      } catch (pe) {
        user.permissions = [];
      }

    const effectiveTenantId = decoded.role === 'Super Admin' ? monitoredTenantId : decoded.tenantId;

    if (user.status !== 'Active') {
      if (effectiveTenantId) {
        try {
          const [tenants] = await masterPool.query('SELECT subscription_status FROM tenants WHERE id = ?', [effectiveTenantId]);
          if (tenants.length > 0 && (tenants[0].subscription_status === 'Active' || tenants[0].subscription_status === 'Trial')) {
            user.status = 'Active';
            await masterPool.query('UPDATE users SET status = "Active" WHERE email = ? AND tenant_id = ?', [user.email, effectiveTenantId]);
            if (db) {
              await db.query('UPDATE users SET status = "Active" WHERE LOWER(email) = LOWER(?)', [user.email]);
            }
          }
        } catch (healErr) {
          console.warn('[Auth Middleware] Status auto-heal error:', healErr.message);
        }
      }
      if (user.status !== 'Active') {
        return res.status(403).json({ success: false, message: 'Your account is suspended. Contact Administrator.' });
      }
    }

    req.db = db;
    req.user = user;
    req.tenantId = effectiveTenantId;
    req.tenantDbName = tenantDbName;

    // Strict Enterprise Read-Only Enforcement for Super Admin in Monitoring Mode
    if (user.role === 'Super Admin') {
      const isWriteMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
      const url = req.originalUrl || req.url || '';
      const isExempt = url.includes('/api/superadmin') || 
                       url.includes('/api/auth/switch-tenant') || 
                       url.includes('/api/auth/exit-monitoring') ||
                       url.includes('/api/auth/login') ||
                       url.includes('/api/auth/logout');

      if (isWriteMethod && !isExempt) {
        return res.status(403).json({
          success: false,
          message: 'Read-Only Monitoring Mode: You do not have permission to modify tenant data.'
        });
      }
    }

    // Check Tenant Subscription status (exclude Super Admin unless monitoring)
    if (effectiveTenantId) {
      const [tenants] = await masterPool.query(
        'SELECT subscription_status, subscription_expires_at, store_name FROM tenants WHERE id = ?',
        [effectiveTenantId]
      );

      if (tenants.length > 0) {
        const tenant = tenants[0];
        const expiryDate = tenant.subscription_expires_at ? new Date(tenant.subscription_expires_at) : null;
        let isExpired = expiryDate && expiryDate < new Date();

        if (isExpired && tenant.subscription_status !== 'Expired') {
          try {
            await masterPool.query(
              "UPDATE tenants SET subscription_status = 'Expired' WHERE id = ?",
              [effectiveTenantId]
            );
            await masterPool.query(
              "UPDATE subscriptions SET status = 'Expired' WHERE tenant_id = ? AND status IN ('Trial', 'Active')",
              [effectiveTenantId]
            );
            tenant.subscription_status = 'Expired';

            await createNotification({
              tenantId: effectiveTenantId,
              type: 'Subscription',
              title: 'SaaS Subscription Expired',
              message: `SaaS subscription for tenant "${tenant.store_name}" has expired.`,
              priority: 'High',
              related_user: tenant.email,
              related_module: 'Billing',
              target_roles: 'Super Admin',
              isMaster: true
            });

            await createNotification({
              type: 'Subscription',
              title: 'SaaS Subscription Expired',
              message: `Your SaaS subscription has expired. Please renew your subscription to access ERP details.`,
              priority: 'High',
              related_user: 'System',
              related_module: 'Billing',
              target_roles: 'Admin'
            });
          } catch (e) {
            console.error('Error auto-updating expired tenant status:', e);
          }
        }

        user.subscription_status = tenant.subscription_status;
        user.subscription_expires_at = tenant.subscription_expires_at;
        user.store_name = tenant.store_name;

        // Block non-superadmin users if tenant account is deactivated / inactive
        if (decoded.role !== 'Super Admin' && (tenant.subscription_status === 'Inactive' || tenant.subscription_status === 'Deactivated' || tenant.subscription_status === 'Disabled')) {
          return res.status(403).json({
            success: false,
            message: 'Your store account has been deactivated. Please contact the Super Admin.'
          });
        }

        // Block non-superadmin users if tenant subscription is expired or suspended
        if (decoded.role !== 'Super Admin' && (tenant.subscription_status === 'Expired' || tenant.subscription_status === 'Suspended')) {
          const path = req.originalUrl || req.url || '';
          const isAllowed = path.includes('/billing') || path.includes('/auth') || path.includes('/settings');
          if (!isAllowed) {
            return res.status(402).json({
              success: false,
              message: `Store SaaS subscription is ${tenant.subscription_status.toLowerCase()}. Access to operational modules is restricted.`
            });
          }
        }
      }
    }

    return requestContext.run(req, () => next());
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(401).json({ success: false, message: 'Not authorized, session token expired' });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (req.user && (req.user.role === 'Super Admin' || req.user.role === 'Admin')) {
      return next();
    }
    const userRole = req.user?.role || '';
    const hasRoleMatch = roles.some(r => {
      if (r === userRole) return true;
      if (r === 'Manager' && userRole.includes('Manager')) return true;
      if (r === 'Employee' && (userRole.includes('Employee') || userRole.includes('Staff'))) return true;
      return false;
    });

    if (!hasRoleMatch) {
      return res.status(403).json({
        success: false,
        message: `Privilege level "${req.user.role}" does not have permission to execute this request`
      });
    }
    next();
  };
};

export const checkPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'Super Admin') {
        // Super Admin does not perform tenant business write operations
        // If monitoring, allow only read actions (GET requests)
        if (req.method === 'GET') {
          return next();
        }
        return res.status(403).json({
          success: false,
          message: 'Super Admin cannot perform tenant business write operations'
        });
      }

      // view_notifications, view_dashboard, and view_vendors are accessible to all authenticated staff
      if (permissionName === 'view_notifications' || permissionName === 'view_dashboard' || permissionName === 'view_vendors') {
        return next();
      }

      if (req.user.role === 'Admin') {
        return next();
      }

      if (req.user.role === 'Purchase Manager') {
        const allowedPmPerms = [
          'view_dashboard', 'view_reports', 'export_reports', 'print_reports',
          'view_purchases', 'create_purchases', 'delete_purchases', 
          'view_vendors', 'create_vendors', 'edit_vendors', 'manage_vendors', 'delete_vendors',
          'view_products', 'create_products', 'edit_products', 'delete_products', 'import_products', 'export_products',
          'view_categories', 'create_categories', 'edit_categories', 'delete_categories', 
          'view_stock', 'view_stock_history', 'adjust_stock', 'transfer_stock', 'destroy_stock', 
          'view_returns', 'create_returns', 'approve_returns', 'delete_returns', 'view_notifications', 'manage_notifications',
          'view_staff', 'manage_users'
        ];
        if (allowedPmPerms.includes(permissionName)) {
          return next();
        }
      }

      if (req.user.role === 'Sales Manager') {
        const allowedSmPerms = [
          'view_dashboard', 'view_reports', 'export_reports', 'print_reports',
          'view_sales', 'create_sales', 'edit_sales', 'delete_sales', 'view_pos', 
          'manage_customers', 'create_customers', 'edit_customers', 'delete_customers', 
          'view_borrow', 'create_borrow', 'manage_borrow', 'delete_borrow',
          'view_vendors', 'view_products', 'view_categories', 'view_stock', 'view_stock_history',
          'view_returns', 'create_returns', 'approve_returns', 'delete_returns', 'view_notifications', 'manage_notifications',
          'view_staff', 'manage_users'
        ];
        if (allowedSmPerms.includes(permissionName)) {
          return next();
        }
      }

      if (req.user.role === 'Employee') {
        const allowedOpPerms = [
          'view_dashboard', 'view_reports', 'export_reports', 'print_reports', 
          'view_sales', 'create_sales', 'edit_sales', 'delete_sales', 'view_pos', 
          'manage_customers', 'create_customers', 'edit_customers', 'delete_customers',
          'view_borrow', 'create_borrow', 'manage_borrow', 'delete_borrow',
          'view_purchases', 'create_purchases', 'delete_purchases', 
          'view_vendors', 'create_vendors', 'edit_vendors', 'manage_vendors', 'delete_vendors',
          'view_products', 'create_products', 'edit_products', 'delete_products', 'import_products', 'export_products',
          'view_categories', 'create_categories', 'edit_categories', 'delete_categories',
          'view_stock', 'view_stock_history', 'adjust_stock', 'transfer_stock', 'destroy_stock', 
          'view_returns', 'create_returns', 'approve_returns', 'delete_returns', 'view_notifications', 'manage_notifications'
        ];
        if (allowedOpPerms.includes(permissionName)) {
          return next();
        }
      }

      if (req.user.role === 'Purchase Employee') {
        const allowedPurchasePerms = [
          'view_dashboard', 'view_reports', 'export_reports', 'print_reports', 
          'view_purchases', 'create_purchases', 'delete_purchases',
          'view_vendors', 'create_vendors', 'edit_vendors', 'manage_vendors', 'delete_vendors',
          'view_products', 'create_products', 'edit_products', 'delete_products', 'import_products', 'export_products',
          'view_categories', 'create_categories', 'edit_categories', 'delete_categories',
          'view_stock', 'view_stock_history', 'adjust_stock', 'transfer_stock', 'destroy_stock', 
          'view_returns', 'create_returns', 'approve_returns', 'delete_returns', 'view_notifications', 'manage_notifications'
        ];
        if (allowedPurchasePerms.includes(permissionName)) {
          return next();
        }
      }

      if (req.user.role === 'Sales Employee') {
        const allowedSalesPerms = [
          'view_dashboard', 'view_reports', 'export_reports', 'print_reports',
          'view_sales', 'create_sales', 'edit_sales', 'delete_sales', 'view_pos', 
          'manage_customers', 'create_customers', 'edit_customers', 'delete_customers',
          'view_borrow', 'create_borrow', 'manage_borrow', 'delete_borrow',
          'view_vendors', 'view_products', 'view_categories', 'view_stock', 'view_stock_history',
          'view_returns', 'create_returns', 'approve_returns', 'delete_returns', 'view_notifications', 'manage_notifications'
        ];
        if (allowedSalesPerms.includes(permissionName)) {
          return next();
        }
      }

      // 1. Check permission via role_permissions mapping
      const [rolePerms] = await req.db.query(
        `SELECT p.name 
         FROM role_permissions rp 
         JOIN permissions p ON rp.permission_id = p.id 
         WHERE rp.role_id = ? AND p.name = ?`,
        [req.user.role_id || 0, permissionName]
      );

      // 2. Check permission via user_permissions mapping (direct user-specific override)
      const [userPerms] = await req.db.query(
        `SELECT p.name 
         FROM user_permissions up 
         JOIN permissions p ON up.permission_id = p.id 
         WHERE up.user_id = ? AND p.name = ?`,
        [req.user.id, permissionName]
      );

      if (rolePerms.length > 0 || userPerms.length > 0) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Access denied. You do not have the required permission: "${permissionName}"`
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error during permission check' });
    }
  };
};
