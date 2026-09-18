const { exec } = require('child_process');
const server = exec('PORT=3001 NODE_ENV=production node dist/server.cjs');
setTimeout(() => {
  exec('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001', (err, stdout) => {
    console.log('HTTP Status:', stdout);
    server.kill();
  });
}, 2000);
