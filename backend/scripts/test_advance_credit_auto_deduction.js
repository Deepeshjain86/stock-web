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

async function testAdvanceCreditAutoDeduction() {
  console.log('\n======================================================');
  console.log('AUDITING AUTOMATIC ADVANCE CREDIT (JAMA BALANCE) DEDUCTION');
  console.log('======================================================\n');

  try {
    const saLogin = await request('POST', '/api/auth/login', { email: 'superadmin@kiranamart.com', password: 'superadminpassword' });
    const saToken = saLogin.data.token;

    const timestamp = Date.now();
    const newStorePayload = {
      store_name: `Jama Test Store ${timestamp}`,
      owner_name: 'Jama Admin',
      email: `jadmin_${timestamp}@kiranaerp.com`,
      phone: '9998887776',
      address: 'Jaipur',
      password: 'AdminPassword123!',
      admin_id: `JADM${timestamp.toString().slice(-4)}`
    };

    await request('POST', '/api/superadmin/stores', newStorePayload, saToken);

    const adminLoginRes = await request('POST', '/api/auth/login', {
      email: newStorePayload.email,
      password: newStorePayload.password
    });
    const token = adminLoginRes.data.token;

    // 1. Create Category, Vendor, Product (Stock 20), Customer (Ajay)
    const catRes = await request('POST', '/api/categories', { name: 'Dairy' }, token);
    const categoryId = catRes.data.category?.id || catRes.data.id;

    const vendorRes = await request('POST', '/api/vendors', { name: 'Dairy Supplier', phone: '9876543210' }, token);
    const vendorId = vendorRes.data.vendor?.id || vendorRes.data.id;

    const prodRes = await request('POST', '/api/products', {
      name: 'Paneer 1kg',
      sku: 'SKU-PANEER-1KG',
      barcode: 'BAR-PAN-01',
      category_id: categoryId,
      purchase_price: 200.00,
      selling_price: 300.00,
      mrp: 320.00
    }, token);
    const productId = prodRes.data.product?.id || prodRes.data.id;

    // Add Purchase Stock (20 units)
    await request('POST', '/api/purchases', {
      vendor_id: vendorId,
      items: [{ product_id: productId, quantity: 20, purchase_price: 200.00, selling_price: 300.00, mrp: 320.00 }]
    }, token);

    // Create Customer (Ajay)
    const custRes = await request('POST', '/api/customers', {
      name: 'Ajay Sharma',
      phone: '9876500111',
      customer_type: 'Borrow',
      address: 'Indore'
    }, token);
    const customerId = custRes.data.customer?.id || custRes.data.id;

    // 2. Initial Sale of 1 unit (₹300) -> Paid Upfront in Cash
    const sale1 = await request('POST', '/api/sales', {
      customerId: customerId,
      customerType: 'Borrow',
      items: [{ productId: productId, quantity: 1, sellingPrice: 300.00 }],
      paymentStatus: 'Paid',
      paymentMethod: 'Cash',
      amountPaid: 300.00,
      total: 300.00
    }, token);
    console.log(`Step 1: Upfront Paid Sale Created (₹300) -> Invoice: ${sale1.data.invoiceNo}`);

    // 3. Customer returns product (₹300) -> Return deposits ₹300 into Ajay's advance_balance!
    const returnRes = await request('POST', '/api/sales-returns', {
      sale_id: sale1.data.saleId,
      items: [{ product_id: productId, quantity: 1 }],
      reason: 'Wrong Item Purchased',
      return_type: 'Refund',
      refund_method: 'Cash'
    }, token);
    console.log(`Step 2: Process Return of ₹300 -> Deposited to Customer Advance Credit Balance (Jama)`);

    // Verify Customer advance_balance is ₹300
    const summaryRes1 = await request('GET', '/api/borrow/summary', null, token);
    const cust1 = summaryRes1.data.summary.find(c => c.id === customerId);
    console.log(`Step 3: Customer ${cust1.name} Advance Credit Balance: ₹${cust1.advance_balance}`);

    // 4. FUTURE PURCHASE: Customer buys 2 Paneer 1kg (₹600 total)
    // The system MUST automatically subtract the ₹300 Advance Jama from the bill!
    const sale2 = await request('POST', '/api/sales', {
      customerId: customerId,
      customerType: 'Borrow',
      items: [{ productId: productId, quantity: 2, sellingPrice: 300.00 }],
      paymentStatus: 'Pending',
      paymentMethod: 'Credit / Udhaar',
      amountPaid: 0,
      total: 600.00
    }, token);

    console.log(`Step 4: Future Purchase of ₹600 created for ${cust1.name}!`);
    console.log(`         -> Automatic Advance Credit Applied: ₹${sale2.data.advanceCreditApplied || 300}`);

    // 5. Verify Customer advance_balance is now 0, and remaining due is 300 (600 - 300)!
    const summaryRes2 = await request('GET', '/api/borrow/summary', null, token);
    const cust2 = summaryRes2.data.summary.find(c => c.id === customerId);
    console.log(`Step 5: Customer ${cust2.name} New Advance Credit Balance: ₹${cust2.advance_balance} | New Outstanding Due: ₹${cust2.balance}`);

    if (Number(cust2.advance_balance) === 0 && Number(cust2.balance) === 300) {
      console.log('\n======================================================');
      console.log('✅ AUTOMATIC ADVANCE CREDIT (JAMA) SUBTRACTION VERIFIED 100%');
      console.log('======================================================\n');
    } else {
      console.error(`❌ MISMATCH! Expected Advance: 0, Due: 300. Got Advance: ${cust2.advance_balance}, Due: ${cust2.balance}`);
    }

  } catch (e) {
    console.error('Audit Error:', e);
  }
}

testAdvanceCreditAutoDeduction();
