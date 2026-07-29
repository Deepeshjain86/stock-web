import { masterPool } from '../config/tenantDb.js';

// @desc    Get all activity logs with dynamic visibility filtering basis role/department
// @route   GET /api/activity-logs
// @access  Private
export const getActivityLogs = async (req, res, next) => {
  try {
    const { 
      user_id, role, department, module, action, status, 
      date_from, date_to, search_query 
    } = req.query;

    let query = `
      SELECT id, user_id, user_name, role, department, action, module, details, 
             record_id, previous_value, new_value, ip_address, device_info, session_id, status, created_at
      FROM activity_logs
      WHERE 1=1
    `;
    const queryParams = [];

    // Role-based visibility enforcement
    if (req.user.role === 'Super Admin') {
      // Super Admin sees all logs except sensitive account actions (passwords, secrets, credentials, payments)
      query += ` AND action NOT LIKE '%password%' 
                 AND action NOT LIKE '%secret%' 
                 AND action NOT LIKE '%credential%' 
                 AND action NOT LIKE '%payment%' 
                 AND details NOT LIKE '%password%'
                 AND details NOT LIKE '%secret%'`;
    } else if (req.user.role === 'Admin') {
      // Admin has complete visibility within their own store database
    } else if (req.user.role === 'Sales Manager') {
      // Sales Manager only sees Sales-related activities
      query += ` AND (department = 'Sales' OR module = 'Sales' OR action LIKE '%sale%')`;
    } else if (req.user.role === 'Purchase Manager') {
      // Purchase Manager only sees Purchase & Inventory-related activities
      query += ` AND (department = 'Purchase' OR module IN ('Purchase', 'Stock', 'Products', 'Categories') OR action LIKE '%purchase%' OR action LIKE '%stock%' OR action LIKE '%product%')`;
    } else {
      // Employees see only their own actions logs
      query += ' AND user_id = ?';
      queryParams.push(req.user.id);
    }

    // Dynamic Filter overlays
    if (user_id) {
      query += ' AND user_id = ?';
      queryParams.push(Number(user_id));
    }
    if (role) {
      query += ' AND role = ?';
      queryParams.push(role);
    }
    if (department) {
      query += ' AND department = ?';
      queryParams.push(department);
    }
    if (module) {
      query += ' AND module = ?';
      queryParams.push(module);
    }
    if (action) {
      query += ' AND action = ?';
      queryParams.push(action);
    }
    if (status) {
      query += ' AND status = ?';
      queryParams.push(status);
    }
    if (date_from) {
      query += ' AND created_at >= ?';
      queryParams.push(date_from);
    }
    if (date_to) {
      query += ' AND created_at <= ?';
      queryParams.push(date_to + ' 23:59:59');
    }
    if (search_query) {
      query += ' AND (details LIKE ? OR action LIKE ? OR user_name LIKE ? OR record_id LIKE ?)';
      const likeQuery = `%${search_query}%`;
      queryParams.push(likeQuery, likeQuery, likeQuery, likeQuery);
    }

    query += ' ORDER BY created_at DESC, id DESC';

    const [logs] = await req.db.query(query, queryParams);

    // Retrieve active store name from master database
    let shopName = 'Kirana ERP';
    if (req.tenantId) {
      try {
        const [tRows] = await masterPool.query('SELECT store_name FROM tenants WHERE id = ?', [req.tenantId]);
        if (tRows.length > 0) {
          shopName = tRows[0].store_name;
        }
      } catch (err) {
        console.warn('Failed to query shop name from master database:', err.message);
      }
    } else {
      shopName = 'SaaS Platform System';
    }

    // Map shop name into each log record
    const logsWithShop = logs.map(l => ({
      ...l,
      shop_name: shopName
    }));

    return res.status(200).json({
      success: true,
      count: logsWithShop.length,
      logs: logsWithShop
    });
  } catch (error) {
    next(error);
  }
};
