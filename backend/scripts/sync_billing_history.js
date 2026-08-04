import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function syncBillingHistory() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  console.log('\n======================================================');
  console.log('SYNCING BILLING HISTORY INVOICES FOR OFFICIAL STORES');
  console.log('======================================================\n');

  const officialInvoices = [
    {
      tenant_id: 1,
      transaction_id: 'TXN-SAAS-2026-0001',
      amount: 6000.00,
      plan: 'Yearly',
      payment_status: 'Paid',
      billing_date: '2026-07-15',
      next_renewal_date: '2027-07-15',
      payment_method: 'SuperAdmin Override'
    },
    {
      tenant_id: 2,
      transaction_id: 'TXN-SAAS-2026-0002',
      amount: 2100.00,
      plan: 'Quarterly',
      payment_status: 'Paid',
      billing_date: '2026-07-31',
      next_renewal_date: '2026-10-31',
      payment_method: 'SuperAdmin Override'
    },
    {
      tenant_id: 3,
      transaction_id: 'TXN-SAAS-2026-0003',
      amount: 3600.00,
      plan: 'Half-Yearly',
      payment_status: 'Paid',
      billing_date: '2026-08-04',
      next_renewal_date: '2027-02-04',
      payment_method: 'SuperAdmin Override'
    }
  ];

  for (const inv of officialInvoices) {
    const [existing] = await masterDb.query('SELECT id FROM billing_history WHERE transaction_id = ?', [inv.transaction_id]);
    if (existing.length === 0) {
      await masterDb.query(
        `INSERT INTO billing_history (tenant_id, transaction_id, amount, plan, payment_status, billing_date, next_renewal_date, payment_method)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [inv.tenant_id, inv.transaction_id, inv.amount, inv.plan, inv.payment_status, inv.billing_date, inv.next_renewal_date, inv.payment_method]
      );
      console.log(`Inserted billing history transaction: ${inv.transaction_id} (₹${inv.amount}) for Tenant ${inv.tenant_id}`);
    }
  }

  const [revRes] = await masterDb.query('SELECT SUM(amount) as total FROM billing_history WHERE payment_status = "Paid"');
  console.log(`\n✅ Total Paid Billing Revenue in Master DB: ₹${revRes[0].total}`);

  await masterDb.end();
}

syncBillingHistory();
