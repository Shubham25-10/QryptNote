const http = require('http');

const data = JSON.stringify({
  id: 'testid123',
  encryptedMessage: 'test message',
  expiryTimestamp: Date.now() + 100000
});

const req = http.request('http://localhost:3000/api/create-message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(res.statusCode, body));
});

req.on('error', console.error);
req.write(data);
req.end();
