import bcrypt from 'bcryptjs';
import { masterPool } from '../config/tenantDb.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../services/notificationService.js';

// @desc    Get all users for tenant
// @route   GET /api/users
// @access  Private (Admin & Managers)
export const getUsers = async (req, res, next) => {
  try {
    let query = `
      SELECT u.id, u.name, u.email, u.contact, u.login_id, u.employee_serial_id, u.status, u.last_login, u.created_at, r.name as role_name, r.id as role_id, u.department
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `;
    const queryParams = [];

    // Filter based on manager role
    if (req.user.role === 'Sales Manager') {
      query += ` WHERE r.name = 'Sales Employee' OR (u.department = 'Sales' AND r.name LIKE '%Employee%')`;
    } else if (req.user.role === 'Purchase Manager') {
      query += ` WHERE r.name = 'Purchase Employee' OR (u.department = 'Purchase' AND r.name LIKE '%Employee%')`;
    } else if (req.user.role.includes('Employee')) {
      return res.status(403).json({ success: false, message: 'Employees do not have access to staff management.' });
    }

    query += ` ORDER BY u.name ASC`;

    const [users] = await req.db.query(query, queryParams);

    // Fetch user permissions for each user
    for (let user of users) {
      const [perms] = await req.db.query(
        'SELECT permission_id FROM user_permissions WHERE user_id = ?',
        [user.id]
      );
      user.permission_ids = perms.map(p => p.permission_id);
    }

    return res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user account for tenant
// @route   POST /api/users
// @access  Private (Admin & Managers)
export const createUser = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { name, email, contact, password, role_id, department, permission_ids } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Full Name is required', field: 'name' });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email Address is required', field: 'email' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required', field: 'password' });
    }

    // 1. Verify unique email constraint globally in Master Database
    const [existingGlobal] = await masterPool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingGlobal.length > 0) {
      return res.status(400).json({ success: false, message: 'Email address already exists. Please use a different email address.', field: 'email' });
    }

    // Verify unique contact constraint locally
    if (contact) {
      const [existingContact] = await connection.query('SELECT id FROM users WHERE contact = ?', [contact]);
      if (existingContact.length > 0) {
        return res.status(400).json({ success: false, message: `Contact number "${contact}" is already registered with another staff member.`, field: 'contact' });
      }
    }

    // 2. Verify role exists locally
    const [roles] = await connection.query('SELECT name FROM roles WHERE id = ?', [role_id]);
    if (roles.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid role selection' });
    }

    const roleName = roles[0].name;
    let dept = department || null;

    // Strict Role Hierarchy Validation
    if (req.user.role === 'Admin') {
      if (roleName === 'Admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot register another Admin account.'
        });
      }
      dept = department || (roleName.includes('Purchase') ? 'Purchase' : (roleName.includes('Sales') ? 'Sales' : 'General'));
    } else if (req.user.role === 'Purchase Manager') {
      if (roleName !== 'Purchase Employee' && roleName !== 'Employee') {
        return res.status(403).json({ success: false, message: 'Purchase Manager can create only Purchase Employee accounts.' });
      }
      dept = 'Purchase';
    } else if (req.user.role === 'Sales Manager') {
      if (roleName !== 'Sales Employee' && roleName !== 'Employee') {
        return res.status(403).json({ success: false, message: 'Sales Manager can create only Sales Employee accounts.' });
      }
      dept = 'Sales';
    } else {
      return res.status(403).json({ success: false, message: 'Employees do not have permission to create staff accounts.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Fetch current tenant Admin's login_id
    const [adminUser] = await connection.query(
      "SELECT login_id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1) LIMIT 1"
    );
    const adminId = adminUser[0]?.login_id || 'ADMIN';

    // Determine Role-based Login ID Prefix (4-digit suffix for all roles)
    let prefix = '';
    const cleanAdmin = adminId || 'AMAN01';

    if (roleName === 'Purchase Manager') {
      prefix = `${cleanAdmin}-PM`;
    } else if (roleName === 'Sales Manager') {
      prefix = `${cleanAdmin}-SM`;
    } else if (roleName === 'Purchase Employee' || dept === 'Purchase') {
      prefix = `${cleanAdmin}-PE`;
    } else if (roleName === 'Sales Employee' || dept === 'Sales') {
      prefix = `${cleanAdmin}-SE`;
    } else {
      prefix = `${cleanAdmin}-EM`;
    }

    // Find existing user IDs starting with the same prefix to compute next counter
    const [existingUsers] = await connection.query(
      'SELECT login_id FROM users WHERE login_id LIKE ?',
      [`${prefix}%`]
    );

    let maxVal = 0;
    existingUsers.forEach(u => {
      const loginId = u.login_id;
      const suffixStr = loginId.substring(prefix.length);
      const num = parseInt(suffixStr, 10);
      if (!isNaN(num) && num > maxVal) {
        maxVal = num;
      }
    });

    const nextVal = maxVal + 1;
    const nextSuffix = String(nextVal).padStart(4, '0');
    const generatedLoginId = `${prefix}${nextSuffix}`;

    // Fetch next available employee_serial_id without locking table gap
    const [serialResult] = await connection.query(
      'SELECT COALESCE(MAX(employee_serial_id), 0) + 1 AS next_serial FROM users'
    );
    const nextSerial = serialResult[0].next_serial;

    // 3. Insert user locally in tenant DB
    const [localResult] = await connection.query(
      'INSERT INTO users (name, email, contact, password, role_id, status, department, login_id, employee_serial_id) VALUES (?, ?, ?, ?, ?, "Active", ?, ?, ?)',
      [name, email, contact || null, hashedPassword, role_id, dept, generatedLoginId, nextSerial]
    );

    // 4. Insert user globally in Master DB users table
    const mappedRole = roleName === 'Admin' ? 'Admin' : 'Employee';
    await masterPool.query(
      'INSERT INTO users (tenant_id, email, password, role, status, login_id) VALUES (?, ?, ?, ?, "Active", ?)',
      [req.tenantId, email, hashedPassword, mappedRole, generatedLoginId]
    );

    // 5. Save user-specific permissions
    let targetPermIds = permission_ids;
    if ((!targetPermIds || !Array.isArray(targetPermIds) || targetPermIds.length === 0) && roleName === 'Employee') {
      const [opPerms] = await connection.query(
        'SELECT id FROM permissions WHERE name != "manage_users" AND name != "view_billing"'
      );
      targetPermIds = opPerms.map(p => p.id);
    }

    if (targetPermIds && Array.isArray(targetPermIds)) {
      let allowedPermissionIds = targetPermIds;
      if (req.user.role !== 'Admin') {
        // Managers can only assign permissions they themselves possess
        const [managerPerms] = await connection.query(
          `SELECT permission_id FROM role_permissions WHERE role_id = ?`,
          [req.user.role_id]
        );
        const managerPermSet = new Set(managerPerms.map(p => p.permission_id));
        allowedPermissionIds = targetPermIds.filter(pId => managerPermSet.has(pId));
      }
      for (const pId of allowedPermissionIds) {
        await connection.query(
          'INSERT INTO user_permissions (user_id, permission_id) VALUES (?, ?)',
          [localResult.insertId, pId]
        );
      }
    }

    await connection.commit();

    await logActivity(
      req.user.id,
      'Create User',
      'Users',
      `Created user account for "${name}" (Email: ${email}, Role: ${roleName}, Dept: ${dept || 'None'})`,
      req.ip
    );

    await createNotification({
      type: 'Employee Creation',
      title: 'New Employee Created',
      message: `Employee "${name}" (${email}) was registered as ${roleName} under ${dept || 'General'} department.`,
      priority: 'Medium',
      related_user: req.user.email,
      related_module: 'Auth',
      target_roles: 'Admin,Manager'
    }, connection);

    return res.status(201).json({
      success: true,
      message: 'User account created successfully',
      user: { id: localResult.insertId, name, email, role_id, status: 'Active', department: dept }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Update user account details / status
// @route   PUT /api/users/:id
// @access  Private (Admin & Managers)
export const updateUser = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { name, email, contact, role_id, status, department, permission_ids } = req.body;

    const [existing] = await connection.query(
      `SELECT u.email, u.role_id, u.department, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentEmail = existing[0].email;
    const currentRoleName = existing[0].role_name;
    const currentDept = existing[0].department;

    // Check duplicate email globally if email is changing
    if (email && email !== currentEmail) {
      const [emailCheck] = await masterPool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (emailCheck.length > 0) {
        return res.status(400).json({ success: false, message: 'Email address already exists. Please use a different email address.', field: 'email' });
      }
    }

    // Check duplicate contact locally if contact is changing
    if (contact) {
      const [contactCheck] = await connection.query('SELECT id FROM users WHERE contact = ? AND id != ?', [contact, id]);
      if (contactCheck.length > 0) {
        return res.status(400).json({ success: false, message: `Contact number "${contact}" is already registered with another staff member.`, field: 'contact' });
      }
    }

    // Block assigning Admin role to staff member
    if (role_id) {
      const [targetRole] = await connection.query('SELECT name FROM roles WHERE id = ?', [role_id]);
      if (targetRole.length > 0 && targetRole[0].name === 'Admin') {
        return res.status(400).json({
          success: false,
          message: 'Staff member role cannot be updated to Admin. Admin accounts are managed exclusively via Super Admin.'
        });
      }
    }

    // Verify Manager constraints on target user
    if (req.user.role === 'Sales Manager') {
      if (currentDept !== 'Sales' || currentRoleName !== 'Employee') {
        return res.status(403).json({ success: false, message: 'Sales Manager can only manage Sales Employee accounts' });
      }
      if (role_id) {
        const [targetRole] = await connection.query('SELECT name FROM roles WHERE id = ?', [role_id]);
        if (targetRole.length > 0 && targetRole[0].name !== 'Employee') {
          return res.status(403).json({ success: false, message: 'Sales Manager can only keep users as Employee' });
        }
      }
    } else if (req.user.role === 'Purchase Manager') {
      if (currentDept !== 'Purchase' || currentRoleName !== 'Employee') {
        return res.status(403).json({ success: false, message: 'Purchase Manager can only manage Purchase Employee accounts' });
      }
      if (role_id) {
        const [targetRole] = await connection.query('SELECT name FROM roles WHERE id = ?', [role_id]);
        if (targetRole.length > 0 && targetRole[0].name !== 'Employee') {
          return res.status(403).json({ success: false, message: 'Purchase Manager can only keep users as Employee' });
        }
      }
    }

    // Prevent suspending or changing the root admin user
    const [adminRoleCheck] = await connection.query('SELECT id FROM roles WHERE name = "Admin"');
    const storeAdminRoleId = adminRoleCheck[0]?.id;

    if (existing[0].role_id === storeAdminRoleId && (status === 'Suspended' || (role_id && Number(role_id) !== storeAdminRoleId))) {
      return res.status(400).json({ success: false, message: 'Cannot suspend or change root store administrator account attributes' });
    }

    // 1. Update user locally
    await connection.query(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), contact = ?, role_id = COALESCE(?, role_id), status = COALESCE(?, status), department = COALESCE(?, department) WHERE id = ?',
      [name, email || null, contact ?? existing[0].contact ?? null, role_id, status, department || currentDept, id]
    );

    // Update email in Master DB matching currentEmail
    if (email && email !== currentEmail) {
      await masterPool.query(
        'UPDATE users SET email = ? WHERE email = ? AND tenant_id = ?',
        [email, currentEmail, req.tenantId]
      );
    }

    // 2. Update status globally in Master DB matching email
    if (status) {
      await masterPool.query(
        'UPDATE users SET status = ? WHERE email = ? AND tenant_id = ?',
        [status, email || currentEmail, req.tenantId]
      );
    }

    // 3. Update role globally in Master DB matching email
    if (role_id) {
      const [roleNameQuery] = await connection.query('SELECT name FROM roles WHERE id = ?', [role_id]);
      if (roleNameQuery.length > 0) {
        const mappedRole = roleNameQuery[0].name === 'Admin' ? 'Admin' : 'Employee';
        await masterPool.query(
          'UPDATE users SET role = ? WHERE email = ? AND tenant_id = ?',
          [mappedRole, email || currentEmail, req.tenantId]
        );
      }
    }

    // 4. Update user-specific permissions
    if (permission_ids && Array.isArray(permission_ids)) {
      // Clear old overrides
      await connection.query('DELETE FROM user_permissions WHERE user_id = ?', [id]);

      let allowedPermissionIds = permission_ids;
      if (req.user.role !== 'Admin') {
        // Managers can only assign permissions they themselves possess
        const [managerPerms] = await connection.query(
          `SELECT permission_id FROM role_permissions WHERE role_id = ?`,
          [req.user.role_id]
        );
        const managerPermSet = new Set(managerPerms.map(p => p.permission_id));
        allowedPermissionIds = permission_ids.filter(pId => managerPermSet.has(pId));
      }
      for (const pId of allowedPermissionIds) {
        await connection.query(
          'INSERT INTO user_permissions (user_id, permission_id) VALUES (?, ?)',
          [id, pId]
        );
      }
    }

    await connection.commit();

    await logActivity(req.user.id, 'Update User Info', 'Users', `Updated account attributes for user ID: ${id}`, req.ip);

    return res.status(200).json({ success: true, message: 'User account updated successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Toggle staff member active/inactive status
// @route   PATCH /api/users/:id/status
// @access  Private (Admin & Managers)
export const toggleUserStatus = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status } = req.body || {};

    const [existing] = await connection.query(
      `SELECT u.id, u.name, u.email, u.status, u.role_id, u.department, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member profile not found' });
    }

    const staffUser = existing[0];

    // Protection for Admin primary account & self
    if (staffUser.role_name === 'Admin' || staffUser.email === req.user.email) {
      return res.status(400).json({
        success: false,
        message: 'Store Administrator primary account cannot be deactivated or suspended.'
      });
    }

    // Role hierarchy constraints check
    if (req.user.role === 'Sales Manager') {
      if (staffUser.department !== 'Sales' || staffUser.role_name !== 'Sales Employee') {
        return res.status(403).json({
          success: false,
          message: 'Sales Manager can only manage status for Sales Employees.'
        });
      }
    } else if (req.user.role === 'Purchase Manager') {
      if (staffUser.department !== 'Purchase' || staffUser.role_name !== 'Purchase Employee') {
        return res.status(403).json({
          success: false,
          message: 'Purchase Manager can only manage status for Purchase Employees.'
        });
      }
    }

    const newStatus = status || (staffUser.status === 'Active' ? 'Inactive' : 'Active');

    // 1. Update status in Tenant DB users table
    await connection.query('UPDATE users SET status = ? WHERE id = ?', [newStatus, id]);

    // 2. Update status in Master DB users table
    await masterPool.query(
      'UPDATE users SET status = ? WHERE email = ? AND tenant_id = ?',
      [newStatus, staffUser.email, req.tenantId]
    );

    await connection.commit();

    await logActivity(
      req.user.id,
      'Toggle Staff Status',
      'Users',
      `Changed staff member "${staffUser.name}" (${staffUser.email}) status from "${staffUser.status}" to "${newStatus}"`,
      req.ip
    );

    await createNotification({
      tenantId: req.tenantId,
      user_id: req.user.id,
      type: 'Staff Security',
      title: 'Staff Status Updated',
      message: `Staff member "${staffUser.name}" (${staffUser.email}) account status changed to "${newStatus}".`,
      priority: 'High',
      related_user: req.user.email,
      module: 'Staff',
      related_module: 'Staff',
      reference_id: staffUser.id,
      reference_type: 'User',
      target_roles: 'Admin'
    }, connection);

    return res.status(200).json({
      success: true,
      message: `Staff member "${staffUser.name}" status updated to ${newStatus}`,
      user: { id: staffUser.id, status: newStatus }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// Disabled physical delete endpoint: Returns 405 Method Not Allowed per SaaS ERP standards
export const deleteUser = async (req, res, next) => {
  return res.status(405).json({
    success: false,
    message: 'Permanent deletion of staff member accounts is disabled per SaaS ERP standards. Use Active/Inactive status toggle instead.'
  });
};

// @desc    Get Roles and Permissions for tenant
// @route   GET /api/users/roles
// @access  Private (Admin & Managers)
export const getRoles = async (req, res, next) => {
  try {
    let queryStr = 'SELECT * FROM roles WHERE name != "Admin" ORDER BY id ASC';
    
    if (req.user.role === 'Admin') {
      queryStr = 'SELECT * FROM roles WHERE name != "Admin" ORDER BY id ASC';
    } else if (req.user.role === 'Purchase Manager') {
      queryStr = 'SELECT * FROM roles WHERE name IN ("Purchase Employee", "Employee") ORDER BY id ASC';
    } else if (req.user.role === 'Sales Manager') {
      queryStr = 'SELECT * FROM roles WHERE name IN ("Sales Employee", "Employee") ORDER BY id ASC';
    }

    const [roles] = await req.db.query(queryStr);
    
    // Fetch mapped permissions for each role
    for (let role of roles) {
      const [perms] = await req.db.query(`
        SELECT p.id, p.name, p.module, p.description
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
      `, [role.id]);
      role.permissions = perms;
    }

    const [allPermissions] = await req.db.query('SELECT * FROM permissions');

    return res.status(200).json({ success: true, roles, allPermissions });
  } catch (error) {
    next(error);
  }
};

// @desc    Update permissions mapped to a role
// @route   PUT /api/users/roles/:id
// @access  Private (Admin only)
export const updateRolePermissions = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params; // Role ID
    const { permission_ids } = req.body; // Array of permission IDs

    if (!permission_ids) {
      return res.status(400).json({ success: false, message: 'Missing permission_ids list' });
    }

    // Verify role exists locally
    const [role] = await connection.query('SELECT name FROM roles WHERE id = ?', [id]);
    if (role.length === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    // Delete old mappings
    await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

    // Insert new mappings
    for (const pId of permission_ids) {
      await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [id, pId]);
    }

    await connection.commit();

    await logActivity(req.user.id, 'Update Role Permissions', 'Users', `Updated permissions mapped to Role "${role[0].name}" (ID: ${id})`, req.ip);

    return res.status(200).json({ success: true, message: `Permissions for role "${role[0].name}" updated successfully` });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Get activity audit logs for tenant
// @route   GET /api/users/activity-logs
// @access  Private (Admin only)
export const getActivityLogs = async (req, res, next) => {
  try {
    const { limit = 200 } = req.query;

    const [logs] = await req.db.query(`
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `, [Number(limit)]);

    return res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};
