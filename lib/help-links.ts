export const helpLinks = [
  {
    label: "Hướng dẫn đặt hàng Flash Sale",
    href: "/huong-dan-dat-hang-flash-sale",
  },
  {
    label: "Hướng dẫn mua hàng",
    href: "/huong-dan-mua-hang",
  },
  {
    label: "Chính sách bảo hành đổi trả",
    href: "/chinh-sach-bao-hanh-doi-tra",
  },
  {
    label: "Chính sách bảo mật thông tin",
    href: "/chinh-sach-bao-mat",
  },
  {
    label: "Chính sách mua trả góp",
    href: "/chinh-sach-mua-tra-gop",
  },
  {
    label: "Chính sách giao hàng",
    href: "/chinh-sach-giao-hang",
  },
  {
    label: "Hỗ trợ khách hàng dự án, doanh nghiệp",
    href: "/ho-tro-khach-hang-du-an-doanh-nghiep",
  },
] as const;

export type HelpPath = (typeof helpLinks)[number]["href"];
