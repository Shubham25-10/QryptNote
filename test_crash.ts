import { createApp } from './server';
import http from 'http';

async function run() {
  const app = await createApp();
  const server = http.createServer(app);
  server.listen(3001, () => {
    console.log('Test server running');
  });
}
run();
