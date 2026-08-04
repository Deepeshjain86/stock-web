import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
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

async function testSaaSIncomeKPI() {
  try {
    const saLogin = await request('POST', '/api/auth/login', {
      email: 'superadmin@kiranamart.com',
      password: 'superadminpassword'
    });

    const token = saLogin.data.token;
    const kpiRes = await request('GET', '/api/superadmin/kpis', null, token);

    console.log('\n======================================================');
    console.log('LIVE SUPER ADMIN KPI RESPONSE:');
    console.log(kpiRes.data.kpis);
    console.log('======================================================\n');
  } catch (err) {
    console.error('KPI Test Error:', err);
  }
}

testSaaSIncomeKPI();
