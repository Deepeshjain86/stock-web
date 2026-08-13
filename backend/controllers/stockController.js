import { logActivity } from '../utils/activityLogger.js';
import { createNotification, checkStockAlerts } from '../services/notificationService.js';
import { syncProductFifoState } from '../utils/fifoQueueHelper.js';
import { recordValuationLayer } from '../services/valuationLayerService.js';

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

    const { 
      product_id, 
      warehouse_id = 1, 
      type, 
      quantity, 
      unit_cost, 
      notes, 
      reason, 
      remarks, 
      batch_id, 
      batch_number, 
      mfg_date, 
      exp_date 
    } = req.body;

    if (!product_id || !type || quantity === undefined) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Missing required fields: product_id, type, and quantity' });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Quantity must be a valid positive number' });
    }

    const adjType = (type === 'add' || type === 'Increase') ? 'Increase' : (type === 'subtract' || type === 'Decrease') ? 'Decrease' : type;
    if (adjType !== 'Increase' && adjType !== 'Decrease' && type !== 'set') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Invalid adjustment type. Use "Increase" or "Decrease"' });
    }

    const finalReason = reason || 'Physical Count Difference';
    const finalRemarks = remarks || notes || '';

    // Check existing stock row for this product+warehouse
    const [stockCheck] = await connection.query(
      'SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1',
      [product_id, warehouse_id]
    );

    const currentQty = stockCheck.length > 0 ? Number(stockCheck[0].quantity) : 0;
    let newQty = 0;
    let deltaQty = 0;

    if (adjType === 'Increase') {
      deltaQty = qty;
      newQty = currentQty + qty;
    } else if (adjType === 'Decrease') {
      if (currentQty < qty) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ success: false, message: `Insufficient stock. Current stock: ${currentQty}, Requested reduction: ${qty}` });
      }
      deltaQty = -qty;
      newQty = currentQty - qty;
    } else if (type === 'set') {
      deltaQty = qty - currentQty;
      newQty = qty;
    }

    const effectiveAdjType = deltaQty >= 0 ? 'Increase' : 'Decrease';
    const absDeltaQty = Math.abs(deltaQty);

    // Fetch product information & default costs
    const [[prod]] = await connection.query('SELECT name, mrp, selling_price, purchase_price FROM products WHERE id = ?', [product_id]);
    if (!prod) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Determine unit cost
    let computedUnitCost = Number(unit_cost || 0);
    if (!computedUnitCost || computedUnitCost <= 0) {
      if (batch_id) {
        const [[bRow]] = await connection.query('SELECT purchase_price FROM purchase_batches WHERE id = ?', [batch_id]);
        if (bRow && Number(bRow.purchase_price) > 0) {
          computedUnitCost = Number(bRow.purchase_price);
        }
      } else if (batch_number) {
        const [[bRow]] = await connection.query('SELECT purchase_price FROM purchase_batches WHERE product_id = ? AND batch_number = ? LIMIT 1', [product_id, batch_number]);
        if (bRow && Number(bRow.purchase_price) > 0) {
          computedUnitCost = Number(bRow.purchase_price);
        }
      }
    }
    if (!computedUnitCost || computedUnitCost <= 0) {
      computedUnitCost = Number(prod.purchase_price || 0);
    }
    if (!computedUnitCost || computedUnitCost <= 0) {
      computedUnitCost = Number(prod.selling_price || 0);
    }
    if (!computedUnitCost || computedUnitCost <= 0) {
      computedUnitCost = Number(prod.mrp || 0);
    }
    if (computedUnitCost > 0 && Number(prod.purchase_price || 0) === 0) {
      await connection.query('UPDATE products SET purchase_price = ? WHERE id = ?', [computedUnitCost, product_id]);
    }

    const adjustmentValue = Number((absDeltaQty * computedUnitCost).toFixed(2));
    const financialImpact = effectiveAdjType === 'Increase' ? 'Gain' : 'Loss';

    // Update or insert stock row
    if (stockCheck.length > 0) {
      await connection.query('UPDATE stock SET quantity = ? WHERE id = ?', [newQty, stockCheck[0].id]);
    } else {
      await connection.query('INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [product_id, warehouse_id, newQty]);
    }

    // Synchronize purchase_batches
    let targetBatchId = batch_id || null;
    let targetBatchNo = batch_number || null;

    if (effectiveAdjType === 'Increase') {
      const defaultMrp = Number(prod.mrp || 0);
      const defaultSellingPrice = Number(prod.selling_price || 0);
      const finalBatchNo = batch_number || `ADJ-BATCH-${Date.now()}`;
      targetBatchNo = finalBatchNo;
      const finalExpDate = exp_date || null;

      const [bRes] = await connection.query(
        `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, expiry_date, purchase_price, mrp, selling_price, warehouse_id)
         VALUES (?, ?, ?, ?, CURRENT_DATE(), ?, ?, ?, ?, ?)`,
        [product_id, finalBatchNo, absDeltaQty, absDeltaQty, finalExpDate, computedUnitCost, defaultMrp, defaultSellingPrice, warehouse_id]
      );
      targetBatchId = bRes.insertId;

      if (finalExpDate) {
        await connection.query('UPDATE products SET expiry_date = ? WHERE id = ?', [finalExpDate, product_id]);
      }
    } else if (effectiveAdjType === 'Decrease') {
      let remDeduct = absDeltaQty;
      if (batch_id || batch_number) {
        const queryStr = batch_id ? 'SELECT id, remaining_quantity FROM purchase_batches WHERE id = ?' : 'SELECT id, remaining_quantity FROM purchase_batches WHERE product_id = ? AND batch_number = ?';
        const queryVal = batch_id ? [batch_id] : [product_id, batch_number];
        const [pbRows] = await connection.query(queryStr, queryVal);
        if (pbRows.length > 0) {
          const pbRow = pbRows[0];
          const curPBQty = Number(pbRow.remaining_quantity);
          const pbDeduct = Math.min(curPBQty, remDeduct);
          await connection.query('UPDATE purchase_batches SET remaining_quantity = remaining_quantity - ? WHERE id = ?', [pbDeduct, pbRow.id]);
          remDeduct -= pbDeduct;
        }
      }
      if (remDeduct > 0) {
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
    }

    // Insert Record into stock_adjustments table
    const adjustmentNo = `ADJ-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
    const prevVal = Number((currentQty * computedUnitCost).toFixed(2));
    const newVal = Number((newQty * computedUnitCost).toFixed(2));
    const acctTreatment = (finalReason === 'Damaged' || finalReason === 'Expired' || finalReason === 'Lost' || finalReason === 'Wastage') ? 'Inventory Loss' : 'Inventory Variation';

    const [adjRes] = await connection.query(
      `INSERT INTO stock_adjustments 
       (adjustment_no, product_id, warehouse_id, batch_id, batch_number, adjustment_type, quantity, unit_cost, adjustment_value, reason, financial_impact, remarks, previous_quantity, new_quantity, previous_inventory_value, new_inventory_value, accounting_treatment, user_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Completed')`,
      [
        adjustmentNo,
        product_id,
        warehouse_id,
        targetBatchId,
        targetBatchNo,
        effectiveAdjType,
        absDeltaQty,
        computedUnitCost,
        adjustmentValue,
        finalReason,
        financialImpact,
        finalRemarks,
        currentQty,
        newQty,
        prevVal,
        newVal,
        acctTreatment,
        req.user?.id || 1
      ]
    );

    // Record Valuation Layer
    await recordValuationLayer(connection, {
      productId: product_id,
      warehouseId: warehouse_id,
      batchId: targetBatchId,
      transactionType: (finalReason === 'Damaged' || finalReason === 'Expired' || finalReason === 'Wastage') ? 'Scrap/Wastage' : 'Stock Adjustment',
      referenceNo: adjustmentNo,
      quantityDelta: deltaQty,
      unitCost: computedUnitCost,
      valueDelta: Number((deltaQty * computedUnitCost).toFixed(2)),
      previousQuantity: currentQty,
      newQuantity: newQty,
      previousInventoryValue: prevVal,
      newInventoryValue: newVal,
      accountingTreatment: acctTreatment,
      createdBy: req.user?.id || 1
    });

    // Insert Stock History Log
    const structuredNotes = `Reason: ${finalReason} | Remarks: ${finalRemarks || 'None'} | Batch: ${targetBatchNo || 'N/A'}`;
    await connection.query(
      `INSERT INTO stock_logs (product_id, warehouse_id, vendor_id, type, quantity, reference_no, notes, user_id, previous_quantity, new_quantity)
       VALUES (?, ?, NULL, 'STOCK_ADJUSTMENT', ?, ?, ?, ?, ?, ?)`,
      [product_id, warehouse_id, deltaQty, adjustmentNo, structuredNotes, req.user?.id || 1, currentQty, newQty]
    );

    // Sync FIFO active batch state on Product master
    await syncProductFifoState(connection, product_id);

    await connection.commit();

    await logActivity(
      req.user?.id || 1,
      'Adjust Stock',
      'Stock',
      `Created Stock Adjustment ${adjustmentNo} for "${prod.name}": ${effectiveAdjType} ${absDeltaQty} Pcs @ ₹${computedUnitCost} (Valuation: ₹${adjustmentValue}, Impact: ${financialImpact})`,
      req.ip
    );

    await createNotification({
      type: 'Stock Update',
      title: 'Stock Adjustment Created',
      message: `Stock Adjustment ${adjustmentNo} for "${prod.name}" (${effectiveAdjType} ${absDeltaQty} Pcs, Value: ₹${adjustmentValue}). New Stock: ${newQty}.`,
      priority: 'Medium',
      related_user: req.user?.email || 'System',
      related_module: 'Inventory',
      target_roles: 'Admin,Manager,Staff'
    }, connection);

    await checkStockAlerts(connection, product_id, req.user?.id || 1);

    return res.status(200).json({
      success: true,
      message: 'Stock adjustment recorded successfully',
      adjustment_id: adjRes.insertId,
      adjustment_no: adjustmentNo,
      newQuantity: newQty,
      adjustmentValue,
      financialImpact
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Get all stock adjustments with filtering and pagination
// @route   GET /api/stock/adjustments
// @access  Private
export const getStockAdjustments = async (req, res, next) => {
  try {
    const { productId, type, reason, startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT sa.*, 
             p.name as product_name, p.barcode, p.sku, p.unit,
             c.name as category_name,
             w.name as warehouse_name,
             u.name as user_name
      FROM stock_adjustments sa
      JOIN products p ON sa.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN warehouses w ON sa.warehouse_id = w.id
      LEFT JOIN users u ON sa.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (productId) {
      query += ' AND sa.product_id = ?';
      queryParams.push(productId);
    }
    if (type && type !== 'all' && type !== 'All') {
      query += ' AND sa.adjustment_type = ?';
      queryParams.push(type);
    }
    if (reason && reason !== 'all' && reason !== 'All') {
      query += ' AND sa.reason = ?';
      queryParams.push(reason);
    }
    if (startDate) {
      query += ' AND sa.created_at >= ?';
      queryParams.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      query += ' AND sa.created_at <= ?';
      queryParams.push(`${endDate} 23:59:59`);
    }

    query += ' ORDER BY sa.id DESC LIMIT ? OFFSET ?';
    queryParams.push(Number(limit), Number(offset));

    const [adjustments] = await req.db.query(query, queryParams);

    return res.status(200).json({
      success: true,
      count: adjustments.length,
      adjustments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reverse a completed stock adjustment (Controlled Reversal)
// @route   POST /api/stock/adjust/:id/reverse
// @access  Private
export const reverseStockAdjustment = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { reason: reversalReason = 'Reversal of incorrect adjustment' } = req.body;

    const [adjRows] = await connection.query('SELECT * FROM stock_adjustments WHERE id = ? FOR UPDATE', [id]);
    if (adjRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Stock adjustment record not found' });
    }

    const origAdj = adjRows[0];
    if (origAdj.status === 'Reversed') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'This stock adjustment has already been reversed' });
    }

    const productId = origAdj.product_id;
    const warehouseId = origAdj.warehouse_id;
    const origType = origAdj.adjustment_type;
    const origQty = Number(origAdj.quantity);
    const unitCost = Number(origAdj.unit_cost);
    const origValue = Number(origAdj.adjustment_value);

    // Current stock check
    const [stockRows] = await connection.query('SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1', [productId, warehouseId]);
    const currentQty = stockRows.length > 0 ? Number(stockRows[0].quantity) : 0;

    let reverseType = 'Decrease';
    let deltaQty = -origQty;
    let newQty = currentQty - origQty;
    let reverseImpact = 'Loss';

    if (origType === 'Decrease') {
      reverseType = 'Increase';
      deltaQty = origQty;
      newQty = currentQty + origQty;
      reverseImpact = 'Gain';
    } else {
      // If reversing an Increase, verify stock sufficiency
      if (currentQty < origQty) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ success: false, message: `Cannot reverse adjustment: current stock (${currentQty}) is less than original adjustment qty (${origQty})` });
      }
    }

    // Update Stock quantity
    await connection.query('UPDATE stock SET quantity = ? WHERE id = ?', [newQty, stockRows[0].id]);

    // Update purchase_batches
    if (reverseType === 'Increase') {
      await connection.query(
        `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, purchase_price, warehouse_id)
         VALUES (?, ?, ?, ?, CURRENT_DATE(), ?, ?)`,
        [productId, `REV-${origAdj.adjustment_no}`, origQty, origQty, unitCost, warehouseId]
      );
    } else {
      let remDeduct = origQty;
      if (origAdj.batch_id) {
        await connection.query('UPDATE purchase_batches SET remaining_quantity = GREATEST(0, remaining_quantity - ?) WHERE id = ?', [origQty, origAdj.batch_id]);
      } else {
        const [pbRows] = await connection.query(
          'SELECT id, remaining_quantity FROM purchase_batches WHERE product_id = ? AND remaining_quantity > 0 ORDER BY purchase_date ASC, id ASC',
          [productId]
        );
        for (const pbRow of pbRows) {
          if (remDeduct <= 0) break;
          const curPBQty = Number(pbRow.remaining_quantity);
          const pbDeduct = Math.min(curPBQty, remDeduct);
          await connection.query('UPDATE purchase_batches SET remaining_quantity = remaining_quantity - ? WHERE id = ?', [pbDeduct, pbRow.id]);
          remDeduct -= pbDeduct;
        }
      }
    }

    // Mark original status = 'Reversed'
    await connection.query('UPDATE stock_adjustments SET status = "Reversed" WHERE id = ?', [id]);

    // Insert reversal adjustment record
    const reversalNo = `${origAdj.adjustment_no}-REV`;
    const prevRevVal = Number((currentQty * unitCost).toFixed(2));
    const newRevVal = Number((newQty * unitCost).toFixed(2));

    const [revRes] = await connection.query(
      `INSERT INTO stock_adjustments 
       (adjustment_no, product_id, warehouse_id, batch_id, batch_number, adjustment_type, quantity, unit_cost, adjustment_value, reason, financial_impact, remarks, previous_quantity, new_quantity, previous_inventory_value, new_inventory_value, accounting_treatment, user_id, status, reversal_ref_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Inventory Reversal', ?, 'Completed', ?)`,
      [
        reversalNo,
        productId,
        warehouseId,
        origAdj.batch_id,
        origAdj.batch_number,
        reverseType,
        origQty,
        unitCost,
        origValue,
        `Reversal of ${origAdj.adjustment_no}: ${reversalReason}`,
        reverseImpact,
        `Reversal reference ADJ ID #${id}`,
        currentQty,
        newQty,
        prevRevVal,
        newRevVal,
        req.user?.id || 1,
        id
      ]
    );

    // Record Valuation Layer for Reversal
    await recordValuationLayer(connection, {
      productId,
      warehouseId,
      batchId: origAdj.batch_id,
      transactionType: 'Stock Adjustment',
      referenceNo: reversalNo,
      quantityDelta: deltaQty,
      unitCost,
      valueDelta: Number((deltaQty * unitCost).toFixed(2)),
      previousQuantity: currentQty,
      newQuantity: newQty,
      previousInventoryValue: prevRevVal,
      newInventoryValue: newRevVal,
      accountingTreatment: 'Inventory Reversal',
      createdBy: req.user?.id || 1
    });

    // Insert Stock History Log
    await connection.query(
      `INSERT INTO stock_logs (product_id, warehouse_id, vendor_id, type, quantity, reference_no, notes, user_id, previous_quantity, new_quantity)
       VALUES (?, ?, NULL, 'STOCK_ADJUSTMENT_REVERSAL', ?, ?, ?, ?, ?, ?)`,
      [productId, warehouseId, deltaQty, reversalNo, `Reversal of ${origAdj.adjustment_no} | ${reversalReason}`, req.user?.id || 1, currentQty, newQty]
    );

    await syncProductFifoState(connection, productId);

    await connection.commit();

    await logActivity(
      req.user?.id || 1,
      'Reverse Stock Adjustment',
      'Stock',
      `Reversed Stock Adjustment ${origAdj.adjustment_no} (${reversalNo})`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: `Stock adjustment ${origAdj.adjustment_no} successfully reversed`,
      reversal_no: reversalNo,
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
      SELECT p.id as product_id, p.name as product_name, p.sku, p.barcode, p.expiry_date, p.unit, COALESCE(SUM(s.quantity), 0) as current_stock
      FROM products p
      JOIN stock s ON p.id = s.product_id
      WHERE p.expiry_date IS NOT NULL 
        AND p.expiry_date > CURRENT_DATE() 
        AND p.expiry_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)
      GROUP BY p.id, p.name, p.sku, p.barcode, p.expiry_date, p.unit
      HAVING current_stock > 0
      ORDER BY p.expiry_date ASC
    `);

    const [expired] = await req.db.query(`
      SELECT p.id as product_id, p.name as product_name, p.sku, p.barcode, p.expiry_date, p.unit, COALESCE(SUM(s.quantity), 0) as current_stock
      FROM products p
      JOIN stock s ON p.id = s.product_id
      WHERE p.expiry_date IS NOT NULL AND p.expiry_date <= CURRENT_DATE()
      GROUP BY p.id, p.name, p.sku, p.barcode, p.expiry_date, p.unit
      HAVING current_stock > 0
      ORDER BY p.expiry_date ASC
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

// @desc    Revalue product inventory unit cost without changing physical stock quantity
// @route   POST /api/stock/revaluation
// @access  Private
export const revalueInventory = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();
    const { product_id, warehouse_id = 1, batch_id, new_unit_cost, reason, remarks } = req.body;

    const newCost = Number(new_unit_cost);
    if (!product_id || isNaN(newCost) || newCost < 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Invalid product_id or new_unit_cost' });
    }

    const [[prod]] = await connection.query('SELECT name, purchase_price FROM products WHERE id = ?', [product_id]);
    if (!prod) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const oldCost = Number(prod.purchase_price || 0);

    const [stockRows] = await connection.query('SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1', [product_id, warehouse_id]);
    const currentQty = stockRows.length > 0 ? Number(stockRows[0].quantity) : 0;

    const prevValue = Number((currentQty * oldCost).toFixed(2));
    const newValue = Number((currentQty * newCost).toFixed(2));
    const valueDelta = Number((newValue - prevValue).toFixed(2));

    await connection.query('UPDATE products SET purchase_price = ? WHERE id = ?', [newCost, product_id]);

    if (batch_id) {
      await connection.query('UPDATE purchase_batches SET purchase_price = ? WHERE id = ?', [newCost, batch_id]);
    }

    const revalNo = `REVAL-${Date.now().toString().slice(-6)}`;
    await connection.query(
      `INSERT INTO inventory_revaluations (revaluation_no, product_id, warehouse_id, batch_id, old_unit_cost, new_unit_cost, quantity, value_delta, reason, remarks, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [revalNo, product_id, warehouse_id, batch_id || null, oldCost, newCost, currentQty, valueDelta, reason || 'Cost Correction', remarks || '', req.user?.id || 1]
    );

    await recordValuationLayer(connection, {
      productId: product_id,
      warehouseId: warehouse_id,
      batchId: batch_id || null,
      transactionType: 'Revaluation',
      referenceNo: revalNo,
      quantityDelta: 0,
      unitCost: newCost,
      valueDelta,
      previousQuantity: currentQty,
      newQuantity: currentQty,
      previousInventoryValue: prevValue,
      newInventoryValue: newValue,
      accountingTreatment: 'Inventory Revaluation',
      createdBy: req.user?.id || 1
    });

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: 'Inventory revalued successfully',
      revaluation_no: revalNo,
      oldCost,
      newCost,
      valueDelta
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};
