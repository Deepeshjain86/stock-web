import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../services/notificationService.js';

// @desc    Get all stock destroy records with optional filters
// @route   GET /api/stock/destroy
// @access  Private
export const getStockDestroys = async (req, res, next) => {
  try {
    const { search, reason, status, startDate, endDate } = req.query;
    let query = `
      SELECT d.*, p.unit as product_unit, p.min_stock
      FROM stock_destroys d
      LEFT JOIN products p ON d.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (d.destroy_no LIKE ? OR d.product_name LIKE ? OR d.barcode LIKE ? OR d.remarks LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (reason && reason !== 'All') {
      query += ` AND d.reason = ?`;
      params.push(reason);
    }

    if (status && status !== 'All') {
      query += ` AND d.status = ?`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND d.created_at >= ?`;
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      query += ` AND d.created_at <= ?`;
      params.push(`${endDate} 23:59:59`);
    }

    query += ` ORDER BY d.id DESC`;

    const [destroys] = await req.db.query(query, params);

    return res.status(200).json({
      success: true,
      count: destroys.length,
      destroys
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Stock Destroy summary KPIs
// @route   GET /api/stock/destroy/kpis
// @access  Private
export const getStockDestroyKPIs = async (req, res, next) => {
  try {
    // 1. Today's Destroy Entries count
    const [[{ todayEntries }]] = await req.db.query(`
      SELECT COUNT(*) as todayEntries
      FROM stock_destroys
      WHERE DATE(created_at) = CURRENT_DATE() AND status = 'Confirmed'
    `);

    // 2. Total Destroyed Quantity (all time)
    const [[{ totalDestroyedQty }]] = await req.db.query(`
      SELECT COALESCE(SUM(destroy_quantity), 0) as totalDestroyedQty
      FROM stock_destroys
      WHERE status = 'Confirmed'
    `);

    // 3. Total Destroyed Value (₹)
    const [[{ totalDestroyedValue }]] = await req.db.query(`
      SELECT COALESCE(SUM(destroy_value), 0) as totalDestroyedValue
      FROM stock_destroys
      WHERE status = 'Confirmed'
    `);

    // 4. This Month's Destroy Records count
    const [[{ monthRecords }]] = await req.db.query(`
      SELECT COUNT(*) as monthRecords
      FROM stock_destroys
      WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
        AND status = 'Confirmed'
    `);

    return res.status(200).json({
      success: true,
      kpis: {
        todayEntries: Number(todayEntries || 0),
        totalDestroyedQty: Number(totalDestroyedQty || 0),
        totalDestroyedValue: Number(totalDestroyedValue || 0),
        monthRecords: Number(monthRecords || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new Stock Destroy record (permanently deducts inventory & logs transaction)
// @route   POST /api/stock/destroy
// @access  Private
export const createStockDestroy = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      product_id,
      destroy_date,
      destroy_quantity,
      reason,
      remarks,
      evidence_image,
      warehouse_name
    } = req.body;

    if (!product_id || !destroy_quantity || !reason) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Product, Destroy Quantity, and Reason are required.'
      });
    }

    const qtyToDestroy = Number(destroy_quantity);
    if (isNaN(qtyToDestroy) || qtyToDestroy <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Destroy quantity must be a positive number greater than zero.'
      });
    }

    // 1. Fetch Product details from Product Master
    const [products] = await connection.query(
      `SELECT id, name, barcode, sku, min_stock, purchase_price, selling_price, unit FROM products WHERE id = ?`,
      [product_id]
    );

    if (products.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Selected product does not exist in catalogue.' });
    }

    const product = products[0];

    // 2. Fetch current total available stock across warehouse rows for this product
    const [stockRows] = await connection.query(
      `SELECT id, warehouse_id, quantity FROM stock WHERE product_id = ? ORDER BY quantity DESC`,
      [product_id]
    );

    const availableStock = stockRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);

    // Validate that Destroy Quantity does not exceed available stock
    if (qtyToDestroy > availableStock) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Validation Error: Destroy quantity (${qtyToDestroy} ${product.unit || 'Pcs'}) cannot exceed available inventory stock (${availableStock} ${product.unit || 'Pcs'}).`
      });
    }

    // 3. Generate Destroy Number (DST-2026-XXXX)
    const [[{ maxId }]] = await connection.query(`SELECT COALESCE(MAX(id), 0) + 1 as maxId FROM stock_destroys`);
    const year = new Date().getFullYear();
    const destroyNo = `DST-${year}-${String(maxId).padStart(4, '0')}`;

    const purchasePrice = Number(product.purchase_price || 0);
    const sellingPrice = Number(product.selling_price || 0);
    const destroyValue = Number((qtyToDestroy * purchasePrice).toFixed(2));
    const whName = warehouse_name || 'Main Storage';
    const destroyedByName = req.user?.name || 'Authorized Operator';
    const destroyedById = req.user?.id || null;

    // 4. Deduct stock quantity from single consolidated stock record
    const [existingStock] = await connection.query(
      `SELECT id, quantity FROM stock WHERE product_id = ? LIMIT 1`,
      [product_id]
    );

    if (existingStock.length > 0) {
      const currentQty = Number(existingStock[0].quantity || 0);
      const newQty = Math.max(0, currentQty - qtyToDestroy);
      await connection.query(
        `UPDATE stock SET quantity = ? WHERE id = ?`,
        [newQty, existingStock[0].id]
      );
    } else {
      await connection.query(
        `INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, 1, ?)`,
        [product_id, 0]
      );
    }

    // 5. Insert Record into stock_destroys
    const [insertResult] = await connection.query(
      `INSERT INTO stock_destroys (
        destroy_no, product_id, product_name, barcode, sku, batch_no, warehouse_name,
        available_stock, destroy_quantity, unit, purchase_price, selling_price,
        destroy_value, reason, remarks, evidence_image, destroyed_by_id, destroyed_by_name,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?)`,
      [
        destroyNo,
        product.id,
        product.name,
        product.barcode || 'N/A',
        product.sku || 'N/A',
        req.body.batch_no || 'DEFAULT',
        whName,
        availableStock,
        qtyToDestroy,
        product.unit || 'Pcs',
        purchasePrice,
        sellingPrice,
        destroyValue,
        reason,
        remarks || '',
        evidence_image || null,
        destroyedById,
        destroyedByName,
        destroy_date ? `${destroy_date} ${new Date().toTimeString().slice(0, 8)}` : new Date()
      ]
    );

    // 6. Insert permanent stock movement log into stock_logs
    const newStockTotal = availableStock - qtyToDestroy;
    const logNotes = `STOCK_DESTROY | Reason: ${reason}${remarks ? ` | Remarks: ${remarks}` : ''} | Loss: ₹${destroyValue}`;

    await connection.query(
      `INSERT INTO stock_logs (
        product_id, warehouse_id, type, quantity, previous_quantity, new_quantity,
        reference_no, notes, user_id, created_at
      ) VALUES (?, 1, 'Stock Out', ?, ?, ?, ?, ?, ?, NOW())`,
      [
        product.id,
        -qtyToDestroy,
        availableStock,
        newStockTotal,
        destroyNo,
        logNotes,
        destroyedById
      ]
    );

    // 7. Audit Log & System Alert
    await logActivity(
      req.db,
      destroyedById,
      'STOCK_DESTROY_CREATED',
      `Stock Destroy Record ${destroyNo} created for ${product.name} (${qtyToDestroy} ${product.unit || 'Pcs'}, Loss Value: ₹${destroyValue})`
    );

    await createNotification(
      req.db,
      'Inventory Stock Destroyed',
      `${qtyToDestroy} units of ${product.name} permanently destroyed under ${destroyNo} (Reason: ${reason}). Loss Value: ₹${destroyValue}.`,
      'warning'
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: `Stock Destruction record ${destroyNo} confirmed successfully. Inventory stock deducted.`,
      destroyId: insertResult.insertId,
      destroyNo
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Cancel a Stock Destroy record (Restores stock quantity and records cancellation reason)
// @route   POST /api/stock/destroy/:id/cancel
// @access  Private (Admin / Super Admin only)
export const cancelStockDestroy = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { cancel_reason } = req.body;

    if (!cancel_reason || cancel_reason.trim() === '') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Validation Error: A mandatory cancellation reason must be provided.'
      });
    }

    // 1. Fetch Destroy Record
    const [destroys] = await connection.query(
      `SELECT * FROM stock_destroys WHERE id = ?`,
      [id]
    );

    if (destroys.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Stock Destroy record not found.' });
    }

    const destroy = destroys[0];

    if (destroy.status === 'Cancelled') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'This Stock Destroy record is already marked as Cancelled.' });
    }

    const restoreQty = Number(destroy.destroy_quantity);
    const cancelledByName = req.user?.name || 'Admin';

    // 2. Restore Stock Quantity in stock table
    const [existingStock] = await connection.query(
      `SELECT id, quantity FROM stock WHERE product_id = ? LIMIT 1`,
      [destroy.product_id]
    );

    if (existingStock.length > 0) {
      await connection.query(
        `UPDATE stock SET quantity = quantity + ? WHERE id = ?`,
        [restoreQty, existingStock[0].id]
      );
    } else {
      await connection.query(
        `INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, 1, ?)`,
        [destroy.product_id, restoreQty]
      );
    }

    // 3. Update stock_destroys status
    await connection.query(
      `UPDATE stock_destroys SET status = 'Cancelled', cancel_reason = ?, cancelled_by_name = ? WHERE id = ?`,
      [cancel_reason.trim(), cancelledByName, id]
    );

    // 4. Log Stock Restoration in stock_logs
    await connection.query(
      `INSERT INTO stock_logs (
        product_id, warehouse_id, type, quantity, previous_quantity, new_quantity,
        reference_no, notes, user_id, created_at
      ) VALUES (?, 1, 'Stock In', ?, 0, ?, ?, ?, ?, NOW())`,
      [
        destroy.product_id,
        restoreQty,
        restoreQty,
        `${destroy.destroy_no}-CANCEL`,
        `RESTORE_STOCK_DESTROY | Reason: ${cancel_reason.trim()}`,
        req.user?.id || null
      ]
    );

    // 5. Audit Log
    await logActivity(
      req.db,
      req.user?.id,
      'STOCK_DESTROY_CANCELLED',
      `Stock Destroy Record ${destroy.destroy_no} was cancelled by ${cancelledByName}. Stock restored: ${restoreQty} units. Reason: ${cancel_reason}`
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Stock Destroy record ${destroy.destroy_no} has been cancelled. Inventory stock of ${restoreQty} units restored successfully.`
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};
