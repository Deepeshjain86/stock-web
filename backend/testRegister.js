import http from 'http';

const post = (path, headers, data) => {
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
        ...headers
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

async function runTest() {
  try {
    console.log('Logging in as Super Admin...');
    const loginRes = await post('/api/auth/login', {}, {
      email: 'superadmin@kiranamart.com',
      password: 'superadminpassword'
    });
    console.log('Login Response:', loginRes);

    const token = loginRes.data.token;
    if (!token) {
      console.error('Failed to get token!');
      return;
    }

    console.log('Registering a new store...');
    const suffix = Math.floor(Math.random() * 10000);
    const regRes = await post('/api/superadmin/stores', {
      'Authorization': `Bearer ${token}`
    }, {
      store_name: `Gopal Kirana ${suffix}`,
      owner_name: `Gopal Sharma ${suffix}`,
      email: `gopal_${suffix}@kirana.com`,
      phone: "9988776655",
      address: "Sector 15, Rohini, Delhi",
      gstin: "07GOPAL1234A1Z1",
      subscription_plan: "Trial",
      subscription_expires_at: "",
      password: "gopalpassword"
    });
    console.log('Register Response:', regRes);
  } catch (err) {
    console.error('Test Error:', err);
  }
}

// Wait a second for server to initialize
setTimeout(runTest, 1000);
