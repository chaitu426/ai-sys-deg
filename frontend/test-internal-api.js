async function test() {
  try {
    console.log('1. Logging in...');
    const loginRes = await fetch('http://localhost:3000/api/internal/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'admin123' }),
    });

    const loginData = await loginRes.json();
    if (!loginData.success) {
      console.error('Login failed:', loginData);
      return;
    }

    const token = loginData.token;
    console.log('Login successful. Token:', token.substring(0, 10) + '...');

    console.log('\n2. Fetching Dashboard...');
    const dashRes = await fetch('http://localhost:3000/api/internal/dashboard?timeRange=30d', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const dashData = await dashRes.json();
    console.log('Dashboard Data Status:', dashRes.status);
    console.log('Dashboard Data Structure:', JSON.stringify(dashData.data, null, 2));

    console.log('\n3. Fetching Tokens...');
    const tokenRes = await fetch(
      'http://localhost:3000/api/internal/tokens?timeRange=30d&groupBy=day',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const tokenData = await tokenRes.json();
    console.log('Token Data Status:', tokenRes.status);
    console.log('Token Data Structure:', JSON.stringify(tokenData.data, null, 2));
  } catch (error) {
    console.error('Test Failed:', error.message);
  }
}

test();
