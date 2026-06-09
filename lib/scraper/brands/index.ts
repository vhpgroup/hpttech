import type { BrandConfig } from "../types";

export const brandConfigs = [
  {
    aliases: ["epson", "ecotank"],
    crawlMethod: "fetch",
    delayMs: 2000,
    domain: "epson.com.vn",
    name: "Epson",
    slug: "epson",
  },
  {
    aliases: ["ricoh"],
    crawlMethod: "fetch",
    delayMs: 2000,
    domain: "ricoh.com.vn",
    name: "Ricoh",
    slug: "ricoh",
  },
  {
    aliases: ["canon", "imageclass", "pixma", "maxify"],
    crawlMethod: "fetch",
    delayMs: 2500,
    domain: "vn.canon",
    name: "Canon",
    slug: "canon",
  },
  {
    aliases: ["brother"],
    crawlMethod: "playwright",
    delayMs: 3000,
    domain: "brother.com.vn",
    name: "Brother",
    slug: "brother",
  },
  {
    aliases: ["hp", "laserjet", "deskjet", "officejet"],
    crawlMethod: "playwright",
    delayMs: 4000,
    domain: "hp.com/vn-vi",
    name: "HP",
    slug: "hp",
  },
] satisfies BrandConfig[];

export function findBrandByName(productName: string) {
  const normalized = productName.toLowerCase();

  return brandConfigs.find((brand) =>
    brand.aliases.some((alias) => normalized.includes(alias.toLowerCase())),
  );
}

export function findBrandBySlug(slug: string) {
  return brandConfigs.find((brand) => brand.slug === slug);
}

export function findBrandByUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return brandConfigs.find((brand) => {
      const domain = brand.domain.replace(/^www\./, "").replace(/\/.*$/, "");
      return hostname.includes(domain);
    });
  } catch {
    return undefined;
  }
}
