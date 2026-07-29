import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runFix = async () => {
  console.log('[Fix] Connecting to MySQL...');
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
    console.log(`[Fix] Found ${tenants.length} tenant database(s).`);

    const dbNames = [masterDb, ...tenants.map(t => t.database_name)];

    for (const dbName of dbNames) {
      if (dbName === masterDb) continue;
      console.log(`\n==========================================`);
      console.log(`[Fix] Database: "${dbName}"`);
      console.log(`==========================================`);

      await conn.query(`USE \`${dbName}\`;`);

      const vendorCols = [
        ['opening_balance', 'DECIMAL(12,2) DEFAULT 0.00'],
        ['opening_balance_type', "VARCHAR(20) DEFAULT 'Payable'"],
        ['credit_limit', 'DECIMAL(12,2) DEFAULT 0.00'],
        ['total_purchases', 'DECIMAL(12,2) DEFAULT 0.00'],
        ['total_paid', 'DECIMAL(12,2) DEFAULT 0.00'],
        ['outstanding_balance', 'DECIMAL(12,2) DEFAULT 0.00'],
        ['alternate_phone', 'VARCHAR(20) NULL'],
        ['pan', 'VARCHAR(15) NULL'],
        ['bank_name', 'VARCHAR(100) NULL'],
        ['account_number', 'VARCHAR(50) NULL'],
        ['ifsc_code', 'VARCHAR(20) NULL']
      ];

      for (const col of vendorCols) {
        try {
          await conn.query(`ALTER TABLE vendors ADD COLUMN ${col[0]} ${col[1]};`);
          console.log(`  -> Added ${col[0]} column to vendors.`);
        } catch (err) {
          if (err.code !== 'ER_DUP_COLUMN_NAME') {
            console.error(`  -> Column ${col[0]} check:`, err.message);
          }
        }
      }

      // Reset opening_balance to 0 for Sanjay Mehta & Vivek Sharma where it was falsely defaulted to 12500
      await conn.query(`
        UPDATE vendors 
        SET opening_balance = 0.00, opening_balance_type = 'Payable'
        WHERE name LIKE '%Sanjay Mehta%' OR name LIKE '%Vivek Sharma%';
      `);

      // Recalculate all vendor balances
      const [vendors] = await conn.query(`
        SELECT v.id, v.name, v.opening_balance, v.opening_balance_type,
               COALESCE((SELECT SUM(p.total) FROM purchases p WHERE p.vendor_id = v.id), 0) as gross,
               COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.vendor_id = v.id), 0) as paid,
               COALESCE((SELECT SUM(pr.total_amount) FROM purchase_returns pr WHERE pr.vendor_id = v.id), 0) as returns
        FROM vendors v
      `);

      for (const v of vendors) {
        const gross = Number(v.gross || 0);
        const paid = Number(v.paid || 0);
        const returns = Number(v.returns || 0);
        const net = Math.max(0, gross - returns);
        const opening = v.opening_balance_type === 'Advance' ? -Number(v.opening_balance || 0) : Number(v.opening_balance || 0);
        const totalObligation = net + opening;
        const diff = totalObligation - paid;

        let calcOutstanding = 0;

        if (diff > 0) {
          calcOutstanding = Number(diff.toFixed(2));
        }

        await conn.query(
          `UPDATE vendors SET total_purchases = ?, total_paid = ?, outstanding_balance = ? WHERE id = ?`,
          [gross, paid, calcOutstanding, v.id]
        );

        console.log(`  -> Updated "${v.name}": Gross=₹${gross}, Returns=₹${returns}, Net=₹${net}, Paid=₹${paid}, Outstanding=₹${calcOutstanding}`);
      }
    }

    console.log('\n==========================================');
    console.log('[Fix] SANJAY MEHTA & VIVEK SHARMA RECALCULATION & REPAIR COMPLETE!');
    console.log('==========================================\n');
  } catch (error) {
    console.error('[Fix] Failed:', error);
  } finally {
    await conn.end();
  }
};

runFix();
