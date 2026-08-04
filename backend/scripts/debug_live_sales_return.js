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

async function testLiveReturn() {
  console.log('\n--- TESTING LIVE SALES RETURN API ---');
  try {
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'dinesh@kiranaerp.com',
      password: 'AdminPassword123!'
    });
    console.log('Login status:', loginRes.status);
    const token = loginRes.data.token;

    // Search invoice 9747
    const searchRes = await request('GET', '/api/sales-returns/search-invoice?query=9747', null, token);
    console.log('Search 9747 status:', searchRes.status);
    if (searchRes.data?.invoices?.length > 0) {
      const inv = searchRes.data.invoices[0];
      console.log('Invoice 9747 items:', inv.items);

      // Attempt return 1 unit of Maggi Noodles if eligible
      const itemToReturn = inv.items.find(i => i.remaining_qty > 0);
      if (itemToReturn) {
        console.log('Attempting return for item:', itemToReturn);
        const retRes = await request('POST', '/api/sales-returns', {
          sale_id: inv.sale_id,
          items: [{ sale_item_id: itemToReturn.sale_item_id, product_id: itemToReturn.product_id, quantity: 1 }],
          product_id: itemToReturn.product_id,
          quantity: 1,
          reason: 'Wrong Item Purchased',
          return_type: 'Credit Adjustment (Udhaar Credit Note)',
          refund_method: 'Credit Note / Udhaar Settlement',
          remarks: 'Testing live return fix'
        }, token);
        console.log('Live Return API Response status:', retRes.status, 'body:', retRes.data);
      } else {
        console.log('No eligible items remaining in 9747');
      }
    }
  } catch (e) {
    console.error('Error during live test:', e);
  }
}

testLiveReturn();
