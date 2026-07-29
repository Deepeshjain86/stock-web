import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';

const check = async () => {
  const conn = await mysql.createConnection({ host, port, user, password });
  try {
    const [tenants] = await conn.query('SELECT database_name FROM kirana_erp_master.tenants');
    for (const t of tenants) {
      console.log(`\nTenant DB: ${t.database_name}`);
      const [rows] = await conn.query(`SELECT id, name, parent_id FROM \`${t.database_name}\`.categories`);
      
      // Trace cycles
      for (const row of rows) {
        let visited = new Set();
        let curr = row;
        let cycle = false;
        while (curr) {
          if (visited.has(curr.id)) {
            cycle = true;
            break;
          }
          visited.add(curr.id);
          if (curr.parent_id) {
            curr = rows.find(r => r.id === curr.parent_id);
          } else {
            curr = null;
          }
        }
        if (cycle) {
          console.log(`  -> CYCLE DETECTED starting at category "${row.name}" (ID: ${row.id}, parent_id: ${row.parent_id})`);
        }
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await conn.end();
  }
};
check();
