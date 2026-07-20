const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "} else {\\n    const distPath = path.join(process.cwd(), 'dist');",
  "} else if (!process.env.VERCEL && !process.env.VERCEL_ENV) {\\n    const distPath = path.join(process.cwd(), 'dist');"
);

fs.writeFileSync('server.ts', code);
