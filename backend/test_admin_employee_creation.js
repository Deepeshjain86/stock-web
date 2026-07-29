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

async function testEmployeeCreation() {
  console.log('=== ADMIN EMPLOYEE REGISTRATION & ACCESS SCOPE AUDIT ===\n');

  // 1. Admin Login
  const adminLogin = await request('POST', '/api/auth/login', { email: 'aman@kiranaerp.com', password: '123456' });
  const adminToken = adminLogin.d.token;
  console.log('1. Admin Login Status:', adminLogin.s === 200 ? '200 OK' : 'FAIL');

  // 2. Fetch Available Roles as Admin
  const rolesRes = await request('GET', '/api/users/roles', null, adminToken);
  console.log('\n2. Admin Fetch Roles Status:', rolesRes.s);
  const roleNames = (rolesRes.d.roles || []).map(r => r.name);
  console.log('   Available Roles for Admin:', roleNames);
  
  const empRole = rolesRes.d.roles.find(r => r.name === 'Employee');
  console.log('   Employee Role Found:', empRole ? '✅ YES (ID: ' + empRole.id + ')' : '❌ NO');

  // 3. Admin Registers New Employee Account with Sales Department Access
  console.log('\n3. Admin Registering New Employee Account ("Vikram Cashier")...');
  const testEmail = `vikram.cashier.${Date.now()}@kiranamart.com`;
  const empPayload = {
    name: 'Vikram Cashier',
    email: testEmail,
    contact: '9876543210',
    password: 'password123',
    role_id: empRole.id,
    department: 'Sales',
    permission_ids: [1, 3, 5, 8] // view_dashboard, view_sales, create_sales, view_pos
  };

  const createRes = await request('POST', '/api/users', empPayload, adminToken);
  console.log('   Employee Registration Status:', createRes.s);
  console.log('   Employee Registration Message:', createRes.d.message || createRes.d);
  console.log('   Employee Creation Check:', createRes.s === 201 ? '✅ PASS (CREATED)' : '❌ FAIL');

  // 4. Test Employee Login & Access Rights
  console.log('\n4. Testing Employee Login & Assigned Permissions...');
  const empLogin = await request('POST', '/api/auth/login', { email: testEmail, password: 'password123' });
  console.log('   Employee Login Status:', empLogin.s);
  console.log('   Employee Role:', empLogin.d.user?.role);
  console.log('   Employee Department:', empLogin.d.user?.department);
  console.log('   Assigned Permissions:', empLogin.d.user?.permissions);
  console.log('   Employee Login Check:', empLogin.s === 200 ? '✅ PASS (AUTHENTICATED & ROUTED)' : '❌ FAIL');

  console.log('\n=== AUDIT COMPLETE ===');
}

testEmployeeCreation().catch(e => console.error(e));
