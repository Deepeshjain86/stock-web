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

async function runParentSyncTest() {
  console.log('=== SUBCATEGORY PARENT CATEGORY DYNAMIC SYNC AUDIT ===\n');

  // 1. Login
  const login = await request('POST', '/api/auth/login', { email: 'aman@kiranaerp.com', password: '123456' });
  const t = login.d.token;
  console.log('1. Login:', login.s === 200 ? 'PASS' : 'FAIL');

  // 2. Fetch 'peanuts' product
  const prodsRes = await request('GET', '/api/products', null, t);
  const peanuts = prodsRes.d.products?.find(p => p.name.toLowerCase().includes('peanut'));
  console.log('\n2. Found Product "peanuts":');
  console.log('   Product ID:', peanuts?.id);
  console.log('   Subcategory ID:', peanuts?.sub_category_id, `(${peanuts?.sub_category})`);
  console.log('   Current Main Category:', peanuts?.category);

  // 3. Fetch subcategories to find 'namkeen'
  const subRes = await request('GET', '/api/sub-categories', null, t);
  const namkeenSub = subRes.d.subCategories?.find(s => s.name.toLowerCase() === 'namkeen');
  console.log('\n3. Found Subcategory "namkeen":');
  console.log('   Subcategory ID:', namkeenSub?.id);
  console.log('   Parent Category ID:', namkeenSub?.category_id, `(${namkeenSub?.category_name})`);

  // 4. Fetch main categories to switch parent category
  const catRes = await request('GET', '/api/categories', null, t);
  const beveragesCat = catRes.d.categories?.find(c => c.name.toLowerCase().includes('beverage')) || catRes.d.categories?.[0];
  const snacksCat = catRes.d.categories?.find(c => c.name.toLowerCase().includes('snacks')) || catRes.d.categories?.[1];

  if (namkeenSub && beveragesCat && snacksCat) {
    const targetCat = namkeenSub.category_id === beveragesCat.id ? snacksCat : beveragesCat;
    console.log(`\n4. Updating Subcategory "${namkeenSub.name}" Parent Category -> "${targetCat.name}" (ID: ${targetCat.id})...`);

    const updateSubRes = await request('PUT', `/api/sub-categories/${namkeenSub.id}`, {
      name: namkeenSub.name,
      category_id: targetCat.id
    }, t);

    console.log('   Subcategory Parent Update Result:', updateSubRes.s === 200 ? 'PASS' : 'FAIL');

    // 5. Fetch products again to verify real-time sync
    const recheckProds = await request('GET', '/api/products', null, t);
    const updatedPeanuts = recheckProds.d.products?.find(p => p.id === peanuts.id);
    console.log('\n5. Checking Products Panel for dynamic parent category update...');
    console.log('   Returned Main Category:', updatedPeanuts?.category);

    const isSyncSuccessful = updatedPeanuts?.category === targetCat.name;
    console.log('   Dynamic Parent Category Sync:', isSyncSuccessful ? '✅ PASS (SYNCHRONIZED REAL-TIME)' : '❌ FAIL');

    // Revert back to Snacks & Packaged Foods
    console.log(`\n6. Reverting Subcategory "${namkeenSub.name}" Parent Category back to "${snacksCat.name}"...`);
    await request('PUT', `/api/sub-categories/${namkeenSub.id}`, {
      name: namkeenSub.name,
      category_id: snacksCat.id
    }, t);
    console.log('   Revert Complete.');
  }

  console.log('\n=== SUBCATEGORY PARENT CATEGORY DYNAMIC SYNC AUDIT COMPLETE ===');
}

runParentSyncTest().catch(e => console.error(e));
