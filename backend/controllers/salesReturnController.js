import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../services/notificationService.js';

// @desc    Search Sales Invoices by Invoice No, Customer Name, or Phone Number
// @route   GET /api/sales-returns/search-invoice
// @access  Private
export const searchInvoiceForReturn = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please enter invoice number, customer name, or phone number to search' });
    }

    const searchTerm = `%${query.trim()}%`;

    // Query sales with customer info
    const [sales] = await req.db.query(
      `SELECT s.id as sale_id, s.invoice_no, s.date as sale_date, s.total as grand_total, 
              s.amount_paid, s.due_amount, s.payment_method, s.payment_status,
              c.id as customer_id, 
              COALESCE(c.name, 'Walk-in Customer') as customer_name,
              COALESCE(c.phone, 'N/A') as customer_phone,
              COALESCE(c.customer_type, 'Walk-in') as customer_type,
              COALESCE((SELECT SUM(remaining_amount) FROM borrow_transactions WHERE customer_id = c.id AND payment_status != 'Paid'), 0) as customer_outstanding_balance
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.invoice_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?
       ORDER BY s.date DESC, s.id DESC
       LIMIT 10`,
      [searchTerm, searchTerm, searchTerm]
    );

    if (sales.length === 0) {
      return res.status(404).json({ success: false, message: 'No matching sales invoice found' });
    }

    // For each found sale, attach itemized list with already returned quantities & borrow details
    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        // Fetch linked borrow transaction if applicable
        const [btRows] = await req.db.query(
          'SELECT remaining_amount, payment_status, total_amount, paid_amount FROM borrow_transactions WHERE invoice_no = ? LIMIT 1',
          [sale.invoice_no]
        );

        const invoiceBorrowRemaining = btRows.length > 0 ? Number(btRows[0].remaining_amount) : Number(sale.due_amount);
        const invoiceBorrowStatus = btRows.length > 0 ? btRows[0].payment_status : sale.payment_status;

        const [items] = await req.db.query(
          `SELECT si.id as sale_item_id, si.product_id, p.name as product_name, p.barcode, p.unit,
                  si.quantity as sold_qty, si.selling_price as unit_price, si.total as total_price, si.gst,
                  COALESCE(SUM(sr.quantity), 0) as returned_qty
           FROM sale_items si
           JOIN products p ON si.product_id = p.id
           LEFT JOIN sales_returns sr ON sr.sale_id = si.sale_id AND sr.product_id = si.product_id
           WHERE si.sale_id = ?
           GROUP BY si.id, si.product_id, p.name, p.barcode, p.unit, si.quantity, si.selling_price, si.total, si.gst`,
          [sale.sale_id]
        );

        const itemsWithEligibility = items.map(item => {
          const sQty = Number(item.sold_qty);
          const rQty = Number(item.returned_qty);
          const uPrice = Number(item.unit_price) > 0 ? Number(item.unit_price) : (Number(item.total_price) / (sQty || 1));
          return {
            ...item,
            sold_qty: sQty,
            unit_price: uPrice,
            returned_qty: rQty,
            remaining_qty: Math.max(0, sQty - rQty)
          };
        });

        // Compute prior total refund amount on this invoice
        const totalPriorReturnedValue = itemsWithEligibility.reduce((acc, i) => acc + (i.returned_qty * i.unit_price), 0);

        // Calculate Return Policy Status:
        // Walk-in Customer: 24 Hours (1 Day)
        // Borrow Customer: 72 Hours (3 Days)
        const saleDateObj = new Date(sale.sale_date);
        const nowObj = new Date();
        const diffMs = Math.max(0, nowObj.getTime() - saleDateObj.getTime());
        const diffHours = diffMs / (1000 * 3600);

        const isBorrowCustomer = sale.customer_type === 'Borrow' || Number(sale.due_amount) > 0 || (sale.customer_name && sale.customer_name !== 'Walk-in Customer' && sale.customer_type !== 'Walk-in');
        const allowedHours = isBorrowCustomer ? 72 : 24;
        const allowedDaysLabel = isBorrowCustomer ? '72-Hour (3-Day)' : '24-Hour (1-Day)';
        const customerTypeLabel = isBorrowCustomer ? 'Borrow Customer' : 'Walk-in Customer';

        const isWithinPolicy = diffHours <= allowedHours;
        const remainingHours = Math.max(0, Math.ceil(allowedHours - diffHours));

        return {
          ...sale,
          grand_total: Number(sale.grand_total),
          amount_paid: Number(sale.amount_paid),
          due_amount: Number(sale.due_amount),
          customer_outstanding_balance: Number(sale.customer_outstanding_balance),
          invoice_borrow_remaining: invoiceBorrowRemaining,
          invoice_borrow_status: invoiceBorrowStatus,
          total_prior_returned_value: totalPriorReturnedValue,
          hours_since_sale: Math.floor(diffHours),
          allowed_hours: allowedHours,
          is_policy_eligible: isWithinPolicy,
          policy_message: isWithinPolicy
            ? `Within ${allowedDaysLabel} Return Policy (${remainingHours} hour(s) remaining for ${customerTypeLabel})`
            : `Return Period Expired (${Math.floor(diffHours)} hours since purchase. ${customerTypeLabel} policy limit is ${allowedHours} Hours).`,
          items: itemsWithEligibility
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: salesWithItems.length,
      invoices: salesWithItems
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Sales Return Logs / History
// @route   GET /api/sales-returns
// @access  Private
export const getSalesReturns = async (req, res, next) => {
  try {
    const { search, date, customer, returnType, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT sr.*, p.name as product_name, p.barcode, p.unit,
             rep.name as replacement_product_name
      FROM sales_returns sr
      LEFT JOIN products p ON sr.product_id = p.id
      LEFT JOIN products rep ON sr.replacement_product_id = rep.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (search && search.trim() !== '') {
      query += ' AND (sr.invoice_no LIKE ? OR sr.return_no LIKE ? OR sr.customer_name LIKE ? OR p.name LIKE ?)';
      const s = `%${search.trim()}%`;
      queryParams.push(s, s, s, s);
    }

    if (date) {
      query += ' AND DATE(sr.created_at) = ?';
      queryParams.push(date);
    }

    if (customer && customer.trim() !== '') {
      query += ' AND (sr.customer_name LIKE ? OR sr.customer_phone LIKE ?)';
      const c = `%${customer.trim()}%`;
      queryParams.push(c, c);
    }

    if (returnType && returnType !== 'all') {
      query += ' AND sr.return_type = ?';
      queryParams.push(returnType);
    }

    query += ' ORDER BY sr.created_at DESC, sr.id DESC LIMIT ? OFFSET ?';
    queryParams.push(Number(limit), Number(offset));

    const [returns] = await req.db.query(query, queryParams);

    return res.status(200).json({
      success: true,
      count: returns.length,
      returns
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Sales Return Details for Receipt Printing
// @route   GET /api/sales-returns/:id
// @access  Private
export const getSalesReturnById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [returns] = await req.db.query(
      `SELECT sr.*, p.name as product_name, p.barcode, p.unit,
              rep.name as replacement_product_name, rep.barcode as replacement_barcode
       FROM sales_returns sr
       LEFT JOIN products p ON sr.product_id = p.id
       LEFT JOIN products rep ON sr.replacement_product_id = rep.id
       WHERE sr.id = ?`,
      [id]
    );

    if (returns.length === 0) {
      return res.status(404).json({ success: false, message: 'Sales return record not found' });
    }

    return res.status(200).json({
      success: true,
      salesReturn: returns[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a customer sales return with ERP business rules
// @route   POST /api/sales-returns
// @access  Private
export const createSalesReturn = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { 
      sale_id, 
      product_id, 
      quantity, 
      items, // optional array of { product_id, quantity }
      reason, 
      return_type = 'Refund',
      refund_method = 'Cash',
      remarks = '',
      replacement_product_id = null,
      replacement_quantity = 0,
      price_difference = 0
    } = req.body;

    if (!sale_id || !reason) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false, 
        message: 'Please specify Sale ID and Return Reason' 
      });
    }

    // Build return items list
    let processItems = [];
    if (Array.isArray(items) && items.length > 0) {
      processItems = items.map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) }));
    } else if (product_id && Number(quantity) > 0) {
      processItems = [{ product_id: Number(product_id), quantity: Number(quantity) }];
    }

    if (processItems.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Please select at least one valid item and quantity to return' });
    }

    // 1. Fetch sale & customer info
    const [sales] = await connection.query(
      `SELECT s.id, s.invoice_no, s.warehouse_id, s.customer_id, s.total, s.amount_paid, s.due_amount, s.payment_status,
              COALESCE(c.name, 'Walk-in Customer') as customer_name,
              COALESCE(c.phone, 'N/A') as customer_phone,
              COALESCE(c.customer_type, 'Walk-in') as customer_type
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = ?`,
      [sale_id]
    );

    if (sales.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Sales invoice not found' });
    }

    const sale = sales[0];
    const saleDateObj = new Date(sale.date || sale.created_at || Date.now());
    const nowObj = new Date();
    const diffMs = Math.max(0, nowObj.getTime() - saleDateObj.getTime());
    const diffHours = diffMs / (1000 * 3600);

    const isBorrowCustomer = sale.customer_type === 'Borrow' || Number(sale.due_amount) > 0 || (sale.customer_name && sale.customer_name !== 'Walk-in Customer' && sale.customer_type !== 'Walk-in');
    const allowedHours = isBorrowCustomer ? 72 : 24;
    const allowedDaysLabel = isBorrowCustomer ? '72-Hour (3-Day)' : '24-Hour (1-Day)';
    const customerTypeLabel = isBorrowCustomer ? 'Borrow Customers' : 'Walk-in Customers';

    if (diffHours > allowedHours) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: `Return Policy Expired: ${customerTypeLabel} have a ${allowedDaysLabel} return policy limit. This invoice was issued ${Math.floor(diffHours)} hours ago.`
      });
    }

    const warehouseId = sale.warehouse_id || 1;
    const returnNo = `RET-${Date.now().toString().slice(-6)}`;
    let grandRefundAmount = 0;
    let createdReturnId = null;

    const isDefectiveOrExpired = ['Damaged Product', 'Defective Product', 'Expired Product'].includes(reason);

    for (const returnItem of processItems) {
      const pId = returnItem.product_id;
      const returnQty = returnItem.quantity;

      // Fetch sale item line
      const [saleItems] = await connection.query(
        'SELECT quantity, selling_price, total, gst FROM sale_items WHERE sale_id = ? AND product_id = ?',
        [sale.id, pId]
      );

      if (saleItems.length === 0) continue;

      const totalSoldQty = saleItems.reduce((acc, row) => acc + Number(row.quantity), 0);
      const firstItem = saleItems[0];
      const unitPrice = Number(firstItem.selling_price) > 0 ? Number(firstItem.selling_price) : (Number(firstItem.total) / (Number(firstItem.quantity) || 1));

      // Check already returned quantity
      const [priorReturns] = await connection.query(
        'SELECT COALESCE(SUM(quantity), 0) as total FROM sales_returns WHERE sale_id = ? AND product_id = ?',
        [sale.id, pId]
      );

      const alreadyReturned = Number(priorReturns[0].total);
      const remainingEligible = Math.max(0, totalSoldQty - alreadyReturned);

      if (remainingEligible <= 0 || returnQty > remainingEligible) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Return quantity (${returnQty}) exceeds remaining eligible units (${remainingEligible}) for product ID ${pId}.`
        });
      }

      if (returnQty > remainingEligible) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Return quantity (${returnQty}) exceeds remaining eligible quantity (${remainingEligible}) for product ID ${pId}.`
        });
      }

      const refundAmount = unitPrice * returnQty;
      grandRefundAmount += refundAmount;

      // Insert Sales Return Record
      const [insertResult] = await connection.query(
        `INSERT INTO sales_returns (
          return_no, sale_id, invoice_no, customer_name, customer_phone,
          product_id, quantity, refund_amount, reason, return_type,
          refund_method, remarks, replacement_product_id, replacement_quantity,
          price_difference, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          returnNo, sale.id, sale.invoice_no, sale.customer_name, sale.customer_phone,
          pId, returnQty, refundAmount, reason, return_type,
          refund_method, remarks || '', replacement_product_id || null, Number(replacement_quantity) || null,
          Number(price_difference) || 0, req.user.id
        ]
      );

      if (!createdReturnId) {
        createdReturnId = insertResult.insertId;
      }

      // Restore stock for non-defective/expired items
      if (!isDefectiveOrExpired) {
        const [existingStock] = await connection.query(
          'SELECT id FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1',
          [pId, warehouseId]
        );

        if (existingStock.length > 0) {
          await connection.query(
            'UPDATE stock SET quantity = quantity + ? WHERE id = ?',
            [returnQty, existingStock[0].id]
          );
        } else {
          await connection.query(
            'INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
            [pId, warehouseId, returnQty]
          );
        }

        // Synchronize purchase_batches for instant Product catalog & stock report updates
        const [existingPb] = await connection.query(
          'SELECT id FROM purchase_batches WHERE product_id = ? ORDER BY id DESC LIMIT 1',
          [pId]
        );
        if (existingPb.length > 0) {
          await connection.query(
            'UPDATE purchase_batches SET remaining_quantity = remaining_quantity + ? WHERE id = ?',
            [returnQty, existingPb[0].id]
          );
        } else {
          await connection.query(
            `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, warehouse_id)
             VALUES (?, ?, ?, ?, CURRENT_DATE(), ?)`,
            [pId, `RETURN-RESTORE-${Date.now()}`, returnQty, returnQty, warehouseId]
          );
        }

        await connection.query(
          `INSERT INTO stock_logs (product_id, warehouse_id, type, quantity, reference_no, notes, user_id)
           VALUES (?, ?, 'Stock In', ?, ?, ?, ?)`,
          [pId, warehouseId, returnQty, sale.invoice_no, `Sales Return (${return_type}): ${reason}`, req.user.id]
        );
      } else {
        await connection.query(
          `INSERT INTO stock_logs (product_id, warehouse_id, type, quantity, reference_no, notes, user_id)
           VALUES (?, ?, 'Stock Return (Damaged)', ?, ?, ?, ?)`,
          [pId, warehouseId, 0, sale.invoice_no, `Sales Return (Non-sellable ${reason}): ${remarks}`, req.user.id]
        );
      }
    }

    // ── ERP BUSINESS LOGIC FOR CREDIT/BORROW VS PAID RETURNS ──────────────────
    const currentPaid = Number(sale.amount_paid);

    if (isBorrowCustomer && sale.customer_id) {
      let remainingRefundToDeduct = grandRefundAmount;

      // 1. Deduct returned value from specific borrow transaction for this invoice
      const [btRows] = await connection.query(
        'SELECT * FROM borrow_transactions WHERE invoice_no = ? AND customer_id = ?',
        [sale.invoice_no, sale.customer_id]
      );

      if (btRows.length > 0) {
        const bt = btRows[0];
        const curRem = Number(bt.remaining_amount);
        const curTot = Number(bt.total_amount);
        const applyAmt = Math.min(curRem, remainingRefundToDeduct);

        const newRem = Math.max(0, curRem - applyAmt);
        const newTot = Math.max(0, curTot - applyAmt);
        const curPaid = Number(bt.paid_amount);

        let newStatus = 'Pending';
        if (newRem === 0) {
          newStatus = 'Paid';
        } else if (curPaid > 0) {
          newStatus = 'Partial Paid';
        } else if (new Date(bt.due_date) < new Date()) {
          newStatus = 'Overdue';
        }

        await connection.query(
          'UPDATE borrow_transactions SET total_amount = ?, remaining_amount = ?, payment_status = ? WHERE id = ?',
          [newTot, newRem, newStatus, bt.id]
        );

        remainingRefundToDeduct -= applyAmt;
      }

      // 2. If excess returned value remains, apply across other open credit transactions (FIFO)
      if (remainingRefundToDeduct > 0) {
        const [openTxs] = await connection.query(
          `SELECT * FROM borrow_transactions 
           WHERE customer_id = ? AND payment_status != 'Paid'
           ORDER BY borrow_date ASC, created_at ASC`,
          [sale.customer_id]
        );

        for (const openBt of openTxs) {
          if (remainingRefundToDeduct <= 0) break;

          const curRem = Number(openBt.remaining_amount);
          const applyAmt = Math.min(curRem, remainingRefundToDeduct);

          const newRem = Math.max(0, curRem - applyAmt);
          const curTot = Number(openBt.total_amount);
          const newTot = Math.max(0, curTot - applyAmt);
          const curPaid = Number(openBt.paid_amount);

          let newStatus = 'Pending';
          if (newRem === 0) {
            newStatus = 'Paid';
          } else if (curPaid > 0) {
            newStatus = 'Partial Paid';
          } else if (new Date(openBt.due_date) < new Date()) {
            newStatus = 'Overdue';
          }

          await connection.query(
            'UPDATE borrow_transactions SET total_amount = ?, remaining_amount = ?, payment_status = ? WHERE id = ?',
            [newTot, newRem, newStatus, openBt.id]
          );

          remainingRefundToDeduct -= applyAmt;
        }
      }

      // 3. If refund value remains (e.g. customer paid bill in full beforehand or has zero remaining dues),
      // deposit excess money into Customer's Advance Credit Balance (Customer Wallet / Store Credit)
      if (remainingRefundToDeduct > 0 && sale.customer_id) {
        await connection.query(
          'UPDATE customers SET advance_balance = COALESCE(advance_balance, 0) + ? WHERE id = ?',
          [remainingRefundToDeduct, sale.customer_id]
        );

        await connection.query(
          `INSERT INTO borrow_records (customer_id, amount, type, date, notes) VALUES (?, ?, 'Advance Deposit', NOW(), ?)`,
          [sale.customer_id, remainingRefundToDeduct, `Sales Return (${returnNo}) Advance Credit Deposit for invoice ${sale.invoice_no}: ₹${remainingRefundToDeduct}`]
        );
      }

      // 4. Log Udhaar Credit Return Entry in borrow_records
      await connection.query(
        `INSERT INTO borrow_records (customer_id, amount, type, date, notes) VALUES (?, ?, 'Return', NOW(), ?)`,
        [sale.customer_id, grandRefundAmount, `Sales Return (${returnNo}) for invoice ${sale.invoice_no}: ₹${grandRefundAmount}`]
      );
    } else if (sale.customer_id && (return_type === 'Store Credit' || return_type === 'Credit Adjustment (Udhaar Credit Note)' || return_type === 'Refund')) {
      // Customer is a registered customer who paid upfront — credit refund directly to Customer Advance Balance
      await connection.query(
        'UPDATE customers SET advance_balance = COALESCE(advance_balance, 0) + ? WHERE id = ?',
        [grandRefundAmount, sale.customer_id]
      );

      await connection.query(
        `INSERT INTO borrow_records (customer_id, amount, type, date, notes) VALUES (?, ?, 'Advance Deposit', NOW(), ?)`,
        [sale.customer_id, grandRefundAmount, `Sales Return (${returnNo}) Advance Credit Deposit for invoice ${sale.invoice_no}: ₹${grandRefundAmount}`]
      );
    }

    // ── UPDATE SALES INVOICE HEADER ──────────────────────────────────────────
    const newSaleDue = Math.max(0, Number(sale.due_amount) - grandRefundAmount);
    let newSaleStatus = sale.payment_status;
    if (newSaleDue === 0) {
      newSaleStatus = 'Paid';
    } else if (currentPaid > 0) {
      newSaleStatus = 'Partial';
    }

    await connection.query(
      'UPDATE sales SET due_amount = ?, balance_amount = ?, payment_status = ? WHERE id = ?',
      [newSaleDue, newSaleDue, newSaleStatus, sale.id]
    );

    // Specific Return Type Adjustments
    if (return_type === 'Store Credit' && sale.customer_id) {
      // Handled above via advance_balance
    } else if (return_type === 'Cancel Item from Invoice') {
      const newSaleTotal = Math.max(0, Number(sale.total) - grandRefundAmount);
      await connection.query(
        'UPDATE sales SET total = ? WHERE id = ?',
        [newSaleTotal, sale.id]
      );
    } else if (return_type === 'Exchange' && replacement_product_id && Number(replacement_quantity) > 0) {
      const repQty = Number(replacement_quantity);
      await connection.query(
        'UPDATE stock SET quantity = GREATEST(0, quantity - ?) WHERE product_id = ? AND warehouse_id = ?',
        [repQty, replacement_product_id, warehouseId]
      );

      await connection.query(
        `INSERT INTO stock_logs (product_id, warehouse_id, type, quantity, reference_no, notes, user_id)
         VALUES (?, ?, 'Stock Out', ?, ?, ?, ?)`,
        [replacement_product_id, warehouseId, repQty, sale.invoice_no, `Sales Return Exchange Replacement: ${returnNo}`, req.user.id]
      );
    }

    await connection.commit();

    // Log Activity & System Notifications AFTER transaction commit safely
    try {
      if (req.user?.id) {
        await logActivity(
          req.user.id,
          'Process Sales Return',
          'Sales',
          `Processed sales return ${returnNo} for invoice ${sale.invoice_no} (Refund/Credit: ₹${grandRefundAmount}, Type: ${return_type})`,
          req.ip
        );
      }

      await createNotification({
        tenantId: req.tenantId,
        user_id: req.user?.id,
        type: 'Stock Return',
        title: 'Sales Return Completed',
        message: `Sales Return ${returnNo} processed for invoice "${sale.invoice_no}" (Refund/Credit: ₹${grandRefundAmount}, ${return_type}).`,
        priority: 'Medium',
        related_user: req.user?.name || req.user?.email || 'Staff',
        module: 'Sales',
        related_module: 'Returns',
        target_roles: 'Admin,Manager,Staff'
      });
    } catch (logErr) {
      console.warn('[SalesReturn] Non-critical notification/activity logging warning:', logErr.message);
    }

    return res.status(201).json({
      success: true,
      message: isBorrowCustomer 
        ? 'Sales return processed. Returned amount adjusted against customer Udhaar balance.' 
        : 'Sales return processed successfully',
      returnNo,
      returnId: createdReturnId,
      refundAmount: grandRefundAmount
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rbErr) {
      // Ignore rollback error if transaction already committed
    }
    console.error('API Error in createSalesReturn:', error.message);
    next(error);
  } finally {
    try {
      connection.release();
    } catch (relErr) {
      // Ignore release error if connection already released
    }
  }
};

// @desc    Void / Delete Sales Return Voucher and restore eligible quantity & stock
// @route   DELETE /api/sales-returns/:id
// @access  Private
export const deleteSalesReturn = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [returnRows] = await connection.query(
      'SELECT * FROM sales_returns WHERE id = ?',
      [id]
    );

    if (returnRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Sales return voucher not found' });
    }

    const ret = returnRows[0];

    // Reverse stock adjustment (deduct stock that was returned)
    const [saleRows] = await connection.query('SELECT warehouse_id FROM sales WHERE id = ?', [ret.sale_id]);
    const warehouseId = saleRows.length > 0 && saleRows[0].warehouse_id ? saleRows[0].warehouse_id : 1;

    await connection.query(
      'UPDATE stock SET quantity = GREATEST(0, quantity - ?) WHERE product_id = ? AND warehouse_id = ?',
      [ret.quantity, ret.product_id, warehouseId]
    );

    // Deduct quantity from purchase_batches as well
    const [existingPb] = await connection.query(
      'SELECT id, remaining_quantity FROM purchase_batches WHERE product_id = ? AND remaining_quantity > 0 ORDER BY id DESC LIMIT 1',
      [ret.product_id]
    );
    if (existingPb.length > 0) {
      await connection.query(
        'UPDATE purchase_batches SET remaining_quantity = GREATEST(0, remaining_quantity - ?) WHERE id = ?',
        [ret.quantity, existingPb[0].id]
      );
    }

    // Log stock reversal
    await connection.query(
      `INSERT INTO stock_logs (product_id, warehouse_id, type, quantity, reference_no, notes, user_id)
       VALUES (?, ?, 'Stock Out', ?, ?, ?, ?)`,
      [
        ret.product_id,
        warehouseId,
        ret.quantity,
        `VOID-${ret.return_no}`,
        `Voided Sales Return ${ret.return_no} for Invoice ${ret.invoice_no}`,
        req.user.id
      ]
    );

    // Reverse Udhaar / Customer advance balance if applicable
    if (ret.return_type === 'Credit Adjustment (Udhaar Credit Note)' || ret.refund_method === 'Credit Note / Udhaar Settlement') {
      const [saleDetail] = await connection.query('SELECT customer_id, due_amount FROM sales WHERE id = ?', [ret.sale_id]);
      if (saleDetail.length > 0) {
        const refundVal = Number(ret.refund_amount);
        await connection.query('UPDATE sales SET due_amount = due_amount + ? WHERE id = ?', [refundVal, ret.sale_id]);
        await connection.query(
          'UPDATE borrow_transactions SET remaining_amount = remaining_amount + ?, payment_status = IF(remaining_amount + ? >= total_amount, "Pending", "Partial Paid") WHERE invoice_no = ?',
          [refundVal, refundVal, ret.invoice_no]
        );
      }
    }

    if (ret.customer_name && ret.customer_name !== 'Walk-in Customer') {
      const [cRows] = await connection.query('SELECT id FROM customers WHERE name = ? OR phone = ? LIMIT 1', [ret.customer_name, ret.customer_phone]);
      if (cRows.length > 0) {
        await connection.query(
          'UPDATE customers SET advance_balance = GREATEST(0, advance_balance - ?) WHERE id = ?',
          [Number(ret.refund_amount) || 0, cRows[0].id]
        );
      }
    }

    // Delete sales_returns record
    await connection.query('DELETE FROM sales_returns WHERE id = ?', [id]);

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Sales return voucher ${ret.return_no || id} voided successfully. Invoice return limits and stock restored.`
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};
