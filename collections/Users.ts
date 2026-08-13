import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  labels: {
    singular: "Người dùng",
    plural: "Người dùng",
  },
  admin: {
    useAsTitle: "email",
  },
  // useAPIKey: hiện mục "API Key" trong trang user của Admin để cấp key cho
  // script/tích hợp gọi REST bằng header `Authorization: users API-Key <key>`.
  // Chỉ MỞ KHẢ NĂNG cấp key — không tự bật cho tài khoản nào; mỗi user phải
  // tự tick "Enable API Key". Đăng nhập bằng email/mật khẩu giữ nguyên.
  auth: {
    useAPIKey: true,
  },
  fields: [
    {
      name: "name",
      label: "Họ tên",
      type: "text",
    },
  ],
};
