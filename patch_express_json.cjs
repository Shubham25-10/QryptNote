const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
  app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      next();
    } else {
      express.json({ limit: '10mb' })(req, res, next);
    }
  });
`;

code = code.replace("  app.use(express.json({ limit: '10mb' }));", replacement);
fs.writeFileSync('server.ts', code);
