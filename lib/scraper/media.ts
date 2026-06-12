import { createHash } from "node:crypto";
import path from "node:path";

import { getPayloadClient } from "@/lib/payload";
import { formatSlug } from "@/lib/payload/utils/slugify";
import type { ScrapedImage, ScrapedProduct } from "./types";

type UploadedImage = {
  id: string | number;
  url: string;
};

const imageMimeExtensions: Record<string, string> = {
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function imageKey(url: string) {
  const parsed = new URL(url);
  parsed.search = "";
  return parsed.toString();
}

function fileExtension(url: string, mimeType: string) {
  const pathname = new URL(url).pathname;
  const ext = path.extname(pathname).toLowerCase();
  if (ext && Object.values(imageMimeExtensions).includes(ext)) return ext;
  return imageMimeExtensions[mimeType] || ".jpg";
}

function imageFilename(product: ScrapedProduct, image: ScrapedImage, mimeType: string) {
  const hash = createHash("sha1").update(image.url).digest("hex").slice(0, 8);
  const title = product.data.sku || product.data.title || "product-image";
  return `${formatSlug(title)}-${hash}${fileExtension(image.url, mimeType)}`;
}

async function downloadImage(image: ScrapedImage) {
  const response = await fetch(image.url, {
    headers: {
      "accept": "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
    },
    signal: AbortSignal.timeout(Number(process.env.SCRAPER_IMAGE_TIMEOUT_MS || 15000)),
  });
  if (!response.ok) {
    throw new Error(`Khong tai duoc anh (${response.status}): ${image.url}`);
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0]?.trim() || "";
  if (!mimeType.startsWith("image/")) {
    throw new Error(`URL khong tra ve image content-type: ${image.url}`);
  }

  const maxBytes = Number(process.env.SCRAPER_MAX_IMAGE_BYTES || 8 * 1024 * 1024);
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > maxBytes) {
    throw new Error(`Anh vuot qua gioi han ${maxBytes} bytes: ${image.url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > maxBytes) {
    throw new Error(`Anh vuot qua gioi han ${maxBytes} bytes: ${image.url}`);
  }

  return { buffer, mimeType };
}

export async function importScrapedImages(product: ScrapedProduct): Promise<UploadedImage[]> {
  const payload = await getPayloadClient();
  const maxImages = Number(process.env.SCRAPER_IMPORT_MAX_IMAGES || 3);
  const seen = new Set<string>();
  const images = (product.images || [])
    .filter((image) => {
      try {
        const key = imageKey(image.url);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      } catch {
        return false;
      }
    })
    .slice(0, maxImages);

  const uploaded: UploadedImage[] = [];
  for (const image of images) {
    const { buffer, mimeType } = await downloadImage(image);
    const filename = imageFilename(product, image, mimeType);
    const alt = image.alt || product.data.title;
    const created = await payload.create({
      collection: "media",
      data: {
        alt,
        caption: product.data.title,
        folder: "scraper/products",
        tags: "product,scraper",
      },
      file: {
        data: buffer,
        mimetype: mimeType,
        name: filename,
        size: buffer.byteLength,
      },
      overrideAccess: true,
    });
    uploaded.push({ id: created.id, url: typeof created.url === "string" ? created.url : image.url });
  }

  return uploaded;
}
