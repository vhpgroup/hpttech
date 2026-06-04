import type { CollectionConfig } from "payload";
import { lexicalHTMLField } from "@payloadcms/richtext-lexical";
import { seoField } from "../lib/payload/fields/seo.ts";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: "Sản phẩm",
    plural: "Sản phẩm",
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true;
      return {
        status: {
          equals: "published",
        },
      };
    },
  },
  admin: {
    defaultColumns: ["title", "sku", "brand", "category", "price", "status", "featured"],
    group: "Danh mục sản phẩm",
    useAsTitle: "title",
  },
  hooks: {
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Thông tin chung",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "title",
                  label: "Tên sản phẩm",
                  type: "text",
                  required: true,
                  admin: {
                    width: "60%",
                  },
                },
                {
                  name: "sku",
                  label: "Mã sản phẩm (SKU)",
                  type: "text",
                  admin: {
                    width: "40%",
                    description: "Ví dụ: HL-L2366DW",
                  },
                },
              ],
            },
            {
              name: "slug",
              label: "Đường dẫn",
              type: "text",
              required: true,
              unique: true,
              admin: {
                description: "Đường dẫn thân thiện dùng trên website.",
              },
              hooks: {
                beforeValidate: [
                  ({ data, value }) => value || (data?.title ? formatSlug(data.title) : value),
                ],
              },
            },
            {
              type: "row",
              fields: [
                {
                  name: "brand",
                  label: "Thương hiệu",
                  type: "relationship",
                  relationTo: "brands",
                  required: true,
                  admin: {
                    width: "50%",
                  },
                },
                {
                  name: "stockStatus",
                  label: "Tình trạng hàng",
                  type: "select",
                  defaultValue: "in_stock",
                  options: [
                    {
                      label: "Còn hàng",
                      value: "in_stock",
                    },
                    {
                      label: "Hết hàng",
                      value: "out_of_stock",
                    },
                    {
                      label: "Đặt trước",
                      value: "preorder",
                    },
                  ],
                  admin: {
                    width: "50%",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "price",
                  label: "Giá bán",
                  type: "text",
                  admin: {
                    width: "50%",
                    description: "Nhập theo định dạng hiển thị, ví dụ: 3.900.000đ.",
                  },
                },
                {
                  name: "compareAtPrice",
                  label: "Giá niêm yết",
                  type: "text",
                  admin: {
                    width: "50%",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "vatIncluded",
                  label: "Giá đã gồm VAT",
                  type: "checkbox",
                  defaultValue: true,
                  admin: {
                    width: "33%",
                  },
                },
                {
                  name: "rating",
                  label: "Điểm đánh giá",
                  type: "number",
                  min: 0,
                  max: 5,
                  admin: {
                    width: "33%",
                    description: "Từ 0 đến 5 sao.",
                  },
                },
                {
                  name: "reviewCount",
                  label: "Số đánh giá",
                  type: "number",
                  min: 0,
                  defaultValue: 0,
                  admin: {
                    width: "34%",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "viewCount",
                  label: "Lượt xem",
                  type: "number",
                  min: 0,
                  admin: {
                    width: "33%",
                  },
                },
                {
                  name: "discountBadge",
                  label: "Nhãn giảm giá",
                  type: "text",
                  admin: {
                    width: "33%",
                    description: "Ví dụ: Giảm 15%, Quà tặng, Hot deal.",
                  },
                },
                {
                  name: "promoText",
                  label: "Nội dung khuyến mãi",
                  type: "text",
                  admin: {
                    width: "34%",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "promoStart",
                  label: "Ngày bắt đầu khuyến mãi",
                  type: "date",
                  admin: {
                    date: {
                      pickerAppearance: "dayOnly",
                    },
                    width: "50%",
                  },
                },
                {
                  name: "promoEnd",
                  label: "Ngày kết thúc khuyến mãi",
                  type: "date",
                  admin: {
                    date: {
                      pickerAppearance: "dayOnly",
                    },
                    width: "50%",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "warranty",
                  label: "Bảo hành",
                  type: "text",
                  admin: {
                    width: "50%",
                    description: "Ví dụ: 12 tháng.",
                  },
                },
                {
                  name: "origin",
                  label: "Xuất xứ",
                  type: "text",
                  admin: {
                    width: "50%",
                  },
                },
              ],
            },
            {
              name: "summary",
              label: "Mô tả ngắn",
              type: "richText",
              admin: {
                description: "Hiển thị ở danh sách và phần đầu trang sản phẩm.",
              },
            },
            lexicalHTMLField({
              htmlFieldName: "summaryHTML",
              lexicalFieldName: "summary",
            }),
            {
              name: "tag",
              label: "Nhãn nổi bật",
              type: "select",
              options: [
                { label: "Mới", value: "Mới" },
                { label: "Bán chạy", value: "Bán chạy" },
                { label: "Cao cấp", value: "Cao cấp" },
                { label: "Khuyến mãi", value: "Khuyến mãi" },
              ],
            },
            {
              name: "relatedProducts",
              label: "Sản phẩm liên quan",
              type: "relationship",
              relationTo: "products",
              hasMany: true,
            },
            {
              name: "description",
              label: "Nội dung bài viết",
              type: "richText",
              admin: {
                description: "Nội dung chính hiển thị ở trang chi tiết sản phẩm.",
              },
            },
            lexicalHTMLField({
              htmlFieldName: "descriptionHTML",
              lexicalFieldName: "description",
            }),
            {
              name: "usageGuide",
              label: "Hướng dẫn sử dụng",
              type: "richText",
              admin: {
                description: "Hướng dẫn lắp đặt, vận hành hoặc lưu ý khi sử dụng sản phẩm.",
              },
            },
            lexicalHTMLField({
              htmlFieldName: "usageGuideHTML",
              lexicalFieldName: "usageGuide",
            }),
          ],
        },
        {
          label: "Thông số kỹ thuật",
          fields: [
            {
              name: "specs",
              label: "Thông số kỹ thuật",
              type: "array",
              fields: [
                {
                  name: "label",
                  label: "Tên thông số",
                  type: "text",
                  required: true,
                  admin: {
                    width: "40%",
                  },
                },
                {
                  name: "value",
                  label: "Giá trị",
                  type: "text",
                  required: true,
                  admin: {
                    width: "60%",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Hình ảnh & Tài liệu",
          fields: [
            {
              name: "datasheets",
              label: "Tài liệu kỹ thuật",
              type: "upload",
              relationTo: "media",
              hasMany: true,
              admin: {
                description: "Dùng cho PDF catalogue, datasheet hoặc tài liệu hướng dẫn.",
              },
            },
          ],
        },
        {
          label: "SEO",
          fields: [seoField],
        },
        {
          label: "Nâng cao",
          fields: [
            {
              name: "sortOrder",
              label: "Thứ tự ưu tiên",
              type: "number",
              defaultValue: 0,
              admin: {
                description: "Số nhỏ hơn được ưu tiên hiển thị trước khi cần sắp xếp thủ công.",
              },
            },
            {
              name: "internalNote",
              label: "Ghi chú nội bộ",
              type: "textarea",
              admin: {
                description: "Chỉ dùng trong CMS, không hiển thị ngoài website.",
              },
            },
          ],
        },
      ],
    },
    {
      name: "category",
      label: "Danh mục",
      type: "relationship",
      relationTo: "categories",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "images",
      label: "Ảnh sản phẩm",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      admin: {
        position: "sidebar",
        description: "Khuyến nghị ảnh vuông 1200x1200px.",
      },
    },
    {
      name: "featured",
      label: "Nổi bật",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "status",
      label: "Trạng thái đăng",
      type: "select",
      defaultValue: "draft",
      options: [
        {
          label: "Bản nháp",
          value: "draft",
        },
        {
          label: "Đã xuất bản",
          value: "published",
        },
        {
          label: "Lưu trữ",
          value: "archived",
        },
      ],
      required: true,
      admin: {
        position: "sidebar",
      },
    },
  ],
};
