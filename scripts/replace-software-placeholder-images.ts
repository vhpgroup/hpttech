import { loadEnvConfig } from "@next/env";
import sharp from "sharp";

loadEnvConfig(process.cwd());

type ProductDoc = {
  id: string | number;
  images?: Array<{ alt?: string; filename?: string; id?: string | number }>;
  model?: string;
  name?: string;
  title?: string;
};

const familyStyles = {
  "Microsoft 365": {
    accent: "#7C3AED",
    subtitle: "Năng suất và cộng tác",
  },
  "Microsoft Office": {
    accent: "#EA580C",
    subtitle: "Bộ ứng dụng văn phòng",
  },
  "Power BI": {
    accent: "#EAB308",
    subtitle: "Phân tích dữ liệu doanh nghiệp",
  },
  "SQL Server": {
    accent: "#DC2626",
    subtitle: "Nền tảng dữ liệu doanh nghiệp",
  },
  "Windows 11": {
    accent: "#0284C7",
    subtitle: "Hệ điều hành doanh nghiệp",
  },
  "Windows Server": {
    accent: "#2563EB",
    subtitle: "Hệ điều hành máy chủ",
  },
} as const;

type Family = keyof typeof familyStyles;

function productTitle(product: ProductDoc) {
  return String(product.name || product.title || "").trim();
}

function productFamily(title: string): Family {
  if (/sql server/i.test(title)) return "SQL Server";
  if (/power bi/i.test(title)) return "Power BI";
  if (/windows server|remote desktop services|\b(?:user|device) cal\b/i.test(title)) {
    return "Windows Server";
  }
  if (/microsoft 365|micrsoft 365|\bm365\b|copilot/i.test(title)) {
    return "Microsoft 365";
  }
  if (/office/i.test(title)) return "Microsoft Office";
  return "Windows 11";
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shortModel(product: ProductDoc, family: Family) {
  const title = productTitle(product);
  const model = String(product.model || "").trim();
  if (model) return model;
  if (family === "SQL Server") {
    return /enterprise/i.test(title) ? "Enterprise" : "Standard";
  }
  if (family === "Windows Server") {
    return title.match(/2025[^-]*/i)?.[0]?.trim() || "2025";
  }
  return "Bản quyền chính hãng";
}

function imageSvg(product: ProductDoc, family: Family) {
  const style = familyStyles[family];
  const model = shortModel(product, family);
  return `
    <svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#F8FAFC"/>
          <stop offset="1" stop-color="#E2E8F0"/>
        </linearGradient>
        <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${style.accent}"/>
          <stop offset="1" stop-color="#0F172A"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#0F172A" flood-opacity=".18"/>
        </filter>
      </defs>
      <rect width="1000" height="1000" fill="url(#background)"/>
      <circle cx="835" cy="155" r="180" fill="${style.accent}" opacity=".10"/>
      <circle cx="125" cy="885" r="220" fill="${style.accent}" opacity=".08"/>
      <g filter="url(#shadow)">
        <rect x="145" y="120" width="710" height="760" rx="42" fill="white"/>
        <rect x="145" y="120" width="710" height="245" rx="42" fill="url(#panel)"/>
        <rect x="145" y="325" width="710" height="40" fill="url(#panel)"/>
      </g>
      <g transform="translate(205 180)">
        <rect width="66" height="66" fill="#F25022"/>
        <rect x="74" width="66" height="66" fill="#7FBA00"/>
        <rect y="74" width="66" height="66" fill="#00A4EF"/>
        <rect x="74" y="74" width="66" height="66" fill="#FFB900"/>
      </g>
      <text x="385" y="260" fill="white" font-family="Arial, sans-serif" font-size="54" font-weight="700">Microsoft</text>
      <text x="205" y="475" fill="#0F172A" font-family="Arial, sans-serif" font-size="68" font-weight="800">${escapeXml(family)}</text>
      <text x="205" y="555" fill="${style.accent}" font-family="Arial, sans-serif" font-size="36" font-weight="700">${escapeXml(model)}</text>
      <line x1="205" y1="610" x2="795" y2="610" stroke="#CBD5E1" stroke-width="3"/>
      <text x="205" y="685" fill="#334155" font-family="Arial, sans-serif" font-size="31">${escapeXml(style.subtitle)}</text>
      <text x="205" y="748" fill="#64748B" font-family="Arial, sans-serif" font-size="27">Bản quyền điện tử dành cho tổ chức</text>
      <rect x="205" y="790" width="260" height="54" rx="27" fill="${style.accent}" opacity=".12"/>
      <text x="235" y="827" fill="${style.accent}" font-family="Arial, sans-serif" font-size="25" font-weight="700">HPT Tech phân phối</text>
    </svg>
  `;
}

async function main() {
  const { getPayloadClient } = await import("../lib/payload");
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "products",
    depth: 2,
    limit: 200,
    overrideAccess: true,
    where: { specProfile: { equals: "software" } },
  });

  const products = (result.docs as ProductDoc[]).filter((product) => {
    const images = Array.isArray(product.images) ? product.images : [];
    return (
      images.length === 0 ||
      images.some(
        (image) =>
          /microsoft-logo|placeholder|software-logo|default/i.test(
            String(image.filename || ""),
          ) ||
          /Microsoft Software|^Logo Microsoft$/i.test(String(image.alt || "")),
      )
    );
  });

  let updated = 0;
  for (const product of products) {
    const title = productTitle(product);
    const family = productFamily(title);
    const buffer = await sharp(Buffer.from(imageSvg(product, family)))
      .png({ compressionLevel: 9 })
      .toBuffer();
    const filename = `${String(product.model || product.id)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${family.toLowerCase().replace(/\s+/g, "-")}.png`;
    const media = await payload.create({
      collection: "media",
      data: {
        alt: `${family} ${shortModel(product, family)}`,
        caption: title,
        folder: "scraper/products/software",
        tags: "product,software,microsoft",
      },
      file: {
        data: buffer,
        mimetype: "image/png",
        name: filename,
        size: buffer.byteLength,
      },
      overrideAccess: true,
    });
    await payload.update({
      collection: "products",
      data: { images: [media.id] },
      id: product.id,
      overrideAccess: true,
    });
    updated += 1;
    console.log(`[${updated}/${products.length}] ${family}: ${title}`);
  }

  console.log(JSON.stringify({ found: products.length, updated }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
