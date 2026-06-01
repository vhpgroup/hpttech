import { getPayload } from "payload";
import config from "../payload.config.ts";

async function main() {
  await getPayload({ config });
  console.log("payload schema ready");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
