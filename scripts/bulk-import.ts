import { loadEnvConfig } from "@next/env";
import { parseBulkImportArgs } from "../lib/scraper/batch-options";

loadEnvConfig(process.cwd());

async function main() {
  const { runBulkImport } = await import("../lib/scraper/batch-runner");
  const options = parseBulkImportArgs(process.argv.slice(2));
  console.log(`Doc file: ${options.filePath}`);
  const { reportPath, summary } = await runBulkImport({
    ...options,
    onResult(result, index, total) {
      const confidence =
        typeof result.confidence === "number"
          ? ` ${Math.round(result.confidence * 100)}%`
          : "";
      console.log(
        `[${index}/${total}] ${result.status.toUpperCase()}${confidence} - ${result.productName}`,
      );
      if (result.error) console.error(`  ${result.error}`);
    },
  });

  console.log(
    `Hoàn tất: ${summary.published} published, ${summary.draft} draft, ${summary.searched} searched, ${summary.failed} failed.`,
  );
  console.log(`Báo cáo: ${reportPath}`);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  },
);
