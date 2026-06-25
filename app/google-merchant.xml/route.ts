import { Pool } from "pg";

export const revalidate = 86400;

type MerchantProductRow = {
  brand: string | null;
  category: string | null;
  compareAtPrice: string | null;
  description: string | null;
  id: number;
  imageUrl: string | null;
  internalId: string | null;
  mediaUrl: string | null;
  model: string | null;
  name: string | null;
  offerPrice: string | null;
  offerPromotionPrice: string | null;
  price: string | null;
  saleStatus: string | null;
  shortDescription: string | null;
  sku: string | null;
  slug: string | null;
  stockStatus: string | null;
  summaryHTML: string | null;
  title: string | null;
};

function siteURL() {
  const raw =
    process.env.NEXT_PUBLIC_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "https://hpttech.vn";
  return raw.startsWith("http") ? raw.replace(/\/$/, "") : `https://${raw}`;
}

function databaseURI() {
  const uri = process.env.DATABASE_URI || process.env.POSTGRES_URL;
  if (!uri) throw new Error("Missing DATABASE_URI or POSTGRES_URL.");
  return uri;
}

let pool: Pool | undefined;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseURI(),
      max: 5,
    });
  }
  return pool;
}

function escapeXML(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHTML(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteURL(value: string | null | undefined, base: string) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    return new URL(text, base).toString();
  } catch {
    return "";
  }
}

function parsePrice(value: string | number | null | undefined) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;

  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/\b(lien he|contact|call)\b/.test(normalized)) return undefined;

  const numeric =
    typeof value === "number"
      ? value
      : Number(text.replace(/[^\d]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : undefined;
}

function merchantPrice(value: number) {
  return `${value} VND`;
}

function availability(stockStatus: string | null | undefined) {
  if (stockStatus === "out_of_stock") return "out_of_stock";
  if (stockStatus === "preorder") return "preorder";
  return "in_stock";
}

function description(row: MerchantProductRow) {
  const parts = [
    row.shortDescription,
    row.summaryHTML ? stripHTML(row.summaryHTML) : "",
    row.description ? stripHTML(row.description) : "",
    row.category ? `Danh mục: ${row.category}` : "",
    row.model ? `Model: ${row.model}` : "",
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean);

  return (parts.join(" - ") || row.title || row.name || "").slice(0, 5000);
}

function productType(row: MerchantProductRow) {
  return [row.category, row.brand].filter(Boolean).join(" > ");
}

function googleProductCategory(row: MerchantProductRow) {
  const text = `${row.category || ""} ${row.title || ""} ${row.name || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (text.includes("laptop") || text.includes("notebook")) {
    return "Electronics > Computers > Laptops";
  }
  if (text.includes("may in") || text.includes("printer")) {
    return "Electronics > Print, Copy, Scan & Fax > Printers";
  }
  if (text.includes("scan")) {
    return "Electronics > Print, Copy, Scan & Fax > Scanners";
  }
  if (text.includes("photo") || text.includes("copy")) {
    return "Electronics > Print, Copy, Scan & Fax > Copiers";
  }
  if (text.includes("phan mem") || text.includes("software")) {
    return "Software";
  }
  return "Electronics";
}

function item(row: MerchantProductRow, base: string) {
  const title = row.name || row.title || "";
  const slug = row.slug || "";
  const price =
    parsePrice(row.offerPromotionPrice) ||
    parsePrice(row.offerPrice) ||
    parsePrice(row.price);
  const image = absoluteURL(row.imageUrl || row.mediaUrl, base);
  const link = absoluteURL(`/san-pham/${slug}`, base);
  const id = row.internalId || row.sku || String(row.id);

  if (!title || !slug || !price || !image || row.saleStatus === "contact") {
    return "";
  }

  const compareAtPrice = parsePrice(row.compareAtPrice);
  const salePrice =
    compareAtPrice && compareAtPrice > price ? merchantPrice(price) : "";
  const basePrice =
    compareAtPrice && compareAtPrice > price
      ? merchantPrice(compareAtPrice)
      : merchantPrice(price);

  return [
    "<item>",
    `<g:id>${escapeXML(id)}</g:id>`,
    `<g:title>${escapeXML(title.slice(0, 150))}</g:title>`,
    `<g:description>${escapeXML(description(row))}</g:description>`,
    `<g:link>${escapeXML(link)}</g:link>`,
    `<g:image_link>${escapeXML(image)}</g:image_link>`,
    `<g:availability>${availability(row.stockStatus)}</g:availability>`,
    `<g:price>${escapeXML(basePrice)}</g:price>`,
    salePrice ? `<g:sale_price>${escapeXML(salePrice)}</g:sale_price>` : "",
    `<g:condition>new</g:condition>`,
    row.brand ? `<g:brand>${escapeXML(row.brand)}</g:brand>` : "",
    row.model ? `<g:mpn>${escapeXML(row.model)}</g:mpn>` : "",
    row.sku ? `<g:item_group_id>${escapeXML(row.sku)}</g:item_group_id>` : "",
    `<g:google_product_category>${escapeXML(googleProductCategory(row))}</g:google_product_category>`,
    productType(row)
      ? `<g:product_type>${escapeXML(productType(row))}</g:product_type>`
      : "",
    "</item>",
  ]
    .filter(Boolean)
    .join("");
}

async function loadProducts() {
  const result = await getPool().query<MerchantProductRow>(`
      select
        p.id,
        p.title,
        p.name,
        p.internal_id as "internalId",
        p.sku,
        p.slug,
        p.price,
        p.compare_at_price as "compareAtPrice",
        p.short_description as "shortDescription",
        p.summary_h_t_m_l as "summaryHTML",
        p.description_h_t_m_l as description,
        p.stock_status as "stockStatus",
        p.model,
        b.name as brand,
        c.name as category,
        m.url as "mediaUrl",
        m.thumbnail_u_r_l as "imageUrl",
        o.price as "offerPrice",
        o.promotion_price as "offerPromotionPrice",
        o.sale_status as "saleStatus"
      from products p
      left join brands b on b.id = p.brand_id
      left join categories c on c.id = p.category_id
      left join lateral (
        select media_id
        from products_rels
        where parent_id = p.id and path = 'images' and media_id is not null
        order by "order" asc nulls last, id asc
        limit 1
      ) pr on true
      left join media m on m.id = pr.media_id
      left join lateral (
        select id
        from product_variants
        where product_id = p.id
        order by is_primary desc nulls last, id asc
        limit 1
      ) v on true
      left join product_offers o on o.variant_id = v.id
      where p.status = 'published' and p._status = 'published'
      order by coalesce(p.name, p.title, '') asc, p.id asc
    `);
  return result.rows;
}

export async function GET() {
  const base = siteURL();
  const rows = await loadProducts();
  const items = rows.map((row) => item(row, base)).filter(Boolean);
  const updatedAt = new Date().toUTCString();

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>` +
      `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">` +
      `<channel>` +
      `<title>${escapeXML("HPTTech.vn Google Merchant Feed")}</title>` +
      `<link>${escapeXML(base)}</link>` +
      `<description>${escapeXML("Published HPTTech products with real prices")}</description>` +
      `<lastBuildDate>${escapeXML(updatedAt)}</lastBuildDate>` +
      items.join("") +
      `</channel></rss>`,
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
}
