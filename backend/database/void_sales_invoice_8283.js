import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function voidSalesInvoice8283() {
  const targetInvoice = 'INV-2026-8283';
  console.log(`🚀 Permanently voiding sales invoice "${targetInvoice}" and restoring stock...`);
  
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const connection = await mysql.createConnection({ host, port, user, password });

  try {
    const dbName = 'shop_ayyan001';
    console.log(`Processing database: "${dbName}"...`);
    const tenantConn = await mysql.createConnection({ host, port, user, password, database: dbName });

    try {
      await tenantConn.beginTransaction();

      // 1. Fetch sale record
      const [sales] = await tenantConn.query('SELECT * FROM sales WHERE invoice_no = ?', [targetInvoice]);
      if (sales.length === 0) {
        console.log(`  ⚠️ Sales invoice "${targetInvoice}" not found or already voided.`);
        await tenantConn.rollback();
        return;
      }

      const saleObj = sales[0];
      const saleId = saleObj.id;

      // 2. Fetch sale items to restore stock
      const [items] = await tenantConn.query('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);

      for (const item of items) {
        const pId = item.product_id;
        const qtyToRestore = Number(item.quantity || 0);

        // A. Restore stock.quantity
        await tenantConn.query(
          `UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse_id = ?`,
          [qtyToRestore, pId, saleObj.warehouse_id || 1]
        );

        // B. Restore purchase_batches.remaining_quantity
        if (item.batch_number) {
          await tenantConn.query(
            `UPDATE purchase_batches SET remaining_quantity = remaining_quantity + ? WHERE product_id = ? AND batch_number = ?`,
            [qtyToRestore, pId, item.batch_number]
          );
        } else {
          // Fallback to active batch
          await tenantConn.query(
            `UPDATE purchase_batches SET remaining_quantity = remaining_quantity + ? WHERE product_id = ? ORDER BY id DESC LIMIT 1`,
            [qtyToRestore, pId]
          );
        }

        // C. Log stock restoration movement
        await tenantConn.query(
          `INSERT INTO stock_logs (product_id, warehouse_id, type, quantity, reference_no, notes, user_id)
           VALUES (?, ?, 'Stock In', ?, ?, ?, ?)`,
          [pId, saleObj.warehouse_id || 1, qtyToRestore, targetInvoice, `Void Sales Invoice ${targetInvoice} (Stock Restored)`, saleObj.user_id || 1]
        );

        console.log(`  📦 Restored ${qtyToRestore} units of product_id ${pId} into stock & batch.`);
      }

      // 3. Delete sale_items, sale_payments, borrow_transactions, borrow_records, and sales row
      await tenantConn.query('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);
      await tenantConn.query('DELETE FROM sale_payments WHERE sale_id = ?', [saleId]);
      await tenantConn.query('DELETE FROM borrow_transactions WHERE invoice_no = ?', [targetInvoice]);
      await tenantConn.query('DELETE FROM borrow_records WHERE notes LIKE ?', [`%${targetInvoice}%`]);
      await tenantConn.query('DELETE FROM sales WHERE id = ?', [saleId]);

      // 4. Update customer outstanding_balance if customer_id is assigned
      if (saleObj.customer_id && saleObj.customer_id !== 1) {
        await tenantConn.query(`
          UPDATE customers c
          SET c.outstanding_balance = COALESCE(
            (SELECT SUM(bt.remaining_amount) FROM borrow_transactions bt WHERE bt.customer_id = c.id AND bt.payment_status != 'Paid'),
            0
          )
          WHERE c.id = ?
        `, [saleObj.customer_id]);
      }

      await tenantConn.commit();
      console.log(`  ✅ Successfully voided invoice "${targetInvoice}" and restored all items to stock!`);

      // Verify stock for Amul Butter 500g (product_id 1)
      const [st] = await tenantConn.query('SELECT quantity FROM stock WHERE product_id = 1');
      const [pb] = await tenantConn.query('SELECT remaining_quantity FROM purchase_batches WHERE product_id = 1 AND batch_number = \'BATCH-1785499176202\'');
      console.log(`  📊 Verified Product 1 Stock Quantity: ${st[0]?.quantity}`);
      console.log(`  📊 Verified Product 1 Batch Quantity: ${pb[0]?.remaining_quantity}`);

    } catch (err) {
      await tenantConn.rollback();
      console.error(`  ❌ Error voiding "${targetInvoice}":`, err.message);
    } finally {
      await tenantConn.end();
    }
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

voidSalesInvoice8283();
