import { masterPool, getTenantPool } from '../config/tenantDb.js';
import { requestContext } from '../utils/context.js';

/**
 * Creates a notification in either the Master database or Tenant database.
 */
export const createNotification = async (data, dbOverride = null) => {
  try {
    const {
      tenantId = null,
      user_id = null,
      type = 'System',
      title,
      message,
      priority = 'Medium',
      related_user = null,
      related_module = null,
      module = null,
      reference_id = null,
      reference_type = null,
      target_roles = 'Admin,Manager,Staff',
      isMaster = false,
      actor_id = null,
      actor_name = null,
      actor_role = null,
      action = null
    } = data;

    const req = requestContext.getStore();
    const effectiveModule = module || related_module || 'General';

    const effectiveActorId = actor_id || user_id || req?.user?.id || null;
    const effectiveActorName = actor_name || related_user || req?.user?.name || req?.user?.email || 'System';
    const effectiveActorRole = actor_role || req?.user?.role || (user_id ? 'User' : 'System');
    const effectiveAction = action || type || 'Activity';

    // Determine DB connection pool
    let activeDb = dbOverride;
    
    if (!activeDb) {
      if (req && req.db && !isMaster) {
        activeDb = req.db;
      } else if (isMaster) {
        activeDb = masterPool;
      } else {
        const effectiveTenantId = tenantId || (req && req.tenantId);
        if (effectiveTenantId) {
          const [tenants] = await masterPool.query('SELECT database_name FROM tenants WHERE id = ?', [effectiveTenantId]);
          if (tenants.length > 0 && tenants[0].database_name) {
            activeDb = getTenantPool(tenants[0].database_name);
          }
        }
      }
    }

    if (!activeDb) {
      activeDb = masterPool; // fallback
    }

    // Insert Notification with RBAC actor attributes
    const targetRolesVal = activeDb === masterPool ? (target_roles || 'Super Admin') : target_roles;
    console.log('[NotificationService] Inserting notification with actor:', { effectiveActorId, effectiveActorName, effectiveActorRole, effectiveAction, db: activeDb === masterPool ? 'master' : 'tenant' });
    
    if (activeDb === masterPool) {
      await activeDb.query(
        `INSERT INTO notifications (tenant_id, user_id, type, title, message, priority, module, related_module, reference_id, reference_type, related_user, target_roles, actor_id, actor_name, actor_role, action) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tenantId, effectiveActorId, type, title, message, priority, effectiveModule, effectiveModule, reference_id, reference_type, effectiveActorName, targetRolesVal, effectiveActorId, effectiveActorName, effectiveActorRole, effectiveAction]
      );
    } else {
      await activeDb.query(
        `INSERT INTO notifications (type, title, message, priority, module, related_module, reference_id, reference_type, related_user, target_roles, actor_id, actor_name, actor_role, action) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [type, title, message, priority, effectiveModule, effectiveModule, reference_id, reference_type, effectiveActorName, targetRolesVal, effectiveActorId, effectiveActorName, effectiveActorRole, effectiveAction]
      );
    }

    // Non-blocking asynchronous self-cleaning in background
    setImmediate(async () => {
      try {
        let cleanupDays = 30;
        const [settings] = await activeDb.query("SELECT `value` FROM settings WHERE `key` = 'notification_archive_days'");
        if (settings.length > 0 && settings[0].value) {
          cleanupDays = parseInt(settings[0].value) || 30;
        }
        await activeDb.query(
          "DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
          [cleanupDays]
        );
      } catch (err) {
        // Ignore background cleanup errors
      }
    });

  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
  }
};

/**
 * Checks stock levels for a product and triggers Low Stock / Out of Stock alerts.
 */
export const checkStockAlerts = async (db, productId, userId = null) => {
  try {
    // 1. Get total stock of this product
    const [stockRows] = await db.query(
      `SELECT COALESCE(SUM(quantity), 0) as total_stock 
       FROM stock 
       WHERE product_id = ?`,
      [productId]
    );
    const totalStock = stockRows.length > 0 ? Number(stockRows[0].total_stock) : 0;

    // 2. Fetch product details
    const [products] = await db.query(
      `SELECT id, name, barcode, min_stock FROM products WHERE id = ?`,
      [productId]
    );
    if (products.length === 0) return;
    const { id: prodId, name, barcode, min_stock } = products[0];

    // Get user details for related_user context
    let username = 'System';
    if (userId) {
      const [users] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
      if (users.length > 0) username = users[0].email;
    }

    if (totalStock === 0) {
      // Check if an unread "Out of Stock" alert already exists
      const [existing] = await db.query(
        `SELECT id FROM notifications 
         WHERE type = 'Out of Stock' AND (message LIKE ? OR reference_id = ?) AND is_read = FALSE`,
        [`%${barcode}%`, prodId]
      );
      if (existing.length === 0) {
        await createNotification({
          type: 'Out of Stock',
          title: 'Out of Stock Alert',
          message: `Product "${name}" (${barcode}) is completely out of stock.`,
          priority: 'High',
          related_user: username,
          module: 'Inventory',
          related_module: 'Inventory',
          reference_id: prodId,
          reference_type: 'Product',
          target_roles: 'Admin,Manager,Staff'
        }, db);
      }
    } else if (totalStock <= min_stock) {
      // Check if an unread "Low Stock" alert already exists
      const [existing] = await db.query(
        `SELECT id FROM notifications 
         WHERE type = 'Low Stock' AND (message LIKE ? OR reference_id = ?) AND is_read = FALSE`,
        [`%${barcode}%`, prodId]
      );
      if (existing.length === 0) {
        await createNotification({
          type: 'Low Stock',
          title: 'Low Stock Alert',
          message: `Product "${name}" (${barcode}) stock is low. Current: ${totalStock}, Threshold: ${min_stock}.`,
          priority: 'Medium',
          related_user: username,
          module: 'Inventory',
          related_module: 'Inventory',
          reference_id: prodId,
          reference_type: 'Product',
          target_roles: 'Admin,Manager,Staff'
        }, db);
      }
    } else {
      // Total stock is above threshold - resolve existing alerts
      await db.query(
        `UPDATE notifications 
         SET is_read = TRUE 
         WHERE type IN ('Low Stock', 'Out of Stock') AND (message LIKE ? OR reference_id = ?) AND is_read = FALSE`,
        [`%${barcode}%`, prodId]
      );
    }
  } catch (error) {
    console.error('[NotificationService] Error checking stock alerts:', error);
  }
};
