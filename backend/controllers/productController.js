import { logActivity } from '../utils/activityLogger.js';
import { createNotification, checkStockAlerts } from '../services/notificationService.js';

// Helper to safely format dates for MySQL DATE columns (returns null if invalid or 'N/A')
const formatMySQLDate = (val) => {
  if (!val || val === 'N/A' || val === 'null' || val === 'undefined' || val === '0000-00-00') return null;
  const str = String(val).trim();
  if (!str || str === 'N/A' || str === 'null' || str === '0000-00-00') return null;
  
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  
  if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(str)) {
    const parts = str.split(/[-/]/);
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return null;
};
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res, next) => {
  try {
    const { 
      search, 
      category, 
      stockStatus, 
      expiryStatus, 
      sortBy = 'name', 
      order = 'ASC', 
      page = 1, 
      limit = 100 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let query = `
      SELECT p.*, 
             c.name as category,
             c.name as category_name, 
             COALESCE(sc.name, p.sub_category) as sub_category,
             COALESCE(b.name, p.brand) as brand,
             sc.id as sub_category_id,
             b.id as brand_id,
             COALESCE(
               (SELECT SUM(remaining_quantity) FROM purchase_batches WHERE product_id = p.id),
               SUM(s.quantity),
               0
             ) as total_stock,
             CASE 
               WHEN COALESCE((SELECT SUM(remaining_quantity) FROM purchase_batches WHERE product_id = p.id), SUM(s.quantity), 0) <= 0 THEN NULL
               ELSE COALESCE(
                 (SELECT pb.expiry_date FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0 AND pb.expiry_date IS NOT NULL AND pb.expiry_date != '' AND pb.expiry_date != 'N/A' AND pb.expiry_date != '0000-00-00' ORDER BY pb.purchase_date ASC, pb.id ASC LIMIT 1),
                 (SELECT pb.expiry_date FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.expiry_date IS NOT NULL AND pb.expiry_date != '' AND pb.expiry_date != 'N/A' AND pb.expiry_date != '0000-00-00' ORDER BY pb.id DESC LIMIT 1),
                 (SELECT gi.expiry_date FROM grn_items gi WHERE gi.product_id = p.id AND gi.expiry_date IS NOT NULL AND gi.expiry_date != '' AND gi.expiry_date != 'N/A' AND gi.expiry_date != '0000-00-00' ORDER BY gi.id DESC LIMIT 1),
                 p.expiry_date
               )
             END as grn_expiry_date,
             CASE 
               WHEN COALESCE((SELECT SUM(remaining_quantity) FROM purchase_batches WHERE product_id = p.id), SUM(s.quantity), 0) <= 0 THEN COALESCE(
                 (SELECT gi.mrp FROM grn_items gi WHERE gi.product_id = p.id AND gi.mrp > 0 ORDER BY gi.id DESC LIMIT 1),
                 p.mrp,
                 0
               )
               ELSE COALESCE(
                 (SELECT pb.mrp FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0 AND pb.mrp > 0 ORDER BY pb.purchase_date ASC, pb.id ASC LIMIT 1),
                 (SELECT pb.mrp FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.mrp > 0 ORDER BY pb.id DESC LIMIT 1),
                 (SELECT gi.mrp FROM grn_items gi WHERE gi.product_id = p.id AND gi.mrp > 0 ORDER BY gi.id DESC LIMIT 1),
                 p.mrp,
                 0
               )
             END as grn_mrp,
             COALESCE(
               (SELECT pb.mrp FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0 AND pb.mrp > 0 ORDER BY pb.purchase_date ASC, pb.id ASC LIMIT 1),
               (SELECT gi.mrp FROM grn_items gi WHERE gi.product_id = p.id AND gi.mrp > 0 ORDER BY gi.id DESC LIMIT 1),
               p.mrp,
               0
             ) as active_batch_mrp,
             COALESCE(
               (SELECT pb.batch_number FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0 ORDER BY pb.purchase_date ASC, pb.id ASC LIMIT 1),
               'DEFAULT'
             ) as active_batch_number
      FROM products p
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN categories c ON COALESCE(sc.category_id, p.category_id) = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE 1=1
    `;
    const queryParams = [];

    // Search filter (name, barcode, brand)
    if (search) {
      query += ` AND (p.name LIKE ? OR p.barcode LIKE ? OR p.brand LIKE ? OR b.name LIKE ?)`;
      const searchVal = `%${search}%`;
      queryParams.push(searchVal, searchVal, searchVal, searchVal);
    }

    // Category filter
    if (category && category !== 'all') {
      if (!isNaN(category)) {
        query += ` AND p.category_id = ?`;
        queryParams.push(Number(category));
      } else {
        query += ` AND c.name = ?`;
        queryParams.push(category);
      }
    }

    // Expiry status filter
    if (expiryStatus === 'expired') {
      query += ` AND p.expiry_date IS NOT NULL AND p.expiry_date <= CURRENT_DATE()`;
    } else if (expiryStatus === 'near') {
      query += ` AND p.expiry_date IS NOT NULL AND p.expiry_date > CURRENT_DATE() AND p.expiry_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)`;
    }

    query += ` GROUP BY p.id`;

    // Stock Status filter
    if (stockStatus === 'low') {
      query += ` HAVING total_stock <= p.min_stock AND total_stock > 0`;
    } else if (stockStatus === 'out') {
      query += ` HAVING total_stock = 0`;
    } else if (stockStatus === 'normal') {
      query += ` HAVING total_stock > p.min_stock`;
    }

    // Sorting
    const allowedSortFields = ['name', 'barcode', 'purchase_price', 'selling_price', 'total_stock', 'expiry_date'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    if (sortField === 'total_stock') {
      query += ` ORDER BY total_stock ${sortOrder}`;
    } else {
      query += ` ORDER BY p.${sortField} ${sortOrder}`;
    }

    const [products] = await req.db.query(query, queryParams);

    const formattedProducts = products.map((p) => ({
      ...p,
      mrp: Number(p.grn_mrp || p.active_batch_mrp || p.mrp || 0),
      active_batch_mrp: Number(p.grn_mrp || p.active_batch_mrp || p.mrp || 0),
    }));

    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      page: Number(page),
      products: formattedProducts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [products] = await req.db.query(
      `SELECT p.*, 
              c.name as category,
              c.name as category_name,
              COALESCE(sc.name, p.sub_category) as sub_category,
              COALESCE(b.name, p.brand) as brand,
              COALESCE(
                (SELECT SUM(remaining_quantity) FROM purchase_batches WHERE product_id = p.id),
                SUM(s.quantity),
                0
              ) as total_stock,
              CASE 
                WHEN COALESCE((SELECT SUM(remaining_quantity) FROM purchase_batches WHERE product_id = p.id), SUM(s.quantity), 0) <= 0 THEN NULL
                ELSE COALESCE(
                  (SELECT pb.expiry_date FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0 AND pb.expiry_date IS NOT NULL AND pb.expiry_date != '' AND pb.expiry_date != 'N/A' AND pb.expiry_date != '0000-00-00' ORDER BY pb.purchase_date ASC, pb.id ASC LIMIT 1),
                  (SELECT pb.expiry_date FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.expiry_date IS NOT NULL AND pb.expiry_date != '' AND pb.expiry_date != 'N/A' AND pb.expiry_date != '0000-00-00' ORDER BY pb.id DESC LIMIT 1),
                  (SELECT gi.expiry_date FROM grn_items gi WHERE gi.product_id = p.id AND gi.expiry_date IS NOT NULL AND gi.expiry_date != '' AND gi.expiry_date != 'N/A' AND gi.expiry_date != '0000-00-00' ORDER BY gi.id DESC LIMIT 1),
                  p.expiry_date
                )
              END as grn_expiry_date,
              CASE 
                WHEN COALESCE((SELECT SUM(remaining_quantity) FROM purchase_batches WHERE product_id = p.id), SUM(s.quantity), 0) <= 0 THEN COALESCE(
                  (SELECT gi.mrp FROM grn_items gi WHERE gi.product_id = p.id AND gi.mrp > 0 ORDER BY gi.id DESC LIMIT 1),
                  p.mrp,
                  0
                )
                ELSE COALESCE(
                  (SELECT pb.mrp FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0 AND pb.mrp > 0 ORDER BY pb.purchase_date ASC, pb.id ASC LIMIT 1),
                  (SELECT pb.mrp FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.mrp > 0 ORDER BY pb.id DESC LIMIT 1),
                  (SELECT gi.mrp FROM grn_items gi WHERE gi.product_id = p.id AND gi.mrp > 0 ORDER BY gi.id DESC LIMIT 1),
                  p.mrp,
                  0
                )
              END as grn_mrp,
              COALESCE(
                (SELECT pb.mrp FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0 AND pb.mrp > 0 ORDER BY pb.purchase_date ASC, pb.id ASC LIMIT 1),
                (SELECT gi.mrp FROM grn_items gi WHERE gi.product_id = p.id AND gi.mrp > 0 ORDER BY gi.id DESC LIMIT 1),
                p.mrp,
                0
              ) as active_batch_mrp,
              COALESCE(
                (SELECT pb.batch_number FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0 ORDER BY pb.purchase_date ASC, pb.id ASC LIMIT 1),
                'DEFAULT'
              ) as active_batch_number
       FROM products p
       LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
       LEFT JOIN categories c ON COALESCE(sc.category_id, p.category_id) = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN stock s ON p.id = s.product_id
       WHERE p.id = ?
       GROUP BY p.id`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const p = products[0];
    const formattedProduct = {
      ...p,
      mrp: Number(p.grn_mrp || p.active_batch_mrp || p.mrp || 0),
      active_batch_mrp: Number(p.grn_mrp || p.active_batch_mrp || p.mrp || 0),
    };

    return res.status(200).json({ success: true, product: formattedProduct });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      barcode,
      category,
      category_id,
      sub_category,
      sub_category_id,
      brand,
      brand_id,
      unit = 'Pcs',
      purchase_price,
      selling_price,
      mrp,
      gst,
      min_stock,
      max_stock,
      opening_stock,
      manufacturing_date,
      expiry_date,
      description,
      warehouse_id,
      measurement_value
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    let resolvedCatId = category_id || null;
    if (!resolvedCatId && category) {
      const [cats] = await req.db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [category.trim()]);
      if (cats.length > 0) {
        resolvedCatId = cats[0].id;
      } else {
        const [newCat] = await req.db.query('INSERT INTO categories (name, status) VALUES (?, "Active")', [category.trim()]);
        resolvedCatId = newCat.insertId;
      }
    }

    if (!resolvedCatId) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    let resolvedSubCatId = sub_category_id || null;
    let subCategoryText = sub_category ? sub_category.trim() : null;
    if (!resolvedSubCatId && subCategoryText && resolvedCatId) {
      const [subs] = await req.db.query(
        'SELECT id FROM sub_categories WHERE LOWER(name) = LOWER(?) AND category_id = ?',
        [subCategoryText, resolvedCatId]
      );
      if (subs.length > 0) {
        resolvedSubCatId = subs[0].id;
      } else {
        const [newSub] = await req.db.query(
          'INSERT INTO sub_categories (name, category_id, status) VALUES (?, ?, "Active")',
          [subCategoryText, resolvedCatId]
        );
        resolvedSubCatId = newSub.insertId;
      }
    }

    let resolvedBrandId = brand_id || null;
    let brandText = brand ? brand.trim() : null;
    if (!resolvedBrandId && brandText) {
      const [brands] = await req.db.query('SELECT id FROM brands WHERE LOWER(name) = LOWER(?)', [brandText]);
      if (brands.length > 0) {
        resolvedBrandId = brands[0].id;
      } else {
        const [newBrand] = await req.db.query(
          'INSERT INTO brands (name, status) VALUES (?, "Active")',
          [brandText]
        );
        resolvedBrandId = newBrand.insertId;
      }
    }

    const image_url = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null;

    const purchasePriceVal = purchase_price && purchase_price !== '' ? Number(purchase_price) : 0.00;
    const sellingPriceVal = selling_price && selling_price !== '' ? Number(selling_price) : 0.00;
    const mrpVal = mrp && mrp !== '' ? Number(mrp) : sellingPriceVal;
    const gstVal = gst && gst !== '' ? Number(gst) : 0.00;
    const minStockVal = min_stock && min_stock !== '' ? Number(min_stock) : 5;
    const maxStockVal = max_stock && max_stock !== '' ? Number(max_stock) : 100;
    const warehouseIdVal = warehouse_id && warehouse_id !== '' ? Number(warehouse_id) : 1;

    const generatedBarcode = barcode || `BAR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const generatedSku = req.body.sku || `SKU-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Format ISO Date strings safely for MySQL DATE columns (returns null if invalid/'N/A')
    const mDateVal = formatMySQLDate(manufacturing_date);
    const eDateVal = formatMySQLDate(expiry_date);

    const [result] = await req.db.query(
      `INSERT INTO products (name, barcode, sku, brand, brand_id, category_id, sub_category_id, unit, purchase_price, selling_price, mrp, gst, min_stock, max_stock, image_url, manufacturing_date, expiry_date, description, sub_category, measurement_value)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(), generatedBarcode, generatedSku, brandText, resolvedBrandId, resolvedCatId, resolvedSubCatId, unit,
        purchasePriceVal, sellingPriceVal, mrpVal, gstVal,
        minStockVal, maxStockVal, image_url,
        mDateVal, eDateVal, description || null,
        subCategoryText, measurement_value || null
      ]
    );

    // Newly created products default stock to 0. Stock is added via Purchase Invoices or Stock Adjustments.
    await req.db.query(
      'INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE quantity = 0',
      [productId, warehouseIdVal]
    );

    await logActivity(req.user.id, 'Create Product', 'Products', `Created product "${name}" (Barcode: ${generatedBarcode}, ID: ${productId})`, req.ip);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: { id: productId, name, barcode: generatedBarcode, sku: generatedSku }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await req.db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      name,
      barcode,
      brand,
      brand_id,
      category_id,
      category,
      unit,
      purchase_price,
      selling_price,
      mrp,
      gst,
      min_stock,
      max_stock,
      manufacturing_date,
      expiry_date,
      description,
      sub_category,
      sub_category_id,
      measurement_value
    } = req.body;

    if (barcode && barcode !== existing[0].barcode) {
      const [dupBar] = await req.db.query('SELECT id FROM products WHERE barcode = ? AND id != ?', [barcode, id]);
      if (dupBar.length > 0) {
        return res.status(400).json({ success: false, message: 'Product with this Barcode already exists' });
      }
    }

    // Resolve Main Category ID
    let resolvedCatId = category_id !== undefined && category_id !== '' ? Number(category_id) : existing[0].category_id;
    if (category && category !== '' && !category_id) {
      const [catMatch] = await req.db.query('SELECT id FROM categories WHERE name = ?', [category.trim()]);
      if (catMatch.length > 0) {
        resolvedCatId = catMatch[0].id;
      }
    }

    // Resolve Sub Category ID & Text
    let resolvedSubCatId = sub_category_id !== undefined && sub_category_id !== '' ? Number(sub_category_id) : existing[0].sub_category_id;
    let subCategoryText = sub_category !== undefined ? (sub_category ? sub_category.trim() : null) : existing[0].sub_category;

    if (resolvedSubCatId && !subCategoryText) {
      const [subRow] = await req.db.query('SELECT name FROM sub_categories WHERE id = ?', [resolvedSubCatId]);
      if (subRow.length > 0) subCategoryText = subRow[0].name;
    } else if (subCategoryText && resolvedCatId) {
      const [subMatch] = await req.db.query(
        'SELECT id FROM sub_categories WHERE LOWER(name) = LOWER(?) AND category_id = ?',
        [subCategoryText, resolvedCatId]
      );
      if (subMatch.length > 0) {
        resolvedSubCatId = subMatch[0].id;
      } else {
        const [newSub] = await req.db.query(
          'INSERT INTO sub_categories (name, category_id, status) VALUES (?, ?, "Active")',
          [subCategoryText, resolvedCatId]
        );
        resolvedSubCatId = newSub.insertId;
      }
    }

    // Resolve Brand ID & Text
    let resolvedBrandId = brand_id !== undefined && brand_id !== '' ? Number(brand_id) : existing[0].brand_id;
    let brandText = brand !== undefined ? (brand ? brand.trim() : null) : existing[0].brand;

    if (resolvedBrandId && !brandText) {
      const [brandRow] = await req.db.query('SELECT name FROM brands WHERE id = ?', [resolvedBrandId]);
      if (brandRow.length > 0) brandText = brandRow[0].name;
    } else if (brandText) {
      const [brandMatch] = await req.db.query(
        'SELECT id FROM brands WHERE LOWER(name) = LOWER(?)',
        [brandText]
      );
      if (brandMatch.length > 0) {
        resolvedBrandId = brandMatch[0].id;
      } else {
        const [newBrand] = await req.db.query(
          'INSERT INTO brands (name, status) VALUES (?, "Active")',
          [brandText]
        );
        resolvedBrandId = newBrand.insertId;
      }
    }

    const image_url = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : existing[0].image_url;

    // Numeric values
    const purchasePriceVal = purchase_price !== undefined && purchase_price !== '' ? Number(purchase_price) : existing[0].purchase_price;
    const sellingPriceVal = selling_price !== undefined && selling_price !== '' ? Number(selling_price) : existing[0].selling_price;
    const mrpVal = mrp !== undefined && mrp !== '' ? Number(mrp) : existing[0].mrp;
    const gstVal = gst !== undefined && gst !== '' ? Number(gst) : existing[0].gst;
    const minStockVal = min_stock !== undefined && min_stock !== '' ? Number(min_stock) : existing[0].min_stock;
    const maxStockVal = max_stock !== undefined && max_stock !== '' ? Number(max_stock) : existing[0].max_stock;

    // Format ISO Date strings safely for MySQL DATE columns (returns null if invalid or 'N/A')
    const mDateVal = manufacturing_date !== undefined ? formatMySQLDate(manufacturing_date) : existing[0].manufacturing_date;
    const eDateVal = expiry_date !== undefined ? formatMySQLDate(expiry_date) : existing[0].expiry_date;

    // Update product
    await req.db.query(
      `UPDATE products 
       SET name = COALESCE(?, name),
           barcode = ?,
           brand = ?,
           brand_id = ?,
           category_id = COALESCE(?, category_id),
           sub_category_id = ?,
           unit = COALESCE(?, unit),
           purchase_price = COALESCE(?, purchase_price),
           selling_price = COALESCE(?, selling_price),
           mrp = COALESCE(?, mrp),
           gst = COALESCE(?, gst),
           min_stock = COALESCE(?, min_stock),
           max_stock = COALESCE(?, max_stock),
           image_url = ?,
           manufacturing_date = ?,
           expiry_date = ?,
           description = ?,
           sub_category = ?,
           measurement_value = ?
       WHERE id = ?`,
      [
        name ? name.trim() : null, barcode || existing[0].barcode, brandText, resolvedBrandId, resolvedCatId, resolvedSubCatId, unit || null,
        purchasePriceVal, sellingPriceVal, mrpVal, gstVal,
        minStockVal, maxStockVal, image_url,
        mDateVal, eDateVal, description || null,
        subCategoryText, measurement_value || null,
        id
      ]
    );

    await logActivity(req.user.id, 'Update Product', 'Products', `Updated product details for "${name || existing[0].name}" (ID: ${id})`, req.ip);

    return res.status(200).json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await req.db.query('SELECT name FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Clean up all child foreign key references across tables before deleting product
    await req.db.query('DELETE FROM stock WHERE product_id = ?', [id]);
    await req.db.query('DELETE FROM stock_logs WHERE product_id = ?', [id]);
    await req.db.query('DELETE FROM purchase_items WHERE product_id = ?', [id]);
    await req.db.query('DELETE FROM sale_items WHERE product_id = ?', [id]);
    await req.db.query('DELETE FROM sales_returns WHERE product_id = ?', [id]);
    try { await req.db.query('DELETE FROM vendor_returns WHERE product_id = ?', [id]); } catch (e) {}
    try { await req.db.query('DELETE FROM stock_destroy WHERE product_id = ?', [id]); } catch (e) {}

    // Delete product record
    await req.db.query('DELETE FROM products WHERE id = ?', [id]);

    await logActivity(req.user.id, 'Delete Product', 'Products', `Deleted product "${existing[0].name}" (ID: ${id})`, req.ip);

    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Import products with pre-validation, duplicate handling & transaction safety
// @route   POST /api/products/bulk-import
// @access  Private
export const bulkImportProducts = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    const { products = [], options = {} } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'No product records provided for import.'
      });
    }

    await connection.beginTransaction();

    // 1. Fetch existing categories & brands for fast lookup
    const [existingCategories] = await connection.query('SELECT id, LOWER(name) as lower_name, name FROM categories');
    const categoryMap = new Map();
    existingCategories.forEach(c => categoryMap.set(c.lower_name, c.id));

    let existingBrands = [];
    try {
      const [bRes] = await connection.query('SELECT id, LOWER(name) as lower_name, name FROM brands');
      existingBrands = bRes;
    } catch (e) {}
    const brandMap = new Map();
    existingBrands.forEach(b => brandMap.set(b.lower_name, b.id));

    // 2. Fetch existing Barcodes and SKUs for duplicate prevention
    const [existingProducts] = await connection.query('SELECT barcode, sku, LOWER(name) as lower_name FROM products');
    const existingBarcodes = new Set(existingProducts.map(p => (p.barcode || '').trim().toLowerCase()).filter(Boolean));
    const existingSkus = new Set(existingProducts.map(p => (p.sku || '').trim().toLowerCase()).filter(Boolean));

    // Also track barcodes/SKUs seen in current batch to prevent duplicates within uploaded file
    const batchBarcodes = new Set();
    const batchSkus = new Set();

    let successCount = 0;
    const failedRecords = [];

    for (let i = 0; i < products.length; i++) {
      const row = products[i];
      const rowNumber = row.rowNumber || (i + 1);
      const name = (row.name || '').toString().trim();
      const barcodeRaw = (row.barcode || '').toString().trim();
      const skuRaw = (row.sku || '').toString().trim();
      const categoryName = (row.category || '').toString().trim();
      const brandName = (row.brand || '').toString().trim();
      const unit = (row.unit || 'Pcs').toString().trim();
      
      const purchasePrice = row.purchasePrice !== undefined && row.purchasePrice !== '' ? Number(row.purchasePrice) : NaN;
      const sellingPrice = row.sellingPrice !== undefined && row.sellingPrice !== '' ? Number(row.sellingPrice) : NaN;
      const mrp = row.mrp !== undefined && row.mrp !== '' ? Number(row.mrp) : (isNaN(sellingPrice) ? 0 : sellingPrice);
      const gst = row.gst !== undefined && row.gst !== '' ? Number(row.gst) : 0;
      const openingStock = row.openingStock !== undefined && row.openingStock !== '' ? Number(row.openingStock) : 0;
      const minStock = row.minimumStock !== undefined && row.minimumStock !== '' ? Number(row.minimumStock) : 5;
      const maxStock = row.maximumStock !== undefined && row.maximumStock !== '' ? Number(row.maximumStock) : 100;
      const warehouseId = row.warehouse_id ? Number(row.warehouse_id) : 1;

      // Validation Checks
      const errors = [];

      if (!name) {
        errors.push('Product Name is required');
      }

      if (!categoryName) {
        errors.push('Category is required');
      }

      if (!unit) {
        errors.push('Unit is required');
      }

      if (isNaN(purchasePrice) || purchasePrice < 0) {
        errors.push(`Invalid Purchase Price: '${row.purchasePrice}' (Must be a number >= 0)`);
      }

      if (isNaN(sellingPrice) || sellingPrice < 0) {
        errors.push(`Invalid Selling Price: '${row.sellingPrice}' (Must be a number >= 0)`);
      }

      if (!isNaN(mrp) && mrp < 0) {
        errors.push(`Invalid MRP: '${row.mrp}' (Must be a number >= 0)`);
      }

      if (!isNaN(openingStock) && openingStock < 0) {
        errors.push(`Opening stock cannot be negative (${openingStock})`);
      }

      // Duplicate Check
      const barcodeLower = barcodeRaw.toLowerCase();
      const skuLower = skuRaw.toLowerCase();

      if (barcodeRaw && (existingBarcodes.has(barcodeLower) || batchBarcodes.has(barcodeLower))) {
        errors.push(`Duplicate Barcode '${barcodeRaw}' (Already exists in database or file)`);
      }

      if (skuRaw && (existingSkus.has(skuLower) || batchSkus.has(skuLower))) {
        errors.push(`Duplicate SKU '${skuRaw}' (Already exists in database or file)`);
      }

      if (errors.length > 0) {
        failedRecords.push({
          rowNumber,
          name: name || 'N/A',
          barcode: barcodeRaw || 'N/A',
          sku: skuRaw || 'N/A',
          category: categoryName || 'N/A',
          reason: errors.join('; ')
        });
        continue;
      }

      // Resolve Category ID (Auto-create category if missing)
      let categoryId = categoryMap.get(categoryName.toLowerCase());
      if (!categoryId) {
        const [catIns] = await connection.query(
          'INSERT INTO categories (name) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
          [categoryName]
        );
        categoryId = catIns.insertId;
        categoryMap.set(categoryName.toLowerCase(), categoryId);
      }

      // Resolve Brand ID
      let brandId = null;
      if (brandName) {
        brandId = brandMap.get(brandName.toLowerCase());
        if (!brandId) {
          try {
            const [brandIns] = await connection.query(
              'INSERT INTO brands (name) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
              [brandName]
            );
            brandId = brandIns.insertId;
            brandMap.set(brandName.toLowerCase(), brandId);
          } catch (e) {}
        }
      }

      // Fallback Barcode & SKU
      const finalBarcode = barcodeRaw || `BAR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const finalSku = skuRaw || `SKU-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const mDateVal = formatMySQLDate(row.manufacturingDate);
      const eDateVal = formatMySQLDate(row.expiryDate);

      // Insert Product
      const [resIns] = await connection.query(
        `INSERT INTO products (name, barcode, sku, brand, brand_id, category_id, sub_category_id, unit, purchase_price, selling_price, mrp, gst, min_stock, max_stock, manufacturing_date, expiry_date, description, sub_category, measurement_value)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, finalBarcode, finalSku, brandName || null, brandId, categoryId, null, unit,
          purchasePrice, sellingPrice, mrp, gst,
          minStock, maxStock,
          mDateVal, eDateVal, row.description || null,
          row.sub_category || null, row.measurement_value || null
        ]
      );

      const productId = resIns.insertId;

      // Newly imported products default stock to 0. Stock is added via Purchase Invoices or Stock Adjustments.
      await connection.query(
        'INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE quantity = 0',
        [productId, warehouseId]
      );

      // Track created barcodes/SKUs in batch set to prevent duplicates later in file
      if (finalBarcode) batchBarcodes.add(finalBarcode.toLowerCase());
      if (finalSku) batchSkus.add(finalSku.toLowerCase());

      successCount++;
    }

    await connection.commit();
    connection.release();

    await logActivity(
      req.user.id,
      'Bulk Import Products',
      'Products',
      `Imported ${successCount} products successfully (${failedRecords.length} records failed)`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: `Bulk import completed. Successfully imported ${successCount} products. ${failedRecords.length} records skipped.`,
      summary: {
        totalRecords: products.length,
        successCount,
        failedCount: failedRecords.length
      },
      failedRecords
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};

