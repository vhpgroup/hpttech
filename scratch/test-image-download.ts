import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { importScrapedImages } from "../lib/scraper/media";

async function main() {
  try {
    const uploaded = await importScrapedImages({
      data: { title: "SQL Server 2025" } as any,
      images: [
        { url: "https://anphat.com.vn/media/product/250_55789_", alt: "Test image" }
      ],
      source: { brand: "Microsoft", url: "test" } as any
    } as any);
    console.log("Uploaded images:", uploaded);
  } catch (error) {
    console.error("Error downloading:", error);
  }
}

main();
