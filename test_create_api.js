import fetch from 'node-fetch';

async function run() {
  const payload = {
    message: '',
    file: { name: 'test.txt', type: 'text/plain', data: 'data:text/plain;base64,aGVsbG8=' },
    expiry: 24,
    viewLimit: 1
  };
  
  // Actually we need to encrypt it first to simulate the frontend
  // But let's just send some dummy encryptedMessage and chunkCount
  const body = {
    id: 'test_api_1',
    encryptedMessage: 'A'.repeat(900 * 1024), // > 800,000 so it chunks
    expiryTimestamp: Date.now() + 100000,
    viewLimit: 1,
    passwordHash: null
  };
  
  const res = await fetch('http://localhost:3000/api/create-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  const data = await res.json();
  console.log(data);
}
run().catch(console.error);
