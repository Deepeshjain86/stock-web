import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../services/notificationService.js';

// @desc    Get available batches for a product with positive stock
// @route   GET /api/stock/product-batches/:productId
// @access  Private
export const getProductBatches = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const [batches] = await req.db.query(
      `SELECT id, batch_number, remaining_quantity, purchase_quantity, purchase_price, mrp, selling_price, expiry_date, purchase_date
       FROM purchase_batches
       WHERE product_id = ? AND remaining_quantity > 0
       ORDER BY purchase_date ASC, id ASC`,
      [productId]
    );

    return res.status(200).json({
      success: true,
      batches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all stock destroy / scrap records with optional filters
// @route   GET /api/stock/destroy
// @access  Private
export const getStockDestroys = async (req, res, next) => {
  try {
    const { search, reason, status, batchNo, startDate, endDate } = req.query;
    let query = `
      SELECT d.*, 
             p.unit as product_unit, 
             p.min_stock,
             p.purchase_price as product_purchase_price,
             pb.batch_number as linked_batch_number,
             pb.expiry_date as batch_expiry_date
      FROM stock_destroys d
      LEFT JOIN products p ON d.product_id = p.id
      LEFT JOIN purchase_batches pb ON d.batch_id = pb.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (d.destroy_no LIKE ? OR d.product_name LIKE ? OR d.barcode LIKE ? OR d.remarks LIKE ? OR d.batch_no LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (reason && reason !== 'All') {
      query += ` AND d.reason = ?`;
      params.push(reason);
    }

    if (status && status !== 'All') {
      query += ` AND d.status = ?`;
      params.push(status);
    }

    if (batchNo && batchNo !== 'All') {
      query += ` AND d.batch_no = ?`;
      params.push(batchNo);
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

    // 2. Total Destroyed Quantity (all time confirmed)
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

    // 5. Draft Records Count
    const [[{ draftCount }]] = await req.db.query(`
      SELECT COUNT(*) as draftCount
      FROM stock_destroys
      WHERE status = 'Draft'
    `);

    return res.status(200).json({
      success: true,
      kpis: {
        todayEntries: Number(todayEntries || 0),
        totalDestroyedQty: Number(totalDestroyedQty || 0),
        totalDestroyedValue: Number(totalDestroyedValue || 0),
        monthRecords: Number(monthRecords || 0),
        draftCount: Number(draftCount || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Process Scrap Stock Deduction, Batch Reduction, Valuation Layer, & Stock Log
async function processScrapStockDeduction({
  connection,
  product,
  qtyToDestroy,
  unitCost,
  destroyValue,
  destroyNo,
  availableStock,
  targetBatch,
  srcLoc,
  scpLoc,
  reason,
  remarks,
  destroyedById
}) {
  // A. Deduct stock quantity in stock table
  const [existingStock] = await connection.query(
    `SELECT id, quantity FROM stock WHERE product_id = ? LIMIT 1 FOR UPDATE`,
    [product.id]
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
      [product.id, 0]
    );
  }

  // B. Deduct batch remaining_quantity (either specified batch or FIFO across active batches)
  if (targetBatch) {
    await connection.query(
      `UPDATE purchase_batches SET remaining_quantity = GREATEST(0, remaining_quantity - ?) WHERE id = ?`,
      [qtyToDestroy, targetBatch.id]
    );
  } else {
    let remainingToDeduct = qtyToDestroy;
    const [activeBatches] = await connection.query(
      `SELECT id, remaining_quantity FROM purchase_batches WHERE product_id = ? AND remaining_quantity > 0 ORDER BY purchase_date ASC, id ASC FOR UPDATE`,
      [product.id]
    );

    for (const b of activeBatches) {
      if (remainingToDeduct <= 0) break;
      const bRem = Number(b.remaining_quantity || 0);
      const deductAmt = Math.min(remainingToDeduct, bRem);
      await connection.query(
        `UPDATE purchase_batches SET remaining_quantity = remaining_quantity - ? WHERE id = ?`,
        [deductAmt, b.id]
      );
      remainingToDeduct -= deductAmt;
    }
  }

  // C. Calculate current total inventory valuation prior to deduction
  const [[{ currentValuation }]] = await connection.query(`
    SELECT COALESCE(SUM(pb.remaining_quantity * COALESCE(NULLIF(pb.purchase_price, 0), NULLIF(p.purchase_price, 0), 0)), 0) as currentValuation
    FROM purchase_batches pb
    JOIN products p ON pb.product_id = p.id
    WHERE pb.remaining_quantity > 0
  `);

  const prevVal = Number(currentValuation || 0);
  const newVal = Math.max(0, prevVal - destroyValue);
  const newStockTotal = Math.max(0, availableStock - qtyToDestroy);

  // D. Create Odoo Valuation Layer Record (transaction_type = 'Scrap/Wastage')
  await connection.query(
    `INSERT INTO inventory_valuation_layers (
      product_id, warehouse_id, batch_id, transaction_type, reference_no,
      quantity_delta, unit_cost, value_delta, previous_inventory_value,
      new_inventory_value, previous_quantity, new_quantity, accounting_treatment,
      created_by, created_at
    ) VALUES (?, 1, ?, 'Scrap/Wastage', ?, ?, ?, ?, ?, ?, ?, ?, 'Scrap Loss', ?, NOW())`,
    [
      product.id,
      targetBatch ? targetBatch.id : null,
      destroyNo,
      -qtyToDestroy,
      unitCost,
      -destroyValue,
      prevVal,
      newVal,
      availableStock,
      newStockTotal,
      destroyedById
    ]
  );

  // E. Insert permanent stock movement log into stock_logs
  const logNotes = `SCRAP_MOVEMENT | Source: ${srcLoc} -> Scrap Location: ${scpLoc} | Reason: ${reason}${remarks ? ` | Remarks: ${remarks}` : ''} | Unit Cost: ₹${unitCost} | Total Loss: ₹${destroyValue}`;

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
}

// @desc    Create a new Stock Destroy / Scrap record (Odoo Scrap Inventory Logic)
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
      warehouse_name,
      source_location,
      scrap_location,
      batch_id,
      batch_no,
      status: requestedStatus
    } = req.body;

    const initialStatus = requestedStatus === 'Draft' ? 'Draft' : 'Confirmed';

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

    // 1. Lock & Fetch Product details from Product Master (FOR UPDATE for concurrency safety)
    const [products] = await connection.query(
      `SELECT id, name, barcode, sku, min_stock, purchase_price, selling_price, standard_cost, unit 
       FROM products 
       WHERE id = ? FOR UPDATE`,
      [product_id]
    );

    if (products.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Selected product does not exist in catalogue.' });
    }

    const product = products[0];

    // 2. Lock & Fetch current stock rows for this product
    const [stockRows] = await connection.query(
      `SELECT id, warehouse_id, quantity FROM stock WHERE product_id = ? FOR UPDATE`,
      [product_id]
    );

    const availableStock = stockRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);

    // Validate global available stock
    if (qtyToDestroy > availableStock) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Validation Error: Destroy quantity (${qtyToDestroy} ${product.unit || 'Pcs'}) exceeds total available inventory stock (${availableStock} ${product.unit || 'Pcs'}).`
      });
    }

    // 3. Batch Level Validation & Unit Cost Derivation
    let targetBatch = null;
    let unitCost = Number(product.purchase_price || product.standard_cost || 0);

    if (batch_id || (batch_no && batch_no !== 'DEFAULT' && batch_no !== 'All')) {
      let batchQuery = `SELECT * FROM purchase_batches WHERE product_id = ?`;
      const batchParams = [product_id];

      if (batch_id) {
        batchQuery += ` AND id = ?`;
        batchParams.push(batch_id);
      } else {
        batchQuery += ` AND batch_number = ?`;
        batchParams.push(batch_no);
      }

      batchQuery += ` FOR UPDATE`;
      const [batches] = await connection.query(batchQuery, batchParams);

      if (batches.length > 0) {
        targetBatch = batches[0];
        const batchRemQty = Number(targetBatch.remaining_quantity || 0);

        if (qtyToDestroy > batchRemQty) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `Validation Error: Destroy quantity (${qtyToDestroy}) exceeds available quantity in selected batch "${targetBatch.batch_number || 'DEFAULT'}" (${batchRemQty} ${product.unit || 'Pcs'}).`
          });
        }

        if (Number(targetBatch.purchase_price || 0) > 0) {
          unitCost = Number(targetBatch.purchase_price);
        }
      }
    } else {
      // If no batch selected, check if FIFO batches exist to derive unit cost from oldest active batch
      const [activeBatches] = await connection.query(
        `SELECT * FROM purchase_batches WHERE product_id = ? AND remaining_quantity > 0 ORDER BY purchase_date ASC, id ASC LIMIT 1 FOR UPDATE`,
        [product_id]
      );
      if (activeBatches.length > 0) {
        targetBatch = activeBatches[0];
        if (Number(targetBatch.purchase_price || 0) > 0) {
          unitCost = Number(targetBatch.purchase_price);
        }
      }
    }

    const destroyValue = Number((qtyToDestroy * unitCost).toFixed(2));
    const whName = warehouse_name || 'Main Storage';
    const srcLoc = source_location || whName || 'Main Storage';
    const scpLoc = scrap_location || 'Scrap / Inventory Loss Location';
    const destroyedByName = req.user?.name || 'Authorized Operator';
    const destroyedById = req.user?.id || null;

    // 4. Generate Unique Scrap Reference Number SCRAP-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const [[{ maxId }]] = await connection.query(`SELECT COALESCE(MAX(id), 0) + 1 as maxId FROM stock_destroys`);
    const destroyNo = `SCRAP-${dateStr}-${String(maxId).padStart(4, '0')}`;

    // 5. Insert Record into stock_destroys table
    const [insertResult] = await connection.query(
      `INSERT INTO stock_destroys (
        destroy_no, product_id, product_name, barcode, sku, batch_no, batch_id,
        warehouse_name, source_location, scrap_location, available_stock,
        destroy_quantity, unit, unit_cost, purchase_price, selling_price,
        destroy_value, reason, remarks, evidence_image, destroyed_by_id, destroyed_by_name,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        destroyNo,
        product.id,
        product.name,
        product.barcode || 'N/A',
        product.sku || 'N/A',
        targetBatch ? targetBatch.batch_number : (batch_no || 'DEFAULT'),
        targetBatch ? targetBatch.id : null,
        whName,
        srcLoc,
        scpLoc,
        availableStock,
        qtyToDestroy,
        product.unit || 'Pcs',
        unitCost,
        Number(product.purchase_price || 0),
        Number(product.selling_price || 0),
        destroyValue,
        reason,
        remarks || '',
        evidence_image || null,
        destroyedById,
        destroyedByName,
        initialStatus,
        destroy_date ? `${destroy_date} ${new Date().toTimeString().slice(0, 8)}` : new Date()
      ]
    );

    // 6. IF status is 'Confirmed', perform atomic Stock Movement + Batch Update + Valuation Layer
    if (initialStatus === 'Confirmed') {
      await processScrapStockDeduction({
        connection,
        product,
        qtyToDestroy,
        unitCost,
        destroyValue,
        destroyNo,
        availableStock,
        targetBatch,
        srcLoc,
        scpLoc,
        reason,
        remarks,
        destroyedById
      });
    }

    // 7. Audit Log & System Alert
    await logActivity({
      db: req.db,
      userId: destroyedById,
      action: initialStatus === 'Confirmed' ? 'STOCK_DESTROY_CONFIRMED' : 'STOCK_DESTROY_DRAFT_CREATED',
      module: 'Stock Destroy',
      details: `Stock Destroy Record ${destroyNo} (${initialStatus}) created for ${product.name} (${qtyToDestroy} ${product.unit || 'Pcs'}, Loss Value: ₹${destroyValue})`
    });

    await createNotification(
      {
        type: initialStatus === 'Confirmed' ? 'Warning' : 'Info',
        title: initialStatus === 'Confirmed' ? 'Inventory Stock Destroyed' : 'Stock Destroy Draft Created',
        message: `${qtyToDestroy} units of ${product.name} ${initialStatus === 'Confirmed' ? 'permanently destroyed' : 'drafted for scrap'} under ${destroyNo} (Reason: ${reason}). Loss Value: ₹${destroyValue}.`,
        priority: initialStatus === 'Confirmed' ? 'High' : 'Medium',
        module: 'Stock Destroy'
      },
      req.db
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: initialStatus === 'Confirmed'
        ? `Scrap transaction ${destroyNo} confirmed successfully. Inventory stock moved to ${scpLoc}.`
        : `Stock Destroy draft ${destroyNo} saved successfully. Stock will not change until confirmed.`,
      destroyId: insertResult.insertId,
      destroyNo,
      status: initialStatus
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Confirm / Validate a Draft Stock Destroy record
// @route   POST /api/stock/destroy/:id/confirm
// @access  Private
export const confirmStockDestroy = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [destroys] = await connection.query(
      `SELECT * FROM stock_destroys WHERE id = ? FOR UPDATE`,
      [id]
    );

    if (destroys.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Stock Destroy record not found.' });
    }

    const destroy = destroys[0];

    if (destroy.status === 'Confirmed') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'This Scrap transaction is already confirmed.' });
    }

    if (destroy.status === 'Cancelled') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Cannot confirm a cancelled Scrap transaction.' });
    }

    // Lock & validate product
    const [products] = await connection.query(
      `SELECT id, name, barcode, sku, min_stock, purchase_price, selling_price, unit FROM products WHERE id = ? FOR UPDATE`,
      [destroy.product_id]
    );
    const product = products[0];

    // Lock & validate current stock
    const [stockRows] = await connection.query(
      `SELECT id, warehouse_id, quantity FROM stock WHERE product_id = ? FOR UPDATE`,
      [destroy.product_id]
    );
    const availableStock = stockRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
    const qtyToDestroy = Number(destroy.destroy_quantity);

    if (qtyToDestroy > availableStock) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Validation Error: Destroy quantity (${qtyToDestroy}) exceeds current available stock (${availableStock} ${product.unit || 'Pcs'}).`
      });
    }

    // Lock & validate batch if assigned
    let targetBatch = null;
    if (destroy.batch_id) {
      const [batches] = await connection.query(
        `SELECT * FROM purchase_batches WHERE id = ? FOR UPDATE`,
        [destroy.batch_id]
      );
      if (batches.length > 0) {
        targetBatch = batches[0];
        if (qtyToDestroy > Number(targetBatch.remaining_quantity || 0)) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `Validation Error: Destroy quantity (${qtyToDestroy}) exceeds batch remaining quantity (${targetBatch.remaining_quantity}).`
          });
        }
      }
    }

    const unitCost = Number(destroy.unit_cost || destroy.purchase_price || 0);
    const destroyValue = Number(destroy.destroy_value || (qtyToDestroy * unitCost).toFixed(2));
    const srcLoc = destroy.source_location || destroy.warehouse_name || 'Main Storage';
    const scpLoc = destroy.scrap_location || 'Scrap / Inventory Loss Location';

    // Process Deduction
    await processScrapStockDeduction({
      connection,
      product,
      qtyToDestroy,
      unitCost,
      destroyValue,
      destroyNo: destroy.destroy_no,
      availableStock,
      targetBatch,
      srcLoc,
      scpLoc,
      reason: destroy.reason,
      remarks: destroy.remarks,
      destroyedById: req.user?.id || destroy.destroyed_by_id
    });

    // Update status to Confirmed
    await connection.query(
      `UPDATE stock_destroys SET status = 'Confirmed', updated_at = NOW() WHERE id = ?`,
      [id]
    );

    await logActivity({
      db: req.db,
      userId: req.user?.id,
      action: 'STOCK_DESTROY_CONFIRMED',
      module: 'Stock Destroy',
      details: `Draft Stock Destroy Record ${destroy.destroy_no} confirmed by ${req.user?.name || 'Admin'}. Stock moved to Scrap Location.`
    });

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Scrap transaction ${destroy.destroy_no} has been validated and confirmed. Stock deducted.`
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Cancel a Stock Destroy record (Restores stock quantity & batch remaining quantity)
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

    // 1. Lock & Fetch Destroy Record
    const [destroys] = await connection.query(
      `SELECT * FROM stock_destroys WHERE id = ? FOR UPDATE`,
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

    // 2. If status was Confirmed, restore physical stock & batch remaining quantity
    if (destroy.status === 'Confirmed') {
      // A. Restore Stock Quantity in stock table
      const [existingStock] = await connection.query(
        `SELECT id, quantity FROM stock WHERE product_id = ? LIMIT 1 FOR UPDATE`,
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

      // B. Restore Batch remaining_quantity if linked or to latest active batch
      if (destroy.batch_id) {
        await connection.query(
          `UPDATE purchase_batches SET remaining_quantity = remaining_quantity + ? WHERE id = ?`,
          [restoreQty, destroy.batch_id]
        );
      } else {
        const [latestBatch] = await connection.query(
          `SELECT id FROM purchase_batches WHERE product_id = ? ORDER BY purchase_date DESC, id DESC LIMIT 1 FOR UPDATE`,
          [destroy.product_id]
        );
        if (latestBatch.length > 0) {
          await connection.query(
            `UPDATE purchase_batches SET remaining_quantity = remaining_quantity + ? WHERE id = ?`,
            [restoreQty, latestBatch[0].id]
          );
        }
      }

      // C. Record Positive Reversal in inventory_valuation_layers
      const unitCost = Number(destroy.unit_cost || destroy.purchase_price || 0);
      const destroyVal = Number(destroy.destroy_value || (restoreQty * unitCost).toFixed(2));

      await connection.query(
        `INSERT INTO inventory_valuation_layers (
          product_id, warehouse_id, batch_id, transaction_type, reference_no,
          quantity_delta, unit_cost, value_delta, previous_inventory_value,
          new_inventory_value, previous_quantity, new_quantity, accounting_treatment,
          created_by, created_at
        ) VALUES (?, 1, ?, 'Scrap/Wastage', ?, ?, ?, ?, 0, 0, 0, ?, 'Scrap Reversal', ?, NOW())`,
        [
          destroy.product_id,
          destroy.batch_id || null,
          `${destroy.destroy_no}-REVERSAL`,
          restoreQty,
          unitCost,
          destroyVal,
          restoreQty,
          req.user?.id || null
        ]
      );

      // D. Log Stock Restoration in stock_logs
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
          `RESTORE_SCRAP | Source: ${destroy.scrap_location || 'Scrap Location'} -> Destination: ${destroy.source_location || 'Main Storage'} | Reason: ${cancel_reason.trim()}`,
          req.user?.id || null
        ]
      );
    }

    // 3. Update stock_destroys status
    await connection.query(
      `UPDATE stock_destroys SET status = 'Cancelled', cancel_reason = ?, cancelled_by_name = ?, updated_at = NOW() WHERE id = ?`,
      [cancel_reason.trim(), cancelledByName, id]
    );

    // 4. Audit Log
    await logActivity({
      db: req.db,
      userId: req.user?.id,
      action: 'STOCK_DESTROY_CANCELLED',
      module: 'Stock Destroy',
      details: `Stock Destroy Record ${destroy.destroy_no} was cancelled by ${cancelledByName}. Stock restored: ${restoreQty} units. Reason: ${cancel_reason}`
    });

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
