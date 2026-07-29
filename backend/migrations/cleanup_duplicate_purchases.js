import mysql from 'mysql2/promise';

/**
 * Migration Script: Cleanup Duplicate Purchase Invoices & Correct Payment Statuses
 */
async function runCleanup() {
  console.log('=== STARTING PURCHASE INVOICE DEDUPLICATION & PAYMENT STATUS CORRECTION ===\n');

  const sysDb = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
  });

  const [dbs] = await sysDb.query("SHOW DATABASES LIKE 'AMAN01'");
  const [tenantDbs] = await sysDb.query("SHOW DATABASES LIKE 'kirana_erp_tenant_%'");
  
  const allTenantDbs = [
    ...dbs.map(d => Object.values(d)[0]),
    ...tenantDbs.map(d => Object.values(d)[0])
  ];

  for (const dbName of allTenantDbs) {
    console.log(`--------------------------------------------------`);
    console.log(`Processing Database: ${dbName}`);
    console.log(`--------------------------------------------------`);

    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: dbName
    });

    try {
      // 1. Find duplicate purchases (same vendor_id, total, date, created within 10 minutes)
      const [dups] = await db.query(`
        SELECT p1.id as remove_id, p1.purchase_no as remove_no, p2.id as keep_id, p2.purchase_no as keep_no
        FROM purchases p1
        JOIN purchases p2 ON p1.vendor_id = p2.vendor_id 
                         AND p1.total = p2.total 
                         AND DATE(p1.date) = DATE(p2.date)
                         AND p1.id > p2.id
                         AND ABS(TIMESTAMPDIFF(SECOND, p1.created_at, p2.created_at)) <= 600
      `);

      console.log(`  Found ${dups.length} duplicate purchase invoice(s) to remove.`);

      for (const d of dups) {
        console.log(`  [Removing Duplicate] ${d.remove_no} (ID: ${d.remove_id}) -> Kept ${d.keep_no} (ID: ${d.keep_id})`);
        
        // Remove purchase items for duplicate
        await db.query('DELETE FROM purchase_items WHERE purchase_id = ?', [d.remove_id]);
        
        // Remove vendor_ledger entries for duplicate
        await db.query('DELETE FROM vendor_ledger WHERE purchase_id = ?', [d.remove_id]);

        // Remove purchase record
        await db.query('DELETE FROM purchases WHERE id = ?', [d.remove_id]);
      }

      // 2. Correct Payment Statuses for Purchases
      // For purchases where no specific payment exists in supplier_payments or paid_amount is 0, set payment_status = 'Pending'
      const [allPurchases] = await db.query('SELECT id, purchase_no, total, payment_status, vendor_id FROM purchases');

      let correctedCount = 0;
      for (const pur of allPurchases) {
        // Check if explicit payment exists for this purchase in supplier_payments
        const [pmtRows] = await db.query('SELECT SUM(amount) as paid FROM supplier_payments WHERE purchase_id = ?', [pur.id]);
        const paidForInvoice = Number(pmtRows[0]?.paid || 0);

        let correctStatus = 'Pending';
        if (paidForInvoice >= Number(pur.total)) {
          correctStatus = 'Paid';
        } else if (paidForInvoice > 0) {
          correctStatus = 'Partial';
        } else {
          // If no specific payment record linked, check if purchase is marked Paid but vendor has zero paid payments
          if (pur.payment_status === 'Paid') {
            const [vPmts] = await db.query('SELECT COUNT(id) as cnt FROM supplier_payments WHERE vendor_id = ?', [pur.vendor_id]);
            if (vPmts[0].cnt === 0) {
              correctStatus = 'Pending';
            } else {
              correctStatus = pur.payment_status;
            }
          } else {
            correctStatus = pur.payment_status;
          }
        }

        if (pur.payment_status !== correctStatus) {
          await db.query('UPDATE purchases SET payment_status = ? WHERE id = ?', [correctStatus, pur.id]);
          console.log(`  [Status Corrected] Invoice ${pur.purchase_no}: "${pur.payment_status}" -> "${correctStatus}"`);
          correctedCount++;
        }
      }

      console.log(`  [✓] Deduplication and Payment Status Correction complete for ${dbName}. (${correctedCount} status(es) corrected)\n`);

    } catch (err) {
      console.error(`  [X] Error processing ${dbName}:`, err);
    } finally {
      await db.end();
    }
  }

  await sysDb.end();
  console.log('=== MIGRATION COMPLETED SUCCESSFULLY ===');
}

runCleanup().catch(err => console.error(err));
