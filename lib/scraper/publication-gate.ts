import { seoArticleWordCount } from "./seo-article";
import type { ScrapedProduct } from "./types";

export type PublicationGateInput = {
  articleHTML: string;
  imageCount: number;
  imageWarning?: string;
  product: ScrapedProduct;
};

function numericPrice(value?: string) {
  if (!value) return undefined;
  const decimal = value.trim().match(/^(\d{6,})(?:[.,]\d{1,2})?$/)?.[1];
  const digits = decimal || value.replace(/[^\d]/g, "");
  const amount = Number(digits);
  return Number.isFinite(amount) && amount >= 100_000 ? amount : undefined;
}

function normalizedText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

function isSoftwareProduct(product: ScrapedProduct) {
  const text = normalizedText(
    [
      product.data.title,
      product.source.brand,
      product.data.sku,
      product.data.specs.map((spec) => `${spec.label} ${spec.value}`).join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );

  return /\b(phan mem|software|license|ban quyen|office|microsoft|windows server|copilot|acrobat|kaspersky|bullguard|antivirus|chatgpt)\b/.test(
    text,
  );
}

export function evaluatePublicationGate(input: PublicationGateInput) {
  const reasons: string[] = [];
  const { product } = input;
  const wordCount = seoArticleWordCount(input.articleHTML);
  const minWords = Number(process.env.SCRAPER_MIN_ARTICLE_WORDS || 1000);
  const maxWords = Number(process.env.SCRAPER_MAX_ARTICLE_WORDS || 1500);
  const softwareProduct = isSoftwareProduct(product);

  if (product.reviewStatus !== "ready_to_review") {
    reasons.push("Dữ liệu đang cần nhân viên kiểm tra.");
  }
  if (!product.source.identity?.exact) {
    reasons.push("Nguồn chưa khớp chính xác theo URL, SKU hoặc tên đầy đủ.");
  }
  if (product.confidence < Number(process.env.SCRAPER_MIN_CONFIDENCE || 0.75)) {
    reasons.push(`Độ tin cậy thấp: ${product.confidence}.`);
  }
  if (!softwareProduct && !product.data.specs.length) {
    reasons.push("Chưa có bảng thông số.");
  }
  if (!input.imageCount) reasons.push("Chưa có ảnh sản phẩm hợp lệ.");
  if (!input.imageCount && input.imageWarning) reasons.push(input.imageWarning);
  if (!product.seo.title.trim()) reasons.push("Thiếu Meta Title.");
  if (!product.seo.description.trim()) reasons.push("Thiếu Meta Description.");
  if (/NEED_REVIEW/i.test(input.articleHTML)) {
    reasons.push("Nội dung còn NEED_REVIEW.");
  }
  if (wordCount < minWords || wordCount > maxWords) {
    reasons.push(`Bài mô tả có ${wordCount} từ, yêu cầu ${minWords}-${maxWords} từ.`);
  }

  const price = numericPrice(product.data.price);
  const compareAtPrice = numericPrice(product.data.compareAtPrice);
  if (price && compareAtPrice && compareAtPrice < price) {
    reasons.push("Giá niêm yết nhỏ hơn giá bán.");
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    wordCount,
  };
}
