export type BulkImportOptions = {
  dryRun: boolean;
  filePath: string;
  limit?: number;
  publish: boolean;
  searchOnly: boolean;
  skip: number;
  categoryUrl?: string;
};

function integerOption(args: string[], name: string, defaultValue?: number) {
  const prefix = `--${name}=`;
  const raw = args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  if (raw === undefined) return defaultValue;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`--${name} phải là số nguyên không âm.`);
  }
  return value;
}

export function parseBulkImportArgs(args: string[]): BulkImportOptions {
  const filePath = args.find((arg) => !arg.startsWith("--"))?.trim();
  if (!filePath) {
    throw new Error(
      "Cách dùng: npx tsx scripts/bulk-import.ts <file.xlsx> [--publish] [--dry-run] [--search-only] [--skip=N] [--limit=N]",
    );
  }

  const categoryUrl = args
    .find((arg) => arg.startsWith("--category-url="))
    ?.slice("--category-url=".length)
    .trim();
  return {
    dryRun: args.includes("--dry-run"),
    filePath,
    limit: integerOption(args, "limit"),
    publish: args.includes("--publish"),
    searchOnly: args.includes("--search-only"),
    skip: integerOption(args, "skip", 0) || 0,
    ...(categoryUrl ? { categoryUrl } : {}),
  };
}
