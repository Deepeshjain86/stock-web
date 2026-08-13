import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'shop_abhishek001',
  port: Number(process.env.DB_PORT) || 3306
};

async function testPurchaseCreation() {
  console.log('--- Testing Purchase Creation Fix ---');
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL...');

    const [[prod]] = await connection.query('SELECT id, name FROM products LIMIT 1');
    const [[vend]] = await connection.query('SELECT id, name FROM vendors LIMIT 1');

    if (!prod || !vend) {
      console.log('Product or vendor missing');
      return;
    }

    console.log(`Using Product: ID ${prod.id} (${prod.name}), Vendor: ID ${vend.id} (${vend.name})`);

    // Simulate PurchaseOrderList / PurchaseForm payload
    const payload = {
      vendor_id: vend.id,
      warehouse_id: 1,
      date: new Date().toISOString().split('T')[0],
      subtotal: 100,
      discount: 0,
      gst_amount: 18,
      total: 118,
      payment_status: 'Paid',
      delivery_status: 'Received',
      payment_method: 'Cash',
      items: [
        {
          productId: prod.id, // PurchaseOrderList sends productId
          quantity: 10,
          price: 10,
          gstPercent: 18,
          total: 118
        }
      ]
    };

    // Test calling backend controller logic
    const { createPurchase } = await import('../controllers/purchaseController.js');

    const req = {
      db: {
        getConnection: async () => connection,
        query: (...args) => connection.query(...args)
      },
      body: payload,
      user: { id: 1, email: 'test@example.com' },
      ip: '127.0.0.1'
    };

    const res = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.responseData = data;
        return this;
      }
    };

    const next = function (err) {
      if (err) console.error('Controller Error:', err);
    };

    await createPurchase(req, res, next);

    console.log('Response Status:', res.statusCode);
    console.log('Response Data:', res.responseData);

    if (res.statusCode === 201 && res.responseData?.success) {
      console.log('✅ PURCHASE CREATION TEST PASSED! Status 201 Created.');
      // Cleanup created test purchase
      if (res.responseData.purchaseId) {
        await connection.query('DELETE FROM purchase_items WHERE purchase_id = ?', [res.responseData.purchaseId]);
        await connection.query('DELETE FROM supplier_payments WHERE purchase_id = ?', [res.responseData.purchaseId]);
        await connection.query('DELETE FROM vendor_ledger WHERE purchase_id = ?', [res.responseData.purchaseId]);
        await connection.query('DELETE FROM purchases WHERE id = ?', [res.responseData.purchaseId]);
        console.log('[CLEANUP] Cleaned test purchase invoice record.');
      }
    } else {
      console.error('❌ PURCHASE CREATION TEST FAILED!');
    }

  } catch (err) {
    console.error('Test Exception:', err);
  } finally {
    if (connection) await connection.end();
  }
}

testPurchaseCreation();
