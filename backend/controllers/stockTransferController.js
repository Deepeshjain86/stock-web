import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../services/notificationService.js';

// @desc    Get active warehouses
// @route   GET /api/stock/warehouses
// @access  Private
export const getWarehouses = async (req, res, next) => {
  try {
    const [warehouses] = await req.db.query('SELECT * FROM warehouses WHERE status = "Active" ORDER BY id ASC');
    return res.status(200).json({ success: true, warehouses });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new warehouse / store location
// @route   POST /api/stock/warehouses
// @access  Private
export const createWarehouse = async (req, res, next) => {
  try {
    const { name, location } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Warehouse / Store name is required.' });
    }

    const trimmedName = name.trim();
    const trimmedLocation = location && location.trim() !== '' ? location.trim() : 'Main Building';

    const [existing] = await req.db.query(
      'SELECT id FROM warehouses WHERE LOWER(name) = LOWER(?) LIMIT 1',
      [trimmedName]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: `A warehouse or store named "${trimmedName}" already exists.` });
    }

    const [insRes] = await req.db.query(
      'INSERT INTO warehouses (name, location, status, created_at) VALUES (?, ?, "Active", NOW())',
      [trimmedName, trimmedLocation]
    );

    await logActivity({
      db: req.db,
      userId: req.user?.id,
      action: 'CREATE_WAREHOUSE',
      module: 'Stock Transfer',
      details: `Created new warehouse/store "${trimmedName}" (${trimmedLocation})`
    });

    return res.status(201).json({
      success: true,
      message: `Warehouse / Store "${trimmedName}" created successfully.`,
      warehouse: {
        id: insRes.insertId,
        name: trimmedName,
        location: trimmedLocation,
        status: 'Active'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all stock transfers with optional filters
// @route   GET /api/stock/transfers
// @access  Private
export const getStockTransfers = async (req, res, next) => {
  try {
    const { search, status, fromWarehouseId, toWarehouseId, startDate, endDate } = req.query;
    let query = `
      SELECT st.*, 
             fw.name as from_warehouse_name, 
             tw.name as to_warehouse_name,
             p.unit as product_unit,
             p.min_stock,
             COALESCE(u.name, st.created_by_name, 'Admin') as created_by_name
      FROM stock_transfers st
      LEFT JOIN warehouses fw ON st.from_warehouse_id = fw.id
      LEFT JOIN warehouses tw ON st.to_warehouse_id = tw.id
      LEFT JOIN products p ON st.product_id = p.id
      LEFT JOIN users u ON st.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (st.transfer_no LIKE ? OR st.product_name LIKE ? OR st.barcode LIKE ? OR st.sku LIKE ? OR st.remarks LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (status && status !== 'All') {
      query += ` AND st.status = ?`;
      params.push(status);
    }

    if (fromWarehouseId && fromWarehouseId !== 'All') {
      query += ` AND st.from_warehouse_id = ?`;
      params.push(fromWarehouseId);
    }

    if (toWarehouseId && toWarehouseId !== 'All') {
      query += ` AND st.to_warehouse_id = ?`;
      params.push(toWarehouseId);
    }

    if (startDate) {
      query += ` AND st.created_at >= ?`;
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      query += ` AND st.created_at <= ?`;
      params.push(`${endDate} 23:59:59`);
    }

    query += ` ORDER BY st.id DESC`;

    const [transfers] = await req.db.query(query, params);

    return res.status(200).json({
      success: true,
      count: transfers.length,
      transfers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Stock Transfer KPIs
// @route   GET /api/stock/transfers/kpis
// @access  Private
export const getStockTransferKPIs = async (req, res, next) => {
  try {
    const [[{ inTransitCount }]] = await req.db.query(
      `SELECT COUNT(*) as inTransitCount FROM stock_transfers WHERE status = 'In Transit'`
    );
    const [[{ inTransitQty }]] = await req.db.query(
      `SELECT COALESCE(SUM(in_transit_quantity), 0) as inTransitQty FROM stock_transfers WHERE status = 'In Transit'`
    );
    const [[{ inTransitValue }]] = await req.db.query(
      `SELECT COALESCE(SUM(in_transit_quantity * unit_cost), 0) as inTransitValue FROM stock_transfers WHERE status = 'In Transit'`
    );
    const [[{ completedCount }]] = await req.db.query(
      `SELECT COUNT(*) as completedCount FROM stock_transfers WHERE status = 'Completed'`
    );
    const [[{ todayTransfers }]] = await req.db.query(
      `SELECT COUNT(*) as todayTransfers FROM stock_transfers WHERE DATE(created_at) = CURRENT_DATE()`
    );

    return res.status(200).json({
      success: true,
      kpis: {
        inTransitCount: Number(inTransitCount || 0),
        inTransitQty: Number(inTransitQty || 0),
        inTransitValue: Number(inTransitValue || 0),
        completedCount: Number(completedCount || 0),
        todayTransfers: Number(todayTransfers || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new Stock Transfer (Draft or In Transit)
// @route   POST /api/stock/transfer/create
// @access  Private
export const createStockTransfer = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      product_id,
      from_warehouse_id,
      to_warehouse_id,
      quantity,
      batch_id,
      batch_no,
      remarks,
      status: requestedStatus
    } = req.body;

    const initialStatus = requestedStatus === 'Draft' ? 'Draft' : 'In Transit';

    // 1. Validation
    if (!product_id || !from_warehouse_id || !to_warehouse_id || !quantity) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Validation Error: product_id, from_warehouse_id, to_warehouse_id, and quantity are required.'
      });
    }

    if (Number(from_warehouse_id) === Number(to_warehouse_id)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Source and Destination warehouses must be different.'
      });
    }

    const transferQty = Number(quantity);
    if (isNaN(transferQty) || transferQty <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Transfer quantity must be a positive number greater than zero.'
      });
    }

    // 2. Lock Product FOR UPDATE
    const [products] = await connection.query(
      'SELECT id, name, barcode, sku, min_stock, purchase_price, selling_price, standard_cost, unit FROM products WHERE id = ? FOR UPDATE',
      [product_id]
    );

    if (products.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Selected product does not exist in catalogue.' });
    }

    const product = products[0];

    // 3. Lock Source & Destination Warehouses
    const [fromWhRows] = await connection.query('SELECT name FROM warehouses WHERE id = ?', [from_warehouse_id]);
    const [toWhRows] = await connection.query('SELECT name FROM warehouses WHERE id = ?', [to_warehouse_id]);
    const fromWhName = fromWhRows[0]?.name || `Warehouse #${from_warehouse_id}`;
    const toWhName = toWhRows[0]?.name || `Warehouse #${to_warehouse_id}`;

    // 4. Lock & Check Source Warehouse Available Stock
    const [srcStockRows] = await connection.query(
      'SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1 FOR UPDATE',
      [product_id, from_warehouse_id]
    );
    const srcAvailable = srcStockRows.length > 0 ? Number(srcStockRows[0].quantity || 0) : 0;

    if (transferQty > srcAvailable) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Validation Error: Transfer quantity (${transferQty} ${product.unit || 'Pcs'}) exceeds available stock in ${fromWhName} (${srcAvailable} ${product.unit || 'Pcs'}).`
      });
    }

    // 5. Determine Batch & Costing Layer
    let targetBatch = null;
    let unitCost = Number(product.purchase_price || product.standard_cost || 0);

    if (batch_id || (batch_no && batch_no !== 'DEFAULT' && batch_no !== 'All')) {
      let bQuery = 'SELECT * FROM purchase_batches WHERE product_id = ?';
      const bParams = [product_id];
      if (batch_id) {
        bQuery += ' AND id = ?';
        bParams.push(batch_id);
      } else {
        bQuery += ' AND batch_number = ?';
        bParams.push(batch_no);
      }
      bQuery += ' FOR UPDATE';
      const [batches] = await connection.query(bQuery, bParams);
      if (batches.length > 0) {
        targetBatch = batches[0];
        unitCost = Number(targetBatch.purchase_price || unitCost);
      }
    }

    const totalValue = Number((transferQty * unitCost).toFixed(2));
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));
    const transferNo = `TRSF-${dateStr}-${randomSuffix}`;
    const inTransitQty = initialStatus === 'In Transit' ? transferQty : 0;

    // 6. Insert Stock Transfer Record
    const [insRes] = await connection.query(`
      INSERT INTO stock_transfers (
        transfer_no, product_id, product_name, barcode, sku,
        from_warehouse_id, from_warehouse_name, to_warehouse_id, to_warehouse_name,
        batch_id, batch_no, expiry_date, quantity, in_transit_quantity, unit,
        unit_cost, total_value, status, remarks, created_by, created_by_name,
        shipped_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      transferNo, product.id, product.name, product.barcode || 'N/A', product.sku || 'N/A',
      from_warehouse_id, fromWhName, to_warehouse_id, toWhName,
      targetBatch ? targetBatch.id : null, targetBatch ? targetBatch.batch_number : (batch_no || 'DEFAULT'),
      targetBatch ? targetBatch.expiry_date : null, transferQty, inTransitQty, product.unit || 'Pcs',
      unitCost, totalValue, initialStatus, remarks || '', req.user?.id || null, req.user?.name || 'Admin',
      initialStatus === 'In Transit' ? new Date() : null
    ]);

    // 7. Deduct Source Stock & Batch if 'In Transit'
    if (initialStatus === 'In Transit') {
      await processOutboundTransferDeduction({
        connection,
        product,
        from_warehouse_id,
        transferQty,
        unitCost,
        totalValue,
        transferNo,
        srcAvailable,
        targetBatch,
        fromWhName,
        toWhName,
        userId: req.user?.id
      });
    }

    await logActivity({
      db: req.db,
      userId: req.user?.id,
      action: initialStatus === 'In Transit' ? 'STOCK_TRANSFER_SHIPPED' : 'STOCK_TRANSFER_DRAFT',
      module: 'Stock Transfer',
      details: `Stock Transfer ${transferNo} (${initialStatus}) created for ${product.name} (${transferQty} ${product.unit || 'Pcs'}) from ${fromWhName} to ${toWhName}`
    });

    await createNotification({
      type: initialStatus === 'In Transit' ? 'Warning' : 'Info',
      title: initialStatus === 'In Transit' ? 'Stock Transfer In-Transit' : 'Stock Transfer Draft Created',
      message: `${transferQty} units of ${product.name} ${initialStatus === 'In Transit' ? 'shipped In-Transit' : 'drafted for transfer'} from ${fromWhName} to ${toWhName} (${transferNo}).`,
      priority: 'Medium',
      module: 'Stock Transfer'
    }, req.db);

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: initialStatus === 'In Transit'
        ? `Stock Transfer ${transferNo} initiated. ${transferQty} ${product.unit || 'Pcs'} shipped In-Transit from ${fromWhName} to ${toWhName}.`
        : `Stock Transfer draft ${transferNo} saved successfully.`,
      transferId: insRes.insertId,
      transferNo,
      status: initialStatus
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Ship a Draft Stock Transfer
// @route   POST /api/stock/transfer/:id/ship
// @access  Private
export const shipStockTransfer = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    const [transfers] = await connection.query('SELECT * FROM stock_transfers WHERE id = ? FOR UPDATE', [id]);
    if (transfers.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Stock Transfer record not found.' });
    }

    const transfer = transfers[0];
    if (transfer.status !== 'Draft') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: `Cannot ship transfer with status "${transfer.status}". Must be "Draft".` });
    }

    const transferQty = Number(transfer.quantity);

    // Fetch product details
    const [products] = await connection.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [transfer.product_id]);
    const product = products[0];

    // Check Source Stock
    const [srcStockRows] = await connection.query(
      'SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1 FOR UPDATE',
      [transfer.product_id, transfer.from_warehouse_id]
    );
    const srcAvailable = srcStockRows.length > 0 ? Number(srcStockRows[0].quantity || 0) : 0;

    if (transferQty > srcAvailable) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Validation Error: Transfer quantity (${transferQty}) exceeds available stock in ${transfer.from_warehouse_name} (${srcAvailable}).`
      });
    }

    let targetBatch = null;
    if (transfer.batch_id) {
      const [batches] = await connection.query('SELECT * FROM purchase_batches WHERE id = ? FOR UPDATE', [transfer.batch_id]);
      if (batches.length > 0) targetBatch = batches[0];
    }

    const unitCost = Number(transfer.unit_cost || product.purchase_price || 0);
    const totalValue = Number(transfer.total_value || (transferQty * unitCost).toFixed(2));

    // Process Outbound Deduction
    await processOutboundTransferDeduction({
      connection,
      product,
      from_warehouse_id: transfer.from_warehouse_id,
      transferQty,
      unitCost,
      totalValue,
      transferNo: transfer.transfer_no,
      srcAvailable,
      targetBatch,
      fromWhName: transfer.from_warehouse_name,
      toWhName: transfer.to_warehouse_name,
      userId: req.user?.id
    });

    // Update Status to In Transit
    await connection.query(`
      UPDATE stock_transfers
      SET status = 'In Transit', in_transit_quantity = ?, shipped_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `, [transferQty, id]);

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Stock Transfer ${transfer.transfer_no} shipped. Quantity is now In-Transit.`
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Receive an In-Transit Stock Transfer at Destination Warehouse
// @route   POST /api/stock/transfer/:id/receive
// @access  Private
export const receiveStockTransfer = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { remarks: receiveRemarks } = req.body;

    const [transfers] = await connection.query('SELECT * FROM stock_transfers WHERE id = ? FOR UPDATE', [id]);
    if (transfers.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Stock Transfer record not found.' });
    }

    const transfer = transfers[0];
    if (transfer.status !== 'In Transit') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: `Cannot receive transfer with status "${transfer.status}". Must be "In Transit".` });
    }

    const transferQty = Number(transfer.quantity);
    const unitCost = Number(transfer.unit_cost || 0);
    const totalValue = Number(transfer.total_value || (transferQty * unitCost).toFixed(2));

    // A. Add to Destination Warehouse stock table
    const [destStockRows] = await connection.query(
      'SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1 FOR UPDATE',
      [transfer.product_id, transfer.to_warehouse_id]
    );

    let prevDestQty = 0;
    let newDestQty = transferQty;

    if (destStockRows.length > 0) {
      prevDestQty = Number(destStockRows[0].quantity || 0);
      newDestQty = prevDestQty + transferQty;
      await connection.query('UPDATE stock SET quantity = ? WHERE id = ?', [newDestQty, destStockRows[0].id]);
    } else {
      await connection.query(
        'INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
        [transfer.product_id, transfer.to_warehouse_id, transferQty]
      );
    }

    // B. Create/Update Batch in Destination Warehouse
    const batchNoToUse = transfer.batch_no || 'DEFAULT';
    const [existingDestBatch] = await connection.query(
      'SELECT id, remaining_quantity FROM purchase_batches WHERE product_id = ? AND warehouse_id = ? AND batch_number = ? LIMIT 1 FOR UPDATE',
      [transfer.product_id, transfer.to_warehouse_id, batchNoToUse]
    );

    if (existingDestBatch.length > 0) {
      await connection.query(
        'UPDATE purchase_batches SET remaining_quantity = remaining_quantity + ? WHERE id = ?',
        [transferQty, existingDestBatch[0].id]
      );
    } else {
      let purchasePrice = unitCost;
      let mrp = 0;
      let sellingPrice = 0;
      let expiryDate = transfer.expiry_date || null;

      if (transfer.batch_id) {
        const [refBatch] = await connection.query('SELECT * FROM purchase_batches WHERE id = ?', [transfer.batch_id]);
        if (refBatch.length > 0) {
          purchasePrice = Number(refBatch[0].purchase_price || unitCost);
          mrp = Number(refBatch[0].mrp || 0);
          sellingPrice = Number(refBatch[0].selling_price || 0);
          expiryDate = refBatch[0].expiry_date || expiryDate;
        }
      }

      await connection.query(`
        INSERT INTO purchase_batches (
          product_id, warehouse_id, batch_number, purchase_quantity, remaining_quantity,
          purchase_date, expiry_date, purchase_price, mrp, selling_price, created_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_DATE(), ?, ?, ?, ?, NOW())
      `, [
        transfer.product_id, transfer.to_warehouse_id, batchNoToUse, transferQty, transferQty,
        expiryDate, purchasePrice, mrp, sellingPrice
      ]);
    }

    // C. Valuation Layer (Inbound Transfer In)
    await connection.query(`
      INSERT INTO inventory_valuation_layers (
        product_id, warehouse_id, batch_id, transaction_type, reference_no,
        quantity_delta, unit_cost, value_delta, previous_inventory_value,
        new_inventory_value, previous_quantity, new_quantity, accounting_treatment,
        created_by, created_at
      ) VALUES (?, ?, ?, 'Transfer In', ?, ?, ?, ?, 0, 0, ?, ?, 'Location Valuation Shift', ?, NOW())
    `, [
      transfer.product_id, transfer.to_warehouse_id, transfer.batch_id || null, transfer.transfer_no,
      transferQty, unitCost, totalValue, prevDestQty, newDestQty, req.user?.id || null
    ]);

    // D. Stock Logs (Inbound)
    await connection.query(`
      INSERT INTO stock_logs (
        product_id, warehouse_id, type, quantity, previous_quantity, new_quantity,
        reference_no, notes, user_id, created_at
      ) VALUES (?, ?, 'Transfer In', ?, ?, ?, ?, ?, ?, NOW())
    `, [
      transfer.product_id, transfer.to_warehouse_id, transferQty, prevDestQty, newDestQty, transfer.transfer_no,
      `TRANSFER_IN | Received from ${transfer.from_warehouse_name} | Unit Cost: ₹${unitCost} | Total Value: ₹${totalValue}`, req.user?.id || null
    ]);

    // E. Update Transfer Record Status
    const appendRemark = receiveRemarks && receiveRemarks.trim() !== '' ? ` | Received Notes: ${receiveRemarks.trim()}` : '';
    await connection.query(`
      UPDATE stock_transfers
      SET status = 'Completed', in_transit_quantity = 0, received_by = ?, received_by_name = ?, received_at = NOW(),
          remarks = CONCAT(COALESCE(remarks,''), ?)
      WHERE id = ?
    `, [req.user?.id || null, req.user?.name || 'Admin', appendRemark, id]);

    await logActivity({
      db: req.db,
      userId: req.user?.id,
      action: 'STOCK_TRANSFER_RECEIVED',
      module: 'Stock Transfer',
      details: `Stock Transfer ${transfer.transfer_no} received at ${transfer.to_warehouse_name} (${transferQty} ${transfer.unit || 'Pcs'})`
    });

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Stock Transfer ${transfer.transfer_no} successfully received at ${transfer.to_warehouse_name}. Stock updated.`
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Cancel a Stock Transfer (Restores In-Transit stock to Source Warehouse)
// @route   POST /api/stock/transfer/:id/cancel
// @access  Private
export const cancelStockTransfer = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { cancel_reason } = req.body;

    if (!cancel_reason || cancel_reason.trim() === '') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Validation Error: Cancellation reason is mandatory.' });
    }

    const [transfers] = await connection.query('SELECT * FROM stock_transfers WHERE id = ? FOR UPDATE', [id]);
    if (transfers.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Stock Transfer record not found.' });
    }

    const transfer = transfers[0];
    if (transfer.status === 'Completed' || transfer.status === 'Cancelled') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: `Cannot cancel transfer with status "${transfer.status}".` });
    }

    const transferQty = Number(transfer.quantity);

    // If status was 'In Transit', restore Source Warehouse stock & batch
    if (transfer.status === 'In Transit') {
      const [srcStock] = await connection.query(
        'SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1 FOR UPDATE',
        [transfer.product_id, transfer.from_warehouse_id]
      );
      const prevQty = srcStock.length > 0 ? Number(srcStock[0].quantity || 0) : 0;
      const newQty = prevQty + transferQty;

      if (srcStock.length > 0) {
        await connection.query('UPDATE stock SET quantity = ? WHERE id = ?', [newQty, srcStock[0].id]);
      } else {
        await connection.query('INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [transfer.product_id, transfer.from_warehouse_id, transferQty]);
      }

      if (transfer.batch_id) {
        await connection.query('UPDATE purchase_batches SET remaining_quantity = remaining_quantity + ? WHERE id = ?', [transferQty, transfer.batch_id]);
      } else {
        const [latestBatch] = await connection.query(
          'SELECT id FROM purchase_batches WHERE product_id = ? ORDER BY purchase_date DESC, id DESC LIMIT 1 FOR UPDATE',
          [transfer.product_id]
        );
        if (latestBatch.length > 0) {
          await connection.query('UPDATE purchase_batches SET remaining_quantity = remaining_quantity + ? WHERE id = ?', [transferQty, latestBatch[0].id]);
        }
      }

      await connection.query(`
        INSERT INTO inventory_valuation_layers (
          product_id, warehouse_id, batch_id, transaction_type, reference_no,
          quantity_delta, unit_cost, value_delta, previous_inventory_value,
          new_inventory_value, previous_quantity, new_quantity, accounting_treatment,
          created_by, created_at
        ) VALUES (?, ?, ?, 'Transfer Reversal', ?, ?, ?, ?, 0, 0, ?, ?, 'Transfer Cancellation', ?, NOW())
      `, [
        transfer.product_id, transfer.from_warehouse_id, transfer.batch_id || null, `${transfer.transfer_no}-CANCEL`,
        transferQty, transfer.unit_cost, transfer.total_value, prevQty, newQty, req.user?.id || null
      ]);

      await connection.query(`
        INSERT INTO stock_logs (
          product_id, warehouse_id, type, quantity, previous_quantity, new_quantity,
          reference_no, notes, user_id, created_at
        ) VALUES (?, ?, 'Transfer In', ?, ?, ?, ?, ?, ?, NOW())
      `, [
        transfer.product_id, transfer.from_warehouse_id, transferQty, prevQty, newQty, `${transfer.transfer_no}-CANCEL`,
        `RESTORE_TRANSFER | Restored from In-Transit | Reason: ${cancel_reason.trim()}`, req.user?.id || null
      ]);
    }

    await connection.query(`
      UPDATE stock_transfers SET status = 'Cancelled', in_transit_quantity = 0, cancel_reason = ?, updated_at = NOW() WHERE id = ?
    `, [cancel_reason.trim(), id]);

    await logActivity({
      db: req.db,
      userId: req.user?.id,
      action: 'STOCK_TRANSFER_CANCELLED',
      module: 'Stock Transfer',
      details: `Stock Transfer ${transfer.transfer_no} cancelled. Reason: ${cancel_reason.trim()}`
    });

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Stock Transfer ${transfer.transfer_no} cancelled. Stock restored to ${transfer.from_warehouse_name}.`
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// Helper: Outbound Transfer Deduction
async function processOutboundTransferDeduction({
  connection,
  product,
  from_warehouse_id,
  transferQty,
  unitCost,
  totalValue,
  transferNo,
  srcAvailable,
  targetBatch,
  fromWhName,
  toWhName,
  userId
}) {
  const newSrcQty = Math.max(0, srcAvailable - transferQty);
  await connection.query(
    'UPDATE stock SET quantity = ? WHERE product_id = ? AND warehouse_id = ?',
    [newSrcQty, product.id, from_warehouse_id]
  );

  if (targetBatch) {
    await connection.query(
      'UPDATE purchase_batches SET remaining_quantity = GREATEST(0, remaining_quantity - ?) WHERE id = ?',
      [transferQty, targetBatch.id]
    );
  } else {
    let remToDeduct = transferQty;
    const [activeBatches] = await connection.query(
      'SELECT id, remaining_quantity FROM purchase_batches WHERE product_id = ? AND remaining_quantity > 0 ORDER BY purchase_date ASC, id ASC FOR UPDATE',
      [product.id]
    );
    for (const b of activeBatches) {
      if (remToDeduct <= 0) break;
      const bRem = Number(b.remaining_quantity || 0);
      const dAmt = Math.min(remToDeduct, bRem);
      await connection.query('UPDATE purchase_batches SET remaining_quantity = remaining_quantity - ? WHERE id = ?', [dAmt, b.id]);
      remToDeduct -= dAmt;
    }
  }

  await connection.query(`
    INSERT INTO inventory_valuation_layers (
      product_id, warehouse_id, batch_id, transaction_type, reference_no,
      quantity_delta, unit_cost, value_delta, previous_inventory_value,
      new_inventory_value, previous_quantity, new_quantity, accounting_treatment,
      created_by, created_at
    ) VALUES (?, ?, ?, 'Transfer Out', ?, ?, ?, ?, 0, 0, ?, ?, 'Location Valuation Shift', ?, NOW())
  `, [
    product.id, from_warehouse_id, targetBatch ? targetBatch.id : null, transferNo,
    -transferQty, unitCost, -totalValue, srcAvailable, newSrcQty, userId || null
  ]);

  await connection.query(`
    INSERT INTO stock_logs (
      product_id, warehouse_id, type, quantity, previous_quantity, new_quantity,
      reference_no, notes, user_id, created_at
    ) VALUES (?, ?, 'Transfer Out', ?, ?, ?, ?, ?, ?, NOW())
  `, [
    product.id, from_warehouse_id, -transferQty, srcAvailable, newSrcQty, transferNo,
    `TRANSFER_OUT | Shipped to ${toWhName} | Unit Cost: ₹${unitCost} | Total Value: ₹${totalValue}`, userId || null
  ]);
}
