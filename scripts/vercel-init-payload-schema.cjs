const { spawnSync } = require("child_process");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

if (process.env.PAYLOAD_DB_PUSH !== "true") {
  console.log("Skipping Payload schema init.");
  process.exit(0);
}

const command = process.platform === "win32" ? "node_modules\\.bin\\tsx.cmd" : "./node_modules/.bin/tsx";
const migration = spawnSync(process.execPath, ["scripts/migrate-product-richtext-columns.cjs"], {
  env: process.env,
  stdio: "inherit",
});

if (migration.status !== 0) {
  process.exit(migration.status ?? 1);
}

const result = spawnSync(command, ["scripts/init-payload-schema.ts"], {
  env: {
    ...process.env,
    NODE_ENV: "development",
  },
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

process.exit(0);
