const http = require('http');

const endpoints = [
  '/api/ingeniero/motos',
  '/api/ingeniero/mantenimientos',
  '/api/ingeniero/repuestos',
  '/api/ingeniero/alertas',
  '/api/ingeniero/stats'
];

function fetchEndpoint(url) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3001${url}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', (err) => {
      resolve({
        url,
        status: 0,
        error: err.message
      });
    });
  });
}

async function run() {
  console.log('Fetching Engineer API endpoints from dev server...');
  for (const endpoint of endpoints) {
    const res = await fetchEndpoint(endpoint);
    console.log(`\nEndpoint: ${res.url}`);
    console.log(`Status: ${res.status}`);
    if (res.error) {
      console.log(`Error: ${res.error}`);
    } else {
      console.log(`Body (truncated): ${res.body.slice(0, 300)}`);
    }
  }
}

// Wait a bit before running to let the dev server compile
setTimeout(run, 3000);
