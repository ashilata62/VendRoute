const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 'some-user-id', role: 'SUPERADMIN' }, 'vendroute_super_secret_jwt_key_2026', { expiresIn: '1h' });

async function run() {
  const data = {
    company: { orgName: 'Test Org' },
    routing: { autoOptimize: false }
  };
  
  const res = await fetch('http://localhost:5000/api/v1/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  
  const json = await res.json();
  console.log('PUT Response:', json);
  
  const res2 = await fetch('http://localhost:5000/api/v1/settings', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const json2 = await res2.json();
  console.log('GET Response:', json2);
}

run();
