import mysql from 'mysql2/promise';

/**
 * Migration Script: Relational Subcategory Deduplication & Parent Category Normalization
 */
async function runMigration() {
  console.log('=== STARTING SUBCATEGORY DEDUPLICATION & PARENT CATEGORY SYNC ===\n');

  const sysDb = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
  });

  const [dbs] = await sysDb.query("SHOW DATABASES LIKE 'AMAN01'");
  const [tenantDbs] = await sysDb.query("SHOW DATABASES LIKE 'kirana_erp_tenant_%'");
  
  const allTenantDbs = [
    ...dbs.map(d => Object.values(d)[0]),
    ...tenantDbs.map(d => Object.values(d)[0])
  ];

  console.log(`Found ${allTenantDbs.length} tenant database(s) to process:`, allTenantDbs);

  for (const dbName of allTenantDbs) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Processing Database: ${dbName}`);
    console.log(`--------------------------------------------------`);

    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: dbName
    });

    try {
      // 1. Ensure Snacks & Packaged Foods main category exists
      let [snacksCat] = await db.query('SELECT id FROM categories WHERE LOWER(name) LIKE "%snacks%"');
      let snacksCatId = snacksCat[0]?.id;
      if (!snacksCatId) {
        const [firstCat] = await db.query('SELECT id FROM categories LIMIT 1');
        snacksCatId = firstCat[0]?.id || 1;
      }

      // 2. Clean duplicate sub_categories (merge duplicate namkeen and other subcategories)
      const [duplicateSubCats] = await db.query(`
        SELECT LOWER(name) as clean_name, MIN(id) as keep_id, COUNT(*) as count 
        FROM sub_categories 
        GROUP BY LOWER(name) 
        HAVING count > 1
      `);

      for (const dup of duplicateSubCats) {
        const [allMatching] = await db.query('SELECT id, category_id FROM sub_categories WHERE LOWER(name) = ?', [dup.clean_name]);
        const keepId = dup.keep_id;
        const dupIds = allMatching.filter(m => m.id !== keepId).map(m => m.id);

        if (dupIds.length > 0) {
          // Re-link all products pointing to duplicate subcategory IDs to keepId
          await db.query(`UPDATE products SET sub_category_id = ? WHERE sub_category_id IN (?)`, [keepId, dupIds]);
          await db.query(`DELETE FROM sub_categories WHERE id IN (?)`, [dupIds]);
          console.log(`  [Merged Duplicate Subcategory] "${dup.clean_name}" -> Kept ID ${keepId}, removed IDs:`, dupIds);
        }
      }

      // If 'namkeen' subcategory exists, set its parent category to 'Snacks & Packaged Foods'
      await db.query('UPDATE sub_categories SET category_id = ? WHERE LOWER(name) = "namkeen"', [snacksCatId]);
      console.log(`  [✓] Updated subcategory "namkeen" parent category to Category ID ${snacksCatId}`);

      // 3. Sync all products.category_id = sub_categories.category_id for products with sub_category_id
      await db.query(`
        UPDATE products p
        JOIN sub_categories sc ON p.sub_category_id = sc.id
        SET p.category_id = sc.category_id
        WHERE p.sub_category_id IS NOT NULL AND sc.category_id IS NOT NULL
      `);
      console.log('  [✓] Synchronized all products.category_id with sub_categories.category_id.');

      // 4. Re-apply Unique Index on sub_categories(name) or sub_categories(name, category_id)
      try {
        await db.query('ALTER TABLE sub_categories ADD UNIQUE KEY uq_subcat_name (name)');
        console.log('  [+] Added UNIQUE constraint on sub_categories(name)');
      } catch (e) {
        // Index might exist
      }

    } catch (err) {
      console.error(`  [X] Migration error in ${dbName}:`, err);
    } finally {
      await db.end();
    }
  }

  await sysDb.end();
  console.log('\n=== MIGRATION COMPLETED SUCCESSFULLY ===');
}

runMigration().catch(err => console.error('Migration failed:', err));
