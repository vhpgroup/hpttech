export type CrawlMethod = "fetch" | "playwright";

export type BrandConfig = {
  aliases: string[];
  crawlMethod: CrawlMethod;
  delayMs: number;
  domain: string;
  extraDomains?: string[];
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
    urls?: string[];
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

export type ExcelRow = {
  category: string;
  name: string;
  productType: string;
  rowNumber: number;
};

export type TavilySearchResult = {
  content?: string;
  domain: string;
  isManufacturer: boolean;
  score: number;
  sourceType: "manufacturer" | "retailer";
  title: string;
  url: string;
};

export type BatchResult = {
  adminUrl?: string;
  confidence?: number;
  error?: string;
  jobId?: string | number;
  productId?: string | number;
  productName: string;
  sourceUrls: string[];
  status: "draft" | "failed" | "searched";
  warnings: string[];
};

export type BatchSummary = {
  draft: number;
  durationMs: number;
  failed: number;
  results: BatchResult[];
  searched: number;
  total: number;
};
