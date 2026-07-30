// Danh bạ đội tư vấn khách hàng + hỗ trợ kỹ thuật hiển thị trên site
// (sidebar trang chi tiết sản phẩm, popover "Hỗ trợ kỹ thuật" ở topbar).
// Đổi người / số điện thoại / ảnh TẠI ĐÂY — mọi nơi dùng chung tự cập nhật.
// Ảnh chân dung tự host trên media R2 của site (upload qua /api/media).

export type SupportContact = {
  name: string;
  phone: string;
  initials: string;
  avatarClassName: string;
  imageSrc?: string;
};

export const consultantItems: SupportContact[] = [
  {
    name: "Đào Duy Vỹ",
    phone: "0876 645 432",
    initials: "DVY",
    avatarClassName: "bg-success",
    imageSrc: "/assets/consultants/dao-duy-vy.jpg",
  },
  {
    name: "Nguyễn Viết Tân",
    phone: "0559 309 904",
    initials: "NT",
    avatarClassName: "bg-primary-700",
    imageSrc: "/assets/consultants/nguyen-viet-tan.jpg",
  },
  {
    name: "Nguyễn Đức Thắng",
    phone: "0372 767 995",
    initials: "NT",
    avatarClassName: "bg-primary-600",
    imageSrc: "/assets/consultants/nguyen-duc-thang.jpg",
  },
];

export const technicalSupportItems: SupportContact[] = [
  {
    name: "Trần Gia Minh",
    phone: "0778 335 225",
    initials: "TGM",
    avatarClassName: "bg-accent-600",
    imageSrc: "/api/r2-media/tran-gia-minh.jpg",
  },
  {
    name: "Nguyễn Thành Danh",
    phone: "0973 798 939",
    initials: "ND",
    avatarClassName: "bg-accent-600",
    imageSrc: "/api/r2-media/nguyen-thanh-danh.jpg",
  },
  {
    name: "Đào Thanh Tùng",
    phone: "0931 311 686",
    initials: "DTT",
    avatarClassName: "bg-accent-600",
    imageSrc: "/api/r2-media/dao-thanh-tung.jpg",
  },
];
