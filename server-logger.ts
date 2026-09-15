import fs from 'fs';
export function setupClientLogger(app: any) {
  app.post('/api/client-logs', (req: any, res: any) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      console.log('--- CLIENT LOGS ---');
      console.log(body);
      console.log('-------------------');
      res.sendStatus(200);
    });
  });
}
