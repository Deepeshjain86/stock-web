import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const audit = async () => {
  console.log('[Audit] Connecting to MySQL...');
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    await conn.query(`USE \`${masterDb}\`;`);
    const [tenants] = await conn.query('SELECT id, store_name, database_name FROM tenants');
    console.log(`[Audit] Found ${tenants.length} tenant database(s).`);

    const dbNames = [masterDb, ...tenants.map(t => t.database_name)];

    for (const dbName of dbNames) {
      if (dbName === masterDb) continue;
      console.log(`\n==========================================`);
      console.log(`[Audit] Database: "${dbName}"`);
      console.log(`==========================================`);

      await conn.query(`USE \`${dbName}\`;`);

      const [vendors] = await conn.query(`
        SELECT v.id, v.name, v.company_name, v.opening_balance, v.opening_balance_type, v.total_purchases, v.total_paid, v.outstanding_balance,
               COALESCE((SELECT SUM(p.total) FROM purchases p WHERE p.vendor_id = v.id), 0) as total_purchases_calc,
               COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.vendor_id = v.id), 0) as total_paid_calc,
               COALESCE((SELECT SUM(pr.total_amount) FROM purchase_returns pr WHERE pr.vendor_id = v.id), 0) as total_returns_calc
        FROM vendors v
      `);

      for (const v of vendors) {
        const gross = Number(v.total_purchases_calc || 0);
        const paid = Number(v.total_paid_calc || 0);
        const returns = Number(v.total_returns_calc || 0);
        const net = Math.max(0, gross - returns);
        const opening = v.opening_balance_type === 'Advance' ? -Number(v.opening_balance || 0) : Number(v.opening_balance || 0);
        const totalObligation = net + opening;
        const diff = totalObligation - paid;

        let calcOutstanding = 0;
        let calcAdvance = 0;
        let calcStatus = 'Paid';

        if (diff > 0) {
          calcOutstanding = Number(diff.toFixed(2));
          calcStatus = paid > 0 ? 'Partial' : 'Pending';
        } else if (diff < 0) {
          calcAdvance = Number(Math.abs(diff).toFixed(2));
          calcStatus = 'Advance';
        } else {
          calcStatus = 'Paid';
        }

        console.log(`\nSupplier ID: ${v.id} | Name: "${v.name}"`);
        console.log(`  -> Gross Purchases : ${gross}`);
        console.log(`  -> Purchase Returns: ${returns}`);
        console.log(`  -> Net Purchases   : ${net}`);
        console.log(`  -> Total Paid      : ${paid}`);
        console.log(`  -> Opening Balance : ${v.opening_balance} (${v.opening_balance_type || 'Payable'})`);
        console.log(`  -> Obligation Diff : ${diff}`);
        console.log(`  -> Calc Outstanding: ${calcOutstanding}`);
        console.log(`  -> Calc Advance    : ${calcAdvance}`);
        console.log(`  -> Calc Status     : ${calcStatus}`);

        // Update DB table vendors columns to match exact dynamic calculations
        await conn.query(
          `UPDATE vendors SET total_purchases = ?, total_paid = ?, outstanding_balance = ? WHERE id = ?`,
          [gross, paid, calcOutstanding, v.id]
        );
      }
    }

    console.log('\n==========================================');
    console.log('[Audit] SUPPLIERS AUDIT & DB COLUMN SYNC COMPLETED SUCCESSFULLY!');
    console.log('==========================================\n');
  } catch (error) {
    console.error('[Audit] Failed:', error);
  } finally {
    await conn.end();
  }
};

audit();
