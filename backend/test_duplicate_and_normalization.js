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

async function runAudit() {
  console.log('=== ENTERPRISE RELATIONAL NORMALIZATION & DUPLICATE VALIDATION AUDIT ===\n');

  // 1. Login as Admin
  const login = await request('POST', '/api/auth/login', { email: 'aman@kiranaerp.com', password: '123456' });
  const t = login.d.token;
  console.log('1. Login:', login.s === 200 ? 'PASS' : 'FAIL');

  // 2. Test Duplicate Main Category
  console.log('\n2. Testing Duplicate Main Category Prevention...');
  const catList = await request('GET', '/api/categories', null, t);
  const existingCatName = catList.d.categories?.[0]?.name || 'Spices & Groceries';
  const dupCatRes = await request('POST', '/api/categories', { name: existingCatName }, t);
  console.log('   Duplicate Category Status Code:', dupCatRes.s);
  console.log('   Validation Error Message:', dupCatRes.d.message);
  console.log('   Duplicate Category Block:', dupCatRes.s === 400 ? '✅ PASS (BLOCKED)' : '❌ FAIL');

  // 3. Test Duplicate Sub Category under same parent
  console.log('\n3. Testing Duplicate Sub Category Prevention...');
  const subList = await request('GET', '/api/sub-categories', null, t);
  const existingSub = subList.d.subCategories?.[0];
  if (existingSub) {
    const dupSubRes = await request('POST', '/api/sub-categories', { name: existingSub.name, category_id: existingSub.category_id }, t);
    console.log('   Duplicate Subcategory Status Code:', dupSubRes.s);
    console.log('   Validation Error Message:', dupSubRes.d.message);
    console.log('   Duplicate Subcategory Block:', dupSubRes.s === 400 ? '✅ PASS (BLOCKED)' : '❌ FAIL');
  }

  // 4. Test Duplicate Brand
  console.log('\n4. Testing Duplicate Brand Prevention...');
  const brandList = await request('GET', '/api/brands', null, t);
  const existingBrandName = brandList.d.brands?.[0]?.name || 'Fortune';
  const dupBrandRes = await request('POST', '/api/brands', { name: existingBrandName }, t);
  console.log('   Duplicate Brand Status Code:', dupBrandRes.s);
  console.log('   Validation Error Message:', dupBrandRes.d.message);
  console.log('   Duplicate Brand Block:', dupBrandRes.s === 400 ? '✅ PASS (BLOCKED)' : '❌ FAIL');

  // 5. Test Master Deletion Safety
  console.log('\n5. Testing Master Deletion Safety (ERP Policy)...');
  const targetCatId = catList.d.categories?.[0]?.id || 1;
  const delRes = await request('DELETE', `/api/categories/${targetCatId}`, null, t);
  console.log('   Delete Category Response Status:', delRes.s);
  console.log('   Policy Response Message:', delRes.d.message);
  console.log('   Deletion Safety Policy:', delRes.s === 403 ? '✅ PASS (POLICY ENFORCED)' : '❌ FAIL');

  // 6. Test Real-time Relational Master Renaming & Product JOIN Sync
  console.log('\n6. Testing Real-time Relational Name Sync...');
  const testBrand = brandList.d.brands?.[0];
  if (testBrand) {
    const origName = testBrand.name;
    const updatedName = `${origName} (Normalized Sync)`;

    await request('PUT', `/api/brands/${testBrand.id}`, { name: updatedName }, t);
    const prods = await request('GET', '/api/products', null, t);
    const matchedProd = prods.d.products?.find(p => p.brand_id === testBrand.id);

    console.log('   Master updated brand name to:', updatedName);
    console.log('   Product API returned brand name via JOIN:', matchedProd?.brand);
    console.log('   Real-time Relational Sync:', matchedProd?.brand === updatedName ? '✅ PASS (SYNCHRONIZED)' : '❌ FAIL');

    // Revert
    await request('PUT', `/api/brands/${testBrand.id}`, { name: origName }, t);
    console.log('   Reverted master brand back to:', origName);
  }

  console.log('\n=== AUDIT COMPLETE ===');
}

runAudit().catch(e => console.error(e));
