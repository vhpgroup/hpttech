import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { scrapeProductUrl } from "../lib/scraper/engine";

async function main() {
  const result = await scrapeProductUrl("https://www.anphatpc.com.vn/phan-mem_dm401.html");
  console.log("Images:", result.images);
}
main().catch(console.error);
