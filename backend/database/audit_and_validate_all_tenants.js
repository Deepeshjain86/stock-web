import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';
import { validateInventoryConsistency } from '../services/calculationService.js';

async function auditAndValidateAllTenants() {
  console.log('🚀 Starting Enterprise Inventory Reconciliation Audit across all tenant databases...');
  
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const connection = await mysql.createConnection({ host, port, user, password });

  try {
    const [dbs] = await connection.query("SHOW DATABASES LIKE 'shop_%'");
    const dbNames = dbs.map(d => Object.values(d)[0]);

    const [kiranaDbs] = await connection.query("SHOW DATABASES LIKE 'kirana_erp'");
    if (kiranaDbs.length > 0) dbNames.push('kirana_erp');

    console.log(`Found ${dbNames.length} tenant database(s) to audit:`, dbNames);

    for (const dbName of dbNames) {
      console.log(`Auditing database: "${dbName}"...`);
      const tenantConn = await mysql.createConnection({ host, port, user, password, database: dbName });

      try {
        const [tables] = await tenantConn.query("SHOW TABLES LIKE 'stock'");
        if (tables.length === 0) {
          console.log(`  ℹ️ Table 'stock' missing in "${dbName}". Skipping.`);
          await tenantConn.end();
          continue;
        }

        const auditResult = await validateInventoryConsistency(tenantConn);
        if (auditResult.isConsistent) {
          console.log(`  ✅ Database "${dbName}" is 100% CONSISTENT. Zero stock-batch discrepancies found.`);
        } else {
          console.log(`  ⚠️ Database "${dbName}" has ${auditResult.discrepancyCount} discrepancy(ies):`);
          console.log(JSON.stringify(auditResult.discrepancies, null, 2));
        }
      } catch (err) {
        console.error(`  ❌ Audit error in "${dbName}":`, err.message);
      } finally {
        await tenantConn.end();
      }
    }
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

auditAndValidateAllTenants();
