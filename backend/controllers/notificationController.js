import { masterPool } from '../config/tenantDb.js';
import { createNotification } from '../services/notificationService.js';

/**
 * Helper to build RBAC SQL conditions for notification access.
 * Returns an object with conditions array and queryParams array.
 *
 * DESIGN NOTES:
 *  - Admin / Super Admin get 100% unrestricted access (fast-path, unchanged).
 *  - Non-admin users have two layers of filtering:
 *      1. Admin Privacy Rule  — blocks any notification produced by admin actions.
 *      2. Role-Module Gate    — uses the stored `target_roles` column (e.g.
 *         'Admin,Manager' / 'Admin,Manager,Staff') combined with a hardcoded
 *         department-module list to ensure Purchase-side users only see Purchase
 *         notifications and Sales-side users only see Sales notifications.
 *  - Stock alert types (Low Stock, Out of Stock, Stock Update) are surfaced to ALL
 *    operations staff because they impact both purchasing decisions and selling availability.
 *  - The broken `canAccessModule()` helper (which depended on a non-existent `p.module`
 *    column in the permissions table) has been removed entirely.
 */
const buildRbacConditions = async (req, db) => {
  const conditions = [];
  const queryParams = [];

  const isSuperAdminMaster = req.user?.role === 'Super Admin' && !req.tenantId;

  // ── Multi-tenant isolation ───────────────────────────────────────────────────
  if (isSuperAdminMaster && req.query.tenant_id) {
    conditions.push('tenant_id = ?');
    queryParams.push(req.query.tenant_id);
  }

  // ── Admin / Super Admin: unrestricted visibility ──────────────────────────────
  if (isSuperAdminMaster || req.user?.role === 'Admin' || req.user?.role === 'Super Admin') {
    return { conditions, queryParams };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  NON-ADMIN USERS — Managers, Staff, and Employees (Panel-Based Filter)
  // ════════════════════════════════════════════════════════════════════════════

  // Exclude purely Admin-internal system/billing/security notifications
  conditions.push(`COALESCE(module, related_module) NOT IN ('Security', 'Settings', 'Billing', 'Billing & Subscription', 'System')`);
  conditions.push(`type NOT IN ('System Setting', 'Subscription Expired', 'Subscription Update', 'Staff Security')`);

  const userRole = req.user?.role || '';
  const dept     = req.user?.department || '';

  // Standard Module Groups per Panel
  const PURCHASE_MODULES = [
    'Purchases', 'Purchase', 'Inventory', 'Stock', 'Stock Management',
    'Supplier', 'Vendors', 'Vendor Returns', 'Purchase Returns',
    'Stock Destroy', 'Product Master', 'Products', 'General'
  ];

  const SALES_MODULES = [
    'Sales', 'Billing', 'Customer', 'Customers', 'Borrow', 'Borrow Ledger',
    'Sales Returns', 'Returns', 'POS', 'Product Master', 'Products', 'General'
  ];

  const OPERATIONAL_STOCK_TYPES = ['Low Stock', 'Out of Stock', 'Stock Update', 'Stock Intake'];

  // Role Target Match Expression
  // A manager matches target_roles containing 'Manager', 'Staff', 'All', or exact role name.
  // An employee matches target_roles containing 'Staff', 'Employee', 'All', or exact role name.
  const isManagerRole = userRole.includes('Manager');
  
  let roleMatchSql = '';
  if (isManagerRole) {
    roleMatchSql = `(target_roles IS NULL OR target_roles = '' OR target_roles LIKE '%Manager%' OR target_roles LIKE '%Staff%' OR target_roles LIKE '%All%' OR target_roles LIKE ?)`;
  } else {
    roleMatchSql = `(target_roles IS NULL OR target_roles = '' OR target_roles LIKE '%Staff%' OR target_roles LIKE '%Employee%' OR target_roles LIKE '%All%' OR target_roles LIKE ?)`;
  }
  const exactRoleParam = `%${userRole}%`;

  if (userRole === 'Purchase Manager' || (isManagerRole && dept === 'Purchase')) {
    // Purchase Manager panel access: Purchase & Stock modules + Purchase actor actions + Stock alerts
    const mPlaceholders = PURCHASE_MODULES.map(() => '?').join(',');
    const stockPlaceholders = OPERATIONAL_STOCK_TYPES.map(() => '?').join(',');

    conditions.push(`(
      (
        ${roleMatchSql}
        AND COALESCE(module, related_module) IN (${mPlaceholders})
      )
      OR type IN (${stockPlaceholders})
      OR actor_role IN ('Purchase Employee', 'Purchase Manager')
      OR actor_id = ?
    )`);
    queryParams.push(exactRoleParam, ...PURCHASE_MODULES, ...OPERATIONAL_STOCK_TYPES, req.user?.id || 0);

  } else if (userRole === 'Sales Manager' || (isManagerRole && dept === 'Sales')) {
    // Sales Manager panel access: Sales & Customer & POS modules + Sales actor actions + Stock alerts
    const mPlaceholders = SALES_MODULES.map(() => '?').join(',');
    const stockPlaceholders = OPERATIONAL_STOCK_TYPES.map(() => '?').join(',');

    conditions.push(`(
      (
        ${roleMatchSql}
        AND COALESCE(module, related_module) IN (${mPlaceholders})
      )
      OR type IN (${stockPlaceholders})
      OR actor_role IN ('Sales Employee', 'Sales Manager')
      OR actor_id = ?
    )`);
    queryParams.push(exactRoleParam, ...SALES_MODULES, ...OPERATIONAL_STOCK_TYPES, req.user?.id || 0);

  } else if (userRole === 'Purchase Employee' || dept === 'Purchase') {
    // Purchase Employee panel access: Purchase & Stock modules
    const mPlaceholders = PURCHASE_MODULES.map(() => '?').join(',');
    const stockPlaceholders = OPERATIONAL_STOCK_TYPES.map(() => '?').join(',');

    conditions.push(`(
      (
        ${roleMatchSql}
        AND COALESCE(module, related_module) IN (${mPlaceholders})
      )
      OR type IN (${stockPlaceholders})
      OR actor_id = ?
    )`);
    queryParams.push(exactRoleParam, ...PURCHASE_MODULES, ...OPERATIONAL_STOCK_TYPES, req.user?.id || 0);

  } else if (userRole === 'Sales Employee' || dept === 'Sales') {
    // Sales Employee panel access: Sales & POS & Customer modules
    const mPlaceholders = SALES_MODULES.map(() => '?').join(',');
    const stockPlaceholders = OPERATIONAL_STOCK_TYPES.map(() => '?').join(',');

    conditions.push(`(
      (
        ${roleMatchSql}
        AND COALESCE(module, related_module) IN (${mPlaceholders})
      )
      OR type IN (${stockPlaceholders})
      OR actor_id = ?
    )`);
    queryParams.push(exactRoleParam, ...SALES_MODULES, ...OPERATIONAL_STOCK_TYPES, req.user?.id || 0);

  } else {
    // General Employee (role 'Employee' or store staff with both sales & purchase panel duties)
    const ALL_OP_MODULES = [...new Set([...PURCHASE_MODULES, ...SALES_MODULES])];
    const mPlaceholders = ALL_OP_MODULES.map(() => '?').join(',');
    const stockPlaceholders = OPERATIONAL_STOCK_TYPES.map(() => '?').join(',');

    conditions.push(`(
      (
        ${roleMatchSql}
        AND COALESCE(module, related_module) IN (${mPlaceholders})
      )
      OR type IN (${stockPlaceholders})
      OR actor_id = ?
    )`);
    queryParams.push(exactRoleParam, ...ALL_OP_MODULES, ...OPERATIONAL_STOCK_TYPES, req.user?.id || 0);
  }

  return { conditions, queryParams };
};

// @desc    Get all notifications (filtered by role, module, priority, search, page)
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly, module, priority, search, page = 1, limit = 50 } = req.query;
    
    const isSuperAdminMaster = req.user.role === 'Super Admin' && !req.tenantId;
    const db = isSuperAdminMaster ? masterPool : req.db;

    const { conditions, queryParams } = await buildRbacConditions(req, db);

    // 1. Unread filter
    if (unreadOnly === 'true' || unreadOnly === true) {
      conditions.push('is_read = FALSE');
    }

    // 2. Module filter
    if (module && module !== 'all') {
      conditions.push('(module = ? OR related_module = ?)');
      queryParams.push(module, module);
    }

    // 3. Priority filter
    if (priority && priority !== 'all') {
      conditions.push('priority = ?');
      queryParams.push(priority);
    }

    // 4. Search filter
    if (search && search.trim() !== '') {
      conditions.push('(title LIKE ? OR message LIKE ? OR actor_name LIKE ? OR action LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    let query = 'SELECT * FROM notifications';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Total count for pagination
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const [countResult] = await db.query(countQuery, queryParams);
    const total = countResult[0]?.count || 0;

    // Ordering & Pagination
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const parsedLimit = parseInt(limit) || 50;
    const parsedPage = parseInt(page) || 1;
    const offset = (parsedPage - 1) * parsedLimit;
    const paginationParams = [...queryParams, parsedLimit, offset];

    const [notifications] = await db.query(query, paginationParams);

    return res.status(200).json({
      success: true,
      total,
      page: parsedPage,
      limit: parsedLimit,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res, next) => {
  try {
    const isSuperAdminMaster = req.user.role === 'Super Admin' && !req.tenantId;
    const db = isSuperAdminMaster ? masterPool : req.db;

    const { conditions, queryParams } = await buildRbacConditions(req, db);
    conditions.push('is_read = FALSE');

    let query = 'SELECT COUNT(*) as unreadCount FROM notifications WHERE ' + conditions.join(' AND ');

    const [result] = await db.query(query, queryParams);
    const unreadCount = result[0]?.unreadCount || 0;

    return res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isSuperAdminMaster = req.user.role === 'Super Admin' && !req.tenantId;
    const db = isSuperAdminMaster ? masterPool : req.db;

    const { conditions, queryParams } = await buildRbacConditions(req, db);
    conditions.push('id = ?');
    queryParams.push(id);

    const checkQuery = 'SELECT id FROM notifications WHERE ' + conditions.join(' AND ');
    const [existing] = await db.query(checkQuery, queryParams);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found or access denied' });
    }

    await db.query('UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a notification as unread
// @route   PUT /api/notifications/:id/unread
// @access  Private
export const markAsUnread = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isSuperAdminMaster = req.user.role === 'Super Admin' && !req.tenantId;
    const db = isSuperAdminMaster ? masterPool : req.db;

    const { conditions, queryParams } = await buildRbacConditions(req, db);
    conditions.push('id = ?');
    queryParams.push(id);

    const checkQuery = 'SELECT id FROM notifications WHERE ' + conditions.join(' AND ');
    const [existing] = await db.query(checkQuery, queryParams);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found or access denied' });
    }

    await db.query('UPDATE notifications SET is_read = FALSE, read_at = NULL WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Notification marked as unread' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res, next) => {
  try {
    const isSuperAdminMaster = req.user.role === 'Super Admin' && !req.tenantId;
    const db = isSuperAdminMaster ? masterPool : req.db;

    const { conditions, queryParams } = await buildRbacConditions(req, db);
    conditions.push('is_read = FALSE');

    const query = 'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE ' + conditions.join(' AND ');

    await db.query(query, queryParams);
    return res.status(200).json({ success: true, message: 'All relevant notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isSuperAdminMaster = req.user.role === 'Super Admin' && !req.tenantId;
    const db = isSuperAdminMaster ? masterPool : req.db;

    const { conditions, queryParams } = await buildRbacConditions(req, db);
    conditions.push('id = ?');
    queryParams.push(id);

    const checkQuery = 'SELECT id FROM notifications WHERE ' + conditions.join(' AND ');
    const [existing] = await db.query(checkQuery, queryParams);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found or access denied' });
    }

    await db.query('DELETE FROM notifications WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all notifications or read notifications
// @route   DELETE /api/notifications/clear-all
// @access  Private
export const clearAllNotifications = async (req, res, next) => {
  try {
    const { readOnly } = req.query;
    const isSuperAdminMaster = req.user.role === 'Super Admin' && !req.tenantId;
    const db = isSuperAdminMaster ? masterPool : req.db;

    const { conditions, queryParams } = await buildRbacConditions(req, db);

    if (readOnly === 'true' || readOnly === true) {
      conditions.push('is_read = TRUE');
    }

    let query = 'DELETE FROM notifications';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    await db.query(query, queryParams);
    return res.status(200).json({ success: true, message: 'Notifications cleared successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new notification manually
// @route   POST /api/notifications
// @access  Private
export const createNotificationApi = async (req, res, next) => {
  try {
    const { title, message, type = 'System', module = 'General', priority = 'Medium', reference_id, reference_type } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    await createNotification({
      tenantId: req.tenantId,
      user_id: req.user?.id,
      type,
      title,
      message,
      priority,
      related_user: req.user?.name || req.user?.email || 'System',
      module,
      related_module: module,
      reference_id,
      reference_type,
      actor_id: req.user?.id,
      actor_name: req.user?.name || req.user?.email || 'System',
      actor_role: req.user?.role || 'Staff',
      action: type
    });

    return res.status(201).json({ success: true, message: 'Notification created successfully' });
  } catch (error) {
    next(error);
  }
};
