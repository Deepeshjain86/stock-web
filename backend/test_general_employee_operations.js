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

async function testGeneralEmployee() {
  console.log('=== GENERAL STORE EMPLOYEE DASHBOARD & NO STAFF MANAGEMENT AUDIT ===\n');

  // 1. Admin Login
  const adminLogin = await request('POST', '/api/auth/login', { email: 'aman@kiranaerp.com', password: '123456' });
  const adminToken = adminLogin.d.token;
  console.log('1. Admin Login Status:', adminLogin.s === 200 ? '200 OK' : 'FAIL');

  // 2. Fetch Roles
  const rolesRes = await request('GET', '/api/users/roles', null, adminToken);
  const empRole = rolesRes.d.roles.find(r => r.name === 'Employee');

  // 3. Register General Store Employee
  const testEmail = `ramesh.store.${Date.now()}@kiranamart.com`;
  console.log('\n2. Admin Registering General Store Employee ("Ramesh Store")...');
  const createRes = await request('POST', '/api/users', {
    name: 'Ramesh Store Employee',
    email: testEmail,
    contact: '9876543211',
    password: 'password123',
    role_id: empRole.id,
    department: 'General',
    permission_ids: [1, 3, 5, 8, 10, 12, 15] // Sales + Purchase + Stock + POS
  }, adminToken);

  console.log('   Create Employee Status:', createRes.s);
  console.log('   Create Employee Result:', createRes.d.message);
  console.log('   Create Check:', createRes.s === 201 ? '✅ PASS' : '❌ FAIL');

  // 4. Employee Login & Permission Security Audit
  console.log('\n3. Employee Login & Permission Security Audit...');
  const empLogin = await request('POST', '/api/auth/login', { email: testEmail, password: 'password123' });
  console.log('   Employee Login Status:', empLogin.s);
  console.log('   Employee Role:', empLogin.d.user?.role);
  console.log('   Employee Department:', empLogin.d.user?.department);
  
  const perms = empLogin.d.user?.permissions || [];
  const hasStaffMgmt = perms.includes('manage_users') || perms.includes('view_staff');
  console.log('   Staff Management Permission Check:', !hasStaffMgmt ? '✅ PASS (RESTRICTED / NO STAFF MANAGEMENT)' : '❌ FAIL (UNAUTHORIZED ACCESS)');

  console.log('\n=== AUDIT COMPLETE ===');
}

testGeneralEmployee().catch(e => console.error(e));
