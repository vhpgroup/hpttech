import type { BrandConfig } from "../types";

export const brandConfigs = [
  {
    aliases: ["avision"],
    crawlMethod: "fetch",
    delayMs: 2000,
    domain: "avision.com",
    extraDomains: ["avision.com"],
    name: "Avision",
    slug: "avision",
  },
  {
    aliases: ["plustek", "opticslim", "opticbook", "opticfilm"],
    crawlMethod: "fetch",
    delayMs: 2000,
    domain: "plustek.com",
    extraDomains: ["plustek.com"],
    name: "Plustek",
    slug: "plustek",
  },
  {
    aliases: ["kodak", "alaris", "scanmate"],
    crawlMethod: "fetch",
    delayMs: 2000,
    domain: "alarisworld.com",
    extraDomains: ["kodakalaris.com"],
    name: "Kodak Alaris",
    slug: "kodak-alaris",
  },
  {
    aliases: ["panasonic"],
    crawlMethod: "fetch",
    delayMs: 2500,
    domain: "panasonic.com/vn",
    extraDomains: ["panasonic.com"],
    name: "Panasonic",
    slug: "panasonic",
  },
  {
    aliases: ["epson", "ecotank"],
    crawlMethod: "fetch",
    delayMs: 2000,
    domain: "epson.com.vn",
    extraDomains: ["epson.com", "epson.eu", "support.epson.net"],
    name: "Epson",
    slug: "epson",
  },
  {
    aliases: ["ricoh", "fujitsu"],
    crawlMethod: "fetch",
    delayMs: 2000,
    domain: "ricoh.com.vn",
    extraDomains: ["ricoh.com", "ricoh-usa.com", "pfu.ricoh.com"],
    name: "Ricoh",
    slug: "ricoh",
  },
  {
    aliases: ["canon", "imageclass", "pixma", "maxify"],
    crawlMethod: "fetch",
    delayMs: 2500,
    domain: "vn.canon",
    extraDomains: ["canon.com", "usa.canon.com", "support.usa.canon.com"],
    name: "Canon",
    slug: "canon",
  },
  {
    aliases: ["brother"],
    crawlMethod: "playwright",
    delayMs: 3000,
    domain: "brother.com.vn",
    extraDomains: ["brother.com", "brother-usa.com", "brother.co.uk", "support.brother.com"],
    name: "Brother",
    slug: "brother",
  },
  {
    aliases: ["hp", "laserjet", "deskjet", "officejet"],
    crawlMethod: "playwright",
    delayMs: 4000,
    domain: "hp.com/vn-vi",
    extraDomains: ["hp.com", "support.hp.com"],
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
