const fetch = require('node-fetch');

async function testCORS() {
  console.log('Testing CORS configuration...');
  
  try {
    // Test the health endpoint first (no credentials)
    console.log('\nTesting /api/health endpoint:');
    const healthResponse = await fetch('http://localhost:3000/api/health');
    console.log('Status:', healthResponse.status);
    console.log('Headers:', Object.fromEntries(healthResponse.headers.entries()));
    console.log('Body:', await healthResponse.json());

    // Test the CORS test endpoint (with origin)
    console.log('\nTesting /api/cors-test endpoint:');
    const corsResponse = await fetch('http://localhost:3000/api/cors-test', {
      headers: {
        'Origin': 'http://localhost:19006'
      }
    });
    console.log('Status:', corsResponse.status);
    console.log('Headers:', Object.fromEntries(corsResponse.headers.entries()));
    console.log('Body:', await corsResponse.json());

    console.log('\nTests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCORS();
