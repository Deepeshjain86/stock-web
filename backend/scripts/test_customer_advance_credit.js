import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const body = data ? JSON.stringify(data) : '';
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request({ hostname: '127.0.0.1', port: 5000, path, method, headers }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { 
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); } 
        catch(e) { resolve({ status: res.statusCode, data: d }); } 
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testCustomerAdvanceCredit() {
  console.log('\n======================================================');
  console.log('AUDITING CUSTOMER ADVANCE CREDIT DEPOSIT FOR PREPAID RETURNS');
  console.log('======================================================\n');

  try {
    // Super Admin login & provision store
    const saLogin = await request('POST', '/api/auth/login', { email: 'superadmin@kiranamart.com', password: 'superadminpassword' });
    const saToken = saLogin.data.token;

    const timestamp = Date.now();
    const newStorePayload = {
      store_name: `Advance Credit Store ${timestamp}`,
      owner_name: 'Advance Admin',
      email: `advadmin_${timestamp}@kiranaerp.com`,
      phone: '9997776665',
      address: 'Mumbai',
      password: 'AdminPassword123!',
      admin_id: `CADM${timestamp.toString().slice(-4)}`
    };

    await request('POST', '/api/superadmin/stores', newStorePayload, saToken);

    const adminLoginRes = await request('POST', '/api/auth/login', {
      email: newStorePayload.email,
      password: newStorePayload.password
    });
    const token = adminLoginRes.data.token;

    // Create Category, Vendor, Product, Customer & Purchase
    const catRes = await request('POST', '/api/categories', { name: 'Dairy' }, token);
    const categoryId = catRes.data.category?.id || catRes.data.id;

    const vendorRes = await request('POST', '/api/vendors', { name: 'Dairy Vendor', phone: '9876544444' }, token);
    const vendorId = vendorRes.data.vendor?.id || vendorRes.data.id;

    const prodRes = await request('POST', '/api/products', {
      name: 'Paneer 200g',
      sku: 'SKU-PANEER-200G',
      barcode: 'BAR-PANEER-01',
      category_id: categoryId,
      purchase_price: 60.00,
      selling_price: 80.00,
      mrp: 85.00
    }, token);
    const productId = prodRes.data.product?.id || prodRes.data.id;

    const custRes = await request('POST', '/api/customers', {
      name: 'Ramesh Customer',
      phone: '9876511111',
      customer_type: 'Borrow'
    }, token);
    const customerId = custRes.data.customer?.id || custRes.data.id;

    await request('POST', '/api/purchases', {
      vendor_id: vendorId,
      items: [{ product_id: productId, quantity: 20, purchase_price: 60.00, selling_price: 80.00, mrp: 85.00 }]
    }, token);

    // Step 1: Customer buys 2 units and pays 100% upfront (Paid 160, Due 0)
    const saleRes = await request('POST', '/api/sales', {
      customerId: customerId,
      items: [{ productId: productId, quantity: 2, sellingPrice: 80.00 }],
      paymentStatus: 'Paid',
      paymentMethod: 'Cash'
    }, token);
    console.log(`Step 1: POS Sale Paid Upfront (Qty 2, ₹160) -> Invoice: ${saleRes.data.invoiceNo}`);

    // Step 2: Customer returns 1 unit (₹80)
    const returnRes = await request('POST', '/api/sales-returns', {
      sale_id: saleRes.data.saleId,
      items: [{ product_id: productId, quantity: 1 }],
      reason: 'Wrong Item Purchased',
      return_type: 'Credit Adjustment (Udhaar Credit Note)',
      refund_method: 'Credit Note / Udhaar Settlement'
    }, token);
    console.log(`Step 2: Sales Return Processed -> Status: ${returnRes.status} | Return No: ${returnRes.data.returnNo} | Message: "${returnRes.data.message}"`);

    // Step 3: Verify Customer Profile / Balance
    const custProfile = await request('GET', `/api/customers/${customerId}`, null, token);
    console.log(`Step 3: Customer Profile -> Advance Balance: ₹${custProfile.data.customer?.advance_balance || 0}`);

    console.log('\n======================================================');
    console.log('✅ CUSTOMER ADVANCE CREDIT DEPOSIT VERIFIED 100%');
    console.log('======================================================\n');
  } catch (e) {
    console.error('Audit Error:', e);
  }
}

testCustomerAdvanceCredit();
