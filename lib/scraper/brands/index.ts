import type { BrandConfig } from "../types";

export const brandConfigs = [
  {
    aliases: ["openai", "chatgpt"],
    crawlMethod: "fetch",
    delayMs: 1500,
    domain: "openai.com",
    extraDomains: ["chatgpt.com"],
    name: "OpenAI",
    slug: "openai",
  },
  {
    aliases: ["autodesk", "autocad", "revit", "navisworks", "inventor", "advance steel", "product design & manufacturing"],
    crawlMethod: "fetch",
    delayMs: 1500,
    domain: "autodesk.com",
    extraDomains: ["autodesk.com"],
    name: "Autodesk",
    slug: "autodesk",
  },
  {
    aliases: ["adobe", "acrobat", "photoshop", "illustrator", "indesign", "lightroom", "premiere", "creative cloud"],
    crawlMethod: "fetch",
    delayMs: 1500,
    domain: "adobe.com",
    extraDomains: ["adobe.com"],
    name: "Adobe",
    slug: "adobe",
  },
  {
    aliases: ["canva"],
    crawlMethod: "fetch",
    delayMs: 1500,
    domain: "canva.com",
    extraDomains: ["canva.com"],
    name: "Canva",
    slug: "canva",
  },
  {
    aliases: ["capcut"],
    crawlMethod: "fetch",
    delayMs: 1500,
    domain: "capcut.com",
    extraDomains: ["capcut.com"],
    name: "CapCut",
    slug: "capcut",
  },
  {
    aliases: ["teamviewer"],
    crawlMethod: "fetch",
    delayMs: 1500,
    domain: "teamviewer.com",
    extraDomains: ["teamviewer.com"],
    name: "TeamViewer",
    slug: "teamviewer",
  },
  {
    aliases: ["corel", "graphics suite"],
    crawlMethod: "fetch",
    delayMs: 1500,
    domain: "corel.com",
    extraDomains: ["coreldraw.com"],
    name: "Corel",
    slug: "corel",
  },
  {
    aliases: ["bitdefender"],
    crawlMethod: "fetch",
    delayMs: 1500,
    domain: "bitdefender.com",
    extraDomains: ["bitdefender.com"],
    name: "Bitdefender",
    slug: "bitdefender",
  },
  {
    aliases: ["bullguard"],
    crawlMethod: "fetch",
    delayMs: 1500,
    domain: "bullguard.com",
    extraDomains: ["norton.com"],
    name: "BullGuard",
    slug: "bullguard",
  },
  {
    aliases: ["trend micro"],
    crawlMethod: "fetch",
    delayMs: 1500,
    domain: "trendmicro.com",
    extraDomains: ["trendmicro.com"],
    name: "Trend Micro",
    slug: "trend-micro",
  },
  {
    aliases: ["microsoft", "micrsoft", "m365", "office", "windows", "win home"],
    crawlMethod: "fetch",
    delayMs: 1500,
    domain: "microsoft.com",
    extraDomains: ["microsoft.com"],
    name: "Microsoft",
    slug: "microsoft",
  },
  {
    aliases: ["kaspersky"],
    crawlMethod: "fetch",
    delayMs: 1500,
    domain: "kaspersky.com",
    extraDomains: ["kaspersky.com.vn"],
    name: "Kaspersky",
    slug: "kaspersky",
  },
  {
    aliases: ["bkav"],
    crawlMethod: "fetch",
    delayMs: 1500,
    domain: "bkav.com.vn",
    extraDomains: ["bkav.com"],
    name: "Bkav",
    slug: "bkav",
  },
  {
    aliases: ["draytek"],
    crawlMethod: "fetch",
    delayMs: 1500,
    domain: "draytek.com",
    extraDomains: ["draytek.com.vn"],
    name: "DrayTek",
    slug: "draytek",
  },
  {
    aliases: [
      "microtek",
      "artixscan",
      "filescan",
      "h-screen",
      "h‑screen",
      "objectscan",
      "scanmaker",
    ],
    crawlMethod: "fetch",
    delayMs: 2000,
    domain: "microtek.com",
    extraDomains: ["microtek.com"],
    name: "Microtek",
    slug: "microtek",
  },
  {
    aliases: ["xerox"],
    crawlMethod: "fetch",
    delayMs: 2000,
    domain: "xerox.com",
    extraDomains: ["xerox.com"],
    name: "Xerox",
    slug: "xerox",
  },
  {
    aliases: ["fujifilm", "fuji"],
    crawlMethod: "fetch",
    delayMs: 2000,
    domain: "fujifilm.com",
    extraDomains: ["fujifilm.com"],
    name: "Fujifilm",
    slug: "fujifilm",
  },
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
    aliases: ["konica", "minolta", "bizhub"],
    crawlMethod: "fetch",
    delayMs: 2000,
    domain: "konicaminolta.com",
    extraDomains: ["konicaminolta.com"],
    name: "Konica Minolta",
    slug: "konica-minolta",
  },
  {
    aliases: ["sharp"],
    crawlMethod: "fetch",
    delayMs: 2000,
    domain: "global.sharp",
    extraDomains: ["sharp.com"],
    name: "Sharp",
    slug: "sharp",
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
  {
    aliases: ["kyocera", "ecosys"],
    crawlMethod: "fetch",
    delayMs: 2000,
    domain: "kyoceradocumentsolutions.com",
    extraDomains: ["kyoceradocumentsolutions.com.vn"],
    name: "Kyocera",
    slug: "kyocera",
  },
  {
    aliases: ["xprinter", "xp-p"],
    crawlMethod: "fetch",
    delayMs: 2000,
    domain: "xprintertech.com",
    extraDomains: ["xprintertech.com"],
    name: "Xprinter",
    slug: "xprinter",
  },
] satisfies BrandConfig[];

export function findBrandByName(productName: string) {
  const normalized = productName.toLowerCase();
  return brandConfigs
    .flatMap((brand) =>
      brand.aliases
        .filter((alias) => normalized.includes(alias.toLowerCase()))
        .map((alias) => ({ alias, brand })),
    )
    .sort((a, b) => b.alias.length - a.alias.length)[0]?.brand;
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
