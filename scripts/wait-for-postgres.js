const net = require('net');
const { execSync } = require('child_process');

const host = process.env.DB_HOST || 'postgres';
const port = Number(process.env.DB_PORT || 5432);

function waitForPort(h, p, interval = 500) {
  return new Promise((resolve) => {
    const tryConnect = () => {
      const socket = net.createConnection(p, h);
      socket.on('connect', () => {
        socket.end();
        resolve();
      });
      socket.on('error', () => {
        setTimeout(tryConnect, interval);
      });
    };
    tryConnect();
  });
}

(async () => {
  process.stdout.write(`Waiting for ${host}:${port}...`);
  await waitForPort(host, port);
  console.log(' connected');

  const cmd = process.argv.slice(2).join(' ');
  if (cmd) {
    console.log(`Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit', shell: true });
  }
})();
