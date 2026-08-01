import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function fixAjayInvoice3099() {
  const targetInvoice = 'INV-2026-3099';
  console.log(`🚀 Fixing split credit invoice "${targetInvoice}" for customer Ajay...`);

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const tenantConn = await mysql.createConnection({ host, port, user, password, database: 'shop_ayyan001' });

  try {
    await tenantConn.beginTransaction();

    // 1. Fetch sale record
    const [sales] = await tenantConn.query('SELECT * FROM sales WHERE invoice_no = ?', [targetInvoice]);
    if (sales.length === 0) {
      console.log(`  ⚠️ Sales invoice "${targetInvoice}" not found.`);
      await tenantConn.rollback();
      return;
    }

    const sale = sales[0];
    const customerId = sale.customer_id;

    // Split amounts: Total = 278, Cash = 8, Credit = 270
    const totalAmount = 278.00;
    const actualPaid = 8.00;
    const dueAmount = 270.00;

    // 2. Update sales table record
    await tenantConn.query(`
      UPDATE sales 
      SET amount_paid = ?, due_amount = ?, balance_amount = ?, payment_status = 'Partial'
      WHERE id = ?
    `, [actualPaid, dueAmount, dueAmount, sale.id]);

    console.log(`  ✅ Updated sales record for ${targetInvoice}: Paid ₹${actualPaid}, Due ₹${dueAmount}, Status: Partial`);

    // 3. Remove old borrow_transactions / borrow_records if any
    await tenantConn.query('DELETE FROM borrow_transactions WHERE invoice_no = ?', [targetInvoice]);
    await tenantConn.query('DELETE FROM borrow_records WHERE notes LIKE ?', [`%${targetInvoice}%`]);

    // 4. Insert borrow_transactions record
    const borrowDate = sale.date ? new Date(sale.date).toISOString().slice(0, 10) : '2026-07-31';
    const dueDate = '2026-08-15';

    await tenantConn.query(`
      INSERT INTO borrow_transactions (
        customer_id, invoice_no, borrow_date, due_date, total_amount, paid_amount, remaining_amount, payment_status, remarks, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Partial Paid', ?, ?)
    `, [
      customerId,
      targetInvoice,
      borrowDate,
      dueDate,
      totalAmount,
      actualPaid,
      dueAmount,
      `POS split credit invoice: ${targetInvoice}`,
      sale.user_id || 1
    ]);

    console.log(`  ✅ Created borrow_transaction for Ajay: Total ₹${totalAmount}, Paid ₹${actualPaid}, Remaining ₹${dueAmount}, Status: Partial Paid`);

    // 5. Insert borrow_records for Borrow and Payback
    await tenantConn.query(`
      INSERT INTO borrow_records (customer_id, amount, type, date, notes) VALUES (?, ?, 'Borrow', ?, ?)
    `, [customerId, totalAmount, borrowDate, `POS credit invoice: ${targetInvoice}`]);

    await tenantConn.query(`
      INSERT INTO borrow_records (customer_id, amount, type, date, notes) VALUES (?, ?, 'Payback', ?, ?)
    `, [customerId, actualPaid, borrowDate, `Upfront payment for invoice: ${targetInvoice}`]);

    // 6. Recalculate customer outstanding_balance
    await tenantConn.query(`
      UPDATE customers c
      SET c.outstanding_balance = COALESCE(
        (SELECT SUM(bt.remaining_amount) FROM borrow_transactions bt WHERE bt.customer_id = c.id AND bt.payment_status != 'Paid'),
        0
      )
      WHERE c.id = ?
    `, [customerId]);

    const [cust] = await tenantConn.query('SELECT id, name, outstanding_balance FROM customers WHERE id = ?', [customerId]);
    console.log(`  ✅ Updated Customer Outstanding Balance for "${cust[0]?.name}": ₹${cust[0]?.outstanding_balance}`);

    await tenantConn.commit();
    console.log(`  🎉 Successfully fixed invoice "${targetInvoice}"!`);
  } catch (err) {
    await tenantConn.rollback();
    console.error('  ❌ Error:', err.message);
  } finally {
    await tenantConn.end();
    process.exit(0);
  }
}

fixAjayInvoice3099();
