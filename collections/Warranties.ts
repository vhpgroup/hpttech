import type { CollectionConfig } from "payload";

/**
 * Phiếu bảo hành theo từng thiết bị đã bàn giao.
 *
 * Khách hàng tra cứu công khai tại /tra-cuu-bao-hanh theo số serial,
 * tên khách hàng hoặc mã E-HSMT (gói thầu). Trang tra cứu KHÔNG đọc qua
 * REST API của collection (access read yêu cầu đăng nhập) mà qua truy vấn
 * giới hạn trường trong lib/warranty-payload.ts để không lộ dữ liệu nội bộ
 * (SĐT khách, ghi chú nội bộ).
 */

function addMonthsClamped(base: Date, months: number): Date {
  const result = new Date(base.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const daysInTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, daysInTargetMonth));
  return result;
}

export const Warranties: CollectionConfig = {
  slug: "warranties",
  labels: {
    singular: "Phiếu bảo hành",
    plural: "Phiếu bảo hành",
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    defaultColumns: ["serialNumber", "productName", "customerName", "ehsmtCode", "endDate", "voided"],
    group: "Bán hàng",
    useAsTitle: "serialNumber",
    description:
      "Hồ sơ bảo hành từng thiết bị. Khách hàng tra cứu tại hpttech.vn/tra-cuu-bao-hanh theo serial, tên khách hàng hoặc mã E-HSMT.",
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data;
        const months = Number(data.warrantyMonths);
        if (!data.endDate && data.startDate && Number.isFinite(months) && months > 0) {
          const start = new Date(data.startDate);
          if (!Number.isNaN(start.getTime())) {
            data.endDate = addMonthsClamped(start, Math.round(months)).toISOString();
          }
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "serialNumber",
      label: "Số serial (S/N)",
      type: "text",
      required: true,
      index: true,
      admin: {
        description: "Số serial in trên tem của thiết bị. Tra cứu không phân biệt hoa/thường và khoảng trắng.",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "customerName",
          label: "Tên khách hàng / đơn vị",
          type: "text",
          required: true,
          index: true,
          admin: { width: "50%" },
        },
        {
          name: "customerPhone",
          label: "SĐT liên hệ (nội bộ)",
          type: "text",
          admin: { width: "50%", description: "Không hiển thị trên trang tra cứu công khai." },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "ehsmtCode",
          label: "Mã E-HSMT (gói thầu)",
          type: "text",
          index: true,
          admin: { width: "50%", description: "Để trống nếu bán lẻ, không qua gói thầu." },
        },
        {
          name: "sku",
          label: "Mã SP / Model",
          type: "text",
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "productName",
      label: "Tên sản phẩm",
      type: "text",
      required: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "startDate",
          label: "Ngày bắt đầu bảo hành",
          type: "date",
          required: true,
          admin: {
            width: "33%",
            date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" },
          },
        },
        {
          name: "warrantyMonths",
          label: "Thời hạn (tháng)",
          type: "number",
          required: true,
          min: 0,
          admin: { width: "33%" },
        },
        {
          name: "endDate",
          label: "Ngày hết hạn",
          type: "date",
          admin: {
            width: "33%",
            date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" },
            description: "Để trống sẽ tự tính = Ngày bắt đầu + Thời hạn.",
          },
        },
      ],
    },
    {
      name: "voided",
      label: "Hủy hiệu lực bảo hành",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Đánh dấu khi phiếu không còn hiệu lực (rách tem, sai serial, từ chối bảo hành...).",
      },
    },
    {
      name: "note",
      label: "Ghi chú nội bộ",
      type: "textarea",
      admin: { description: "Không hiển thị trên trang tra cứu công khai." },
    },
  ],
};
