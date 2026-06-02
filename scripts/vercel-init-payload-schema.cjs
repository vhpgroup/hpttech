const { spawnSync } = require("child_process");
const fs = require("fs");

if (process.env.PAYLOAD_DB_PUSH !== "true") {
  console.log("Skipping Payload schema init.");
  process.exit(0);
}

const loadEnvFile = "node_modules/payload/dist/bin/loadEnv.js";

if (fs.existsSync(loadEnvFile)) {
  let source = fs.readFileSync(loadEnvFile, "utf8");
  source = source.replace(
    "import nextEnvImport from '@next/env';",
    "import * as nextEnvImport from '@next/env';",
  );
  fs.writeFileSync(loadEnvFile, source);
}

const command = process.platform === "win32" ? "node_modules\\.bin\\tsx.cmd" : "./node_modules/.bin/tsx";
const result = spawnSync(command, ["scripts/init-payload-schema.ts"], {
  env: {
    ...process.env,
    NODE_ENV: "development",
  },
  shell: process.platform === "win32",
  stdio: "inherit",
});

process.exit(result.status ?? 1);
