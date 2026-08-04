import { logActivity } from '../utils/activityLogger.js';
import { createNotification, checkStockAlerts } from '../services/notificationService.js';
import { syncProductFifoState } from '../utils/fifoQueueHelper.js';

// @desc    Get inventory summary across all warehouses for authenticated tenant
// @route   GET /api/stock
// @access  Private
export const getStockSummary = async (req, res, next) => {
  try {
    const [stock] = await req.db.query(`
      SELECT p.id as product_id, p.id, p.name as product_name, p.barcode, p.sku, p.unit, p.min_stock,
             c.name as category, sc.name as sub_category, b.name as brand,
             COALESCE(s.warehouse_id, 1) as warehouse_id, 
             COALESCE(w.name, 'Main Storage') as warehouse_name, 
             COALESCE(SUM(s.quantity), 0) as quantity,
             COALESCE(
               (SELECT SUM(pb.remaining_quantity * COALESCE(NULLIF(pb.purchase_price, 0), NULLIF(p.purchase_price, 0), 0)) FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0),
               (GREATEST(0, COALESCE(SUM(s.quantity), 0)) * COALESCE(p.purchase_price, 0))
             ) as stock_valuation
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN stock s ON p.id = s.product_id
      LEFT JOIN warehouses w ON s.warehouse_id = w.id
      GROUP BY p.id, s.warehouse_id, p.name, p.barcode, p.sku, p.unit, p.min_stock, w.name, p.purchase_price, c.name, sc.name, b.name
      ORDER BY p.name ASC
    `);

    return res.status(200).json({ success: true, count: stock.length, stock });
  } catch (error) {
    next(error);
  }
};

// @desc    Adjust stock level (Manual increase, decrease, set)
// @route   POST /api/stock/adjust
// @access  Private
export const adjustStock = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { product_id, warehouse_id, type, quantity, notes, reason } = req.body;

    if (!product_id || !warehouse_id || !type || quantity === undefined) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Missing fields: product_id, warehouse_id, type, and quantity' });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty < 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Quantity must be a valid positive number' });
    }

    const vendorId = req.body.vendor_id || null;

    // Check existing stock row for this product+warehouse
    const [stockCheck] = await connection.query(
      'SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1',
      [product_id, warehouse_id]
    );

    let currentQty = stockCheck.length > 0 ? Number(stockCheck[0].quantity) : 0;
    let newQty = 0;

    if (type === 'add') {
      newQty = currentQty + qty;
    } else if (type === 'subtract') {
      if (currentQty < qty) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ success: false, message: `Insufficient stock. Total available: ${currentQty}, trying to subtract: ${qty}` });
      }
      newQty = currentQty - qty;
      if (newQty < 0) newQty = 0;
    } else if (type === 'set') {
      newQty = qty;
    } else {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Invalid adjustment type. Use "add", "subtract", or "set"' });
    }

    // Update or insert stock row
    if (stockCheck.length > 0) {
      await connection.query(
        'UPDATE stock SET quantity = ? WHERE id = ?',
        [newQty, stockCheck[0].id]
      );
    } else {
      await connection.query(
        'INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
        [product_id, warehouse_id, newQty]
      );
    }

    // ── Synchronize purchase_batches for manual stock adjustment ──────────────
    const changeAmount = newQty - currentQty;
    if (changeAmount > 0) {
      const [[prod]] = await connection.query('SELECT mrp, selling_price, purchase_price FROM products WHERE id = ?', [product_id]);
      const defaultMrp = Number(prod?.mrp || 0);
      const defaultSellingPrice = Number(prod?.selling_price || 0);
      const defaultPurchasePrice = Number(prod?.purchase_price || 0);

      await connection.query(
        `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, purchase_price, mrp, selling_price, warehouse_id)
         VALUES (?, ?, ?, ?, CURRENT_DATE(), ?, ?, ?, ?)`,
        [product_id, `ADJ-BATCH-${Date.now()}`, changeAmount, changeAmount, defaultPurchasePrice, defaultMrp, defaultSellingPrice, warehouse_id]
      );
    } else if (changeAmount < 0) {
      let remDeduct = Math.abs(changeAmount);
      const [pbRows] = await connection.query(
        `SELECT id, remaining_quantity FROM purchase_batches WHERE product_id = ? AND remaining_quantity > 0 ORDER BY purchase_date ASC, id ASC`,
        [product_id]
      );
      for (const pbRow of pbRows) {
        if (remDeduct <= 0) break;
        const curPBQty = Number(pbRow.remaining_quantity);
        const pbDeduct = Math.min(curPBQty, remDeduct);
        await connection.query('UPDATE purchase_batches SET remaining_quantity = remaining_quantity - ? WHERE id = ?', [pbDeduct, pbRow.id]);
        remDeduct -= pbDeduct;
      }
    }
    const finalReason = reason || 'Manual Recount';
    const notesDetails = `Reason: ${finalReason} | Notes: ${notes || 'None'}`;
    
    await connection.query(
      `INSERT INTO stock_logs (product_id, warehouse_id, vendor_id, type, quantity, reference_no, notes, user_id, previous_quantity, new_quantity)
       VALUES (?, ?, ?, 'Adjustment', ?, 'ADJUSTMENT', ?, ?, ?, ?)`,
      [product_id, warehouse_id, vendorId, changeAmount, notesDetails, req.user.id, currentQty, newQty]
    );

    // Sync FIFO active batch Expiry Date and MRP on Product master
    await syncProductFifoState(connection, product_id);

    // Get product name for log
    const [pInfo] = await connection.query('SELECT name FROM products WHERE id = ?', [product_id]);
    const pName = pInfo[0]?.name || 'Unknown';

    await connection.commit();

    await logActivity(
      req.user.id,
      'Adjust Stock',
      'Stock',
      `Adjusted stock of "${pName}" in warehouse ${warehouse_id} by ${changeAmount} (New: ${newQty})`,
      req.ip
    );

    await createNotification({
      type: 'Stock Update',
      title: 'Stock Adjusted Manually',
      message: `Stock of product "${pName}" was adjusted by ${changeAmount >= 0 ? '+' : ''}${changeAmount}. New quantity: ${newQty}.`,
      priority: 'Medium',
      related_user: req.user.email,
      related_module: 'Inventory',
      target_roles: 'Admin,Manager,Staff'
    }, connection);

    await checkStockAlerts(connection, product_id, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      newQuantity: newQty
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Transfer stock between warehouses
// @route   POST /api/stock/transfer
// @access  Private
export const transferStock = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { product_id, from_warehouse_id, to_warehouse_id, quantity, notes } = req.body;

    if (!product_id || !from_warehouse_id || !to_warehouse_id || !quantity) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Missing fields: product_id, from_warehouse_id, to_warehouse_id, and quantity' });
    }

    if (from_warehouse_id === to_warehouse_id) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Source and destination warehouses must be different' });
    }

    const transferQty = Number(quantity);
    if (isNaN(transferQty) || transferQty <= 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    // Check source warehouse stock
    const [sourceStock] = await connection.query(
      'SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1',
      [product_id, from_warehouse_id]
    );

    const sourceAvailable = sourceStock.length > 0 ? Number(sourceStock[0].quantity) : 0;
    if (sourceAvailable < transferQty) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: `Insufficient stock in source warehouse. Available: ${sourceAvailable}, Requested: ${transferQty}` });
    }

    // Deduct from source warehouse
    const newSourceQty = sourceAvailable - transferQty;
    await connection.query('UPDATE stock SET quantity = ? WHERE id = ?', [newSourceQty, sourceStock[0].id]);

    // Add to destination warehouse
    const [destStock] = await connection.query(
      'SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1',
      [product_id, to_warehouse_id]
    );

    let newDestQty = transferQty;
    if (destStock.length > 0) {
      newDestQty = Number(destStock[0].quantity) + transferQty;
      await connection.query('UPDATE stock SET quantity = ? WHERE id = ?', [newDestQty, destStock[0].id]);
    } else {
      await connection.query('INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [product_id, to_warehouse_id, transferQty]);
    }

    // Log Stock Transfers
    const transferRef = `TRSF-${Date.now().toString().slice(-6)}`;

    // Outbound Log
    await connection.query(
      `INSERT INTO stock_logs (product_id, warehouse_id, type, quantity, reference_no, notes, user_id, previous_quantity, new_quantity)
       VALUES (?, ?, 'Transfer Out', ?, ?, ?, ?, ?, ?)`,
      [product_id, from_warehouse_id, -transferQty, transferRef, `Stock Transfer to Warehouse #${to_warehouse_id}. ${notes || ''}`, req.user.id, sourceAvailable, newSourceQty]
    );

    // Inbound Log
    await connection.query(
      `INSERT INTO stock_logs (product_id, warehouse_id, type, quantity, reference_no, notes, user_id, previous_quantity, new_quantity)
       VALUES (?, ?, 'Transfer In', ?, ?, ?, ?, ?, ?)`,
      [product_id, to_warehouse_id, transferQty, transferRef, `Stock Transfer from Warehouse #${from_warehouse_id}. ${notes || ''}`, req.user.id, destStock.length > 0 ? Number(destStock[0].quantity) : 0, newDestQty]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Stock transferred successfully',
      transferRef
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Get low stock and expiry alerts
// @route   GET /api/stock/alerts
// @access  Private
export const getStockAlerts = async (req, res, next) => {
  try {
    const [lowStock] = await req.db.query(`
      SELECT p.id as product_id, p.name as product_name, p.sku, p.barcode, p.min_stock, p.unit,
             COALESCE(SUM(s.quantity), 0) as current_stock
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      GROUP BY p.id, p.name, p.sku, p.barcode, p.min_stock, p.unit
      HAVING current_stock <= p.min_stock AND current_stock > 0
      ORDER BY current_stock ASC
    `);

    const [outOfStock] = await req.db.query(`
      SELECT p.id as product_id, p.name as product_name, p.sku, p.barcode, p.min_stock, p.unit, 0 as current_stock
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      GROUP BY p.id, p.name, p.sku, p.barcode, p.min_stock, p.unit
      HAVING COALESCE(SUM(s.quantity), 0) = 0
      ORDER BY p.name ASC
    `);

    const [nearExpiry] = await req.db.query(`
      SELECT id as product_id, name as product_name, sku, barcode, expiry_date, unit
      FROM products
      WHERE expiry_date IS NOT NULL 
        AND expiry_date > CURRENT_DATE() 
        AND expiry_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)
      ORDER BY expiry_date ASC
    `);

    const [expired] = await req.db.query(`
      SELECT id as product_id, name as product_name, sku, barcode, expiry_date, unit
      FROM products
      WHERE expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE()
      ORDER BY expiry_date ASC
    `);

    return res.status(200).json({
      success: true,
      alerts: {
        lowStock,
        outOfStock,
        nearExpiry,
        expired
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get movement history logs
// @route   GET /api/stock/logs
// @access  Private
export const getStockLogs = async (req, res, next) => {
  try {
    const { productId, type, startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT sl.*, p.name as product_name, p.sku, p.barcode, p.unit,
             w.name as warehouse_name, u.name as user_name
      FROM stock_logs sl
      JOIN products p ON sl.product_id = p.id
      JOIN warehouses w ON sl.warehouse_id = w.id
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (productId) {
      query += ' AND sl.product_id = ?';
      queryParams.push(productId);
    }

    if (type && type !== 'all' && type !== 'All') {
      query += ' AND sl.type LIKE ?';
      queryParams.push(`%${type}%`);
    }

    if (startDate) {
      query += ' AND sl.created_at >= ?';
      queryParams.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      query += ' AND sl.created_at <= ?';
      queryParams.push(`${endDate} 23:59:59`);
    }

    query += ' ORDER BY sl.id DESC LIMIT ? OFFSET ?';
    queryParams.push(Number(limit), Number(offset));

    const [logs] = await req.db.query(query, queryParams);

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all stock transfers
// @route   GET /api/stock/transfers
// @access  Private
export const getStockTransfers = async (req, res, next) => {
  try {
    const [transfers] = await req.db.query(`
      SELECT st.*, 
             fw.name as from_warehouse_name, 
             tw.name as to_warehouse_name,
             COALESCE(u.name, 'Admin') as created_by_name
      FROM stock_transfers st
      LEFT JOIN warehouses fw ON st.from_warehouse_id = fw.id
      LEFT JOIN warehouses tw ON st.to_warehouse_id = tw.id
      LEFT JOIN users u ON st.created_by = u.id
      ORDER BY st.created_at DESC
    `);
    return res.status(200).json({ success: true, transfers });
  } catch (error) {
    next(error);
  }
};
