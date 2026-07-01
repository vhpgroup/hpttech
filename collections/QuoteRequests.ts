import type { CollectionConfig } from "payload";

export const QuoteRequests: CollectionConfig = {
  slug: "quote-requests",
  labels: {
    singular: "Yêu cầu báo giá",
    plural: "Yêu cầu báo giá",
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    defaultColumns: ["quoteId", "company", "phone", "status", "totalLabel", "createdAt"],
    group: "Bán hàng",
    useAsTitle: "quoteId",
  },
  fields: [
    {
      name: "quoteId",
      label: "Mã báo giá",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      defaultValue: "new",
      options: [
        { label: "Mới", value: "new" },
        { label: "Đang tư vấn", value: "consulting" },
        { label: "Đã gửi báo giá", value: "quoted" },
        { label: "Đang giao hàng", value: "shipping" },
        { label: "Thành công", value: "success" },
        { label: "Thất bại", value: "failed" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "company", label: "Công ty", type: "text", admin: { width: "50%" } },
        { name: "taxCode", label: "Mã số thuế (xuất VAT)", type: "text", admin: { width: "50%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "contact", label: "Người liên hệ", type: "text", admin: { width: "50%" } },
        { name: "phone", label: "Số điện thoại", type: "text", required: true, admin: { width: "50%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "email", label: "Email", type: "email", admin: { width: "50%" } },
        { name: "source", label: "Nguồn", type: "text", admin: { width: "50%", readOnly: true } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "industry", label: "Ngành/facet pSEO", type: "text", admin: { width: "50%", readOnly: true } },
        { name: "landingPath", label: "Landing source", type: "text", admin: { width: "50%", readOnly: true } },
      ],
    },
    { name: "address", label: "Địa chỉ", type: "textarea" },
    { name: "note", label: "Ghi chú yêu cầu", type: "textarea" },
    {
      name: "items",
      label: "Sản phẩm",
      type: "array",
      minRows: 1,
      fields: [
        { name: "title", label: "Tên sản phẩm", type: "text", required: true },
        { name: "sku", label: "Mã SP", type: "text" },
        { name: "quantity", label: "Số lượng", type: "number", required: true, min: 1 },
        { name: "priceLabel", label: "Đơn giá (hiển thị)", type: "text" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "subtotal", label: "Tạm tính", type: "number", admin: { width: "33%" } },
        { name: "vat", label: "VAT", type: "number", admin: { width: "33%" } },
        { name: "totalLabel", label: "Tổng (đã VAT)", type: "text", admin: { width: "33%" } },
      ],
    },
    { name: "internalNote", label: "Ghi chú nội bộ", type: "textarea" },
  ],
};
