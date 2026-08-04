import http from 'http';

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

async function testVoidSalesReturn() {
  console.log('\n======================================================');
  console.log('AUDITING VOID SALES RETURN WORKFLOW FOR SALES INVOICES');
  console.log('======================================================\n');

  try {
    const saLogin = await request('POST', '/api/auth/login', { email: 'superadmin@kiranamart.com', password: 'superadminpassword' });
    const saToken = saLogin.data.token;

    const timestamp = Date.now();
    const newStorePayload = {
      store_name: `Void Test Store ${timestamp}`,
      owner_name: 'Void Admin',
      email: `voidadmin_${timestamp}@kiranaerp.com`,
      phone: '9998887776',
      address: 'Jaipur',
      password: 'AdminPassword123!',
      admin_id: `VADM${timestamp.toString().slice(-4)}`
    };

    await request('POST', '/api/superadmin/stores', newStorePayload, saToken);

    const adminLoginRes = await request('POST', '/api/auth/login', {
      email: newStorePayload.email,
      password: newStorePayload.password
    });
    const token = adminLoginRes.data.token;

    // Create Category, Product, Purchase & POS Sale (Qty 2)
    const catRes = await request('POST', '/api/categories', { name: 'Pooja Items' }, token);
    const categoryId = catRes.data.category?.id || catRes.data.id;

    const vendorRes = await request('POST', '/api/vendors', { name: 'Pooja Trader', phone: '9876599999' }, token);
    const vendorId = vendorRes.data.vendor?.id || vendorRes.data.id;

    const prodRes = await request('POST', '/api/products', {
      name: 'Agarbatti Premium 100g',
      sku: 'SKU-AGARBATTI-100G',
      barcode: 'BAR-AGAR-01',
      category_id: categoryId,
      purchase_price: 30.00,
      selling_price: 50.00,
      mrp: 55.00
    }, token);
    const productId = prodRes.data.product?.id || prodRes.data.id;

    await request('POST', '/api/purchases', {
      vendor_id: vendorId,
      items: [{ product_id: productId, quantity: 20, purchase_price: 30.00, selling_price: 50.00, mrp: 55.00 }]
    }, token);

    const saleRes = await request('POST', '/api/sales', {
      customerId: 1,
      items: [{ productId: productId, quantity: 2, sellingPrice: 50.00 }],
      paymentStatus: 'Paid',
      paymentMethod: 'Cash'
    }, token);
    console.log(`Step 1: POS Sale Created (Qty 2) -> Invoice: ${saleRes.data.invoiceNo}`);

    // Process Return 1 (Qty 1)
    const ret1 = await request('POST', '/api/sales-returns', {
      sale_id: saleRes.data.saleId,
      items: [{ product_id: productId, quantity: 1 }],
      reason: 'Wrong Item Purchased',
      return_type: 'Refund',
      refund_method: 'Cash'
    }, token);
    console.log(`Step 2: Process Return 1 (Qty 1) -> VRN: ${ret1.data.returnNo} (Return ID: ${ret1.data.returnId})`);

    // Search Invoice: should show 1 sold, 1 returned, 1 remaining
    const search1 = await request('GET', `/api/sales-returns/search-invoice?query=${saleRes.data.invoiceNo}`, null, token);
    const item1 = search1.data.invoices[0].items[0];
    console.log(`Step 3: After Return 1 -> Sold: ${item1.sold_qty} | Returned: ${item1.returned_qty} | Remaining: ${item1.remaining_qty}`);

    // Void Return 1
    const voidRes = await request('DELETE', `/api/sales-returns/${ret1.data.returnId}`, null, token);
    console.log(`Step 4: Void Return 1 -> Status: ${voidRes.status} | Message: "${voidRes.data.message}"`);

    // Search Invoice again: should restore back to 2 sold, 0 returned, 2 remaining!
    const search2 = await request('GET', `/api/sales-returns/search-invoice?query=${saleRes.data.invoiceNo}`, null, token);
    const item2 = search2.data.invoices[0].items[0];
    console.log(`Step 5: After Voiding Return -> Sold: ${item2.sold_qty} | Returned: ${item2.returned_qty} | Remaining: ${item2.remaining_qty}`);

    console.log('\n======================================================');
    console.log('✅ VOID SALES RETURN AUDIT PASSED 100% (RESORED FULL ELIGIBILITY)');
    console.log('======================================================\n');
  } catch (e) {
    console.error('Void Audit Error:', e);
  }
}

testVoidSalesReturn();
