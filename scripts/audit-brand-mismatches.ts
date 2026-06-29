import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

type BrandDoc = {
  id: number;
  name: string;
  slug: string;
};

type ProductDoc = {
  id: number;
  title: string;
  slug: string;
  brand: number | BrandDoc;
  name?: string | null;
  model?: string | null;
  sku?: string | null;
  mpn?: string | null;
};

type BrandToken = {
  id: number;
  name: string;
  slug: string;
  tokens: string[];
};

type AuditIssue = {
  id: number;
  title: string;
  slug: string;
  model?: string | null;
  sku?: string | null;
  assignedBrand: string;
  suspectedBrand: string;
  evidence: string[];
};

const MIN_TOKEN_LENGTH = 3;

function normalizeText(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function compactToken(value?: string | null) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "");
}

function brandName(value: number | BrandDoc) {
  return typeof value === "object" && value ? value.name : `brand#${value}`;
}

function brandSlug(value: number | BrandDoc) {
  return typeof value === "object" && value ? value.slug : "";
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function brandTokens(brand: BrandDoc): BrandToken {
  const rawParts = [
    brand.name,
    brand.slug,
    ...brand.name.split(/[\s/+-]+/),
    ...brand.slug.split(/[\s/+-]+/),
  ];
  const tokens = unique(rawParts.map(compactToken).filter((token) => token.length >= MIN_TOKEN_LENGTH));

  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    tokens,
  };
}

function productHaystack(product: ProductDoc) {
  return compactToken([
    product.slug,
    product.title,
    product.name,
    product.model,
    product.sku,
    product.mpn,
  ].filter(Boolean).join(" "));
}

function evidenceForBrand(product: ProductDoc, token: BrandToken) {
  const fields = [
    ["slug", product.slug],
    ["title", product.title],
    ["name", product.name],
    ["model", product.model],
    ["sku", product.sku],
    ["mpn", product.mpn],
  ] as const;

  return fields
    .filter(([, value]) => token.tokens.some((brandToken) => compactToken(value).includes(brandToken)))
    .map(([field, value]) => `${field}=${String(value)}`);
}

function findBrandMismatch(product: ProductDoc, brands: BrandToken[]): AuditIssue | undefined {
  const assignedName = brandName(product.brand);
  const assignedSlug = brandSlug(product.brand);
  const assigned = compactToken(`${assignedName} ${assignedSlug}`);
  const haystack = productHaystack(product);
  const matched = brands
    .filter((brand) => brand.tokens.some((token) => haystack.includes(token)))
    .filter((brand) => !brand.tokens.some((token) => assigned.includes(token)))
    .sort((a, b) => b.tokens[0].length - a.tokens[0].length)[0];

  if (!matched) return undefined;

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    model: product.model,
    sku: product.sku,
    assignedBrand: assignedName,
    suspectedBrand: matched.name,
    evidence: evidenceForBrand(product, matched),
  };
}

async function readAll<T>(collection: "brands" | "products", depth: number) {
  const { getPayloadClient } = await import("../lib/payload");
  const payload = await getPayloadClient();
  const docs: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await payload.find({
      collection,
      depth,
      limit: 500,
      page,
      overrideAccess: true,
      sort: "id",
    });

    docs.push(...(result.docs as T[]));
    totalPages = result.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return docs;
}

async function main() {
  const [brands, products] = await Promise.all([
    readAll<BrandDoc>("brands", 0),
    readAll<ProductDoc>("products", 1),
  ]);
  const brandIndex = brands.map(brandTokens).filter((brand) => brand.tokens.length);
  const issues = products
    .map((product) => findBrandMismatch(product, brandIndex))
    .filter((issue): issue is AuditIssue => Boolean(issue));

  const report = {
    dryRun: true,
    checkedAt: new Date().toISOString(),
    counts: {
      brands: brands.length,
      products: products.length,
      suspectedMismatches: issues.length,
    },
    samples: issues.slice(0, 100),
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(issues.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
