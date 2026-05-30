import type { Post, Product } from "@/lib/data";
import { createSeedPostSource } from "@/lib/posts";
import { createSeedProductSource } from "@/lib/products";

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

const productSource = createSeedProductSource(getProductSlug);
const postSource = createSeedPostSource(getPostSlug);

export function getProducts() {
  return productSource.getProducts();
}

export function getProductBySlug(slug: string) {
  return productSource.getProductBySlug(slug);
}

export function getPosts() {
  return postSource.getPosts();
}

export function getPostBySlug(slug: string) {
  return postSource.getPostBySlug(slug);
}

export function getProductCategories() {
  return productSource.getProductCategories();
}

export function getProductBrands() {
  return productSource.getProductBrands();
}
