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

async function testReportsAccess() {
  console.log('=== REPORTS API PERMISSION AUDIT ===\n');

  // 1. Employee Login
  const empLogin = await request('POST', '/api/auth/login', { email: 'ayyan@gmail.com', password: '123456' });
  const empToken = empLogin.d.token;
  console.log('1. Employee Login Status:', empLogin.s);

  console.log('\n2. Testing Employee Reports Access...');
  const invRes = await request('GET', '/api/reports/inventory', null, empToken);
  console.log('   /api/reports/inventory:', invRes.s === 200 ? '✅ 200 OK' : `❌ ${invRes.s}`);

  const salesRes = await request('GET', '/api/reports/sales', null, empToken);
  console.log('   /api/reports/sales:', salesRes.s === 200 ? '✅ 200 OK' : `❌ ${salesRes.s}`);

  const purRes = await request('GET', '/api/reports/purchases', null, empToken);
  console.log('   /api/reports/purchases:', purRes.s === 200 ? '✅ 200 OK' : `❌ ${purRes.s}`);

  // 3. Purchase Manager Login
  const pmLogin = await request('POST', '/api/auth/login', { email: 'rahul.purchase@kiranaerp.com', password: '123456' });
  const pmToken = pmLogin.d.token;
  console.log('\n3. Testing Purchase Manager Reports Access...');
  const pmInv = await request('GET', '/api/reports/inventory', null, pmToken);
  console.log('   /api/reports/inventory:', pmInv.s === 200 ? '✅ 200 OK' : `❌ ${pmInv.s}`);

  // 4. Sales Manager Login
  const smLogin = await request('POST', '/api/auth/login', { email: 'priya.sales@kiranaerp.com', password: '123456' });
  const smToken = smLogin.d.token;
  console.log('\n4. Testing Sales Manager Reports Access...');
  const smSales = await request('GET', '/api/reports/sales', null, smToken);
  console.log('   /api/reports/sales:', smSales.s === 200 ? '✅ 200 OK' : `❌ ${smSales.s}`);

  console.log('\n=== AUDIT COMPLETE ===');
}

testReportsAccess().catch(e => console.error(e));
