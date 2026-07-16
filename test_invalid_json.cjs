const { execSync } = require('child_process');
try {
  execSync('node -e "JSON.parse(\\\"A server error\\\")"', {stdio: 'inherit'});
} catch(e) {}
