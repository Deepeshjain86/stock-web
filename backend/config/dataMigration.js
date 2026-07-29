export const runCategoryDataMigration = async (pool) => {
  try {
    // 1. Ensure sub_categories table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sub_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category_id INT NOT NULL,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_subcat_category (category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Ensure brands table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Ensure sub_category_id and brand_id columns exist on products table
    const [cols] = await pool.query('DESCRIBE products');
    const colNames = cols.map(c => c.Field);
    if (!colNames.includes('sub_category_id')) {
      await pool.query('ALTER TABLE products ADD COLUMN sub_category_id INT NULL AFTER category_id');
    }
    if (!colNames.includes('brand_id')) {
      await pool.query('ALTER TABLE products ADD COLUMN brand_id INT NULL AFTER sub_category_id');
    }

    // 4. Migrate sub-categories from categories table where parent_id IS NOT NULL or category_type = 'Sub'
    const [subCatRows] = await pool.query(
      "SELECT * FROM categories WHERE parent_id IS NOT NULL OR category_type = 'Sub'"
    );

    for (const sub of subCatRows) {
      if (sub.parent_id) {
        const [dup] = await pool.query(
          'SELECT id FROM sub_categories WHERE LOWER(name) = LOWER(?) AND category_id = ?',
          [sub.name.trim(), sub.parent_id]
        );
        if (dup.length === 0) {
          await pool.query(
            'INSERT INTO sub_categories (name, category_id, status, description) VALUES (?, ?, ?, ?)',
            [sub.name.trim(), sub.parent_id, sub.status || 'Active', sub.description || null]
          );
        }
      }
    }

    // 5. Migrate sub-categories from products text column
    const [prodSubRows] = await pool.query(
      "SELECT DISTINCT category_id, sub_category FROM products WHERE sub_category IS NOT NULL AND sub_category != ''"
    );
    for (const item of prodSubRows) {
      if (item.category_id && item.sub_category) {
        const subName = item.sub_category.trim();
        const [dup] = await pool.query(
          'SELECT id FROM sub_categories WHERE LOWER(name) = LOWER(?) AND category_id = ?',
          [subName, item.category_id]
        );
        if (dup.length === 0) {
          await pool.query(
            'INSERT INTO sub_categories (name, category_id, status) VALUES (?, ?, "Active")',
            [subName, item.category_id]
          );
        }
      }
    }

    // 6. Map products.sub_category_id via parameterized JS lookup to avoid collation error
    const [allSubCats] = await pool.query('SELECT id, name, category_id FROM sub_categories');
    for (const subCat of allSubCats) {
      await pool.query(
        'UPDATE products SET sub_category_id = ? WHERE category_id = ? AND LOWER(sub_category) = LOWER(?) AND sub_category_id IS NULL',
        [subCat.id, subCat.category_id, subCat.name]
      );
    }

    // 7. Migrate brands from products.brand text column
    const [brandTextRows] = await pool.query(
      "SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != ''"
    );
    for (const item of brandTextRows) {
      const brandName = item.brand.trim();
      const [dup] = await pool.query(
        'SELECT id FROM brands WHERE LOWER(name) = LOWER(?)',
        [brandName]
      );
      if (dup.length === 0) {
        await pool.query(
          'INSERT INTO brands (name, status) VALUES (?, "Active")',
          [brandName]
        );
      }
    }

    // 8. Migrate brands from old categories table where category_type = 'Brand'
    const [brandCatRows] = await pool.query(
      "SELECT * FROM categories WHERE category_type = 'Brand'"
    );
    for (const b of brandCatRows) {
      const brandName = b.name.trim();
      const [dup] = await pool.query(
        'SELECT id FROM brands WHERE LOWER(name) = LOWER(?)',
        [brandName]
      );
      if (dup.length === 0) {
        await pool.query(
          'INSERT INTO brands (name, status, description) VALUES (?, ?, ?)',
          [brandName, b.status || 'Active', b.description || null]
        );
      }
    }

    // 9. Map products.brand_id via parameterized JS lookup to avoid collation error
    const [allBrands] = await pool.query('SELECT id, name FROM brands');
    for (const b of allBrands) {
      await pool.query(
        'UPDATE products SET brand_id = ? WHERE LOWER(brand) = LOWER(?) AND brand_id IS NULL',
        [b.id, b.name]
      );
    }

    // 10. Clean up sub-categories and brands from categories table so categories contains ONLY Main Categories!
    await pool.query(
      "DELETE FROM categories WHERE parent_id IS NOT NULL OR category_type = 'Sub' OR category_type = 'Brand'"
    );

  } catch (err) {
    console.error('[Data Migration] Error during category data migration:', err.message);
  }
};
