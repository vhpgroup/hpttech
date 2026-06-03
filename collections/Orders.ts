import type { CollectionConfig } from "payload";

export const Orders: CollectionConfig = {
  slug: "orders",
  labels: {
    singular: "Đơn hàng",
    plural: "Đơn hàng",
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    defaultColumns: ["orderCode", "customerName", "customerPhone", "status", "totalLabel", "createdAt"],
    group: "Bán hàng",
    useAsTitle: "orderCode",
  },
  fields: [
    {
      name: "orderCode",
      label: "Mã đơn hàng",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      defaultValue: "new",
      required: true,
      options: [
        { label: "Đơn mới", value: "new" },
        { label: "Đang liên hệ", value: "contacting" },
        { label: "Đã xác nhận", value: "confirmed" },
        { label: "Đang xử lý", value: "processing" },
        { label: "Hoàn tất", value: "completed" },
        { label: "Đã hủy", value: "cancelled" },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "customerName",
          label: "Họ tên",
          type: "text",
          required: true,
          admin: { width: "50%" },
        },
        {
          name: "customerPhone",
          label: "Số điện thoại",
          type: "text",
          required: true,
          admin: { width: "50%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "customerEmail",
          label: "Email",
          type: "email",
          admin: { width: "50%" },
        },
        {
          name: "customerArea",
          label: "Tỉnh/thành hoặc khu vực",
          type: "text",
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "customerAddress",
      label: "Địa chỉ giao hàng",
      type: "textarea",
      required: true,
    },
    {
      name: "customerNote",
      label: "Ghi chú",
      type: "textarea",
    },
    {
      type: "row",
      fields: [
        {
          name: "paymentMethod",
          label: "Phương thức thanh toán",
          type: "select",
          defaultValue: "cod",
          required: true,
          options: [
            { label: "COD", value: "cod" },
            { label: "Liên hệ xác nhận", value: "confirm_first" },
          ],
          admin: { width: "50%" },
        },
        {
          name: "shippingFeeStatus",
          label: "Phí vận chuyển",
          type: "select",
          defaultValue: "pending_confirmation",
          required: true,
          options: [{ label: "Chờ xác nhận", value: "pending_confirmation" }],
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "items",
      label: "Sản phẩm",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        { name: "product", label: "Sản phẩm liên kết", type: "relationship", relationTo: "products" },
        { name: "slug", label: "Slug", type: "text" },
        { name: "href", label: "Đường dẫn", type: "text" },
        { name: "title", label: "Tên sản phẩm", type: "text", required: true },
        { name: "brand", label: "Thương hiệu", type: "text" },
        { name: "category", label: "Danh mục", type: "text" },
        { name: "image", label: "Ảnh", type: "text" },
        { name: "priceLabel", label: "Giá hiển thị", type: "text" },
        { name: "unitPrice", label: "Đơn giá", type: "number" },
        { name: "quantity", label: "Số lượng", type: "number", required: true, min: 1 },
        { name: "lineTotal", label: "Thành tiền", type: "number" },
        {
          name: "requiresPriceConfirmation",
          label: "Cần xác nhận giá",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "subtotal",
          label: "Tạm tính",
          type: "number",
          defaultValue: 0,
          admin: { width: "33%" },
        },
        {
          name: "totalLabel",
          label: "Tổng hiển thị",
          type: "text",
          required: true,
          admin: { width: "33%" },
        },
        {
          name: "requiresPriceConfirmation",
          label: "Cần xác nhận giá",
          type: "checkbox",
          defaultValue: false,
          admin: { width: "33%" },
        },
      ],
    },
    {
      name: "internalNote",
      label: "Ghi chú nội bộ",
      type: "textarea",
    },
  ],
};
