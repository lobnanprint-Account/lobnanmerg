const cp = require('child_process');
const p = cp.spawn('node', ['dist/server.cjs'], { env: { NODE_ENV: 'production' } });
p.stdout.on('data', d => console.log('OUT:', d.toString()));
p.stderr.on('data', d => console.log('ERR:', d.toString()));
setTimeout(() => {
  p.kill();
  console.log('Killed after 2s');
}, 2000);
