import { masterPool } from '../config/tenantDb.js';
import { requestContext } from './context.js';

/**
 * Logs activity to the active store database dynamically.
 * Supports flexible parameter signatures for backwards compatibility.
 */
export const logActivity = async (userIdOrObj, action, module, details = null, ipAddress = null, db = null) => {
  let params = {};
  if (typeof userIdOrObj === 'object' && userIdOrObj !== null) {
    params = userIdOrObj;
  } else {
    params = {
      userId: userIdOrObj,
      action,
      module,
      details,
      ipAddress,
      db
    };
  }

  try {
    const req = requestContext.getStore();
    const activeDb = params.db || (req && req.db) || masterPool;

    // Resolve user details if not provided
    let uId = params.userId || null;
    let uName = params.userName || null;
    let uRole = params.role || null;
    let uDept = params.department || null;

    if (uId && (!uName || !uRole)) {
      try {
        const [uRows] = await activeDb.query(
          `SELECT u.name, r.name as role, u.department 
           FROM users u 
           LEFT JOIN roles r ON u.role_id = r.id 
           WHERE u.id = ?`,
          [uId]
        );
        if (uRows.length > 0) {
          uName = uName || uRows[0].name;
          uRole = uRole || uRows[0].role;
          uDept = uDept || uRows[0].department;
        } else {
          // If not in local users, check master DB for Super Admin registry
          const [saRows] = await masterPool.query(
            'SELECT name, role, department FROM users WHERE id = ?',
            [uId]
          );
          if (saRows.length > 0) {
            uName = uName || saRows[0].name || 'Super Admin';
            uRole = uRole || saRows[0].role || 'Super Admin';
            uDept = uDept || saRows[0].department;
          }
        }
      } catch (err) {
        console.warn('Failed to resolve user metadata for logging:', err.message);
      }
    }

    // Capture dynamic IP, Device details from request context if available
    let ip = params.ipAddress || (req && (req.headers['x-forwarded-for'] || req.ip)) || null;
    let device = params.deviceInfo || (req && req.headers && req.headers['user-agent']) || null;
    let session = params.sessionId || (req && (req.sessionID || req.session?.id)) || null;

    try {
      await activeDb.query(
        `INSERT INTO activity_logs (
          user_id, user_name, role, department, action, module, details, 
          record_id, previous_value, new_value, ip_address, device_info, session_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uId,
          uName,
          uRole,
          uDept,
          params.action,
          params.module,
          params.details,
          params.recordId ? String(params.recordId) : null,
          params.previousValue ? String(params.previousValue) : null,
          params.newValue ? String(params.newValue) : null,
          ip,
          device ? device.substring(0, 255) : null,
          session,
          params.status || 'Success'
        ]
      );
    } catch (insertErr) {
      // Fallback for minimal legacy activity_logs schema
      await activeDb.query(
        `INSERT INTO activity_logs (user_id, action, module, details, ip_address) VALUES (?, ?, ?, ?, ?)`,
        [uId, params.action, params.module, params.details, ip]
      );
    }
  } catch (error) {
    console.error('Activity logging failed:', error);
  }
};
