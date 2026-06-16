export type ProductPromotion = {
  id: string;
  kind: "monthly" | "product";
  title: string;
  description?: string;
  benefits?: string[];
  startDate?: string;
  endDate?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type CatalogProduct = {
  id?: string | number;
  internalId?: string;
  title: string;
  slug: string;
  sku?: string;
  model?: string;
  productType?: string;
  brand?: string;
  category?: string;
  price?: string;
  priceValue?: number;
  compareAtPrice?: string;
  rating?: number;
  reviewCount?: number;
  viewCount?: number;
  vatIncluded?: boolean;
  discountBadge?: string;
  promoText?: string;
  promoStart?: string;
  promoEnd?: string;
  promotions?: ProductPromotion[];
  promotionCount?: number;
  stockStatus?: string;
  stockQuantity?: number;
  detail?: string;
  description?: string;
  usageGuide?: string;
  warranty?: string;
  origin?: string;
  images?: Array<{ id?: string | number; url?: string; alt?: string }>;
  datasheets?: Array<{ id?: string | number; url?: string; filename?: string; mimeType?: string }>;
  specs?: Array<{ label: string; value: string }>;
  relatedProducts?: CatalogProduct[];
  href?: string;
  image?: string;
  sellingPoints?: string[];
  tag?: string;
};

export type CatalogPost = {
  title: string;
  slug: string;
  image?: string;
  date?: string;
  href?: string;
};

type Sluggable = {
  href?: string;
  title: string;
};

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function slugFromHref(href?: string) {
  if (!href) return "";

  try {
    const url = new URL(href, "https://hpttech.vn");
    const path = url.pathname.replace(/^\/|\/$/g, "");
    return path || "";
  } catch {
    return "";
  }
}

export function getProductSlug(product: Sluggable) {
  return slugFromHref(product.href) || slugify(product.title);
}

export function getPostSlug(post: Sluggable) {
  return slugFromHref(post.href) || slugify(post.title);
}

export function getProducts(): CatalogProduct[] {
  return [];
}

export function getProductBySlug(slug: string) {
  return getProducts().find((product) => product.slug === slug) ?? null;
}

export function getPosts(): CatalogPost[] {
  return [];
}

export function getPostBySlug(slug: string) {
  return getPosts().find((post) => post.slug === slug) ?? null;
}

export function getProductCategories(): string[] {
  return [];
}

export function getProductBrands(): string[] {
  return [];
}
