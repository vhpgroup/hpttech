import { loadEnvConfig } from "@next/env";
import { getPayload } from "payload";

async function main() {
  loadEnvConfig(process.cwd());
  const { default: config } = await import("../payload.config.ts");
  await getPayload({ config });
  console.log("payload schema ready");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
