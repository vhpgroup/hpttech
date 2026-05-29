import { HPT_DATA, type Post, type Product } from "@/lib/data";

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

function slugFromHref(href: string) {
  try {
    const url = new URL(href);
    const path = url.pathname.replace(/^\/|\/$/g, "");
    return path || "";
  } catch {
    return "";
  }
}

export function getProductSlug(product: Product) {
  return slugFromHref(product.href) || slugify(product.title);
}

export function getPostSlug(post: Post) {
  return slugFromHref(post.href) || slugify(post.title);
}

export function getProducts() {
  return HPT_DATA.products.map((product) => ({
    ...product,
    slug: getProductSlug(product),
  }));
}

export function getProductBySlug(slug: string) {
  return getProducts().find((product) => product.slug === slug) ?? null;
}

export function getPosts() {
  return HPT_DATA.posts.map((post) => ({
    ...post,
    slug: getPostSlug(post),
  }));
}

export function getPostBySlug(slug: string) {
  return getPosts().find((post) => post.slug === slug) ?? null;
}

export function getProductCategories() {
  return Array.from(new Set(HPT_DATA.products.map((product) => product.category))).sort();
}

export function getProductBrands() {
  return Array.from(new Set(HPT_DATA.products.map((product) => product.brand))).sort();
}
