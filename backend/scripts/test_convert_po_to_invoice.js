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

async function testConvertPOToInvoice() {
  console.log('====================================================');
  console.log('   TESTING PO-0002-2026 CONVERSION TO INVOICE       ');
  console.log('====================================================\n');

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // 1. Check if PO-0002-2026 exists in purchase_orders table
    const [pos] = await connection.query('SELECT * FROM purchase_orders WHERE purchase_order_no = ? LIMIT 1', ['PO-0002-2026']);
    let po;
    if (pos.length === 0) {
      console.log('[INFO] PO-0002-2026 not found in DB. Creating dummy PO-0002-2026 for testing...');
      const [[prod]] = await connection.query('SELECT id, name, purchase_price FROM products LIMIT 1');
      const [[vend]] = await connection.query('SELECT id, name FROM vendors LIMIT 1');
      
      const [resPO] = await connection.query(
        `INSERT INTO purchase_orders (purchase_order_no, vendor_id, warehouse_id, date, subtotal, discount, gst_amount, total, status, notes, user_id)
         VALUES ('PO-0002-2026', ?, 1, NOW(), 100, 0, 18, 118, 'Confirmed', 'Test PO', 1)`,
        [vend.id]
      );
      const poId = resPO.insertId;
      await connection.query(
        `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, received_quantity, purchase_price, gst, total)
         VALUES (?, ?, 10, 0, 10, 18, 118)`,
        [poId, prod.id]
      );

      const [newPO] = await connection.query('SELECT * FROM purchase_orders WHERE id = ?', [poId]);
      po = newPO[0];
    } else {
      po = pos[0];
    }

    console.log(`Found PO: ID ${po.id} (${po.purchase_order_no}) for Vendor ID ${po.vendor_id}`);

    // Fetch PO items
    const [poItems] = await connection.query(
      `SELECT poi.*, pr.name as product_name, pr.unit, pr.barcode
       FROM purchase_order_items poi
       JOIN products pr ON poi.product_id = pr.id
       WHERE poi.purchase_order_id = ?`,
      [po.id]
    );

    console.log(`PO items count: ${poItems.length}`);

    // Simulate front-end conversion payload sent from PurchaseOrderList.jsx -> purchasesAPI.create
    const itemsMapped = poItems.map(item => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity) || 1,
      purchase_price: Number(item.purchase_price || 0),
      mrp: Number(item.mrp || 0),
      gst: Number(item.gst || 0),
      total: Number(item.total) || 0
    }));

    const payload = {
      vendor_id: Number(po.vendor_id),
      warehouse_id: Number(po.warehouse_id || 1),
      date: new Date().toISOString().split('T')[0],
      subtotal: Number(po.subtotal || 0),
      discount: Number(po.discount || 0),
      gst_amount: Number(po.gst_amount || 0),
      total: Number(po.total || 0),
      payment_status: 'Pending',
      delivery_status: 'Received',
      payment_method: 'Cash',
      purchase_order_id: po.id,
      items: itemsMapped
    };

    // Invoke backend createPurchase controller directly
    const { createPurchase } = await import('../controllers/purchaseController.js');

    const req = {
      db: {
        getConnection: async () => connection,
        query: (...args) => connection.query(...args)
      },
      body: payload,
      user: { id: 1, email: 'admin@kirana.com' },
      ip: '127.0.0.1'
    };

    const res = {
      statusCode: 200,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.responseData = data;
        return this;
      }
    };

    let controllerErr = null;
    const next = function (err) {
      if (err) controllerErr = err;
    };

    await createPurchase(req, res, next);

    if (controllerErr) {
      console.error('❌ CONTROLLER ERROR ENCOUNTERED:', controllerErr);
    } else {
      console.log('Response Status:', res.statusCode);
      console.log('Response Output:', res.responseData);

      if (res.statusCode === 201 && res.responseData?.success) {
        console.log('\n====================================================');
        console.log(' ✅ PO-0002-2026 INVOICE CONVERSION SUCCESSFUL 100%');
        console.log('====================================================');
        
        // Clean up test purchase record
        if (res.responseData.purchaseId) {
          await connection.query('DELETE FROM purchase_items WHERE purchase_id = ?', [res.responseData.purchaseId]);
          await connection.query('DELETE FROM supplier_payments WHERE purchase_id = ?', [res.responseData.purchaseId]);
          await connection.query('DELETE FROM vendor_ledger WHERE purchase_id = ?', [res.responseData.purchaseId]);
          await connection.query('DELETE FROM purchases WHERE id = ?', [res.responseData.purchaseId]);
          console.log('[INFO] Cleaned up temporary test purchase invoice.');
        }
      } else {
        console.error('❌ PO CONVERSION FAILED:', res.responseData);
      }
    }

  } catch (err) {
    console.error('Test Exception:', err);
  } finally {
    if (connection) await connection.end();
  }
}

testConvertPOToInvoice();
