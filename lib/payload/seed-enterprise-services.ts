import type { Payload } from "payload";
import { lexicalParagraphs } from "../scraper/text.ts";

const services = [
  {
    title: "Giải pháp số hóa tài liệu",
    slug: "giai-phap-so-hoa-tai-lieu",
    summary: "Tư vấn thiết bị, lưu trữ và quản lý tài liệu theo nhu cầu thực tế.",
    icon: "scan",
  },
  {
    title: "Giải pháp OCR và tự động hóa",
    slug: "giai-phap-ocr-va-tu-dong-hoa",
    summary: "Ứng dụng công nghệ nhận dạng để hỗ trợ trích xuất và xử lý dữ liệu.",
    icon: "file",
  },
  {
    title: "Hạ tầng mạng doanh nghiệp",
    slug: "ha-tang-mang-doanh-nghiep",
    summary: "Thiết kế, cung cấp và triển khai mạng LAN, WAN, Wi-Fi và thiết bị liên quan.",
    icon: "network",
  },
  {
    title: "Camera giám sát và hội nghị",
    slug: "camera-giam-sat-va-hoi-nghi",
    summary: "Cung cấp hệ thống giám sát, họp trực tuyến và kết nối nhiều địa điểm.",
    icon: "camera",
  },
  {
    title: "Bảo trì hệ thống CNTT",
    slug: "bao-tri-he-thong-cntt",
    summary: "Khảo sát và thực hiện bảo trì theo phạm vi công việc đã thống nhất.",
    icon: "wrench",
  },
  {
    title: "Triển khai hệ thống CNTT",
    slug: "trien-khai-he-thong-cntt",
    summary: "Tư vấn, lắp đặt và cấu hình hệ thống theo mục tiêu của doanh nghiệp.",
    icon: "building",
  },
  {
    title: "Thiết bị cho trường học",
    slug: "thiet-bi-cho-truong-hoc",
    summary: "Cung cấp thiết bị CNTT theo số lượng, ngân sách và môi trường sử dụng.",
    icon: "school",
  },
  {
    title: "Máy chủ và lưu trữ",
    slug: "may-chu-va-luu-tru",
    summary: "Xây dựng cấu hình máy chủ, lưu trữ và phương án mở rộng phù hợp.",
    icon: "server",
  },
] as const;

export async function seedEnterpriseServices(payload: Payload) {
  for (const [index, service] of services.entries()) {
    const existing = await payload.find({
      collection: "enterprise-services",
      depth: 0,
      limit: 1,
      where: { slug: { equals: service.slug } },
    });

    if (existing.docs.length) continue;

    await payload.create({
      collection: "enterprise-services",
      data: {
        ...service,
        content: lexicalParagraphs(
          `${service.summary}\n\nHPT Tech sẽ trao đổi chi tiết về ${service.title.toLocaleLowerCase("vi-VN")}, phạm vi công việc, thiết bị và chi phí sau khi tiếp nhận yêu cầu thực tế.`,
        ),
        sortOrder: index + 1,
        status: "published",
      },
    });
  }
}
