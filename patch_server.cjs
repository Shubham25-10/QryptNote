const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// replace dynamic fs read with a static import or require.
// Actually we can just write the fallback inline since it's just config.
code = code.replace(
  "const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');",
  "import defaultFirebaseConfig from './firebase-applet-config.json';"
);

code = code.replace(
  "    if (!config.firestoreDatabaseId && fs.existsSync(firebaseConfigPath)) {\n      const fileConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));\n      config.firestoreDatabaseId = fileConfig.firestoreDatabaseId;\n    }",
  "    if (!config.firestoreDatabaseId) {\n      config.firestoreDatabaseId = defaultFirebaseConfig.firestoreDatabaseId;\n    }"
);

code = code.replace(
  "  } else if (fs.existsSync(firebaseConfigPath)) {\n    config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));\n  }",
  "  } else {\n    config = defaultFirebaseConfig;\n  }"
);

fs.writeFileSync('server.ts', code);
