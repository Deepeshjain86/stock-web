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

async function runAccessAudit() {
  console.log('=== EMPLOYEE OPERATIONAL MODULE ACCESS AUDIT ===\n');

  // 1. Admin Login
  const adminLogin = await request('POST', '/api/auth/login', { email: 'aman@kiranaerp.com', password: '123456' });
  const adminToken = adminLogin.d.token;

  // 2. Fetch Roles & Create Employee
  const rolesRes = await request('GET', '/api/users/roles', null, adminToken);
  const empRoleId = rolesRes.d.roles.find(r => r.name === 'Employee').id;

  const testEmail = `anoop.employee.${Date.now()}@kiranamart.com`;
  console.log('1. Admin Creating General Employee ("Anoop Operational Employee")...');
  const createRes = await request('POST', '/api/users', {
    name: 'Anoop Operational Employee',
    email: testEmail,
    password: 'password123',
    role_id: empRoleId,
    department: 'General'
  }, adminToken);
  console.log('   Create Employee Status:', createRes.s === 201 ? '201 Created' : 'FAIL');

  // 3. Login as Employee & Audit Permissions
  console.log('\n2. Employee Login & Operational Rights Verification...');
  const empLogin = await request('POST', '/api/auth/login', { email: testEmail, password: 'password123' });
  const empToken = empLogin.d.token;
  console.log('   Employee Login Status:', empLogin.s);
  
  const perms = empLogin.d.user?.permissions || [];
  console.log('   Total Operational Permissions Assigned:', perms.length);

  // Test accessing operational endpoints
  const vRes = await request('GET', '/api/vendors', null, empToken);
  console.log('   Supplier Master Access (GET /api/vendors):', vRes.s === 200 ? '✅ 200 OK (ALLOWED)' : `❌ ${vRes.s}`);

  const sRes = await request('GET', '/api/stock', null, empToken);
  console.log('   Stock Management Access (GET /api/stock):', sRes.s === 200 ? '✅ 200 OK (ALLOWED)' : `❌ ${sRes.s}`);

  const purRes = await request('GET', '/api/purchases', null, empToken);
  console.log('   Purchase Entries Access (GET /api/purchases):', purRes.s === 200 ? '✅ 200 OK (ALLOWED)' : `❌ ${purRes.s}`);

  const salRes = await request('GET', '/api/sales', null, empToken);
  console.log('   Sales Entries Access (GET /api/sales):', salRes.s === 200 ? '✅ 200 OK (ALLOWED)' : `❌ ${salRes.s}`);

  const staffRes = await request('GET', '/api/users', null, empToken);
  console.log('   Staff Management Access (GET /api/users):', staffRes.s === 403 ? '✅ 403 FORBIDDEN (RESTRICTED AS EXPECTED)' : `❌ ${staffRes.s}`);

  console.log('\n=== AUDIT COMPLETE ===');
}

runAccessAudit().catch(e => console.error(e));
