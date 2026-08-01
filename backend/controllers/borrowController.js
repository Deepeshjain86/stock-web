import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../services/notificationService.js';


// @desc    Get borrow summary by customer (outstanding balances, customer profile details)
// @route   GET /api/borrow
// @access  Private
export const getBorrowSummary = async (req, res, next) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT c.id, c.customer_code, c.name, c.phone, c.email, c.address, c.customer_type, c.status,
             COALESCE(SUM(bt.remaining_amount), 0) as balance,
             COALESCE(SUM(CASE WHEN bt.payment_status = 'Overdue' OR (bt.payment_status != 'Paid' AND bt.due_date < CURRENT_DATE()) THEN bt.remaining_amount ELSE 0 END), 0) as overdue_balance
      FROM customers c
      LEFT JOIN borrow_transactions bt ON c.id = bt.customer_id
      WHERE (c.customer_type = 'Borrow' OR c.id IN (SELECT DISTINCT customer_id FROM borrow_transactions))
        AND c.name != 'Walk-in Customer'
    `;
    const queryParams = [];

    if (search) {
      query += ' AND (c.name LIKE ? OR c.phone LIKE ? OR c.customer_code LIKE ?)';
      const s = `%${search}%`;
      queryParams.push(s, s, s);
    }

    query += ' GROUP BY c.id ORDER BY balance DESC, c.name ASC';

    const [summary] = await req.db.query(query, queryParams);

    const [totals] = await req.db.query(`
      SELECT 
        COALESCE(SUM(bt.remaining_amount), 0) as total_pending,
        COALESCE(SUM(CASE WHEN bt.payment_status != 'Paid' AND bt.due_date < CURRENT_DATE() THEN bt.remaining_amount ELSE 0 END), 0) as total_overdue
      FROM borrow_transactions bt
      JOIN customers c ON bt.customer_id = c.id
      WHERE c.name != 'Walk-in Customer'
    `);

    return res.status(200).json({ 
      success: true, 
      count: summary.length, 
      summary,
      summaryTotals: totals[0] || { total_pending: 0, total_overdue: 0 }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed borrow transactions list
// @route   GET /api/borrow/transactions
// @access  Private
export const getBorrowTransactions = async (req, res, next) => {
  try {
    const { customerId, status } = req.query;

    let query = `
      SELECT bt.*, c.name as customer_name, c.phone as customer_phone, c.customer_code,
             CASE 
               WHEN bt.payment_status != 'Paid' AND bt.due_date < CURRENT_DATE() THEN 'Overdue' 
               ELSE bt.payment_status 
             END as current_payment_status
      FROM borrow_transactions bt
      JOIN customers c ON bt.customer_id = c.id
      WHERE c.name != 'Walk-in Customer'
    `;
    const queryParams = [];

    if (customerId) {
      query += ' AND bt.customer_id = ?';
      queryParams.push(customerId);
    }

    if (status) {
      if (status === 'Overdue') {
        query += " AND bt.payment_status != 'Paid' AND bt.due_date < CURRENT_DATE()";
      } else {
        query += ' AND bt.payment_status = ?';
        queryParams.push(status);
      }
    }

    query += ' ORDER BY bt.borrow_date DESC, bt.created_at DESC';

    const [transactions] = await req.db.query(query, queryParams);
    
    // Map the current_payment_status back to payment_status for consistent API delivery
    const formattedTransactions = transactions.map(t => ({
      ...t,
      payment_status: t.current_payment_status
    }));

    return res.status(200).json({ success: true, count: formattedTransactions.length, transactions: formattedTransactions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Udhaar Ledger & Payment History (from borrow_records table)
// @route   GET /api/borrow/history
// @access  Private
export const getBorrowHistory = async (req, res, next) => {
  try {
    const { customerId } = req.query;

    let query = `
      SELECT br.*, c.name as customer_name, c.phone as customer_phone, c.customer_code
      FROM borrow_records br
      JOIN customers c ON br.customer_id = c.id
      WHERE c.name != 'Walk-in Customer'
    `;
    const queryParams = [];

    if (customerId) {
      query += ' AND br.customer_id = ?';
      queryParams.push(customerId);
    }

    query += ' ORDER BY br.date DESC, br.created_at DESC';

    const [history] = await req.db.query(query, queryParams);
    return res.status(200).json({ success: true, count: history.length, history });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a new credit transaction (Borrow Entry)
// @route   POST /api/borrow/transactions
// @access  Private
export const addBorrowTransaction = async (req, res, next) => {
  try {
    const { customer_id, invoice_no, total_amount, borrow_date, due_date, remarks } = req.body;

    if (!customer_id || !total_amount || !borrow_date || !due_date) {
      return res.status(400).json({ success: false, message: 'Required fields: customer_id, total_amount, borrow_date, and due_date' });
    }

    const amt = Number(total_amount);
    if (amt <= 0) {
      return res.status(400).json({ success: false, message: 'Total amount must be greater than zero' });
    }

    // Verify customer exists
    const [customer] = await req.db.query('SELECT name, customer_type FROM customers WHERE id = ?', [customer_id]);
    if (customer.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (customer[0].customer_type !== 'Borrow') {
      return res.status(400).json({ success: false, message: 'Credit transactions can only be recorded for Borrow Customers.' });
    }

    // Insert transaction
    const [result] = await req.db.query(
      `INSERT INTO borrow_transactions (
        customer_id, invoice_no, borrow_date, due_date, total_amount, paid_amount, remaining_amount, payment_status, remarks, created_by
      ) VALUES (?, ?, ?, ?, ?, 0.00, ?, 'Pending', ?, ?)`,
      [customer_id, invoice_no || null, borrow_date, due_date, amt, amt, remarks || null, req.user?.id || null]
    );

    // Sync log in borrow_records (legacy ledger compatibility)
    await req.db.query(
      'INSERT INTO borrow_records (customer_id, amount, type, date, notes) VALUES (?, ?, ?, ?, ?)',
      [customer_id, amt, 'Borrow', borrow_date, remarks || `Invoice credit: ${invoice_no || 'Manual'}`]
    );

    await logActivity(
      req.user.id,
      'Create Borrow Transaction',
      'Borrow',
      `Recorded Udhaar of ₹${amt} for customer "${customer[0].name}"`,
      req.ip
    );

    await createNotification({
      tenantId: req.tenantId,
      user_id: req.user?.id,
      type: 'Customer Credit',
      title: 'Udhaar Credit Issued',
      message: `Udhaar credit of ₹${amt.toLocaleString('en-IN')} issued to "${customer[0].name}".`,
      priority: 'Medium',
      related_user: req.user?.name || req.user?.email || 'Staff',
      module: 'Customer',
      related_module: 'Customer',
      reference_id: result.insertId,
      reference_type: 'BorrowTransaction',
      target_roles: 'Admin,Manager,Staff'
    });

    return res.status(201).json({
      success: true,
      message: 'Borrow transaction recorded successfully',
      transactionId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a payback payment
// @route   POST /api/borrow/payback
// @access  Private
export const addPaybackPayment = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { customer_id, transaction_id, amount, date, remarks } = req.body;

    if (!customer_id || !amount || !date) {
      return connection.rollback(), res.status(400).json({ success: false, message: 'Required fields: customer_id, amount, and date' });
    }

    const payAmt = Number(amount);
    if (payAmt <= 0) {
      return connection.rollback(), res.status(400).json({ success: false, message: 'Payback amount must be greater than zero' });
    }

    const [customer] = await connection.query('SELECT name FROM customers WHERE id = ?', [customer_id]);
    if (customer.length === 0) {
      return connection.rollback(), res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // A. Specific transaction payment
    if (transaction_id) {
      const [tx] = await connection.query(
        'SELECT * FROM borrow_transactions WHERE id = ? AND customer_id = ?',
        [transaction_id, customer_id]
      );
      if (tx.length === 0) {
        return connection.rollback(), res.status(404).json({ success: false, message: 'Transaction not found for this customer' });
      }

      const newPaid = Number(tx[0].paid_amount) + payAmt;
      const newRemaining = Math.max(0, Number(tx[0].total_amount) - newPaid);
      let status = 'Partial Paid';
      if (newRemaining === 0) {
        status = 'Paid';
      } else if (new Date(tx[0].due_date) < new Date(date)) {
        status = 'Overdue';
      }

      await connection.query(
        'UPDATE borrow_transactions SET paid_amount = ?, remaining_amount = ?, payment_status = ? WHERE id = ?',
        [newPaid, newRemaining, status, transaction_id]
      );

      // Sync with Sales Invoice
      if (tx[0].invoice_no) {
        const [sales] = await connection.query(
          'SELECT id, total, amount_paid FROM sales WHERE invoice_no = ?',
          [tx[0].invoice_no]
        );
        if (sales.length > 0) {
          const saleObj = sales[0];
          const newSalePaid = Number(saleObj.amount_paid) + payAmt;
          const newSaleDue = Math.max(0, Number(saleObj.total) - newSalePaid);
          let saleStatus = 'Partial';
          if (newSaleDue === 0) {
            saleStatus = 'Paid';
          } else if (newSalePaid === 0) {
            saleStatus = 'Pending';
          }

          await connection.query(
            'UPDATE sales SET amount_paid = ?, due_amount = ?, balance_amount = ?, payment_date = ?, payment_status = ? WHERE id = ?',
            [newSalePaid, newSaleDue, newSaleDue, date, saleStatus, saleObj.id]
          );
        }
      }
    } else {
      // B. Generic Customer Payment: Apply to oldest unpaid transactions first
      const [unpaidTx] = await connection.query(
        `SELECT * FROM borrow_transactions 
         WHERE customer_id = ? AND payment_status != 'Paid' 
         ORDER BY borrow_date ASC, created_at ASC`,
        [customer_id]
      );

      let remainingPayment = payAmt;
      for (const tx of unpaidTx) {
        if (remainingPayment <= 0) break;

        const currentRemaining = Number(tx.remaining_amount);
        const amountToApply = Math.min(remainingPayment, currentRemaining);
        
        const newPaid = Number(tx.paid_amount) + amountToApply;
        const newRemaining = currentRemaining - amountToApply;
        let status = 'Partial Paid';
        if (newRemaining === 0) {
          status = 'Paid';
        } else if (new Date(tx.due_date) < new Date(date)) {
          status = 'Overdue';
        }

        await connection.query(
          'UPDATE borrow_transactions SET paid_amount = ?, remaining_amount = ?, payment_status = ? WHERE id = ?',
          [newPaid, newRemaining, status, tx.id]
        );

        // Sync with Sales Invoice
        if (tx.invoice_no) {
          const [sales] = await connection.query(
            'SELECT id, total, amount_paid FROM sales WHERE invoice_no = ?',
            [tx.invoice_no]
          );
          if (sales.length > 0) {
            const saleObj = sales[0];
            const newSalePaid = Number(saleObj.amount_paid) + amountToApply;
            const newSaleDue = Math.max(0, Number(saleObj.total) - newSalePaid);
            let saleStatus = 'Partial';
            if (newSaleDue === 0) {
              saleStatus = 'Paid';
            } else if (newSalePaid === 0) {
              saleStatus = 'Pending';
            }

            await connection.query(
              'UPDATE sales SET amount_paid = ?, due_amount = ?, balance_amount = ?, payment_date = ?, payment_status = ? WHERE id = ?',
              [newSalePaid, newSaleDue, newSaleDue, date, saleStatus, saleObj.id]
            );
          }
        }

        remainingPayment -= amountToApply;
      }
    }

    // Insert legacy record in borrow_records table for ledger tracking
    await connection.query(
      'INSERT INTO borrow_records (customer_id, amount, type, date, notes) VALUES (?, ?, ?, ?, ?)',
      [customer_id, payAmt, 'Payback', date, remarks || 'Udhaar Payback Payment']
    );

    // Update customer outstanding_balance in real-time
    await connection.query(
      'UPDATE customers SET outstanding_balance = GREATEST(0, COALESCE(outstanding_balance, 0) - ?) WHERE id = ?',
      [payAmt, customer_id]
    );

    await connection.commit();

    await logActivity(
      req.user.id,
      'Record Payback',
      'Borrow',
      `Recorded payment of ₹${payAmt} from customer "${customer[0].name}"`,
      req.ip
    );

    await createNotification({
      tenantId: req.tenantId,
      user_id: req.user?.id,
      type: 'Customer Payback',
      title: 'Udhaar Payback Received',
      message: `Payback payment of ₹${payAmt.toLocaleString('en-IN')} received from "${customer[0].name}".`,
      priority: 'Medium',
      related_user: req.user?.name || req.user?.email || 'Staff',
      module: 'Customer',
      related_module: 'Customer',
      reference_id: customer_id,
      reference_type: 'BorrowPayback',
      target_roles: 'Admin,Manager,Staff'
    });

    return res.status(200).json({ success: true, message: 'Payment recorded successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Get dashboard KPIs/Statistics for Customers & Udhaar
// @route   GET /api/borrow/kpis
// @access  Private
export const getBorrowKPIs = async (req, res, next) => {
  try {
    // 1. Total, Walk-in, Borrow Customers
    const [counts] = await req.db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN customer_type = 'Walk-in' THEN 1 END) as walkin,
        COUNT(CASE WHEN customer_type = 'Borrow' THEN 1 END) as borrow
      FROM customers
    `);

    // 2. Outstanding & Pending amounts
    const [balances] = await req.db.query(`
      SELECT 
        COALESCE(SUM(remaining_amount), 0) as pending_amount,
        COUNT(DISTINCT CASE WHEN payment_status != 'Paid' AND due_date < CURRENT_DATE() THEN customer_id END) as overdue_customers
      FROM borrow_transactions
      WHERE payment_status != 'Paid'
    `);

    // 3. Today's collections
    const [collections] = await req.db.query(`
      SELECT COALESCE(SUM(amount), 0) as todays_collection
      FROM borrow_records
      WHERE type = 'Payback' AND DATE(date) = CURRENT_DATE()
    `);

    return res.status(200).json({
      success: true,
      stats: {
        totalCustomers: counts[0].total,
        walkinCustomers: counts[0].walkin,
        borrowCustomers: counts[0].borrow,
        totalOutstandingAmount: balances[0].pending_amount,
        pendingBorrowAmount: balances[0].pending_amount,
        overdueCustomers: balances[0].overdue_customers,
        todaysCollections: collections[0].todays_collection
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Void credit transaction
// @route   DELETE /api/borrow/transactions/:id
// @access  Private
export const deleteBorrowTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await req.db.query('SELECT * FROM borrow_transactions WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction record not found' });
    }

    // Delete record
    await req.db.query('DELETE FROM borrow_transactions WHERE id = ?', [id]);

    await logActivity(
      req.user.id,
      'Void Borrow Transaction',
      'Borrow',
      `Voided credit transaction ID: ${id} (Amount: ₹${existing[0].total_amount})`,
      req.ip
    );

    return res.status(200).json({ success: true, message: 'Transaction voided successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Void credit or payback transaction log
// @route   DELETE /api/borrow/:id
// @access  Private
export const deleteBorrowRecord = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Check if ID exists in borrow_records
    const [records] = await connection.query('SELECT * FROM borrow_records WHERE id = ?', [id]);
    
    if (records.length > 0) {
      const rec = records[0];
      
      // If it's a Borrow entry, try deleting corresponding borrow_transaction if it exists
      if (rec.type === 'Borrow') {
        await connection.query(
          'DELETE FROM borrow_transactions WHERE customer_id = ? AND total_amount = ? AND DATE(borrow_date) = DATE(?) LIMIT 1',
          [rec.customer_id, rec.amount, rec.date]
        );
      } else if (rec.type === 'Payback') {
        // Revert payback amount on customer's borrow_transactions
        const [transactions] = await connection.query(
          `SELECT * FROM borrow_transactions 
           WHERE customer_id = ? AND paid_amount > 0 
           ORDER BY updated_at DESC, id DESC`,
          [rec.customer_id]
        );

        let remainingRevert = Number(rec.amount);
        for (const tx of transactions) {
          if (remainingRevert <= 0) break;
          const paid = Number(tx.paid_amount);
          const revertAmount = Math.min(paid, remainingRevert);
          const newPaid = paid - revertAmount;
          const newRemaining = Number(tx.remaining_amount) + revertAmount;
          const status = newPaid === 0 ? 'Pending' : 'Partial Paid';

          await connection.query(
            'UPDATE borrow_transactions SET paid_amount = ?, remaining_amount = ?, payment_status = ? WHERE id = ?',
            [newPaid, newRemaining, status, tx.id]
          );

          remainingRevert -= revertAmount;
        }
      }

      await connection.query('DELETE FROM borrow_records WHERE id = ?', [id]);
    } else {
      // Check in borrow_transactions table
      const [txs] = await connection.query('SELECT * FROM borrow_transactions WHERE id = ?', [id]);
      if (txs.length > 0) {
        await connection.query('DELETE FROM borrow_transactions WHERE id = ?', [id]);
      } else {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Transaction log record not found' });
      }
    }

    await connection.commit();

    await logActivity(
      req.user.id,
      'Void Borrow Record',
      'Borrow',
      `Voided borrow ledger record ID: ${id}`,
      req.ip
    );

    return res.status(200).json({ success: true, message: 'Transaction log voided successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};
