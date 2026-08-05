import http from 'http';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

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

async function testRegisterStore() {
  console.log('\n======================================================');
  console.log('TESTING SELF-SERVICE MERCHANT STORE REGISTRATION API');
  console.log('======================================================\n');

  const testEmail = `testmerchant_${Date.now()}@kiranaerp.com`;

  const res = await request('POST', '/api/auth/register-store', {
    store_name: 'Radhe Kirana Mart',
    owner_name: 'Radhe Shyam',
    email: testEmail,
    password: 'password123',
    phone: '9876543210',
    address: 'Sector 62, Noida, UP'
  });

  console.log(`HTTP Status: ${res.status}`);
  console.log('Response Payload:', res.data);

  if (res.status === 201 && res.data.success) {
    console.log('\n======================================================');
    console.log('✅ SELF-SERVICE STORE REGISTRATION VERIFIED 100%');
    console.log('======================================================\n');

    // Cleanup test store DB and master DB record
    const masterDb = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'kirana_erp_master'
    });

    const tenantDbName = res.data.user?.tenantDbName;
    if (tenantDbName) {
      await masterDb.query(`DROP DATABASE IF EXISTS \`${tenantDbName}\``);
    }
    await masterDb.query('DELETE FROM users WHERE email = ?', [testEmail]);
    await masterDb.query('DELETE FROM tenants WHERE email = ?', [testEmail]);
    await masterDb.end();
    console.log('🧹 Cleaned up temporary test store data.');
  } else {
    console.log('❌ REGISTRATION API TEST FAILED');
  }
}

testRegisterStore();
