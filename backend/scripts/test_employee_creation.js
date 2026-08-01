import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const post = (path, token, data) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
};

async function testCreation() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'shop_ayyan001'
  });

  try {
    const [roles] = await conn.query('SELECT * FROM roles');
    console.log('Available roles in shop_ayyan001:', roles);

    const seRole = roles.find(r => r.name === 'Sales Employee');
    const smRole = roles.find(r => r.name === 'Sales Manager');

    console.log(`Sales Employee Role ID: ${seRole?.id}`);

    // Create a mock token for Sales Manager
    const secret = process.env.JWT_SECRET || 'secret';
    const salesManagerToken = jwt.sign({
      id: 50,
      email: 'ayyan@kiranaerp.com',
      role: 'Sales Manager',
      role_id: smRole?.id || 2,
      tenantId: 2,
      tenantDbName: 'shop_ayyan001'
    }, secret, { expiresIn: '1h' });

    console.log('Testing user creation as Sales Manager...');
    const suffix = Math.floor(Math.random() * 1000);
    const res = await post('/api/users', salesManagerToken, {
      name: `Sohil Khan ${suffix}`,
      email: `sohil_${suffix}@gmail.com`,
      contact: `96874${suffix}`,
      password: 'password123',
      role_id: seRole.id,
      department: 'Sales'
    });

    console.log('Creation API Result:', res);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await conn.end();
  }
}

testCreation();
