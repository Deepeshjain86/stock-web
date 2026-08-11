import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../services/notificationService.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: safe console log with prefix
// ─────────────────────────────────────────────────────────────────────────────
const log = (step, msg, data = '') =>
  console.log(`[VendorReturn][${step}] ${msg}`, data !== '' ? data : '');

const errLog = (step, msg, err) =>
  console.error(`[VendorReturn][ERROR][${step}] ${msg}`, err?.message || err, err?.code || '');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all vendor stock returns (filtered by vendor, status, or search)
// @route   GET /api/vendor-returns
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getVendorReturns = async (req, res, next) => {
  try {
    const { vendor_id, status, search, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT pr.*, 
             p.name as product_name, p.barcode, p.unit, p.sku,
             v.name as vendor_name, v.company_name as vendor_company, v.supplier_code,
             w.name as warehouse_name
      FROM purchase_returns pr
      JOIN products p ON pr.product_id = p.id
      JOIN vendors v ON pr.vendor_id = v.id
      LEFT JOIN warehouses w ON pr.warehouse_id = w.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (vendor_id) {
      query += ' AND pr.vendor_id = ?';
      queryParams.push(Number(vendor_id));
    }

    if (status && status !== 'all') {
      query += ' AND pr.status = ?';
      queryParams.push(status);
    }

    if (search && search.trim() !== '') {
      query += ' AND (pr.return_no LIKE ? OR pr.purchase_no LIKE ? OR p.name LIKE ? OR v.name LIKE ?)';
      const s = `%${search.trim()}%`;
      queryParams.push(s, s, s, s);
    }

    query += ' ORDER BY pr.created_at DESC, pr.id DESC LIMIT ? OFFSET ?';
    queryParams.push(Number(limit), Number(offset));

    const [returns] = await req.db.query(query, queryParams);
    return res.status(200).json({ success: true, count: returns.length, returns });
  } catch (error) {
    errLog('getVendorReturns', 'Failed to fetch vendor returns', error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get products that were purchased from a specific vendor
// @route   GET /api/vendor-returns/products-purchased?vendor_id=X
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getProductsPurchasedByVendor = async (req, res, next) => {
  try {
    const { vendor_id } = req.query;
    if (!vendor_id) {
      return res.status(400).json({ success: false, message: 'vendor_id query parameter is required' });
    }

    const [products] = await req.db.query(
      `SELECT DISTINCT p.id, p.name, p.sku, p.barcode, p.unit, p.purchase_price, p.gst,
              COALESCE(s.quantity, 0) as current_stock
       FROM purchase_items pi
       JOIN purchases pu ON pi.purchase_id = pu.id
       JOIN products p   ON pi.product_id  = p.id
       LEFT JOIN stock s ON s.product_id   = p.id
       WHERE pu.vendor_id = ?
       ORDER BY p.name ASC`,
      [Number(vendor_id)]
    );

    return res.status(200).json({ success: true, products });
  } catch (error) {
    errLog('getProductsPurchasedByVendor', 'Failed to fetch vendor products', error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get purchase invoices for a specific vendor + product combination
// @route   GET /api/vendor-returns/purchases-by-product?vendor_id=X&product_id=Y
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getPurchasesForVendorProduct = async (req, res, next) => {
  try {
    const { vendor_id, product_id } = req.query;
    if (!vendor_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'Both vendor_id and product_id query parameters are required'
      });
    }

    // Fetch current physical stock for the product
    const [stockRec] = await req.db.query(
      'SELECT COALESCE(SUM(quantity), 0) as currentStock FROM stock WHERE product_id = ?',
      [Number(product_id)]
    );
    const currentStock = Number(stockRec[0]?.currentStock || 0);

    const [purchases] = await req.db.query(
      `SELECT pu.id as purchaseId, pu.purchase_no, pu.date, pu.payment_status,
              pi.purchase_price as purchasePrice, pi.quantity as purchasedQuantity,
              pi.gst,
              COALESCE((
                SELECT SUM(pr.quantity)
                FROM purchase_returns pr
                WHERE pr.purchase_id = pu.id
                  AND pr.product_id  = pi.product_id
                  AND pr.status != 'Void'
              ), 0) as returnedQuantity
       FROM purchase_items pi
       JOIN purchases pu ON pi.purchase_id = pu.id
       WHERE pu.vendor_id  = ?
         AND pi.product_id = ?
       ORDER BY pu.date DESC`,
      [Number(vendor_id), Number(product_id)]
    );

    const mappedPurchases = purchases.map(p => {
      const purchasedQty = Number(p.purchasedQuantity || 0);
      const returnedQty = Number(p.returnedQuantity || 0);
      const netPurchased = Math.max(0, purchasedQty - returnedQty);
      // Available return quantity cannot exceed physical stock in hand!
      const availableReturnQuantity = Math.max(0, Math.min(netPurchased, currentStock));
      return {
        ...p,
        availableReturnQuantity
      };
    });

    return res.status(200).json({ success: true, purchases: mappedPurchases, currentStock });
  } catch (error) {
    errLog('getPurchasesForVendorProduct', 'Failed to fetch purchase records for product', error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get available stock for a vendor/product pair
// @route   GET /api/vendor-returns/available-stock?vendor_id=X&product_id=Y
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getAvailableReturnStock = async (req, res, next) => {
  try {
    const { vendor_id, product_id } = req.query;
    if (!vendor_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'vendor_id and product_id are required'
      });
    }

    const [stock] = await req.db.query(
      'SELECT COALESCE(SUM(quantity), 0) as available FROM stock WHERE product_id = ?',
      [Number(product_id)]
    );

    const [purchases] = await req.db.query(
      `SELECT COALESCE(SUM(pi.quantity), 0) as totalPurchased
       FROM purchase_items pi
       JOIN purchases pu ON pi.purchase_id = pu.id
       WHERE pu.vendor_id = ? AND pi.product_id = ?`,
      [Number(vendor_id), Number(product_id)]
    );

    const [returned] = await req.db.query(
      `SELECT COALESCE(SUM(quantity), 0) as totalReturned
       FROM purchase_returns
       WHERE vendor_id = ? AND product_id = ? AND status != 'Void'`,
      [Number(vendor_id), Number(product_id)]
    );

    const availableStock = Number(stock[0]?.available || 0);
    const totalPurchased = Number(purchases[0]?.totalPurchased || 0);
    const totalReturned = Number(returned[0]?.totalReturned || 0);
    // Capped by physical stock in hand!
    const maxReturnable = Math.max(0, Math.min(totalPurchased - totalReturned, availableStock));

    return res.status(200).json({
      success: true,
      availableStock: availableStock,
      maxReturnableQty: maxReturnable,
      totalPurchased,
      totalReturned
    });
  } catch (error) {
    errLog('getAvailableReturnStock', 'Failed to fetch available return stock', error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get Supplier Ledger analytics for a given vendor
// @route   GET /api/vendor-returns/ledger/:vendorId
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getSupplierLedger = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'vendorId param is required' });
    }

    const vid = Number(vendorId);

    // Vendor basic info
    const [vendorRows] = await req.db.query('SELECT * FROM vendors WHERE id = ?', [vid]);
    if (vendorRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    const vendor = vendorRows[0];

    // Totals
    const [purchasesSum] = await req.db.query(
      'SELECT COALESCE(SUM(total), 0) as total FROM purchases WHERE vendor_id = ?', [vid]
    );
    const [returnsSum] = await req.db.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_returns WHERE vendor_id = ? AND status != 'Void'", [vid]
    );
    const [paymentsSum] = await req.db.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM supplier_payments WHERE vendor_id = ?', [vid]
    );

    const grossPurchases = Number(purchasesSum[0].total);
    const totalReturns = Number(returnsSum[0].total);
    const totalPaid = Number(paymentsSum[0].total);
    const netObligations = Math.max(0, grossPurchases - totalReturns);
    const openingBal = vendor.opening_balance_type === 'Advance'
      ? -Number(vendor.opening_balance || 0)
      : Number(vendor.opening_balance || 0);
    const diff = netObligations + openingBal - totalPaid;
    const outstandingBalance = diff > 0 ? Number(diff.toFixed(2)) : 0;
    const advanceBalance = diff < 0 ? Number(Math.abs(diff).toFixed(2)) : 0;

    const analytics = {
      vendorId: vid,
      vendorName: vendor.name,
      companyName: vendor.company_name,
      grossPurchases: Number(grossPurchases.toFixed(2)),
      totalReturns: Number(totalReturns.toFixed(2)),
      netPurchases: Number(netObligations.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      outstandingBalance,
      advanceBalance,
      openingBalance: Number(vendor.opening_balance || 0),
      openingBalanceType: vendor.opening_balance_type || 'Debit'
    };

    // Return history for this vendor
    const [history] = await req.db.query(
      `SELECT pr.*, p.name as product_name
       FROM purchase_returns pr
       JOIN products p ON pr.product_id = p.id
       WHERE pr.vendor_id = ?
       ORDER BY pr.created_at DESC`,
      [vid]
    );

    return res.status(200).json({ success: true, analytics, history });
  } catch (error) {
    errLog('getSupplierLedger', 'Failed to fetch supplier ledger', error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update vendor return note status
// @route   PUT /api/vendor-returns/:id/status
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const updateVendorReturnStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = [
      'Pending', 'Sent to Vendor', 'Acknowledged', 'Refund Received', 'Replacement Received', 'Closed', 'Void'
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const [existing] = await req.db.query(
      'SELECT id, return_no, status FROM purchase_returns WHERE id = ?', [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Return note not found' });
    }

    await req.db.query(
      'UPDATE purchase_returns SET status = ? WHERE id = ?',
      [status, id]
    );

    // Record status history if the table exists
    try {
      await req.db.query(
        `INSERT INTO purchase_return_status_history (purchase_return_id, status, user_name, notes)
         VALUES (?, ?, ?, ?)`,
        [id, status, req.user?.name || 'System', notes || null]
      );
    } catch (histErr) {
      // Non-fatal: status history table might not exist in older deployments
      log('updateStatus', 'Warning: Could not insert status history (table may not exist)', histErr.message);
    }

    log('updateStatus', `Return note ${existing[0].return_no} status updated to "${status}"`);

    return res.status(200).json({
      success: true,
      message: `Return note status updated to "${status}" successfully`
    });
  } catch (error) {
    errLog('updateVendorReturnStatus', 'Failed to update status', error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create Vendor Purchase Return Note (full transaction)
// @route   POST /api/vendor-returns
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const createVendorReturn = async (req, res, next) => {
  const connection = await req.db.getConnection();
  log('createVendorReturn', 'Starting vendor return creation. Payload:', JSON.stringify(req.body));

  try {
    await connection.beginTransaction();
    log('createVendorReturn', 'Transaction started');

    const {
      vendor_id,
      purchase_id,
      product_id,
      quantity,
      items, // array of { product_id, quantity, return_price }
      reason,
      return_type = 'Refund',
      remarks = '',
      batch_number,
      expiry_date,
      image_url
    } = req.body;

    const tenantId = req.tenantId;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!vendor_id) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Required field missing: vendor_id' });
    }
    if (!reason) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Required field missing: reason for return' });
    }

    // Verify vendor exists
    const [vendorCheck] = await connection.query('SELECT id, name FROM vendors WHERE id = ?', [Number(vendor_id)]);
    if (vendorCheck.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: `Supplier not found for vendor_id: ${vendor_id}` });
    }
    const vendorName = vendorCheck[0].name;
    log('createVendorReturn', `Supplier verified: ${vendorName} (id=${vendor_id})`);

    // Build process items list
    let processItems = [];
    if (Array.isArray(items) && items.length > 0) {
      processItems = items.map(i => ({
        product_id: Number(i.product_id),
        quantity: Number(i.quantity),
        return_price: i.return_price ? Number(i.return_price) : null
      }));
    } else if (product_id && Number(quantity) > 0) {
      processItems = [{
        product_id: Number(product_id),
        quantity: Number(quantity),
        return_price: req.body.return_price ? Number(req.body.return_price) : null
      }];
    }

    if (processItems.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Please select at least one valid product with a return quantity greater than 0'
      });
    }

    log('createVendorReturn', `Processing ${processItems.length} item(s)`);

    // ── Generate unique PRN Return Note number safely
    const [allPRNs] = await connection.query('SELECT return_no FROM purchase_returns WHERE return_no LIKE ?', ['PRN-%']);
    let maxSeq = 0;
    for (const row of allPRNs) {
      const parts = row.return_no.split('-');
      const seq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
    const vrnNo = `PRN-${String(maxSeq + 1).padStart(5, '0')}`;
    log('createVendorReturn', `Generated VRN: ${vrnNo}`);

    // ── Fetch purchase_no if purchase_id supplied ────────────────────────────
    let purchaseNo = null;
    if (purchase_id) {
      const [purchInfo] = await connection.query(
        'SELECT purchase_no FROM purchases WHERE id = ?', [Number(purchase_id)]
      );
      if (purchInfo.length > 0) {
        purchaseNo = purchInfo[0].purchase_no;
        log('createVendorReturn', `Linked to purchase invoice: ${purchaseNo}`);
      } else {
        log('createVendorReturn', `Warning: purchase_id=${purchase_id} not found – continuing without invoice link`);
      }
    }

    let totalReturnVal = 0;
    let createdReturnId = null;

    // ── Process each return item ─────────────────────────────────────────────
    for (const [idx, item] of processItems.entries()) {
      const pId = item.product_id;
      const retQty = item.quantity;
      log('createVendorReturn', `Item ${idx + 1}/${processItems.length}: product_id=${pId}, qty=${retQty}`);

      // Validate product exists
      const [productCheck] = await connection.query('SELECT id, name, purchase_price FROM products WHERE id = ?', [pId]);
      if (productCheck.length === 0) {
        throw new Error(`Product not found for product_id: ${pId}. Please select a valid product.`);
      }
      log('createVendorReturn', `Product verified: ${productCheck[0].name}`);

      // Determine return unit price
      let unitPrice = item.return_price || 0;
      if (!unitPrice && purchase_id) {
        const [piCheck] = await connection.query(
          'SELECT purchase_price FROM purchase_items WHERE purchase_id = ? AND product_id = ?',
          [Number(purchase_id), pId]
        );
        if (piCheck.length > 0) {
          unitPrice = Number(piCheck[0].purchase_price);
          log('createVendorReturn', `Unit price from purchase invoice: ₹${unitPrice}`);
        }
      }
      if (!unitPrice) {
        unitPrice = Number(productCheck[0].purchase_price || 0);
        log('createVendorReturn', `Unit price from product master: ₹${unitPrice}`);
      }

      const itemTotal = unitPrice * retQty;
      totalReturnVal += itemTotal;
      log('createVendorReturn', `Item total: ₹${itemTotal} | Running total: ₹${totalReturnVal}`);

      // ── Step 1: Fetch warehouse for this product's stock ─────────────────
      const [stockRec] = await connection.query(
        'SELECT id, warehouse_id, quantity FROM stock WHERE product_id = ? ORDER BY id LIMIT 1',
        [pId]
      );
      const targetWarehouseId = stockRec.length > 0 ? stockRec[0].warehouse_id : null;
      const currentStockQty = stockRec.length > 0 ? Number(stockRec[0].quantity || 0) : 0;

      if (!targetWarehouseId) {
        throw new Error(
          `No stock record found for product_id=${pId}. Cannot determine warehouse. ` +
          `Ensure stock has been received before processing a return.`
        );
      }

      if (retQty > currentStockQty) {
        throw new Error(
          `Cannot return ${retQty} units of "${productCheck[0].name}". Only ${currentStockQty} units are currently present in physical stock.`
        );
      }
      log('createVendorReturn', `Target warehouse_id: ${targetWarehouseId}, Current stock: ${currentStockQty}`);

      // ── Step 2: Deduct Stock ─────────────────────────────────────────────
      log('createVendorReturn', `Deducting ${retQty} units from stock (product=${pId}, warehouse=${targetWarehouseId})`);
      await connection.query(
        'UPDATE stock SET quantity = GREATEST(0, quantity - ?) WHERE product_id = ? AND warehouse_id = ?',
        [retQty, pId, targetWarehouseId]
      );

      // ── Step 2b: Deduct Stock in purchase_batches table (so Products Page total_stock updates!) ──
      try {
        await connection.query(
          `UPDATE purchase_batches 
           SET remaining_quantity = GREATEST(0, remaining_quantity - ?) 
           WHERE product_id = ? AND (supplier_id = ? OR purchase_id = ?) AND remaining_quantity > 0 
           ORDER BY id DESC LIMIT 1`,
          [retQty, pId, Number(vendor_id), purchase_id ? Number(purchase_id) : 0]
        );
      } catch (pbErr) {
        log('createVendorReturn', 'Warning: Could not update purchase_batches', pbErr.message);
      }

      // ── Step 3: Log Stock Movement ────────────────────────────────────────
      log('createVendorReturn', 'Inserting stock_logs entry');
      await connection.query(
        `INSERT INTO stock_logs (product_id, warehouse_id, vendor_id, type, quantity, reference_no, notes, user_id)
         VALUES (?, ?, ?, 'Stock Out', ?, ?, ?, ?)`,
        [
          pId,
          targetWarehouseId,
          Number(vendor_id),
          -Math.abs(retQty),
          vrnNo,
          `Supplier Return (${return_type}): ${reason}`,
          req.user.id || null
        ]
      );
      log('createVendorReturn', 'Stock log inserted successfully');

      // ── Step 4: Insert purchase_returns row ───────────────────────────────
      log('createVendorReturn', 'Inserting purchase_returns record');
      const [insertRes] = await connection.query(
        `INSERT INTO purchase_returns (
          purchase_id, purchase_no, vendor_id, product_id, warehouse_id,
          quantity, return_price, total_amount, reason, return_no,
          return_type, remarks, batch_number, expiry_date, image_url, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Approved')`,
        [
          purchase_id ? Number(purchase_id) : null,
          purchaseNo || null,
          Number(vendor_id),
          pId,
          targetWarehouseId,
          retQty,
          unitPrice,
          itemTotal,
          reason,
          vrnNo,
          return_type,
          remarks || null,
          batch_number || null,
          expiry_date || null,
          image_url || null
        ]
      );
      log('createVendorReturn', `purchase_returns row inserted. insertId=${insertRes.insertId}`);

      if (!createdReturnId) {
        createdReturnId = insertRes.insertId;
      }
    }

    // ── Step 5: Update Vendor Financial Balance (Single Source of Truth) ──────────────────────
    log('createVendorReturn', `Updating vendor balance. totalReturnVal=₹${totalReturnVal}`);
    const [invSumSync] = await connection.query('SELECT COALESCE(SUM(total), 0) as total FROM purchases WHERE vendor_id = ? AND payment_status != "Void"', [Number(vendor_id)]);
    const [retSumSync] = await connection.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_returns WHERE vendor_id = ? AND status != "Void"', [Number(vendor_id)]);
    const [paySumSync] = await connection.query('SELECT COALESCE(SUM(amount), 0) as total FROM supplier_payments WHERE vendor_id = ?', [Number(vendor_id)]);
    const [vRowSync] = await connection.query('SELECT opening_balance, opening_balance_type FROM vendors WHERE id = ?', [Number(vendor_id)]);

    if (vRowSync.length > 0) {
      const grossPSync = Number(invSumSync[0].total || 0);
      const retPSync = Number(retSumSync[0].total || 0);
      const netPSync = Math.max(0, grossPSync - retPSync);
      const openBSync = vRowSync[0].opening_balance_type === 'Advance' ? -Number(vRowSync[0].opening_balance || 0) : Number(vRowSync[0].opening_balance || 0);
      const totPaidSync = Number(paySumSync[0].total || 0);

      const diffSync = (netPSync + openBSync) - totPaidSync;
      const newOut = Math.max(0, diffSync);

      await connection.query(
        'UPDATE vendors SET total_purchases = ?, total_paid = ?, outstanding_balance = ? WHERE id = ?',
        [grossPSync, totPaidSync, newOut, Number(vendor_id)]
      );
    }
    log('createVendorReturn', 'Vendor balance updated');

    // ── Commit Transaction ────────────────────────────────────────────────────
    await connection.commit();
    log('createVendorReturn', `Transaction COMMITTED successfully. VRN: ${vrnNo}`);

    // ── Post-commit: Activity Log & Notification (non-fatal) ─────────────────
    try {
      await logActivity(
        req.user.id,
        'Process Purchase Return',
        'Stock',
        `Processed purchase return ${vrnNo} for supplier "${vendorName}" (ID: ${vendor_id}) — Return Value: ₹${totalReturnVal.toFixed(2)}`,
        req.ip
      );
    } catch (actErr) {
      log('createVendorReturn', 'Warning: Activity logging failed (non-fatal)', actErr.message);
    }

    try {
      await createNotification({
        type: 'Stock Return',
        title: 'Purchase Return Note Posted',
        message: `Purchase Return Note "${vrnNo}" created for supplier "${vendorName}" (Value: ₹${totalReturnVal.toFixed(2)}).`,
        priority: 'Medium',
        related_user: req.user.email,
        related_module: 'Returns',
        target_roles: 'Admin,Manager,Staff'
      }, req.db);
    } catch (notifErr) {
      log('createVendorReturn', 'Warning: Notification creation failed (non-fatal)', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Vendor return note ${vrnNo} posted successfully. Stock updated and supplier balance adjusted.`,
      vrn: vrnNo,
      returnId: createdReturnId,
      totalAmount: Number(totalReturnVal.toFixed(2))
    });

  } catch (error) {
    errLog('createVendorReturn', 'Error — rolling back transaction', error);
    try {
      await connection.rollback();
      log('createVendorReturn', 'Transaction rolled back');
    } catch (rbErr) {
      errLog('createVendorReturn', 'Failed to rollback transaction', rbErr);
    }

    // Pass a descriptive error to the global error handler
    const detailedError = new Error(
      `Vendor return failed: ${error.message}` +
      (error.code ? ` [DB Code: ${error.code}]` : '')
    );
    detailedError.status = error.status || 500;
    detailedError.code = error.code;
    detailedError.originalError = error.message;
    next(detailedError);
  } finally {
    try { connection.release(); } catch (_) {}
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete (Void) a vendor return note and reverse all changes
// @route   DELETE /api/vendor-returns/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const deleteVendorReturn = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const [returnRows] = await connection.query(
      'SELECT * FROM purchase_returns WHERE id = ?', [id]
    );

    if (returnRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Return note not found' });
    }

    const ret = returnRows[0];

    if (ret.status === 'Void') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'This return note has already been voided' });
    }

    log('deleteVendorReturn', `Voiding return note ${ret.return_no} (id=${id})`);

    // Restore stock
    await connection.query(
      'UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse_id = ?',
      [ret.quantity, ret.product_id, ret.warehouse_id]
    );

    try {
      if (ret.purchase_id) {
        await connection.query(
          'UPDATE purchase_batches SET remaining_quantity = remaining_quantity + ? WHERE purchase_id = ? AND product_id = ?',
          [ret.quantity, ret.purchase_id, ret.product_id]
        );
      } else {
        await connection.query(
          'UPDATE purchase_batches SET remaining_quantity = remaining_quantity + ? WHERE product_id = ? ORDER BY id DESC LIMIT 1',
          [ret.quantity, ret.product_id]
        );
      }
    } catch (pbErr) {}

    // Mark return as Void
    await connection.query('UPDATE purchase_returns SET status = ? WHERE id = ?', ['Void', id]);

    // Recalculate vendor financial balance (Single Source of Truth)
    const [invSumSync] = await connection.query('SELECT COALESCE(SUM(total), 0) as total FROM purchases WHERE vendor_id = ? AND payment_status != "Void"', [Number(ret.vendor_id)]);
    const [retSumSync] = await connection.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_returns WHERE vendor_id = ? AND status != "Void"', [Number(ret.vendor_id)]);
    const [paySumSync] = await connection.query('SELECT COALESCE(SUM(amount), 0) as total FROM supplier_payments WHERE vendor_id = ?', [Number(ret.vendor_id)]);
    const [vRowSync] = await connection.query('SELECT opening_balance, opening_balance_type FROM vendors WHERE id = ?', [Number(ret.vendor_id)]);

    if (vRowSync.length > 0) {
      const grossPSync = Number(invSumSync[0].total || 0);
      const retPSync = Number(retSumSync[0].total || 0);
      const netPSync = Math.max(0, grossPSync - retPSync);
      const openBSync = vRowSync[0].opening_balance_type === 'Advance' ? -Number(vRowSync[0].opening_balance || 0) : Number(vRowSync[0].opening_balance || 0);
      const totPaidSync = Number(paySumSync[0].total || 0);

      const diffSync = (netPSync + openBSync) - totPaidSync;
      const newOut = Math.max(0, diffSync);

      await connection.query(
        'UPDATE vendors SET total_purchases = ?, total_paid = ?, outstanding_balance = ? WHERE id = ?',
        [grossPSync, totPaidSync, newOut, Number(ret.vendor_id)]
      );
    }

    // Log stock reversal
    await connection.query(
      `INSERT INTO stock_logs (product_id, warehouse_id, vendor_id, type, quantity, reference_no, notes, user_id)
       VALUES (?, ?, ?, 'Stock In', ?, ?, ?, ?)`,
      [
        ret.product_id,
        ret.warehouse_id,
        ret.vendor_id,
        ret.quantity,
        `VOID-${ret.return_no}`,
        `Voided Supplier Return: ${ret.reason}`,
        req.user.id || null
      ]
    );

    await connection.commit();
    log('deleteVendorReturn', `Return note ${ret.return_no} voided successfully`);

    return res.status(200).json({
      success: true,
      message: `Return note ${ret.return_no} voided. Stock restored and supplier balance updated.`
    });

  } catch (error) {
    errLog('deleteVendorReturn', 'Error voiding return note — rolling back', error);
    try { await connection.rollback(); } catch (_) {}
    next(error);
  } finally {
    try { connection.release(); } catch (_) {}
  }
};
