import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../services/notificationService.js';
import { syncProductFifoState } from '../utils/fifoQueueHelper.js';

// @desc    Get all sales invoices for authenticated tenant
// @route   GET /api/sales
// @access  Private
export const getSales = async (req, res, next) => {
  try {
    const { search, customerId, customer_id, paymentStatus, startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT s.*, 
             c.name as customer_name, c.phone as customer_phone, c.customer_type,
             w.name as warehouse_name, u.name as billing_user_name,
             (SELECT GROUP_CONCAT(CONCAT(p.name, ' (x', si.quantity, ')') SEPARATOR ', ')
              FROM sale_items si
              JOIN products p ON si.product_id = p.id
              WHERE si.sale_id = s.id) as product_summary,
             (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE sale_id = s.id) as total_items
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN warehouses w ON s.warehouse_id = w.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (search) {
      query += ' AND (s.invoice_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)';
      const searchVal = `%${search}%`;
      queryParams.push(searchVal, searchVal, searchVal);
    }

    const targetCustId = customerId || customer_id;
    if (targetCustId) {
      query += ' AND s.customer_id = ?';
      queryParams.push(targetCustId);
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query += ' AND s.payment_status = ?';
      queryParams.push(paymentStatus);
    }

    if (startDate) {
      query += ' AND s.date >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ' AND s.date <= ?';
      queryParams.push(endDate);
    }

    query += ' ORDER BY s.id DESC LIMIT ? OFFSET ?';
    queryParams.push(Number(limit), Number(offset));

    const [sales] = await req.db.query(query, queryParams);

    let salePaymentsMap = new Map();
    if (sales.length > 0) {
      const saleIds = sales.map(s => s.id);
      try {
        const [pRows] = await req.db.query(
          `SELECT sale_id, payment_method, amount, reference_no, notes FROM sale_payments WHERE sale_id IN (?)`,
          [saleIds]
        );
        for (const pr of pRows) {
          if (!salePaymentsMap.has(pr.sale_id)) {
            salePaymentsMap.set(pr.sale_id, []);
          }
          salePaymentsMap.get(pr.sale_id).push({
            paymentMethod: pr.payment_method,
            amount: Number(pr.amount),
            referenceNo: pr.reference_no,
            notes: pr.notes
          });
        }
      } catch (e) {}
    }

    const formattedSales = sales.map((s) => ({
      id: s.id,
      invoiceNo: s.invoice_no,
      customerId: s.customer_id,
      customerName: s.customer_name || 'Walk-in Customer',
      customerPhone: s.customer_phone || '',
      customerType: s.customer_type || 'Walk-in',
      warehouseId: s.warehouse_id,
      warehouseName: s.warehouse_name || 'Main Storage',
      billingUser: s.billing_user_name || 'Counter Operator',
      date: s.date ? new Date(s.date).toISOString().split('T')[0] : '',
      subtotal: Number(s.subtotal || 0),
      discount: Number(s.discount || 0),
      gstAmount: Number(s.gst_amount || 0),
      total: Number(s.total || 0),
      amountPaid: Number(s.amount_paid || 0),
      dueAmount: Number(s.due_amount || 0),
      paymentStatus: s.payment_status,
      paymentMethod: s.payment_method,
      payments: salePaymentsMap.get(s.id) || [{ paymentMethod: s.payment_method || 'Cash', amount: Number(s.amount_paid || 0) }],
      productSummary: s.product_summary || 'General items',
      totalItems: Number(s.total_items || 0),
      createdAt: s.created_at
    }));

    return res.status(200).json({ success: true, count: formattedSales.length, sales: formattedSales });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single sale detail with item lines
// @route   GET /api/sales/:id
// @access  Private
export const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [sales] = await req.db.query(`
      SELECT s.*, 
             c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address, c.customer_type,
             w.name as warehouse_name, u.name as billing_user_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN warehouses w ON s.warehouse_id = w.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (sales.length === 0) {
      return res.status(404).json({ success: false, message: 'Sales invoice record not found' });
    }

    const sale = sales[0];

    const [items] = await req.db.query(`
      SELECT si.*, p.name as product_name, p.barcode, p.unit, p.sku, p.mrp as master_mrp,
             COALESCE((SELECT SUM(quantity) FROM sales_returns WHERE sale_id = si.sale_id AND product_id = si.product_id), 0) as returnedQuantity
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, [id]);

    let paymentsList = [];
    try {
      const [pRows] = await req.db.query(
        'SELECT payment_method as paymentMethod, amount, reference_no as referenceNo, notes FROM sale_payments WHERE sale_id = ?',
        [id]
      );
      paymentsList = pRows.map(p => ({
        paymentMethod: p.paymentMethod,
        amount: Number(p.amount),
        referenceNo: p.referenceNo,
        notes: p.notes
      }));
    } catch (e) {}

    if (paymentsList.length === 0) {
      paymentsList = [{ paymentMethod: sale.payment_method || 'Cash', amount: Number(sale.amount_paid || 0) }];
    }

    const formattedSale = {
      id: sale.id,
      invoiceNo: sale.invoice_no,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Walk-in Customer',
      customerPhone: sale.customer_phone || '',
      customerEmail: sale.customer_email || '',
      customerAddress: sale.customer_address || '',
      customerType: sale.customer_type || 'Walk-in',
      warehouseId: sale.warehouse_id,
      warehouseName: sale.warehouse_name || 'Main Storage',
      billingUser: sale.billing_user_name || 'Counter Operator',
      date: sale.date ? new Date(sale.date).toISOString().split('T')[0] : '',
      subtotal: Number(sale.subtotal || 0),
      discount: Number(sale.discount || 0),
      gstAmount: Number(sale.gst_amount || 0),
      total: Number(sale.total || 0),
      amountPaid: Number(sale.amount_paid || 0),
      dueAmount: Number(sale.due_amount || 0),
      paymentStatus: sale.payment_status,
      paymentMethod: sale.payment_method,
      payments: paymentsList,
      createdAt: sale.created_at,
      items: items.map(i => ({
        id: i.id,
        productId: i.product_id,
        productName: i.product_name,
        barcode: i.barcode,
        sku: i.sku,
        unit: i.unit || 'Pcs',
        quantity: Number(i.quantity),
        sellingPrice: Number(i.selling_price),
        mrp: Number(i.mrp || i.master_mrp || 0),
        batchNumber: i.batch_number || 'DEFAULT',
        gst: Number(i.gst),
        total: Number(i.total),
        returnedQuantity: Number(i.returnedQuantity)
      }))
    };

    return res.status(200).json({ success: true, sale: formattedSale });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Sales Invoice (POS Billing) with FIFO stock deduction & Split Payments
// @route   POST /api/sales
// @access  Private
export const createSale = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      customerId = 1,
      customerType = 'Walk-in',
      customerName = '',
      customerPhone = '',
      dueDate,
      amountPaid = 0,
      warehouseId = 1,
      date,
      subtotal,
      discount,
      gstAmount,
      total,
      paymentStatus = 'Paid',
      paymentMethod = 'Cash',
      payments = [],
      items
    } = req.body;

    if (!items || items.length === 0 || !date) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Missing billing details or products list' });
    }

    console.log(`[Sales] Creating invoice. Items: ${items.length}, Warehouse: ${warehouseId}`);

    // ── Pre-flight stock validation across stock table ─────────────────────
    for (const item of items) {
      const pId = Number(item.productId || item.product_id);
      const qtyNeeded = Number(item.quantity);

      if (!pId || qtyNeeded <= 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ success: false, message: 'Invalid product or quantity in cart items' });
      }

      const [stockCheck] = await connection.query(
        'SELECT COALESCE(SUM(quantity), 0) as available FROM stock WHERE product_id = ? AND warehouse_id = ?',
        [pId, Number(warehouseId)]
      );
      const availableQty = Number(stockCheck[0]?.available ?? 0);

      if (availableQty < qtyNeeded) {
        const [prodInfo] = await connection.query('SELECT name, unit FROM products WHERE id = ?', [pId]);
        const prodName = prodInfo[0]?.name || `Product #${pId}`;
        console.warn(`[Sales][StockValidation] FAIL — ${prodName} (id:${pId}): need ${qtyNeeded}, have ${availableQty}`);
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${prodName}". Available: ${availableQty} ${prodInfo[0]?.unit || 'Pcs'}, Requested: ${qtyNeeded}`
        });
      }
    }

    let finalCustomerId = Number(customerId || 1);

    // Walk-in Customer Auto Registration if custom name provided
    if (customerType === 'Walk-in' && customerName && customerName !== 'Walk-in Customer') {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      const expiresAt = d.toISOString().slice(0, 19).replace('T', ' ');

      const [newCustResult] = await connection.query(
        `INSERT INTO customers (name, phone, customer_type, status, created_by, expires_at)
         VALUES (?, ?, 'Walk-in', 'Active', ?, ?)`,
        [customerName, customerPhone || null, req.user.id, expiresAt]
      );

      finalCustomerId = newCustResult.insertId;
      const code = `CUST-${String(finalCustomerId).padStart(5, '0')}`;
      await connection.query('UPDATE customers SET customer_code = ? WHERE id = ?', [code, finalCustomerId]);
    }

    // ── Generate Unique Invoice Number (Collision Free) ───────────────────────
    let invoiceNo = req.body.invoiceNo;
    if (invoiceNo) {
      const [existingInv] = await connection.query('SELECT id FROM sales WHERE invoice_no = ?', [invoiceNo]);
      if (existingInv.length > 0) {
        invoiceNo = null; // force generation of a new unique invoice number
      }
    }

    if (!invoiceNo) {
      const invYear = new Date(date).getFullYear();
      const [allInvoices] = await connection.query('SELECT invoice_no FROM sales WHERE invoice_no LIKE ?', [`INV-${invYear}-%`]);
      let maxSeq = 0;
      for (const row of allInvoices) {
        const parts = row.invoice_no.split('-');
        const seq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
      invoiceNo = `INV-${invYear}-${String(maxSeq + 1).padStart(4, '0')}`;
    }

    // ── Payment Modes Processing & Split Payments ──────────────────────────────
    let finalPayments = Array.isArray(payments) && payments.length > 0 ? payments : [];
    
    // If payments array not passed or empty, build fallback from single payment method
    if (finalPayments.length === 0) {
      const fallbackAmount = paymentStatus === 'Paid' ? Number(total || 0) : (paymentStatus === 'Partial' ? Number(amountPaid || 0) : 0);
      if (fallbackAmount > 0 || paymentStatus === 'Paid') {
        finalPayments.push({
          paymentMethod: paymentMethod || 'Cash',
          amount: fallbackAmount
        });
      }
    }

    const paymentsSum = finalPayments.reduce((acc, p) => acc + (Number(p.amount || p.amountPaid) || 0), 0);
    
    // Primary payment method text for sales table header
    let primaryPaymentMethod = paymentMethod || 'Cash';
    if (finalPayments.length === 1) {
      primaryPaymentMethod = finalPayments[0].paymentMethod || 'Cash';
    } else if (finalPayments.length > 1) {
      const modesText = finalPayments.map(p => `${p.paymentMethod} ₹${p.amount}`).join(' + ');
      primaryPaymentMethod = `Split (${modesText})`;
      if (primaryPaymentMethod.length > 48) {
        primaryPaymentMethod = `Split (${finalPayments.map(p => p.paymentMethod).join(', ')})`;
      }
      if (primaryPaymentMethod.length > 48) {
        primaryPaymentMethod = 'Split Payment';
      }
    }

    // Determine actual amount paid
    let amtPaid = 0;
    if (paymentStatus === 'Paid') {
      amtPaid = Number(total || 0);
    } else if (paymentStatus === 'Partial') {
      amtPaid = Math.min(Number(total || 0), paymentsSum > 0 ? paymentsSum : Number(amountPaid || 0));
    } else {
      amtPaid = Math.min(Number(total || 0), paymentsSum);
    }

    const dueAmt = Math.max(0, Number(total || 0) - amtPaid);

    // Insert Sale header
    const [result] = await connection.query(
      `INSERT INTO sales (invoice_no, customer_id, warehouse_id, user_id, date, subtotal, discount, gst_amount, total, payment_status, payment_method, amount_paid, due_amount, balance_amount, payment_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNo, finalCustomerId, Number(warehouseId), req.user.id, date, 
        subtotal || 0, discount || 0, gstAmount || 0, total || 0,
        paymentStatus, primaryPaymentMethod, amtPaid, dueAmt, dueAmt,
        paymentStatus === 'Paid' ? date : null
      ]
    );

    const saleId = result.insertId;

    // Save itemized sale_payments records inside transaction
    for (const pm of finalPayments) {
      const pAmt = Number(pm.amount || pm.amountPaid || 0);
      if (pAmt > 0) {
        try {
          await connection.query(
            `INSERT INTO sale_payments (tenant_id, sale_id, payment_method, amount, reference_no, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user?.tenant_id || null, saleId, pm.paymentMethod || 'Cash', pAmt, pm.referenceNo || pm.reference_no || null, pm.notes || null]
          );
        } catch (pe) {
          console.error('[Sales] Notice inserting sale_payment:', pe.message);
        }
      }
    }

    const updatedStockItems = [];

    // Loop items: Save sale items + FIFO stock deduction with Batch-wise MRP
    for (const item of items) {
      const pId = Number(item.productId || item.product_id);
      const qtyNeeded = Number(item.quantity);
      const sPrice = Number(item.sellingPrice || item.selling_price || item.price || (item.quantity ? item.total / item.quantity : 0));
      const defaultMrp = Number(item.mrp || item.max_retail_price || 0);

      // Total stock before deduction
      const [[stockSumBefore]] = await connection.query(
        'SELECT COALESCE(SUM(quantity), 0) as total FROM stock WHERE product_id = ? AND warehouse_id = ?',
        [pId, Number(warehouseId)]
      );
      const prevStockTotal = Number(stockSumBefore.total);

      // ── FIFO Stock Deduction Logic ─────────────────────────────────────
      const [stockRows] = await connection.query(
        `SELECT id, quantity FROM stock 
         WHERE product_id = ? AND warehouse_id = ? AND quantity > 0 
         ORDER BY id ASC`,
        [pId, Number(warehouseId)]
      );

      let remainingToDeduct = qtyNeeded;
      for (const row of stockRows) {
        if (remainingToDeduct <= 0) break;
        const currentQty = Number(row.quantity);
        const deductAmt = Math.min(currentQty, remainingToDeduct);
        const newQty = currentQty - deductAmt;

        await connection.query(
          'UPDATE stock SET quantity = ? WHERE id = ?',
          [newQty, row.id]
        );

        remainingToDeduct -= deductAmt;
      }

      // ── FIFO Batch Deduction & Batch-wise MRP from purchase_batches ─────────
      const [batchRows] = await connection.query(
        `SELECT id, batch_number, expiry_date, purchase_price, selling_price, mrp, remaining_quantity 
         FROM purchase_batches 
         WHERE product_id = ? AND remaining_quantity > 0 
         ORDER BY purchase_date ASC, id ASC`,
        [pId]
      );

      if (batchRows.length > 0) {
        let batchRemToDeduct = qtyNeeded;
        for (const batchRow of batchRows) {
          if (batchRemToDeduct <= 0) break;
          const currentBatchQty = Number(batchRow.remaining_quantity);
          const batchDeductAmt = Math.min(currentBatchQty, batchRemToDeduct);
          const newBatchQty = currentBatchQty - batchDeductAmt;

          await connection.query(
            'UPDATE purchase_batches SET remaining_quantity = ? WHERE id = ?',
            [newBatchQty, batchRow.id]
          );

          const batchMrp = Number(batchRow.mrp > 0 ? batchRow.mrp : defaultMrp);

          // Save sale_items record for this batch segment
          await connection.query(
            `INSERT INTO sale_items (sale_id, product_id, quantity, selling_price, mrp, batch_number, gst, total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [saleId, pId, batchDeductAmt, sPrice, batchMrp, batchRow.batch_number, item.gst || 0, batchDeductAmt * sPrice]
          );

          batchRemToDeduct -= batchDeductAmt;
        }

        if (batchRemToDeduct > 0) {
          await connection.query(
            `INSERT INTO sale_items (sale_id, product_id, quantity, selling_price, mrp, batch_number, gst, total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [saleId, pId, batchRemToDeduct, sPrice, defaultMrp, 'BATCH-OVERFLOW', item.gst || 0, batchRemToDeduct * sPrice]
          );
        }
      } else {
        // Fallback for items without active purchase_batches
        await connection.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, selling_price, mrp, batch_number, gst, total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [saleId, pId, qtyNeeded, sPrice, defaultMrp, 'DEFAULT', item.gst || 0, item.total || (qtyNeeded * sPrice)]
        );
      }

      const newStockTotal = Math.max(0, prevStockTotal - qtyNeeded);

      // Log stock movement
      await connection.query(
        `INSERT INTO stock_logs (product_id, warehouse_id, type, quantity, reference_no, notes, user_id, previous_quantity, new_quantity)
         VALUES (?, ?, 'Stock Out', ?, ?, 'Sales Billing Entry (FIFO)', ?, ?, ?)`,
        [pId, Number(warehouseId), -qtyNeeded, invoiceNo, req.user.id, prevStockTotal, newStockTotal]
      );

      // Sync FIFO active batch Expiry Date and MRP on Product master after sale deduction
      await syncProductFifoState(connection, pId);
      console.log(`[Sales FIFO] Product ${pId} deducted ${qtyNeeded} units. Stock: ${prevStockTotal} -> ${newStockTotal}`);

      updatedStockItems.push({
        productId: pId,
        warehouseId: Number(warehouseId),
        previousStock: prevStockTotal,
        currentStock: newStockTotal
      });
    }

    // Borrow Customer Credit Handling
    if (customerType === 'Borrow' && paymentStatus !== 'Paid') {
      const grandTotal = Number(total);
      const paid = paymentStatus === 'Partial' ? Number(amountPaid || 0) : 0;
      const remaining = Math.max(0, grandTotal - paid);

      let finalDueDate = dueDate;
      if (!finalDueDate) {
        const d = new Date(date);
        d.setDate(d.getDate() + 15);
        finalDueDate = d.toISOString().slice(0, 10);
      }

      let txStatus = 'Pending';
      if (remaining === 0) txStatus = 'Paid';
      else if (paid > 0) txStatus = 'Partial Paid';

      if (remaining > 0 && new Date(finalDueDate) < new Date(date)) {
        txStatus = 'Overdue';
      }

      await connection.query(
        `INSERT INTO borrow_transactions (
          customer_id, invoice_no, borrow_date, due_date, total_amount, paid_amount, remaining_amount, payment_status, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalCustomerId,
          invoiceNo,
          date,
          finalDueDate,
          grandTotal,
          paid,
          remaining,
          txStatus,
          `POS credit invoice: ${invoiceNo}`,
          req.user.id
        ]
      );

      await connection.query(
        `INSERT INTO borrow_records (customer_id, amount, type, date, notes) VALUES (?, ?, 'Borrow', ?, ?)`,
        [finalCustomerId, grandTotal, date, `POS credit invoice: ${invoiceNo}`]
      );

      if (paid > 0) {
        await connection.query(
          `INSERT INTO borrow_records (customer_id, amount, type, date, notes) VALUES (?, ?, 'Payback', ?, ?)`,
          [finalCustomerId, paid, date, `Upfront payment for invoice: ${invoiceNo}`]
        );
      }
    }

    await connection.commit();

    await logActivity(req.user.id, 'Create Sale', 'Sales', `Generated sales invoice "${invoiceNo}" (Customer ID: ${finalCustomerId})`, req.ip);

    await createNotification({
      type: 'Sales Invoice',
      title: 'Sales Invoice Generated',
      message: `Sales invoice "${invoiceNo}" generated for total amount ₹${total}. Stock deducted.`,
      priority: 'Medium',
      related_user: req.user.email,
      related_module: 'Sales',
      target_roles: 'Admin,Manager,Staff'
    }, connection);

    return res.status(201).json({
      success: true,
      message: 'Sales billing completed successfully. Stock deducted.',
      invoiceNo,
      saleId,
      updatedStock: updatedStockItems
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Cancel sales transaction (restores inventory)
// @route   DELETE /api/sales/:id
// @access  Private
export const deleteSale = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Fetch sale details
    const [sales] = await connection.query('SELECT invoice_no, warehouse_id FROM sales WHERE id = ?', [id]);
    if (sales.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Sales invoice record not found' });
    }

    const { invoice_no, warehouse_id } = sales[0];

    // Fetch item lines
    const [items] = await connection.query('SELECT product_id, quantity FROM sale_items WHERE sale_id = ?', [id]);

    // Restore stock for each item
    for (const item of items) {
      const pId = Number(item.product_id);
      const qty = Number(item.quantity);

      const [[stockSumBefore]] = await connection.query(
        'SELECT COALESCE(SUM(quantity), 0) as total FROM stock WHERE product_id = ? AND warehouse_id = ?',
        [pId, warehouse_id]
      );
      const prevQty = Number(stockSumBefore.total);

      const [existingStock] = await connection.query(
        'SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1',
        [pId, warehouse_id]
      );

      if (existingStock.length > 0) {
        await connection.query(
          'UPDATE stock SET quantity = quantity + ? WHERE id = ?',
          [qty, existingStock[0].id]
        );
      } else {
        await connection.query(
          'INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
          [pId, warehouse_id, qty]
        );
      }

      // Restore batch record in purchase_batches
      await connection.query(
        `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, warehouse_id)
         VALUES (?, ?, ?, ?, CURRENT_DATE(), ?)`,
        [pId, `VOID-RESTORE-${Date.now()}`, qty, qty, warehouse_id]
      );

      await connection.query(
        `INSERT INTO stock_logs (product_id, warehouse_id, type, quantity, reference_no, notes, user_id, previous_quantity, new_quantity)
         VALUES (?, ?, 'Stock In', ?, ?, 'Sales Transaction Voided/Returned', ?, ?, ?)`,
        [pId, warehouse_id, qty, invoice_no, req.user.id, prevQty, prevQty + qty]
      );
    }

    // Delete linked credit transactions
    await connection.query('DELETE FROM borrow_transactions WHERE invoice_no = ?', [invoice_no]);
    await connection.query('DELETE FROM borrow_records WHERE notes LIKE ?', [`%${invoice_no}%`]);

    // Delete items and invoice header
    await connection.query('DELETE FROM sale_items WHERE sale_id = ?', [id]);
    await connection.query('DELETE FROM sales WHERE id = ?', [id]);

    await connection.commit();

    await logActivity(req.user.id, 'Cancel Sale', 'Sales', `Voided sales invoice "${invoice_no}" (ID: ${id})`, req.ip);

    return res.status(200).json({ success: true, message: 'Sales invoice cancelled and stock restored successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};
