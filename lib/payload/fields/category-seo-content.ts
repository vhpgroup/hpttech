import type { Field } from "payload";

// Group `seoContent` cho collection Categories — khối bài SEO dài đặt DƯỚI grid
// sản phẩm ở landing /<slug> (mô hình samnec.com.vn/tivi).
//
// Chủ ý thiết kế: nhân viên content CHỈ viết bài trong 1 ô rich text. Mục lục
// "Xem nhanh", anchor id và FAQ schema đều TỰ SINH ở tầng render
// (lib/category-seo-content.ts) — không ai phải gõ tay mục lục hay HTML.

export const categorySeoContentField: Field = {
  name: "seoContent",
  label: "Nội dung SEO danh mục",
  type: "group",
  admin: {
    description:
      "Bài viết SEO hiển thị dưới danh sách sản phẩm. Mục lục 'Xem nhanh' tự sinh từ các đề mục H2/H3 trong bài — không cần tự gõ mục lục.",
  },
  fields: [
    {
      name: "enabled",
      label: "Bật khối nội dung SEO",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "Bỏ tick để tạm ẩn toàn bộ khối khỏi trang mà vẫn giữ nội dung đã viết.",
      },
    },
    {
      name: "heading",
      label: "Tiêu đề khối (H2)",
      type: "text",
      admin: {
        description:
          "Ví dụ: 'Tìm hiểu về máy scan tài liệu'. Bỏ trống sẽ tự dùng 'Tìm hiểu về + tên danh mục'.",
      },
    },
    {
      name: "showToc",
      label: "Hiện mục lục 'Xem nhanh'",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "tocTitle",
      label: "Tiêu đề mục lục",
      type: "text",
      defaultValue: "Xem nhanh",
      admin: {
        condition: (_, siblingData) => siblingData?.showToc !== false,
      },
    },
    {
      name: "body",
      label: "Nội dung bài viết",
      type: "richText",
      admin: {
        description:
          "Dùng đề mục H2 cho phần lớn (I, II, III…) và H3 cho mục con (1, 2, 3…). Mỗi đề mục sẽ tự thành một dòng trong mục lục và có liên kết neo riêng.",
      },
    },
    {
      name: "faqs",
      label: "Câu hỏi thường gặp",
      type: "array",
      labels: {
        singular: "Câu hỏi",
        plural: "Câu hỏi",
      },
      admin: {
        description:
          "Tùy chọn. Mỗi câu hỏi sẽ được đánh dấu schema.org/FAQPage để Google hiển thị dạng câu hỏi mở rộng trên kết quả tìm kiếm.",
      },
      fields: [
        {
          name: "question",
          label: "Câu hỏi",
          type: "text",
          required: true,
        },
        {
          name: "answer",
          label: "Trả lời",
          type: "textarea",
          required: true,
          admin: {
            description: "Viết thành văn xuôi, 1-3 câu. Không dùng HTML.",
          },
        },
      ],
    },
    {
      name: "seo",
      label: "Ghi đè SEO cho landing danh mục",
      type: "group",
      admin: {
        description:
          "Bỏ trống để dùng tiêu đề/mô tả mặc định do hệ thống sinh. Điền vào khi muốn tự kiểm soát thẻ title/description trên Google.",
      },
      fields: [
        {
          name: "title",
          label: "Tiêu đề SEO (title)",
          type: "text",
          admin: {
            description: "Nên 50-60 ký tự. Hệ thống tự thêm ' | HPT Tech' nếu chưa có.",
          },
        },
        {
          name: "description",
          label: "Mô tả SEO (meta description)",
          type: "textarea",
          admin: {
            description: "Nên 140-160 ký tự, có lợi ích + lời kêu gọi (báo giá, hotline).",
          },
        },
        {
          name: "noIndex",
          label: "Không lập chỉ mục danh mục này",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
  ],
};
