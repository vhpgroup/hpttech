export type CrawlMethod = "fetch" | "playwright";

export type BrandConfig = {
  aliases: string[];
  crawlMethod: CrawlMethod;
  delayMs: number;
  domain: string;
  name: string;
  slug: string;
};

export type ProductSpec = {
  label: string;
  value: string;
};

export type ExtractedProductData = {
  compareAtPrice?: string;
  description?: string;
  imageUrls: string[];
  origin?: string;
  price?: string;
  sku?: string;
  specs: ProductSpec[];
  summary?: string;
  title: string;
  warranty?: string;
};

export type GeneratedProductContent = {
  description: string;
  summary: string;
};

export type SeoPreview = {
  canonical: string;
  description: string;
  imageAlt: string;
  title: string;
};

export type ScrapedProduct = {
  confidence: number;
  data: ExtractedProductData;
  generated: GeneratedProductContent;
  reviewStatus: "ready_to_review" | "needs_human_input";
  seo: SeoPreview;
  source: {
    brand: string;
    searchQuery: string;
    url: string;
  };
  warnings: string[];
};

export type SearchProductInput = {
  query: string;
};

export type ImportProductInput = {
  categoryId?: string;
  product: ScrapedProduct;
};
