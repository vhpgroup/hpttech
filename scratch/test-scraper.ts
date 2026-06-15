import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { searchProduct } from "../lib/scraper/engine";

async function main() {
  const result = await searchProduct("Phần mềm Microsoft SQL Server 2025 Enterprise core - 2 core License Pack");
  console.log("Images found:", result.images);
}

main().catch(console.error);
