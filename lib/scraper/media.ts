import { createHash } from "node:crypto";
import path from "node:path";

import { getPayloadClient } from "@/lib/payload";
import { formatSlug } from "@/lib/payload/utils/slugify";
import type { ScrapedImage, ScrapedProduct } from "./types";

type UploadedImage = {
  id: string | number;
  url: string;
};

export type ImageImportReport = {
  images: UploadedImage[];
  warnings: string[];
};

type ImageImportOptions = {
  maxImages?: number;
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

function imageIdentity(url: string) {
  const parsed = new URL(imageKey(url));
  const match = parsed.pathname.match(
    /^(.*\/media\/product\/)(?:\d+_)?(\d+_.*)$/i,
  );
  if (match) parsed.pathname = `${match[1]}${match[2]}`;
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

function detectMimeType(buffer: Buffer, fallback: string): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  if (buffer.length >= 4 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return "image/gif";
  }
  if (buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return "image/webp";
  }
  return fallback;
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

  let mimeType = response.headers.get("content-type")?.split(";")[0]?.trim() || "";

  const maxBytes = Number(process.env.SCRAPER_MAX_IMAGE_BYTES || 8 * 1024 * 1024);
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > maxBytes) {
    throw new Error(`Anh vuot qua gioi han ${maxBytes} bytes: ${image.url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > maxBytes) {
    throw new Error(`Anh vuot qua gioi han ${maxBytes} bytes: ${image.url}`);
  }

  if (!mimeType.startsWith("image/")) {
    mimeType = detectMimeType(buffer, mimeType);
    if (!mimeType.startsWith("image/")) {
      throw new Error(`URL khong tra ve image content-type: ${image.url} (Type: ${mimeType})`);
    }
  }

  if (buffer.byteLength < Number(process.env.SCRAPER_MIN_IMAGE_BYTES || 2_048)) {
    throw new Error(`Ảnh quá nhỏ hoặc không hợp lệ: ${image.url}`);
  }

  return { buffer, mimeType };
}

function uploadedMediaURL(created: Record<string, unknown>, fallback: string) {
  const filename =
    typeof created.filename === "string" ? created.filename : undefined;
  if (filename && process.env.NODE_ENV !== "production") {
    return `/api/media/file/${encodeURIComponent(filename)}`;
  }
  if (filename && process.env.R2_BUCKET && process.env.R2_ENDPOINT) {
    const publicBase =
      process.env.R2_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
      process.env.MEDIA_PUBLIC_URL;
    return publicBase
      ? `${publicBase.replace(/\/$/, "")}/${encodeURIComponent(filename)}`
      : `/api/r2-media/${encodeURIComponent(filename)}`;
  }
  return typeof created.url === "string" ? created.url : fallback;
}

// Tải ảnh trong BÀI MÔ TẢ (article) lên Media để nhúng vào lexical dưới dạng
// upload node — phục vụ tab "Mô tả sản phẩm" hiển thị ảnh như trang nguồn.
// Trả về map src -> media id; lỗi từng ảnh chỉ ghi warning, không chặn import.
export async function importArticleImages(
  product: ScrapedProduct,
  images: Array<{ alt?: string; url: string }>,
  options: ImageImportOptions = {},
): Promise<{ idBySrc: Map<string, string | number>; warnings: string[] }> {
  const payload = await getPayloadClient();
  const maxImages =
    options.maxImages ?? Number(process.env.SCRAPER_ARTICLE_MAX_IMAGES || 8);
  const seen = new Set<string>();
  const selected: Array<{ alt?: string; url: string }> = [];
  for (const image of images) {
    try {
      const key = imageIdentity(image.url);
      if (seen.has(key)) continue;
      seen.add(key);
      selected.push(image);
      if (selected.length >= maxImages) break;
    } catch {
      // URL hỏng -> bỏ qua
    }
  }

  const idBySrc = new Map<string, string | number>();
  const warnings: string[] = [];
  for (const image of selected) {
    try {
      const { buffer, mimeType } = await downloadImage({ alt: image.alt || "", source: "article", url: image.url });
      const filename = imageFilename(
        product,
        { alt: image.alt || "", source: "article", url: image.url },
        mimeType,
      );
      const created = await payload.create({
        collection: "media",
        data: {
          alt: image.alt || product.data.title,
          caption: product.data.title,
          folder: "scraper/articles",
          tags: "article,scraper",
        },
        file: {
          data: buffer,
          mimetype: mimeType,
          name: filename,
          size: buffer.byteLength,
        },
        overrideAccess: true,
      });
      idBySrc.set(image.url, created.id);
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : String(error));
    }
  }
  return { idBySrc, warnings };
}

export async function importScrapedImagesWithReport(
  product: ScrapedProduct,
  options: ImageImportOptions = {},
): Promise<ImageImportReport> {
  const payload = await getPayloadClient();
  const maxImages = options.maxImages ?? Number(process.env.SCRAPER_IMPORT_MAX_IMAGES || 1);
  const seen = new Set<string>();
  const images = (product.images || [])
    .filter((image) => {
      try {
        const key = imageIdentity(image.url);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      } catch {
        return false;
      }
    })
    .slice(0, maxImages);

  const uploaded: UploadedImage[] = [];
  const warnings: string[] = [];
  for (const image of images) {
    try {
      if (/placeholder|no[-_ ]?image|default[-_ ]?image/i.test(image.url)) {
        throw new Error(`Bỏ qua ảnh placeholder: ${image.url}`);
      }
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
      uploaded.push({
        id: created.id,
        url: uploadedMediaURL(created as unknown as Record<string, unknown>, image.url),
      });
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : String(error));
    }
  }

  return { images: uploaded, warnings };
}

export async function importScrapedImages(
  product: ScrapedProduct,
): Promise<UploadedImage[]> {
  const report = await importScrapedImagesWithReport(product);
  return report.images;
}
