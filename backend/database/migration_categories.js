import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runMigration = async () => {
  console.log(`[Migration] Connecting to MySQL at ${host}:${port} as ${user}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    // 1. Fetch all tenants
    console.log(`[Migration] Selecting Master Database "${masterDb}"...`);
    await conn.query(`USE \`${masterDb}\`;`);
    const [tenants] = await conn.query('SELECT id, store_name, database_name FROM tenants');
    console.log(`[Migration] Found ${tenants.length} tenant store(s).`);

    for (const tenant of tenants) {
      const dbName = tenant.database_name;
      console.log(`\n--------------------------------------------`);
      console.log(`[Migration] Upgrading Tenant Database: "${dbName}" (${tenant.store_name})`);
      console.log(`--------------------------------------------`);

      // Select tenant DB
      await conn.query(`USE \`${dbName}\`;`);

      // Add parent_id column if not exists
      try {
        await conn.query(`ALTER TABLE categories ADD COLUMN parent_id INT NULL DEFAULT NULL;`);
        console.log(`  -> Added parent_id column.`);
      } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
          console.log(`  -> parent_id column already exists.`);
        } else {
          console.error(`  -> Failed to add parent_id:`, err.message);
        }
      }

      // Add category_type column if not exists
      try {
        await conn.query(`ALTER TABLE categories ADD COLUMN category_type ENUM('Main','Sub') NOT NULL DEFAULT 'Main';`);
        console.log(`  -> Added category_type column.`);
      } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
          console.log(`  -> category_type column already exists.`);
        } else {
          console.error(`  -> Failed to add category_type:`, err.message);
        }
      }

      // Add category_code column if not exists
      try {
        await conn.query(`ALTER TABLE categories ADD COLUMN category_code VARCHAR(20) NULL;`);
        console.log(`  -> Added category_code column.`);
      } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
          console.log(`  -> category_code column already exists.`);
        } else {
          console.error(`  -> Failed to add category_code:`, err.message);
        }
      }

      // Add display_order column if not exists
      try {
        await conn.query(`ALTER TABLE categories ADD COLUMN display_order INT NOT NULL DEFAULT 0;`);
        console.log(`  -> Added display_order column.`);
      } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
          console.log(`  -> display_order column already exists.`);
        } else {
          console.error(`  -> Failed to add display_order:`, err.message);
        }
      }

      // Add foreign key constraint if not exists
      try {
        // Drop constraint if it already exists, to avoid duplicate errors
        try {
          await conn.query(`ALTER TABLE categories DROP FOREIGN KEY fk_cat_parent;`);
        } catch (e) {}
        await conn.query(`ALTER TABLE categories ADD CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;`);
        console.log(`  -> Added foreign key constraint fk_cat_parent.`);
      } catch (err) {
        console.error(`  -> Failed to add foreign key constraint:`, err.message);
      }

      // Modify UNIQUE constraint. The original table has a UNIQUE index on 'name'.
      // We want name unique per parent_id, i.e., UNIQUE(name, parent_id).
      try {
        // Find existing index names for the unique constraint on name
        const [indexes] = await conn.query(`SHOW INDEX FROM categories WHERE Column_name = 'name'`);
        for (const idx of indexes) {
          if (idx.Key_name !== 'PRIMARY' && idx.Key_name !== 'uq_cat_name_parent') {
            try {
              await conn.query(`ALTER TABLE categories DROP INDEX \`${idx.Key_name}\`;`);
              console.log(`  -> Dropped old unique index "${idx.Key_name}" on name.`);
            } catch (err) {
              console.error(`  -> Failed to drop index ${idx.Key_name}:`, err.message);
            }
          }
        }
      } catch (err) {
        console.error(`  -> Failed checking/dropping old indexes:`, err.message);
      }

      // Add new composite unique key
      try {
        await conn.query(`ALTER TABLE categories ADD UNIQUE KEY uq_cat_name_parent (name, parent_id);`);
        console.log(`  -> Added unique key uq_cat_name_parent.`);
      } catch (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
          console.log(`  -> Unique key uq_cat_name_parent already exists.`);
        } else {
          console.error(`  -> Failed to add unique key uq_cat_name_parent:`, err.message);
        }
      }
    }

    console.log('\n[Migration] Database migration completed successfully.');
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
  } finally {
    await conn.end();
  }
};

runMigration();
