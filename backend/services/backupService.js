import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const BACKUP_DIR = path.join(process.cwd(), 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate single database SQL dump file
async function dumpDatabase(connection, dbName, targetFilePath) {
  let dumpContent = `-- Kirana ERP Automated Database Backup\n`;
  dumpContent += `-- Database: ${dbName}\n`;
  dumpContent += `-- Generated At: ${new Date().toISOString()}\n\n`;
  dumpContent += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

  const [tables] = await connection.query(`SHOW TABLES FROM \`${dbName}\``);
  const tableKey = `Tables_in_${dbName}`;

  for (const row of tables) {
    const tableName = row[tableKey];
    if (!tableName) continue;

    // 1. Structure
    const [[createRow]] = await connection.query(`SHOW CREATE TABLE \`${dbName}\`.\`${tableName}\``);
    const createTableSql = createRow['Create Table'];
    dumpContent += `-- Table structure for table \`${tableName}\`\n`;
    dumpContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    dumpContent += `${createTableSql};\n\n`;

    // 2. Data
    const [rows] = await connection.query(`SELECT * FROM \`${dbName}\`.\`${tableName}\``);
    if (rows.length > 0) {
      dumpContent += `-- Dumping data for table \`${tableName}\`\n`;
      const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
      
      for (const r of rows) {
        const values = Object.values(r).map(val => {
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return val;
          if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
          if (typeof val === 'boolean') return val ? 1 : 0;
          return `'${String(val).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
        }).join(', ');

        dumpContent += `INSERT INTO \`${tableName}\` (${cols}) VALUES (${values});\n`;
      }
      dumpContent += `\n`;
    }
  }

  dumpContent += `SET FOREIGN_KEY_CHECKS=1;\n`;
  fs.writeFileSync(targetFilePath, dumpContent, 'utf8');
}

// Run Backup for Master DB + All Tenant DBs
export async function runFullBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const folderName = `backup_${timestamp}`;
  const folderPath = path.join(BACKUP_DIR, folderName);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  console.log(`[BackupService] 📦 Starting Full Automated Database Backup: ${folderName}...`);

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  let masterConn;
  const createdFiles = [];

  try {
    masterConn = await mysql.createConnection({ host, port, user, password, database: 'kirana_erp_master' });

    // Backup Master Database
    const masterFilePath = path.join(folderPath, 'kirana_erp_master.sql');
    await dumpDatabase(masterConn, 'kirana_erp_master', masterFilePath);
    createdFiles.push('kirana_erp_master.sql');
    console.log(`[BackupService] ✅ Master DB backup saved: kirana_erp_master.sql`);

    // Backup All Tenant Databases
    const [tenants] = await masterConn.query('SELECT database_name, store_name FROM tenants');
    for (const t of tenants) {
      if (!t.database_name) continue;
      try {
        const tenantFilePath = path.join(folderPath, `${t.database_name}.sql`);
        await dumpDatabase(masterConn, t.database_name, tenantFilePath);
        createdFiles.push(`${t.database_name}.sql`);
        console.log(`[BackupService] ✅ Tenant DB backup saved: ${t.database_name}.sql ("${t.store_name}")`);
      } catch (err) {
        console.error(`[BackupService] ❌ Failed to dump tenant DB ${t.database_name}:`, err.message);
      }
    }

    // Auto-purge old backups older than 30 days
    purgeOldBackups(30);

    return {
      success: true,
      folderName,
      folderPath,
      filesCount: createdFiles.length,
      files: createdFiles,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('[BackupService] ❌ Backup failed:', err.message);
    throw err;
  } finally {
    if (masterConn) await masterConn.end();
  }
}

// Purge backup folders older than retentionDays
function purgeOldBackups(retentionDays = 30) {
  try {
    const folders = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

    for (const folder of folders) {
      const fullPath = path.join(BACKUP_DIR, folder);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const ageMs = now - stat.mtimeMs;
        if (ageMs > maxAgeMs) {
          console.log(`[BackupService] 🗑️ Purging expired backup folder: ${folder}`);
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      }
    }
  } catch (e) {
    console.warn('[BackupService] Notice during backup purge:', e.message);
  }
}

// List all existing backup archives
export function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  const folders = fs.readdirSync(BACKUP_DIR);
  return folders
    .map(folder => {
      const fullPath = path.join(BACKUP_DIR, folder);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const files = fs.readdirSync(fullPath);
        return {
          id: folder,
          folderName: folder,
          created_at: stat.birthtime || stat.mtime,
          sizeBytes: files.reduce((acc, file) => acc + fs.statSync(path.join(fullPath, file)).size, 0),
          filesCount: files.length,
          files
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// Initialize Daily Cron Scheduler (Runs every day at 02:00 AM)
export function initBackupScheduler() {
  // Cron schedule: "0 2 * * *" = 02:00 AM daily
  cron.schedule('0 2 * * *', async () => {
    console.log('[BackupService Cron] Triggering scheduled daily database backup at 02:00 AM...');
    try {
      await runFullBackup();
    } catch (e) {
      console.error('[BackupService Cron] Backup failed:', e.message);
    }
  });

  console.log('[BackupService] Automated Daily Database Backup Scheduler initialized (runs at 02:00 AM daily).');
}
