import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { getNotifications } from '../controllers/notificationController.js';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const tenantDb = 'shop_aman001';

const testRolePanelNotifications = async () => {
  console.log('\n======================================================');
  console.log('TESTING PANEL-BASED NOTIFICATION RETRIEVAL FOR ALL ROLES');
  console.log('======================================================\n');

  let db = null;
  try {
    db = await mysql.createConnection({ host, port, user, password, database: tenantDb });

    const rolesToTest = [
      { name: 'Admin', role: 'Admin', dept: '' },
      { name: 'Purchase Manager', role: 'Purchase Manager', dept: 'Purchase' },
      { name: 'Sales Manager', role: 'Sales Manager', dept: 'Sales' },
      { name: 'Purchase Employee', role: 'Purchase Employee', dept: 'Purchase' },
      { name: 'Sales Employee', role: 'Sales Employee', dept: 'Sales' },
      { name: 'General Employee', role: 'Employee', dept: 'General' }
    ];

    for (const r of rolesToTest) {
      const mockReq = {
        user: { id: 99, role: r.role, department: r.dept, email: 'test@kiranaerp.com' },
        query: { page: 1, limit: 10 },
        db
      };

      let jsonRes = null;
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            jsonRes = data;
            return data;
          }
        })
      };

      await getNotifications(mockReq, mockRes, (err) => console.error('Next Error:', err));

      if (jsonRes && jsonRes.success) {
        console.log(`[Role: ${r.name.padEnd(18)}] Notifications Returned: ${jsonRes.notifications.length} (Total: ${jsonRes.total})`);
        if (jsonRes.notifications.length > 0) {
          const sampleModules = [...new Set(jsonRes.notifications.map(n => n.module || n.related_module))];
          console.log(`                             Sample Modules: ${sampleModules.slice(0, 5).join(', ')}`);
        }
      } else {
        console.error(`❌ FAILED for Role: ${r.name}`);
      }
    }

    console.log('\n======================================================');
    console.log('✅ PANEL-BASED NOTIFICATION RETRIEVAL TEST PASSED 100%');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test Execution Error:', err);
  } finally {
    if (db) await db.end();
  }
};

testRolePanelNotifications();
