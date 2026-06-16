import { loadEnvConfig } from "@next/env";
import { createNewsCronPost } from "../lib/news-cron/create-news";
import { getPayloadClient } from "../lib/payload";

loadEnvConfig(process.cwd());

const publish = process.argv.includes("--publish");

createNewsCronPost({ status: publish ? "published" : undefined })
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error("[cron:create-news]", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const payload = await getPayloadClient().catch(() => undefined);
    await payload?.destroy?.();
    process.exit(process.exitCode || 0);
  });
