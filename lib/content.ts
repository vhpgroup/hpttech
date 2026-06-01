import { HPT_DATA } from "@/lib/data";
import { getProducts } from "@/lib/catalog";

export type SitePageSlug =
  | "san-pham"
  | "giai-phap"
  | "thuong-hieu"
  | "du-an"
  | "dich-vu"
  | "tin-tuc"
  | "ve-hpt"
  | "lien-he"
  | "chat";

export type SitePage = {
  slug: SitePageSlug;
  title: string;
  eyebrow: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export const SITE_PAGES: Record<SitePageSlug, SitePage> = {
  "san-pham": {
    slug: "san-pham",
    title: "Sản phẩm",
    eyebrow: "Catalog thiết bị",
    description:
      "Danh mục máy scan, máy in và thiết bị văn phòng đang được HPT Tech ưu tiên tư vấn cho doanh nghiệp.",
    ctaLabel: "So sánh sản phẩm",
    ctaHref: "/compare",
  },
  "giai-phap": {
    slug: "giai-phap",
    title: "Giải pháp doanh nghiệp",
    eyebrow: "Tư vấn triển khai",
    description:
      "Các gói hạ tầng CNTT, số hóa tài liệu, an ninh, hội nghị và lớp học thông minh cho tổ chức.",
  },
  "thuong-hieu": {
    slug: "thuong-hieu",
    title: "Thương hiệu",
    eyebrow: "Đối tác công nghệ",
    description:
      "Các thương hiệu thiết bị văn phòng và hạ tầng đang xuất hiện trong dữ liệu sản phẩm của HPT Tech.",
  },
  "du-an": {
    slug: "du-an",
    title: "Dự án",
    eyebrow: "Triển khai thực tế",
    description:
      "Khu vực dành cho năng lực triển khai, hồ sơ dự án và các case study sau khi dữ liệu WordPress sẵn sàng.",
  },
  "dich-vu": {
    slug: "dich-vu",
    title: "Dịch vụ",
    eyebrow: "Hỗ trợ kỹ thuật",
    description:
      "Lắp đặt, bảo trì, bảo hành, tư vấn cấu hình và hỗ trợ vận hành thiết bị cho doanh nghiệp.",
  },
  "tin-tuc": {
    slug: "tin-tuc",
    title: "Tin tức",
    eyebrow: "Bài viết và tiêu điểm",
    description:
      "Tin tức sản phẩm, hướng dẫn chọn thiết bị và nội dung chuyên môn sẽ được đồng bộ từ WordPress.",
  },
  "ve-hpt": {
    slug: "ve-hpt",
    title: "Về HPT",
    eyebrow: "Hồ sơ doanh nghiệp",
    description:
      "Thông tin giới thiệu, năng lực tư vấn và định vị dịch vụ của HPT Tech.",
  },
  "lien-he": {
    slug: "lien-he",
    title: "Liên hệ",
    eyebrow: "Tư vấn nhanh",
    description:
      "Gửi nhu cầu báo giá, tư vấn thiết bị hoặc triển khai giải pháp để đội ngũ HPT Tech phản hồi.",
    ctaLabel: "Gửi email báo giá",
    ctaHref: "mailto:lienhe@hpttech.vn?subject=Yêu cầu tư vấn HPT Tech",
  },
  chat: {
    slug: "chat",
    title: "Tư vấn nhanh",
    eyebrow: "Hỗ trợ khách hàng",
    description:
      "Kênh tư vấn sẽ được nối với hệ thống chat khi backend và dữ liệu WordPress được chốt.",
    ctaLabel: "Liên hệ ngay",
    ctaHref: "/lien-he",
  },
};

export function getSitePage(slug: string) {
  return SITE_PAGES[slug as SitePageSlug] ?? null;
}

export function getCatalogProducts() {
  return getProducts();
}

export function getBrands() {
  return HPT_DATA.brands;
}

export function getSolutions() {
  return HPT_DATA.solutions;
}

export function getPosts() {
  return HPT_DATA.posts;
}
