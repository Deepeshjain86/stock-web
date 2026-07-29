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

async function testAllRolesReportsAccess() {
  console.log('=== REPORTS ACCESS FOR ALL STAFF ROLES AUDIT ===\n');

  const testAccounts = [
    { name: 'Admin', email: 'aman@kiranaerp.com' },
    { name: 'Purchase Manager', email: 'rahul.purchase@kiranaerp.com' },
    { name: 'Sales Manager', email: 'priya.sales@kiranaerp.com' },
    { name: 'Purchase Employee', email: 'mohit@kiranaerp.com' },
    { name: 'Sales Employee', email: 'suresh@kiranaerp.com' },
    { name: 'General Employee', email: 'ayyan@gmail.com' }
  ];

  for (const acc of testAccounts) {
    console.log(`Testing Role: ${acc.name} (${acc.email})...`);
    const login = await request('POST', '/api/auth/login', { email: acc.email, password: '123456' });
    if (login.s !== 200) {
      console.log(`   Login failed: ${login.s}`);
      continue;
    }
    const token = login.d.token;

    const inv = await request('GET', '/api/reports/inventory?startDate=2026-06-24&endDate=2026-07-24&categoryId=&brandId=&vendorId=&customerId=&employeeId=', null, token);
    const sal = await request('GET', '/api/reports/sales?startDate=2026-06-24&endDate=2026-07-24&categoryId=&brandId=&vendorId=&customerId=&employeeId=', null, token);
    const pur = await request('GET', '/api/reports/purchases?startDate=2026-06-24&endDate=2026-07-24&categoryId=&brandId=&vendorId=&customerId=&employeeId=', null, token);

    console.log(`   Inventory Report: ${inv.s === 200 ? '✅ 200 OK' : `❌ ${inv.s}`}`);
    console.log(`   Sales Report:     ${sal.s === 200 ? '✅ 200 OK' : `❌ ${sal.s}`}`);
    console.log(`   Purchase Report:  ${pur.s === 200 ? '✅ 200 OK' : `❌ ${pur.s}`}\n`);
  }

  console.log('=== AUDIT COMPLETE ===');
}

testAllRolesReportsAccess().catch(e => console.error(e));
