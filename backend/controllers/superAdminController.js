import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { masterPool, getTenantPool } from '../config/tenantDb.js';
import { provisionTenantDatabase } from '../services/tenantProvisioner.js';
import { createNotification } from '../services/notificationService.js';
import { runFullBackup, listBackups } from '../services/backupService.js';
import { validateEmailField } from '../utils/validators.js';

// Helper for logger fallback since activity logs table exists on both master and tenant DBs
const logMasterActivity = async (userId, action, module, details, ip) => {
  try {
    await masterPool.query(
      'INSERT INTO activity_logs (tenant_id, user_id, action, module, details, ip_address) VALUES (NULL, ?, ?, ?, ?, ?)',
      [userId, action, module, details, ip]
    );
  } catch (err) {
    console.error('Failed to log master activity:', err);
  }
};

// @desc    Get platform stats / KPI analytics for Super Admin
// @route   GET /api/superadmin/kpis
// @access  Private (Super Admin only)
export const getPlatformKPIs = async (req, res, next) => {
  try {
    const [tenants] = await masterPool.query('SELECT * FROM tenants ORDER BY created_at DESC');

    const totalStoresCount = tenants.length;
    const activeStoresCount = tenants.filter(t => t.subscription_status === 'Active' || t.subscription_status === 'Trial').length;
    const inactiveStoresCount = tenants.filter(t => t.subscription_status === 'Inactive' || t.subscription_status === 'Suspended' || t.subscription_status === 'Expired').length;

    let cumulativeSales = 0;
    let totalTransactionsCount = 0;
    let totalActiveUsers = 0;
    let totalInactiveUsers = 0;

    const tenantsWithMetrics = await Promise.all(
      tenants.map(async (store) => {
        let activeUsers = 0;
        let inactiveUsers = 0;
        let storeSales = 0;
        if (store.database_name) {
          try {
            const tenantDb = getTenantPool(store.database_name);
            const [uRes] = await tenantDb.query('SELECT status, COUNT(*) as count FROM users GROUP BY status');
            uRes.forEach(r => {
              if (r.status === 'Active') activeUsers += r.count;
              else inactiveUsers += r.count;
            });

            const [sRes] = await tenantDb.query('SELECT COUNT(*) as invoiceCount, COALESCE(SUM(total), 0) as total FROM sales');
            storeSales = Number(sRes[0]?.total || 0);
            cumulativeSales += storeSales;
            totalTransactionsCount += Number(sRes[0]?.invoiceCount || 0);
          } catch (err) {
            console.error(`Failed to fetch metrics for ${store.database_name}:`, err.message);
          }
        }

        totalActiveUsers += activeUsers;
        totalInactiveUsers += inactiveUsers;

        const [ownerUsers] = await masterPool.query('SELECT email, phone, login_id FROM users WHERE tenant_id = ? AND role = "Admin" LIMIT 1', [store.id]);

        return {
          ...store,
          owner_name: ownerUsers[0]?.login_id || store.owner_name || store.store_name || 'Store Admin',
          owner_email: ownerUsers[0]?.email || store.email || 'N/A',
          active_users: activeUsers + inactiveUsers,
          store_sales: storeSales
        };
      })
    );

    // ── ACCURATE MONTHLY SAAS INCOME & PLATFORM REVENUE CALCULATION ─────────
    let platformRevenue = 0;
    let monthlySaaSIncome = 0;
    let mrrAmortized = 0;
    try {
      // 1. Calculate total actual paid cash collected from billing_history & subscriptions
      const [billRevenue] = await masterPool.query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM billing_history 
        WHERE payment_status = 'Paid'
      `);
      const [subRevenue] = await masterPool.query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM subscriptions 
        WHERE payment_status = 'Paid'
      `);

      const totalPaidSaaSIncome = Math.max(Number(billRevenue[0]?.total || 0), Number(subRevenue[0]?.total || 0));

      // 2. Fetch latest paid subscription per store to get active recurring valuation
      const [latestPaidSubs] = await masterPool.query(`
        SELECT s.tenant_id, s.plan, s.amount
        FROM subscriptions s
        INNER JOIN (
          SELECT tenant_id, MAX(id) as max_id
          FROM subscriptions
          WHERE payment_status = 'Paid' AND amount > 0
          GROUP BY tenant_id
        ) latest ON s.tenant_id = latest.tenant_id AND s.id = latest.max_id
      `);

      const activeStoresPlanSum = latestPaidSubs.reduce((sum, s) => sum + Number(s.amount || 0), 0);

      // 3. Amortized MRR calculation
      const PLAN_RATES = {
        Monthly: 800,
        Quarterly: 2100,
        'Half-Yearly': 3600,
        Yearly: 6000
      };

      latestPaidSubs.forEach(s => {
        const amt = Number(s.amount) > 0 ? Number(s.amount) : (PLAN_RATES[s.plan] || 800);
        if (s.plan === 'Monthly') mrrAmortized += amt;
        else if (s.plan === 'Quarterly') mrrAmortized += Math.round(amt / 3);
        else if (s.plan === 'Half-Yearly') mrrAmortized += Math.round(amt / 6);
        else if (s.plan === 'Yearly') mrrAmortized += Math.round(amt / 12);
      });

      monthlySaaSIncome = totalPaidSaaSIncome;
      platformRevenue = totalPaidSaaSIncome;
    } catch (err) {
      console.warn('[KPI] Revenue query error:', err.message);
    }

    return res.status(200).json({
      success: true,
      kpis: {
        totalStores: totalStoresCount,
        activeStores: activeStoresCount,
        suspendedStores: inactiveStoresCount,
        inactiveStores: inactiveStoresCount,
        totalUsers: totalActiveUsers + totalInactiveUsers,
        activeUsers: totalActiveUsers,
        inactiveUsers: totalInactiveUsers,
        totalEmployees: totalActiveUsers,
        totalProducts: 0,
        totalSales: cumulativeSales,
        totalTransactions: totalTransactionsCount,
        platformRevenue: platformRevenue,
        monthlySaaSIncome: monthlySaaSIncome,
        mrr: mrrAmortized
      },
      recentStores: tenantsWithMetrics,
      stores: tenantsWithMetrics,
      recentLogs: []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tenants/stores
// @route   GET /api/superadmin/stores
// @access  Private (Super Admin only)
export const getStores = async (req, res, next) => {
  try {
    const [stores] = await masterPool.query(`
      SELECT t.*, u.login_id as admin_id
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'Admin'
      ORDER BY t.created_at DESC
    `);

    const storesWithDetails = await Promise.all(stores.map(async (store) => {
      let subs = [];
      try {
        const [subLogs] = await masterPool.query(
          'SELECT * FROM subscription_logs WHERE tenant_id = ? ORDER BY created_at DESC',
          [store.id]
        );
        subs = subLogs;
      } catch (err) {
        subs = [];
      }

      let bills = [];
      try {
        const [billHistory] = await masterPool.query(
          'SELECT * FROM billing_history WHERE tenant_id = ? ORDER BY billing_date DESC',
          [store.id]
        );
        bills = billHistory;
      } catch (err) {
        bills = [];
      }

      // Dynamically fetch actual Admin ID from tenant isolated database as persistent source of truth
      let adminId = store.admin_id;
      if (store.database_name) {
        try {
          const tenantDb = getTenantPool(store.database_name);
          const [localAdmins] = await tenantDb.query(`
            SELECT u.login_id 
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.name = 'Admin'
            LIMIT 1
          `);
          if (localAdmins.length > 0) {
            adminId = localAdmins[0].login_id;
          }
        } catch (err) {
          console.warn(`[Registry] Could not fetch local admin login_id for store ${store.store_name} (${store.database_name}):`, err.message);
        }
      }

      return {
        ...store,
        admin_id: adminId,
        subscriptions: subs,
        invoices: bills
      };
    }));

    return res.status(200).json({ success: true, count: storesWithDetails.length, stores: storesWithDetails });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new tenant store and automatically initialize isolated database
// @route   POST /api/superadmin/stores
// @access  Private (Super Admin only)
export const createStore = async (req, res, next) => {
  const masterConn = await masterPool.getConnection();
  let finalDbName = null;
  try {
    await masterConn.beginTransaction();

    let {
      store_name,
      owner_name,
      email,
      phone,
      address,
      gstin,
      subscription_plan = 'Trial',
      subscription_expires_at,
      password, // Store Admin account password
      admin_id // Unique Admin ID (e.g. AMAN001)
    } = req.body;

    if (!store_name || !owner_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Required fields: Store Name, Owner Name, Email, and Password' });
    }

    const emailErr = validateEmailField(email, true);
    if (emailErr) {
      return res.status(400).json({ success: false, message: emailErr, field: 'email' });
    }

    // Auto-generate / format Admin ID in UPPERCASE with auto-incrementing sequence (e.g. AMAN001, AMAN002)
    let basePrefix = 'ADMIN';
    if (admin_id && String(admin_id).trim()) {
      const match = String(admin_id).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '').match(/^([A-Z_]+)/);
      if (match && match[1]) basePrefix = match[1];
    } else if (owner_name && String(owner_name).trim()) {
      const firstWord = String(owner_name).trim().split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
      if (firstWord.length >= 2) basePrefix = firstWord;
    }

    // Query Master DB users for highest sequence matching basePrefix
    const [existingAdmins] = await masterConn.query(
      'SELECT login_id FROM users WHERE UPPER(login_id) LIKE ?',
      [`${basePrefix}%`]
    );

    let maxSeq = 0;
    for (const r of existingAdmins) {
      const logId = String(r.login_id || '').toUpperCase();
      const numMatch = logId.match(new RegExp(`^${basePrefix}(\\d+)$`));
      if (numMatch && numMatch[1]) {
        const seqNum = parseInt(numMatch[1], 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }
    }

    let candidateAdminId = '';
    if (admin_id && String(admin_id).trim()) {
      const userReqId = String(admin_id).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
      const [dupReq] = await masterConn.query('SELECT id FROM users WHERE UPPER(login_id) = ?', [userReqId]);
      if (dupReq.length === 0) {
        candidateAdminId = userReqId;
      }
    }

    if (!candidateAdminId) {
      candidateAdminId = `${basePrefix}${String(maxSeq + 1).padStart(3, '0')}`;
    }

    const sanitizedAdminId = candidateAdminId;
    const dbName = `shop_${sanitizedAdminId.toLowerCase()}`;

    const [dupDbName] = await masterConn.query('SELECT id FROM tenants WHERE database_name = ?', [dbName]);
    if (dupDbName.length > 0) {
      return res.status(400).json({ success: false, message: `Database name "${dbName}" already exists. Please choose another unique Admin ID.` });
    }

    // Verify unique email constraints globally in Master DB
    const [dupTenant] = await masterConn.query('SELECT id FROM tenants WHERE email = ?', [email]);
    if (dupTenant.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists. Please use a different email address.' });
    }

    const [dupUser] = await masterConn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (dupUser.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists. Please use a different email address.' });
    }

    // Generate unique Tenant UUID
    const randUuid = 'TENT-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Calculate trial dates (7-day free trial)
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    // Insert tenant record directly with formatted shop database name and activate 7-day free trial
    const [tenantResult] = await masterConn.query(
      `INSERT INTO tenants (tenant_uuid, store_name, owner_name, email, phone, address, gstin, subscription_status, subscription_plan, subscription_expires_at, trial_started_at, trial_ended_at, trial_used, database_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Trial', 'Trial', ?, ?, ?, TRUE, ?)`,
      [randUuid, store_name, owner_name, email, phone || null, address || null, gstin || null, trialEnd, trialStart, trialEnd, dbName]
    );

    const tenantId = tenantResult.insertId;
    finalDbName = dbName;

    // Insert into subscriptions table immediately
    await masterConn.query(
      `INSERT INTO subscriptions (tenant_id, plan, status, trial_start_date, trial_end_date, subscription_start_date, subscription_expiry_date, payment_status, payment_gateway, amount)
       VALUES (?, 'Trial', 'Trial', ?, ?, NULL, NULL, 'Paid', 'System', 0.00)`,
      [tenantId, trialStart, trialEnd]
    );

    // Hash Store Admin password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert Store Admin user globally in Master DB
    await masterConn.query(
      'INSERT INTO users (tenant_id, email, password, role, status, login_id) VALUES (?, ?, ?, "Admin", "Active", ?)',
      [tenantId, email, hashedPassword, sanitizedAdminId]
    );

    // Dynamic database creation & seeding
    console.log(`[Provisioner] Creating database: "${finalDbName}"...`);
    await provisionTenantDatabase(tenantId, finalDbName, store_name, owner_name, email, password, sanitizedAdminId);

    // Commit master transaction
    await masterConn.commit();

    await logMasterActivity(req.user.id, 'Register Store', 'System', `Registered tenant store "${store_name}" (UUID: ${randUuid}, DB: ${finalDbName})`, req.ip);

    await createNotification({
      tenantId: tenantId,
      type: 'Admin Registration',
      title: 'New Admin Registered',
      message: `Store Admin "${owner_name}" (${email}) successfully registered store "${store_name}".`,
      priority: 'High',
      related_user: email,
      related_module: 'Auth',
      target_roles: 'Super Admin',
      isMaster: true
    });

    return res.status(201).json({
      success: true,
      message: 'Store database created and seeded successfully!',
      tenantId,
      uuid: randUuid,
      databaseName: finalDbName
    });
  } catch (error) {
    await masterConn.rollback();
    // Drop the created tenant database if provisioning failed
    if (finalDbName) {
      try {
        const dbHost = process.env.DB_HOST || '127.0.0.1';
        const dbPort = process.env.DB_PORT || 3306;
        const dbUser = process.env.DB_USER || 'root';
        const dbPass = process.env.DB_PASSWORD || '';
        const tempConn = await mysql.createConnection({ host: dbHost, port: dbPort, user: dbUser, password: dbPass });
        await tempConn.query(`DROP DATABASE IF EXISTS \`${finalDbName}\`;`);
        await tempConn.end();
        console.log(`[Provisioner] Cleaned up database: "${finalDbName}" due to provisioning failure.`);
      } catch (cleanupErr) {
        console.error('Failed to clean up database after seeder/provisioning failure:', cleanupErr);
      }
    }
    next(error);
  } finally {
    masterConn.release();
  }
};

// @desc    Update tenant store attributes / subscription status
// @route   PUT /api/superadmin/stores/:id
// @access  Private (Super Admin only)
// Helper to synchronize store subscription status and user status across Master DB and isolated Tenant DB
export const syncTenantStoreAndUserStatus = async (tenantId, newSubscriptionStatus, newPlan = null, newExpiry = null, conn = null) => {
  try {
    const isStoreActive = newSubscriptionStatus === 'Active' || newSubscriptionStatus === 'Trial';
    const targetUserStatus = isStoreActive ? 'Active' : 'Suspended';
    const dbClient = conn || masterPool;

    // 1. Update masterPool tenants table status, plan, and expiry
    let query = 'UPDATE tenants SET subscription_status = ?';
    const params = [newSubscriptionStatus];

    if (newPlan) {
      query += ', subscription_plan = ?';
      params.push(newPlan);
    }
    if (newExpiry) {
      query += ', subscription_expires_at = ?';
      params.push(newExpiry);
    }
    query += ' WHERE id = ?';
    params.push(tenantId);

    await dbClient.query(query, params);

    // 2. Update masterPool users table for all non-superadmin users under this tenant
    await dbClient.query(
      'UPDATE users SET status = ? WHERE tenant_id = ? AND role != "Super Admin"',
      [targetUserStatus, tenantId]
    );

    // 3. Update isolated tenant DB users table
    const [tenants] = await dbClient.query('SELECT database_name FROM tenants WHERE id = ?', [tenantId]);
    if (tenants.length > 0 && tenants[0].database_name) {
      const dbName = tenants[0].database_name;
      try {
        const tenantDb = getTenantPool(dbName);
        await tenantDb.query('UPDATE users SET status = ?', [targetUserStatus]);
      } catch (err) {
        console.warn(`[Status Sync] Failed to sync tenant DB "${dbName}":`, err.message);
      }
    }
  } catch (err) {
    console.error(`[Status Sync] Error syncing tenant status for ID ${tenantId}:`, err);
  }
};

export const updateStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      store_name,
      owner_name,
      phone,
      address,
      gstin,
      subscription_status,
      subscription_plan,
      subscription_expires_at
    } = req.body;

    const [existing] = await masterPool.query('SELECT store_name FROM tenants WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant store not found' });
    }

    await masterPool.query(
      `UPDATE tenants 
       SET store_name = COALESCE(?, store_name),
           owner_name = COALESCE(?, owner_name),
           phone = ?,
           address = ?,
           gstin = ?,
           subscription_status = COALESCE(?, subscription_status),
           subscription_plan = COALESCE(?, subscription_plan),
           subscription_expires_at = ?
       WHERE id = ?`,
      [
        store_name || null, owner_name || null, phone || null, address || null, gstin || null,
        subscription_status || null, subscription_plan || null, subscription_expires_at || null,
        id
      ]
    );

    // Reflect status change globally across Master DB and Tenant DB
    if (subscription_status) {
      await syncTenantStoreAndUserStatus(id, subscription_status);
    }

    // Update Admin password across Master DB and Tenant DB if provided in update payload
    if (req.body.password && String(req.body.password).trim().length > 0) {
      const newPassword = String(req.body.password).trim();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update in Master DB users table
      await masterPool.query('UPDATE users SET password = ? WHERE tenant_id = ? AND role = "Admin"', [hashedPassword, id]);

      // Update in Tenant DB users table
      const [tRows] = await masterPool.query('SELECT database_name FROM tenants WHERE id = ?', [id]);
      if (tRows.length > 0 && tRows[0].database_name) {
        try {
          const tenantDb = getTenantPool(tRows[0].database_name);
          await tenantDb.query(
            'UPDATE users SET password = ? WHERE role_id = (SELECT id FROM roles WHERE name = "Admin" LIMIT 1) OR id = 1',
            [hashedPassword]
          );
        } catch (pErr) {
          console.warn('[UpdateStore] Tenant DB password update error:', pErr.message);
        }
      }
    }

    await logMasterActivity(req.user.id, 'Update Store Info', 'System', `Updated attributes and status for store ID: ${id}`, req.ip);

    return res.status(200).json({ success: true, message: 'Store properties updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle tenant store status (Active / Inactive)
// @route   PATCH /api/superadmin/stores/:id/status
// @access  Private (Super Admin only)
export const toggleStoreStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const [existing] = await masterPool.query('SELECT id, store_name, subscription_status FROM tenants WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant store not found' });
    }

    const tenant = existing[0];
    const currentStatus = tenant.subscription_status;
    let newStatus = status;

    if (!newStatus) {
      newStatus = (currentStatus === 'Inactive' || currentStatus === 'Disabled' || currentStatus === 'Suspended') ? 'Active' : 'Suspended';
    }

    // Synchronize store and user status across Master DB and Tenant DB
    await syncTenantStoreAndUserStatus(id, newStatus);

    await logMasterActivity(
      req.user.id, 
      'Toggle Store Status', 
      'System', 
      `Changed tenant store "${tenant.store_name}" (ID: ${id}) status from "${currentStatus}" to "${newStatus}"`, 
      req.ip
    );

    return res.status(200).json({ 
      success: true, 
      message: `Store "${tenant.store_name}" status updated to ${newStatus}`,
      status: newStatus 
    });
  } catch (error) {
    next(error);
  }
};

// Safety wrapper: Physical delete is disabled per SaaS ERP standards; performs soft toggle instead
export const deleteStore = async (req, res, next) => {
  req.body = { status: 'Inactive' };
  return toggleStoreStatus(req, res, next);
};

// Plan rates config for Super Admin manual renewals
const SUPER_ADMIN_PLAN_RATES = {
  Monthly: { price: 800, months: 1 },
  Quarterly: { price: 2100, months: 3 },
  'Half-Yearly': { price: 3600, months: 6 },
  Yearly: { price: 6000, months: 12 }
};

// @desc    Perform manual subscription action (activate, suspend, extend, renew, cancel)
// @route   POST /api/superadmin/stores/:id/subscription-action
// @access  Private (Super Admin only)
export const handleSubscriptionAction = async (req, res, next) => {
  const masterConn = await masterPool.getConnection();
  try {
    await masterConn.beginTransaction();
    const { id } = req.params;
    const { action, planName, days } = req.body;

    const [tenants] = await masterConn.query(
      'SELECT store_name, subscription_status, subscription_plan, subscription_expires_at FROM tenants WHERE id = ?',
      [id]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const tenant = tenants[0];
    let newStatus = tenant.subscription_status;
    let newPlan = tenant.subscription_plan;
    let newExpiry = tenant.subscription_expires_at ? new Date(tenant.subscription_expires_at) : new Date();

    if (action === 'activate') {
      newStatus = 'Active';
      newPlan = planName || 'Monthly';
      const months = SUPER_ADMIN_PLAN_RATES[newPlan] ? SUPER_ADMIN_PLAN_RATES[newPlan].months : 1;
      const price = SUPER_ADMIN_PLAN_RATES[newPlan] ? SUPER_ADMIN_PLAN_RATES[newPlan].price : 0;
      
      newExpiry = new Date();
      newExpiry.setMonth(newExpiry.getMonth() + months);
      
      // Update subscriptions
      await masterConn.query(
        `INSERT INTO subscriptions (tenant_id, plan, status, subscription_start_date, subscription_expiry_date, payment_status, payment_gateway, amount)
         VALUES (?, ?, 'Active', CURRENT_DATE(), ?, 'Paid', 'Manual SuperAdmin Override', ?)`,
        [id, newPlan, newExpiry, price]
      );

      // Also record invoice in billing_history
      const txnId1 = `TXN-SAAS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      try {
        await masterConn.query(
          `INSERT INTO billing_history (tenant_id, transaction_id, amount, plan, payment_status, billing_date, next_renewal_date, payment_method)
           VALUES (?, ?, ?, ?, 'Paid', CURRENT_DATE(), ?, 'SuperAdmin Override')`,
          [id, txnId1, price, newPlan, newExpiry]
        );
      } catch (bhErr) {
        console.warn('[BillingHistory] Insert error:', bhErr.message);
      }
    } else if (action === 'suspend') {
      newStatus = 'Suspended';
      await masterConn.query(
        `UPDATE subscriptions SET status = 'Suspended' WHERE tenant_id = ? AND status IN ('Trial', 'Active')`,
        [id]
      );
    } else if (action === 'extend') {
      const extendDays = Number(days) || 7;
      newExpiry = new Date(newExpiry);
      newExpiry.setDate(newExpiry.getDate() + extendDays);
      newStatus = 'Active'; // Re-activate if expired

      await masterConn.query(
        `UPDATE subscriptions 
         SET status = 'Active', subscription_expiry_date = ? 
         WHERE tenant_id = ? AND status IN ('Trial', 'Active', 'Expired')`,
        [newExpiry, id]
      );
    } else if (action === 'renew') {
      newStatus = 'Active';
      newPlan = planName || tenant.subscription_plan;
      if (newPlan === 'Trial') newPlan = 'Monthly';
      const months = SUPER_ADMIN_PLAN_RATES[newPlan] ? SUPER_ADMIN_PLAN_RATES[newPlan].months : 1;
      const price = SUPER_ADMIN_PLAN_RATES[newPlan] ? SUPER_ADMIN_PLAN_RATES[newPlan].price : 0;
      
      let baseDate = new Date();
      if (tenant.subscription_expires_at && new Date(tenant.subscription_expires_at) > new Date() && tenant.subscription_status === 'Active') {
        baseDate = new Date(tenant.subscription_expires_at);
      }
      newExpiry = new Date(baseDate);
      newExpiry.setMonth(newExpiry.getMonth() + months);

      await masterConn.query(
        `INSERT INTO subscriptions (tenant_id, plan, status, subscription_start_date, subscription_expiry_date, payment_status, payment_gateway, amount)
         VALUES (?, ?, 'Active', CURRENT_DATE(), ?, 'Paid', 'Manual SuperAdmin Override', ?)`,
        [id, newPlan, newExpiry, price]
      );

      // Also record invoice in billing_history
      const txnId2 = `TXN-SAAS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      try {
        await masterConn.query(
          `INSERT INTO billing_history (tenant_id, transaction_id, amount, plan, payment_status, billing_date, next_renewal_date, payment_method)
           VALUES (?, ?, ?, ?, 'Paid', CURRENT_DATE(), ?, 'SuperAdmin Override')`,
          [id, txnId2, price, newPlan, newExpiry]
        );
      } catch (bhErr) {
        console.warn('[BillingHistory] Insert error:', bhErr.message);
      }
    } else if (action === 'cancel') {
      newStatus = 'Expired';
      newExpiry = new Date(); // Expire immediately
      await masterConn.query(
        `UPDATE subscriptions SET status = 'Expired', subscription_expiry_date = ? WHERE tenant_id = ? AND status IN ('Trial', 'Active')`,
        [newExpiry, id]
      );
    }

    // Synchronize tenant store & user status across Master DB and Tenant DB
    await syncTenantStoreAndUserStatus(id, newStatus, newPlan, newExpiry, masterConn);

    // Log action to subscription logs
    await masterConn.query(
      'INSERT INTO subscription_logs (tenant_id, action, description) VALUES (?, ?, ?)',
      [id, action.toUpperCase(), `Manual SuperAdmin Override Action: ${action.toUpperCase()} on plan ${newPlan}.`]
    );

    await masterConn.commit();

    await createNotification({
      tenantId: id,
      type: 'Subscription',
      title: `Subscription Status ${newStatus}`,
      message: `Tenant subscription status updated to "${newStatus}" (Plan: "${newPlan}") by Super Admin.`,
      priority: 'High',
      related_user: tenant.email,
      related_module: 'Billing',
      target_roles: 'Super Admin',
      isMaster: true
    });

    if (tenant && tenant.database_name) {
      try {
        const tenantDb = getTenantPool(tenant.database_name);
        await createNotification({
          type: 'Subscription',
          title: `Subscription Status Updated`,
          message: `Your SaaS subscription status has been updated to "${newStatus}" (Plan: "${newPlan}").`,
          priority: 'High',
          related_user: 'System',
          related_module: 'Billing',
          target_roles: 'Admin'
        }, tenantDb);
      } catch (err) {
        console.warn(`[Subscription Notification] Warning for tenant DB "${tenant.database_name}":`, err.message);
      }
    }

    return res.status(200).json({ success: true, message: `Store subscription is now ${newStatus} with plan ${newPlan}` });
  } catch (error) {
    await masterConn.rollback();
    next(error);
  } finally {
    masterConn.release();
  }
};

// @desc    Get all database backups list
// @route   GET /api/superadmin/backups
// @access  Private (Super Admin only)
export const getBackups = async (req, res, next) => {
  try {
    const backups = listBackups();
    return res.status(200).json({ success: true, count: backups.length, backups });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger instant full database backup
// @route   POST /api/superadmin/backups/trigger
// @access  Private (Super Admin only)
export const triggerManualBackup = async (req, res, next) => {
  try {
    const result = await runFullBackup();
    return res.status(200).json({ success: true, message: 'Automated full database backup executed successfully', backup: result });
  } catch (error) {
    next(error);
  }
};
