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
      res.on('end', () => { try { resolve({ s: res.statusCode, d: JSON.parse(d) }); } catch(e) { resolve({ s: res.statusCode, d }); } });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testRelationalSync() {
  console.log('=== TESTING REAL-TIME RELATIONAL CATEGORY/BRAND SYNCHRONIZATION ===\n');

  const login = await request('POST', '/api/auth/login', { email: 'aman@kiranaerp.com', password: '123456' });
  const t = login.d.token;
  console.log('1. Login:', login.s === 200 ? 'PASS' : 'FAIL');

  const brandsRes = await request('GET', '/api/brands', null, t);
  const fortuneBrand = brandsRes.d.brands?.find(b => b.name.includes('Fortune')) || brandsRes.d.brands?.[0];
  console.log('\n2. Found Target Brand:', fortuneBrand ? `${fortuneBrand.name} (ID: ${fortuneBrand.id})` : 'NOT FOUND');

  if (fortuneBrand) {
    const originalName = fortuneBrand.name;
    const testUpdatedName = originalName.includes('(ERP Relational Test)') ? originalName.replace(' (ERP Relational Test)', '') : originalName + ' (ERP Relational Test)';

    console.log(`\n3. Updating Brand Master ID ${fortuneBrand.id} from "${originalName}" -> "${testUpdatedName}"...`);
    const updateBrandRes = await request('PUT', `/api/brands/${fortuneBrand.id}`, { name: testUpdatedName, status: 'Active' }, t);
    console.log('   Brand Master Update Result:', updateBrandRes.s === 200 ? 'PASS' : 'FAIL');

    console.log('\n4. Checking Products API for dynamic JOIN update...');
    const prodsRes = await request('GET', '/api/products', null, t);
    const updatedProd = prodsRes.d.products?.find(p => p.brand_id === fortuneBrand.id);
    console.log('   Product returned brand name:', updatedProd?.brand);
    const syncSuccess = updatedProd?.brand === testUpdatedName;
    console.log('   Real-time Relational Brand Sync:', syncSuccess ? '✅ PASS (SYNCHRONIZED)' : '❌ FAIL');

    console.log('\n5. Checking Inventory Report API for dynamic JOIN update...');
    const invReportRes = await request('GET', '/api/reports/inventory', null, t);
    const reportProd = invReportRes.d.report?.find(p => p.id === updatedProd?.id);
    console.log('   Report returned prod object:', reportProd);
    console.log('   Report returned brand name:', reportProd?.brand);
    console.log('   Inventory Report Relational Sync:', reportProd?.brand === testUpdatedName ? '✅ PASS (SYNCHRONIZED)' : '❌ FAIL');

    console.log(`\n6. Reverting Brand Master back to "${originalName}"...`);
    await request('PUT', `/api/brands/${fortuneBrand.id}`, { name: originalName, status: 'Active' }, t);
    console.log('   Revert Complete.');
  }

  console.log('\n=== REAL-TIME RELATIONAL SYNCHRONIZATION AUDIT COMPLETE ===');
}

testRelationalSync().catch(e => console.error('Test Error:', e));
