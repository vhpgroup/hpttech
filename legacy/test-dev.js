const { spawn } = require('child_process');
const http = require('http');

console.log("Starting dev server on port 3001...");
const child = spawn('npx', ['next', 'dev', '-p', '3001'], {
  shell: true,
  stdio: 'inherit'
});

setTimeout(() => {
  console.log("Sending test request to http://localhost:3001/...");
  http.get('http://localhost:3001/', (res) => {
    console.log(`STATUS CODE: ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log("SUCCESS! Dev server is running fine.");
      child.kill('SIGINT');
      process.exit(0);
    } else {
      console.error(`FAILED: Received status code ${res.statusCode}`);
      child.kill('SIGINT');
      process.exit(1);
    }
  }).on('error', (err) => {
    console.error(`Request failed: ${err.message}`);
    child.kill('SIGINT');
    process.exit(1);
  });
}, 8000);