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

        return {
          ...sale,
          grand_total: Number(sale.grand_total),
          amount_paid: Number(sale.amount_paid),
          due_amount: Number(sale.due_amount),
          customer_outstanding_balance: Number(sale.customer_outstanding_balance),
          invoice_borrow_remaining: invoiceBorrowRemaining,
          invoice_borrow_status: invoiceBorrowStatus,
          total_prior_returned_value: totalPriorReturnedValue,
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

      const item = saleItems[0];
      const soldQty = Number(item.quantity);
      const unitPrice = Number(item.selling_price) > 0 ? Number(item.selling_price) : (Number(item.total) / (soldQty || 1));

      // Check already returned quantity
      const [priorReturns] = await connection.query(
        'SELECT COALESCE(SUM(quantity), 0) as total FROM sales_returns WHERE sale_id = ? AND product_id = ?',
        [sale.id, pId]
      );

      const alreadyReturned = Number(priorReturns[0].total);
      const remainingEligible = soldQty - alreadyReturned;

      if (returnQty > remainingEligible) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Return quantity (${returnQty}) exceeds eligible sold quantity (${remainingEligible}) for product ID ${pId}.`
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
    const isBorrowCustomer = sale.customer_type === 'Borrow' || sale.due_amount > 0;
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

      // 3. Log Udhaar Credit Return Entry in borrow_records
      await connection.query(
        `INSERT INTO borrow_records (customer_id, amount, type, date, notes) VALUES (?, ?, 'Return', NOW(), ?)`,
        [sale.customer_id, grandRefundAmount, `Sales Return (${returnNo}) for invoice ${sale.invoice_no}: ₹${grandRefundAmount}`]
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
      await connection.query(
        'INSERT INTO borrow_records (customer_id, amount, type, date, notes) VALUES (?, ?, ?, NOW(), ?)',
        [sale.customer_id, grandRefundAmount, 'Payback', `Sales Return Store Credit Voucher: ${returnNo}`]
      );
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

    // Log Activity & System Notifications AFTER transaction commit
    try {
      await logActivity(
        req.user.id,
        'Process Sales Return',
        'Sales',
        `Processed sales return ${returnNo} for invoice ${sale.invoice_no} (Refund/Credit: ₹${grandRefundAmount}, Type: ${return_type})`,
        req.ip
      );

      await createNotification({
        type: 'Stock Return',
        title: 'Sales Return Completed',
        message: `Sales Return ${returnNo} processed for invoice "${sale.invoice_no}" (Refund/Credit: ₹${grandRefundAmount}, ${return_type}).`,
        priority: 'Medium',
        related_user: req.user.email,
        related_module: 'Returns',
        target_roles: 'Admin,Manager,Staff'
      }, req.db);
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
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};
