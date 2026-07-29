import mysql from 'mysql2/promise';

async function syncPurchasePaymentStatuses() {
  console.log('=== STARTING PURCHASE PAYMENT STATUS & VENDOR LEDGER SYNC ===\n');

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
      // Ensure paid_amount column exists on purchases table
      const [cols] = await db.query("SHOW COLUMNS FROM purchases LIKE 'paid_amount'");
      if (cols.length === 0) {
        await db.query("ALTER TABLE purchases ADD COLUMN paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER total");
        console.log("  [+] Added missing 'paid_amount' column to purchases table.");
      }

      // 1. Sync Purchases payment_status and paid_amount
      const [purchases] = await db.query('SELECT id, purchase_no, vendor_id, total, COALESCE(paid_amount, 0) as paid_amount, payment_status FROM purchases');

      let updatedPurchases = 0;
      for (const pur of purchases) {
        const purTotal = Number(pur.total || 0);

        // Sum payments explicitly linked to this purchase
        const [linkedPmts] = await db.query('SELECT COALESCE(SUM(amount), 0) as paid FROM supplier_payments WHERE purchase_id = ?', [pur.id]);
        let paidForInvoice = Number(linkedPmts[0]?.paid || 0);

        // If no linked payment, check vendor's total payments vs prior invoices
        if (paidForInvoice === 0) {
          const [vPayments] = await db.query('SELECT COALESCE(SUM(amount), 0) as total_v_paid FROM supplier_payments WHERE vendor_id = ?', [pur.vendor_id]);
          const totalVPaid = Number(vPayments[0]?.total_v_paid || 0);
          if (totalVPaid === 0) {
            paidForInvoice = 0;
          } else {
            paidForInvoice = Number(pur.paid_amount || 0);
          }
        }

        let newStatus = 'Pending';
        if (paidForInvoice >= purTotal && purTotal > 0) {
          newStatus = 'Paid';
        } else if (paidForInvoice > 0) {
          newStatus = 'Partial';
        } else {
          newStatus = 'Pending';
          paidForInvoice = 0;
        }

        if (pur.payment_status !== newStatus || Number(pur.paid_amount) !== paidForInvoice) {
          await db.query(
            'UPDATE purchases SET paid_amount = ?, payment_status = ? WHERE id = ?',
            [paidForInvoice, newStatus, pur.id]
          );
          console.log(`  [Purchase Updated] ${pur.purchase_no} (Vendor ID: ${pur.vendor_id}): "${pur.payment_status}" -> "${newStatus}" (Paid: ₹${paidForInvoice}/₹${purTotal})`);
          updatedPurchases++;
        }
      }

      // 2. Sync Vendors Aggregate Totals
      const [vCols] = await db.query("SHOW COLUMNS FROM vendors LIKE 'opening_balance'");
      const hasOpenBal = vCols.length > 0;
      const [vendors] = await db.query(`SELECT id, name ${hasOpenBal ? ', opening_balance' : ''} FROM vendors`);
      let updatedVendors = 0;

      for (const v of vendors) {
        const [allInvoices] = await db.query('SELECT COALESCE(SUM(total), 0) as sum_total FROM purchases WHERE vendor_id = ?', [v.id]);
        const [allPayments] = await db.query('SELECT COALESCE(SUM(amount), 0) as sum_paid FROM supplier_payments WHERE vendor_id = ?', [v.id]);
        const [allReturns] = await db.query('SELECT COALESCE(SUM(total_amount), 0) as sum_returns FROM purchase_returns WHERE vendor_id = ?', [v.id]);

        const totalPurchases = Number(allInvoices[0].sum_total || 0);
        const totalPaid = Number(allPayments[0].sum_paid || 0);
        const totalReturns = Number(allReturns[0].sum_returns || 0);
        const openingBal = Number(v.opening_balance || 0);
        const newOutstanding = Math.max(0, (totalPurchases + openingBal) - (totalPaid + totalReturns));

        await db.query(
          `UPDATE vendors 
           SET total_purchases = ?, total_paid = ?, outstanding_balance = ? 
           WHERE id = ?`,
          [totalPurchases, totalPaid, newOutstanding, v.id]
        );
        console.log(`  [Vendor Synced] ${v.name}: Total Purchases = ₹${totalPurchases}, Total Paid = ₹${totalPaid}, Outstanding = ₹${newOutstanding}`);
        updatedVendors++;
      }

      console.log(`  [✓] Sync completed for database: ${dbName}. (${updatedPurchases} purchases updated, ${updatedVendors} vendors updated)\n`);

    } catch (err) {
      console.error(`  [X] Error syncing database ${dbName}:`, err.message);
    } finally {
      await db.end();
    }
  }

  await sysDb.end();
  console.log('=== SYNC SCRIPT COMPLETE ===');
}

syncPurchasePaymentStatuses().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
