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

async function runHierarchyAudit() {
  console.log('=== STRICT MANAGER HIERARCHY & ADMIN EMPLOYEE RIGHTS AUDIT ===\n');

  // 1. Sales Manager Test
  console.log('1. Testing Sales Manager Role Restrictions...');
  const smLogin = await request('POST', '/api/auth/login', { email: 'priya.sales@kiranaerp.com', password: '123456' });
  const smToken = smLogin.d.token;
  console.log('   Sales Manager Login Status:', smLogin.s);

  const smRoles = await request('GET', '/api/users/roles', null, smToken);
  const smRoleNames = (smRoles.d.roles || []).map(r => r.name);
  console.log('   Roles returned for Sales Manager:', smRoleNames);
  console.log('   Sales Manager Role List Check:', (smRoleNames.length === 1 && smRoleNames[0] === 'Sales Employee') ? '✅ PASS (ONLY Sales Employee)' : '❌ FAIL');

  // Try creating invalid role as Sales Manager
  const badSmAttempt = await request('POST', '/api/users', {
    name: 'Unauthorized User',
    email: `bad.sm.${Date.now()}@kirana.com`,
    password: 'password123',
    role_id: 3 // Purchase Manager
  }, smToken);
  console.log('   Sales Manager invalid role attempt status:', badSmAttempt.s);
  console.log('   Sales Manager invalid role check:', badSmAttempt.s === 403 ? '✅ PASS (BLOCKED)' : '❌ FAIL');

  // 2. Purchase Manager Test
  console.log('\n2. Testing Purchase Manager Role Restrictions...');
  const pmLogin = await request('POST', '/api/auth/login', { email: 'rahul.purchase@kiranaerp.com', password: '123456' });
  const pmToken = pmLogin.d.token;
  console.log('   Purchase Manager Login Status:', pmLogin.s);

  const pmRoles = await request('GET', '/api/users/roles', null, pmToken);
  const pmRoleNames = (pmRoles.d.roles || []).map(r => r.name);
  console.log('   Roles returned for Purchase Manager:', pmRoleNames);
  console.log('   Purchase Manager Role List Check:', (pmRoleNames.length === 1 && pmRoleNames[0] === 'Purchase Employee') ? '✅ PASS (ONLY Purchase Employee)' : '❌ FAIL');

  // Try creating invalid role as Purchase Manager
  const badPmAttempt = await request('POST', '/api/users', {
    name: 'Unauthorized User',
    email: `bad.pm.${Date.now()}@kirana.com`,
    password: 'password123',
    role_id: 2 // Sales Manager
  }, pmToken);
  console.log('   Purchase Manager invalid role attempt status:', badPmAttempt.s);
  console.log('   Purchase Manager invalid role check:', badPmAttempt.s === 403 ? '✅ PASS (BLOCKED)' : '❌ FAIL');

  // 3. Admin Creating Employee Rights Test
  console.log('\n3. Testing Admin Creating Employee Rights...');
  const adminLogin = await request('POST', '/api/auth/login', { email: 'aman@kiranaerp.com', password: '123456' });
  const adminToken = adminLogin.d.token;

  const adminRoles = await request('GET', '/api/users/roles', null, adminToken);
  const empRoleId = adminRoles.d.roles.find(r => r.name === 'Employee').id;

  const empTestEmail = `admin.employee.${Date.now()}@kiranamart.com`;
  const adminEmpRes = await request('POST', '/api/users', {
    name: 'Admin Created Employee',
    email: empTestEmail,
    password: 'password123',
    role_id: empRoleId,
    department: 'General'
  }, adminToken);

  console.log('   Admin Created Employee Status:', adminEmpRes.s);
  console.log('   Admin Created Employee Check:', adminEmpRes.s === 201 ? '✅ PASS' : '❌ FAIL');

  console.log('\n=== AUDIT COMPLETE ===');
}

runHierarchyAudit().catch(e => console.error(e));
