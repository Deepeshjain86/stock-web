import http from 'http';

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
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

async function testMohanLogin() {
  console.log('\n======================================================');
  console.log('TESTING MOHAN LOGIN API RESPONSE WITH EXPIRED STORE STATUS');
  console.log('======================================================\n');

  const res = await request('POST', '/api/auth/login', {
    email: 'mohan@kiranamart.com',
    password: 'password123'
  });

  console.log(`HTTP Status: ${res.status}`);
  console.log('Response Payload:', {
    success: res.data.success,
    user: {
      email: res.data.user?.email,
      login_id: res.data.user?.login_id,
      store_name: res.data.user?.store_name,
      subscription_status: res.data.user?.subscription_status
    }
  });

  if (res.status === 200 && res.data.success && res.data.user?.subscription_status === 'Expired') {
    console.log('\n======================================================');
    console.log('✅ MOHAN LOGIN VERIFIED 100% (HTTP 200 OK + Expired Status)');
    console.log('======================================================\n');
  }
}

testMohanLogin();
