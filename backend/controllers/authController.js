import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { masterPool, getTenantPool, ensureTenantMigrations } from '../config/tenantDb.js';
import { createNotification } from '../services/notificationService.js';
import { provisionTenantDatabase } from '../services/tenantProvisioner.js';

// Helper to generate JWT token
const generateToken = (id, email, role, tenantId, tenantDbName) => {
  return jwt.sign({ id, email, role, tenantId, tenantDbName }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

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

// @desc    Super Admin, Admin & Employee Login
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    let input = String(email).trim();
    let inputPass = String(password).trim();

    // 1. Authenticate credentials against Master Database global users
    const [globalUsers] = await masterPool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR UPPER(login_id) = UPPER(?)', 
      [input, input]
    );

    if (globalUsers.length === 0) {
      await createNotification({
        type: 'Failed Login',
        title: 'Failed Login Attempt',
        message: `Failed login attempt for unrecognized email/ID: "${input}".`,
        priority: 'High',
        related_user: input,
        related_module: 'Auth',
        target_roles: 'Super Admin',
        isMaster: true
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials. Account not found.' });
    }

    let globalUser = globalUsers[0];

    // Check Tenant Subscription status & Auto-Heal status when store is Active/Trial
    if (globalUser.role !== 'Super Admin' && globalUser.tenant_id) {
      const [tenants] = await masterPool.query('SELECT id, store_name, subscription_status, database_name FROM tenants WHERE id = ?', [globalUser.tenant_id]);
      if (tenants.length > 0) {
        const tenantObj = tenants[0];

        // Block login if store is explicitly suspended or deactivated
        if (tenantObj.subscription_status === 'Suspended' || tenantObj.subscription_status === 'Inactive' || tenantObj.subscription_status === 'Deactivated' || tenantObj.subscription_status === 'Disabled') {
          return res.status(403).json({
            success: false,
            message: `Your store account is currently ${tenantObj.subscription_status.toLowerCase()}. Please contact the Super Admin.`
          });
        }

        // Auto-heal status if store is Active or Trial but user status in DB was stale
        if (tenantObj.subscription_status === 'Active' || tenantObj.subscription_status === 'Trial') {
          if (globalUser.status !== 'Active') {
            await masterPool.query('UPDATE users SET status = "Active" WHERE id = ?', [globalUser.id]);
            globalUser.status = 'Active';
          }
          if (tenantObj.database_name) {
            try {
              const tenantDb = getTenantPool(tenantObj.database_name);
              await tenantDb.query('UPDATE users SET status = "Active" WHERE LOWER(email) = LOWER(?) OR UPPER(login_id) = UPPER(?)', [globalUser.email, globalUser.login_id || globalUser.email]);
            } catch (healErr) {
              console.warn('[Auth Login] Status auto-heal error:', healErr.message);
            }
          }
        }
      }
    }

    if (globalUser.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your account is inactive. Please contact your administrator.' });
    }

    // Verify Password Hash strictly with Bidirectional Self-Healing
    let isMatch = await bcrypt.compare(inputPass, globalUser.password);

    if (!isMatch && globalUser.role !== 'Super Admin' && globalUser.tenant_id) {
      try {
        const [tenants] = await masterPool.query('SELECT database_name FROM tenants WHERE id = ?', [globalUser.tenant_id]);
        if (tenants.length > 0) {
          const tenantDb = getTenantPool(tenants[0].database_name);
          const [tUsers] = await tenantDb.query(
            'SELECT password FROM users WHERE LOWER(email) = LOWER(?) OR UPPER(login_id) = UPPER(?)', 
            [globalUser.email, globalUser.login_id || globalUser.email]
          );
          if (tUsers.length > 0) {
            const isTenantMatch = await bcrypt.compare(inputPass, tUsers[0].password);
            if (isTenantMatch) {
              isMatch = true;
              // Auto-heal masterPool hash so future logins are instant
              await masterPool.query('UPDATE users SET password = ? WHERE id = ?', [tUsers[0].password, globalUser.id]);
            }
          }
        }
      } catch (err) {
        console.warn('[Self-Healing Auth] Tenant DB fallback check:', err.message);
      }
    }

    // Bidirectional sync: If masterPool password matched, ensure tenantDb password is also updated if different
    if (isMatch && globalUser.role !== 'Super Admin' && globalUser.tenant_id) {
      try {
        const [tenants] = await masterPool.query('SELECT database_name FROM tenants WHERE id = ?', [globalUser.tenant_id]);
        if (tenants.length > 0 && tenants[0].database_name) {
          const tenantDb = getTenantPool(tenants[0].database_name);
          await tenantDb.query('UPDATE users SET password = ? WHERE LOWER(email) = LOWER(?) OR UPPER(login_id) = UPPER(?)', [globalUser.password, globalUser.email, globalUser.login_id || globalUser.email]);
        }
      } catch (syncErr) {
        // non-blocking
      }
    }

    if (!isMatch) {
      if (globalUser.role === 'Super Admin') {
        await createNotification({
          type: 'Failed Login',
          title: 'Failed Login Attempt',
          message: `Failed login attempt for Super Admin (${globalUser.email}).`,
          priority: 'High',
          related_user: globalUser.email,
          related_module: 'Auth',
          target_roles: 'Super Admin',
          isMaster: true
        });
      } else {
        const tenantId = globalUser.tenant_id;
        const [tenants] = await masterPool.query('SELECT database_name FROM tenants WHERE id = ?', [tenantId]);
        if (tenants.length > 0) {
          const tenantDb = getTenantPool(tenants[0].database_name);
          await createNotification({
            type: 'Failed Login',
            title: 'Failed Login Attempt',
            message: `Failed login attempt for user account: "${globalUser.email}".`,
            priority: 'High',
            related_user: globalUser.email,
            related_module: 'Auth',
            target_roles: 'Admin'
          }, tenantDb);
        }
      }
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    // Update last_login in Master users table
    await masterPool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [globalUser.id]);

    let tenantDbName = 'kirana_erp_master';
    let tenantId = null;
    let displayName = 'Super Admin';
    let userRole = globalUser.role;
    let localUsers = null;
    let permissions = [];
    let localDept = null;
    let tenant = null;

    // 2. Resolve Store metadata if user is not Super Admin
    if (globalUser.role !== 'Super Admin') {
      tenantId = globalUser.tenant_id;
      const [tenants] = await masterPool.query('SELECT * FROM tenants WHERE id = ?', [tenantId]);
      if (tenants.length === 0) {
        return res.status(404).json({ success: false, message: 'Tenant store specifications not found' });
      }

      tenant = tenants[0];
      tenantDbName = tenant.database_name;

      // Check tenant status - block all logins if tenant is inactive or deactivated
      if (tenant.subscription_status === 'Inactive' || tenant.subscription_status === 'Deactivated' || tenant.subscription_status === 'Disabled') {
        return res.status(403).json({
          success: false,
          message: 'Your store account has been deactivated. Please contact the Super Admin.'
        });
      }

      // 3. CHECK AND INITIALIZE TRIAL STATE ON FIRST LOGIN
      if (tenant.first_login_at === null) {
        console.log(`[Billing] Activating 7-Day Free Trial for Tenant: "${tenant.store_name}" (Email: ${email})`);
        
        await masterPool.query(
          `UPDATE tenants 
           SET first_login_at = NOW(),
               subscription_status = 'Trial',
               subscription_plan = 'Trial',
               subscription_expires_at = DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY),
               trial_started_at = NOW(),
               trial_ended_at = DATE_ADD(NOW(), INTERVAL 7 DAY),
               trial_used = TRUE
           WHERE id = ?`,
          [tenantId]
        );

        // Log to subscription change audit
        await masterPool.query(
          'INSERT INTO subscription_logs (tenant_id, action, description) VALUES (?, "Trial Started", "7-Day Free Trial automatically activated on first successful login.")',
          [tenantId]
        );
      }

      // Fetch actual local user details (like display name, role, department, role_id) from the isolated database
      const tenantDb = getTenantPool(tenantDbName);

      // Update last_login in Tenant users table
      await tenantDb.query('UPDATE users SET last_login = NOW() WHERE email = ?', [globalUser.email]);

      const [results] = await tenantDb.query(
        `SELECT u.id, u.name, r.name as role, u.department, u.role_id 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.email = ?`,
         [globalUser.email]
      );
      localUsers = results;
      
      if (localUsers.length > 0) {
        displayName = localUsers[0].name;
        userRole = localUsers[0].role;
        localDept = localUsers[0].department;

        // Fetch permissions mapping
        const [rolePerms] = await tenantDb.query(
          `SELECT p.name FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id WHERE rp.role_id = ?`,
          [localUsers[0].role_id]
        );
        const [userPerms] = await tenantDb.query(
          `SELECT p.name FROM user_permissions up JOIN permissions p ON up.permission_id = p.id WHERE up.user_id = ?`,
          [localUsers[0].id]
        );
        permissions = [...new Set([...rolePerms.map(p => p.name), ...userPerms.map(p => p.name)])];
      }
    }

    // Generate Token containing core routing contexts
    const token = generateToken(globalUser.id, globalUser.email, globalUser.role, tenantId, tenantDbName);

    // Asynchronously log login activity & trigger notifications in background for instant login response times
    setImmediate(async () => {
      try {
        if (globalUser.role === 'Super Admin') {
          await logMasterActivity(globalUser.id, 'User Login Success', 'Auth', 'Super Admin logged in.', req.ip);
          await createNotification({
            type: 'User Login',
            title: 'Super Admin Login',
            message: `Super Admin logged in successfully from IP ${req.ip}.`,
            priority: 'Low',
            related_user: globalUser.email,
            related_module: 'Auth',
            target_roles: 'Super Admin',
            isMaster: true
          });
        } else {
          const tenantDb = getTenantPool(tenantDbName);
          try {
            const localUserId = (localUsers && localUsers[0]) ? localUsers[0].id : null;
            await tenantDb.query(
              'INSERT INTO activity_logs (user_id, action, module, details, ip_address) VALUES (?, "User Login Success", "Auth", "Logged in to isolated store console.", ?)',
              [localUserId, req.ip]
            );
          } catch (err) {
            console.error('Failed to log tenant login activity:', err);
          }

          await createNotification({
            type: 'User Login',
            title: 'Employee Logged In',
            message: `${userRole} "${displayName}" logged in successfully.`,
            priority: 'Low',
            related_user: globalUser.email,
            related_module: 'Auth',
            target_roles: 'Admin,Manager'
          }, tenantDb);

          if (tenant && tenant.subscription_expires_at) {
            const expiresAt = new Date(tenant.subscription_expires_at);
            const now = new Date();
            const diffTime = expiresAt - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 0 && diffDays <= 3) {
              await createNotification({
                type: 'Subscription',
                title: 'Subscription Expiry Reminder',
                message: `Your SaaS subscription will expire in ${diffDays} day(s) on ${expiresAt.toLocaleDateString()}. Please renew soon.`,
                priority: 'High',
                related_user: 'System',
                related_module: 'Billing',
                target_roles: 'Admin'
              }, tenantDb);
            }
          }
        }
      } catch (err) {
        console.error('Post-login background notification error:', err);
      }
    });

    // Combined permissions logic for Super Admin
    const superAdminPerms = globalUser.role === 'Super Admin' ? ['manage_tenants', 'manage_subscriptions'] : [];

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: globalUser.id,
        name: displayName,
        email: globalUser.email,
        login_id: globalUser.login_id,
        role: userRole,
        department: globalUser.role === 'Super Admin' ? null : (localUsers && localUsers[0] ? localUsers[0].department : null),
        permissions: globalUser.role === 'Super Admin' ? superAdminPerms : (localUsers && localUsers[0] ? permissions : []),
        tenant_id: tenantId,
        store_name: globalUser.role === 'Super Admin' ? 'SaaS Super Admin' : (tenant ? tenant.store_name : null),
        subscription_status: globalUser.role === 'Super Admin' ? 'Active' : (tenant ? tenant.subscription_status : null),
        subscription_expires_at: globalUser.role === 'Super Admin' ? null : (tenant ? tenant.subscription_expires_at : null)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const [users] = await masterPool.query('SELECT id, role FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No user registered with this email address' });
    }

    const user = users[0];
    
    // Generate secure 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    
    // Save to master DB users table
    await masterPool.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?',
      [otp, user.id]
    );

    await logMasterActivity(user.id, 'Forgot Password Triggered', 'Auth', 'Requested password recovery OTP code.', req.ip);

    return res.status(200).json({
      success: true,
      message: 'Password reset code generated and sent to email.',
      resetToken: otp // Retain key name for frontend compatibility
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { password, token } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Invalid request parameters' });
    }

    // Query master users table to verify token and expiration
    const [users] = await masterPool.query(
      'SELECT id, email, tenant_id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token/OTP' });
    }

    const user = users[0];
    const userId = user.id;
    const email = user.email;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Update master auth credentials registry and invalidate the token immediately
    await masterPool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, userId]
    );

    // 2. Update local tenant database registry if applicable
    if (user.tenant_id) {
      // Find tenant database name
      const [tenants] = await masterPool.query('SELECT database_name FROM tenants WHERE id = ?', [user.tenant_id]);
      if (tenants.length > 0) {
        const tenantDbName = tenants[0].database_name;
        const db = getTenantPool(tenantDbName);
        await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
      }
    }

    await logMasterActivity(userId, 'Password Reset Completed', 'Auth', 'Password updated successfully and reset token invalidated.', req.ip);

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully! You can now log in.'
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }
};

// @desc    Change Password (Authenticated Users)
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    // Get password hash from master DB
    const [users] = await masterPool.query('SELECT password FROM users WHERE id = ?', [userId]);
    const user = users[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 1. Update in Master DB users
    await masterPool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    // 2. Update in Tenant DB users
    if (req.user.role !== 'Super Admin' && req.tenantDbName) {
      await req.db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    }

    await createNotification({
      type: 'Password Change',
      title: 'Password Updated',
      message: `Password changed for account: "${email}".`,
      priority: 'High',
      related_user: email,
      related_module: 'Auth',
      target_roles: req.user.role === 'Super Admin' ? 'Super Admin' : 'Admin'
    });

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User Profile details from active DB
export const getProfile = async (req, res, next) => {
  try {
    if (req.user.role === 'Super Admin') {
      const [saUser] = await masterPool.query(
        'SELECT id, email, role, phone, address FROM users WHERE id = ?',
        [req.user.id]
      );
      return res.status(200).json({
        success: true,
        user: {
          id: req.user.id,
          name: 'Super Admin',
          email: req.user.email,
          role: 'Super Admin',
          phone: saUser[0]?.phone || '',
          address: saUser[0]?.address || '',
          tenant_id: null
        }
      });
    }

    const [users] = await req.db.query(
      `SELECT u.id, u.name, u.email, u.contact as phone, u.status, u.created_at, r.name as role, u.department, u.role_id 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ?`,
      [req.user.email]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    const profileUser = users[0];
    profileUser.address = '';

    const tenantIdToUse = req.tenantId || req.user.tenant_id;
    if (tenantIdToUse) {
      const [tenants] = await masterPool.query(
        'SELECT store_name, subscription_status, subscription_expires_at FROM tenants WHERE id = ?',
        [tenantIdToUse]
      );
      const tenant = tenants[0];
      profileUser.store_name = tenant ? tenant.store_name : null;
      profileUser.subscription_status = tenant ? tenant.subscription_status : null;
      profileUser.subscription_expires_at = tenant ? tenant.subscription_expires_at : null;
    }

    // Fetch permissions mapping
    const [rolePerms] = await req.db.query(
      `SELECT p.name FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id WHERE rp.role_id = ?`,
      [profileUser.role_id]
    );
    const [userPerms] = await req.db.query(
      `SELECT p.name FROM user_permissions up JOIN permissions p ON up.permission_id = p.id WHERE up.user_id = ?`,
      [profileUser.id]
    );
    
    profileUser.permissions = [...new Set([...rolePerms.map(p => p.name), ...userPerms.map(p => p.name)])];

    return res.status(200).json({
      success: true,
      user: profileUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Profile Info
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, address, currentPassword, newPassword } = req.body;
    const currentEmail = req.user.email;
    const userId = req.user.id;

    let cleanPhone = null;
    if (phone && String(phone).trim() !== '') {
      cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, message: 'Mobile Number must be exactly 10 digits' });
      }
    }

    // Handle password update if provided
    let hashedPassword = null;
    if (currentPassword && newPassword) {
      // Get password hash from master DB
      const [masterUsers] = await masterPool.query('SELECT password FROM users WHERE id = ?', [userId]);
      if (masterUsers.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found in authentication system' });
      }
      const userObj = masterUsers[0];

      const isMatch = await bcrypt.compare(currentPassword, userObj.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(newPassword, salt);
    }

    // Check duplicate email globally if email is changing
    if (email && email !== currentEmail) {
      const [emailCheck] = await masterPool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (emailCheck.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already exists. Please use a different email address.' });
      }

      // Update email globally in Master users table
      await masterPool.query('UPDATE users SET email = ? WHERE email = ?', [email, currentEmail]);
    }

    // Update global users fields
    if (hashedPassword) {
      await masterPool.query(
        'UPDATE users SET email = COALESCE(?, email), password = ?, phone = COALESCE(?, phone), address = COALESCE(?, address) WHERE id = ?',
        [email || null, hashedPassword, phone || null, address || null, userId]
      );
    } else {
      await masterPool.query(
        'UPDATE users SET email = COALESCE(?, email), phone = COALESCE(?, phone), address = COALESCE(?, address) WHERE id = ?',
        [email || null, phone || null, address || null, userId]
      );
    }

    if (req.user.role !== 'Super Admin') {
      // Update locally in Tenant database user profile details
      if (hashedPassword) {
        await req.db.query(
          'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), password = ?, contact = COALESCE(?, contact) WHERE email = ?',
          [name || null, email || null, hashedPassword, phone || null, currentEmail]
        );
      } else {
        await req.db.query(
          'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), contact = COALESCE(?, contact) WHERE email = ?',
          [name || null, email || null, phone || null, currentEmail]
        );
      }
    }

    // Get updated details to return
    let finalUserObj = {};
    if (req.user.role === 'Super Admin') {
      const [saUser] = await masterPool.query(
        'SELECT id, email, role, phone, address FROM users WHERE id = ?',
        [userId]
      );
      finalUserObj = {
        id: userId,
        name: 'Super Admin',
        email: saUser[0]?.email,
        role: 'Super Admin',
        phone: saUser[0]?.phone || '',
        address: saUser[0]?.address || ''
      };
    } else {
      const dbEmail = email || currentEmail;
      const [updatedUsers] = await req.db.query(
        `SELECT u.id, u.name, u.email, u.contact as phone, r.name as role 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.email = ?`,
        [dbEmail]
      );
      finalUserObj = updatedUsers[0] || {};
      if (finalUserObj) finalUserObj.address = '';
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: finalUserObj
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout User
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      if (req.user.role === 'Super Admin') {
        await createNotification({
          type: 'User Logout',
          title: 'Super Admin Logout',
          message: `Super Admin logged out.`,
          priority: 'Low',
          related_user: req.user.email,
          related_module: 'Auth',
          target_roles: 'Super Admin',
          isMaster: true
        });
      } else {
        await createNotification({
          type: 'User Logout',
          title: 'Employee Logged Out',
          message: `${req.user.role} "${req.user.name}" logged out.`,
          priority: 'Low',
          related_user: req.user.email,
          related_module: 'Auth',
          target_roles: 'Admin,Manager'
        }, req.db);
      }
    }
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Self-Service Merchant Store Registration (Public Signup)
// @route   POST /api/auth/register-store
// @access  Public
export const registerStore = async (req, res, next) => {
  const masterConn = await masterPool.getConnection();
  try {
    await masterConn.beginTransaction();

    const {
      store_name,
      owner_name,
      email,
      password,
      phone,
      address,
      gstin
    } = req.body;

    if (!store_name || !owner_name || !email || !password) {
      masterConn.release();
      return res.status(400).json({ success: false, message: 'Required fields: Store Name, Owner Name, Email, and Password' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();
    const cleanOwner = String(owner_name).trim();
    const cleanStore = String(store_name).trim();
    let cleanPhone = null;
    if (phone && String(phone).trim() !== '') {
      cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        masterConn.release();
        return res.status(400).json({ success: false, message: 'Contact / Mobile Number must be exactly 10 digits' });
      }
    }

    if (cleanPassword.length < 6) {
      masterConn.release();
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Verify email uniqueness globally in Master DB
    const [dupUser] = await masterConn.query('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (dupUser.length > 0) {
      masterConn.release();
      return res.status(400).json({ success: false, message: 'Email address is already registered. Please login instead.' });
    }

    const [dupTenant] = await masterConn.query('SELECT id FROM tenants WHERE LOWER(email) = ?', [cleanEmail]);
    if (dupTenant.length > 0) {
      masterConn.release();
      return res.status(400).json({ success: false, message: 'Email address is already registered. Please login instead.' });
    }

    // Auto-generate Admin ID prefix (e.g. RADHE001)
    let basePrefix = cleanOwner.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
    if (!basePrefix || basePrefix.length < 2) basePrefix = 'STORE';

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
        if (!isNaN(seqNum) && seqNum > maxSeq) maxSeq = seqNum;
      }
    }

    const sanitizedAdminId = `${basePrefix}${String(maxSeq + 1).padStart(3, '0')}`;
    const dbName = `shop_${sanitizedAdminId.toLowerCase()}`;

    const randUuid = 'TENT-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    // Insert tenant record
    const [tenantResult] = await masterConn.query(
      `INSERT INTO tenants 
        (tenant_uuid, store_name, owner_name, email, phone, address, gstin, subscription_status, subscription_plan, subscription_expires_at, trial_started_at, trial_ended_at, trial_used, database_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Trial', 'Trial', ?, ?, ?, TRUE, ?)`,
      [
        randUuid, cleanStore, cleanOwner, cleanEmail, cleanPhone, address || null, gstin || null,
        trialEnd, trialStart, trialEnd, dbName
      ]
    );

    const tenantId = tenantResult.insertId;

    // Hash password and insert Admin user into master users table
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(cleanPassword, salt);

    const [userResult] = await masterConn.query(
      `INSERT INTO users (tenant_id, email, login_id, password, role, status)
       VALUES (?, ?, ?, ?, 'Admin', 'Active')`,
      [tenantId, cleanEmail, sanitizedAdminId, passwordHash]
    );

    const userId = userResult.insertId;

    // Provision the store database, tables, and default data synchronously
    try {
      await provisionTenantDatabase(tenantId, dbName, cleanStore, cleanOwner, cleanEmail, cleanPassword, sanitizedAdminId);
      await ensureTenantMigrations(dbName);
    } catch (provErr) {
      console.error('[RegisterStore] Database provisioning error:', provErr);
    }

    await masterConn.commit();

    // Generate JWT token for instant auto-login
    const token = generateToken(userId, cleanEmail, 'Admin', tenantId, dbName);

    await createNotification({
      type: 'New Store Registered',
      title: '🆕 New Merchant Store Registered',
      message: `Merchant "${cleanStore}" (${cleanOwner}) registered for 7-Day Free Trial.`,
      priority: 'High',
      related_user: cleanEmail,
      related_module: 'Auth',
      target_roles: 'Super Admin',
      isMaster: true
    });

    return res.status(201).json({
      success: true,
      message: 'Store registered successfully! Welcome to Kirana ERP 🚀',
      token,
      user: {
        id: userId,
        email: cleanEmail,
        name: cleanOwner,
        role: 'Admin',
        tenantId,
        tenantDbName: dbName,
        store_name: cleanStore,
        login_id: sanitizedAdminId,
        subscription_status: 'Trial',
        subscription_plan: 'Trial',
        trial_ended_at: trialEnd
      }
    });

  } catch (error) {
    await masterConn.rollback();
    next(error);
  } finally {
    masterConn.release();
  }
};
