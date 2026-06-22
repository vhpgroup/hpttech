const { spawn } = require("node:child_process");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      shell: false,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with ${signal || code}`));
    });
  });
}

async function main() {
  await run(process.execPath, ["scripts/vercel-init-payload-schema.cjs"]);

  const startedAt = Date.now();
  const heartbeat = setInterval(() => {
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    console.log(`[build] next build still running... ${seconds}s`);
  }, 20_000);

  try {
    await run(process.execPath, ["node_modules/next/dist/bin/next", "build"]);
  } finally {
    clearInterval(heartbeat);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
