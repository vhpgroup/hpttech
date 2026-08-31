import Image from "next/image";
import Link from "next/link";

const SIDE_AD_IMAGE = "/api/r2-media/HPT_Microsoft_banner_200x600.png";
const SIDE_AD_LINK = "/tin-tuc/tin-tuc-hpt/thong-bao/ban-quyen-khong-kho-da-co-hpt";

export default function SiteSideBanners() {
  return (
    <div className="site-side-ads" aria-label="Banner quảng cáo hai bên">
      <Link
        className="site-side-ad site-side-ad-left"
        href={SIDE_AD_LINK}
        aria-label="Xem ưu đãi bản quyền không khó đã có HPT"
      >
        <Image
          src={SIDE_AD_IMAGE}
          alt="Ưu đãi Microsoft chính hãng tại HPT Tech"
          width={200}
          height={600}
          priority
        />
      </Link>
      <Link
        className="site-side-ad site-side-ad-right"
        href={SIDE_AD_LINK}
        aria-label="Xem ưu đãi bản quyền không khó đã có HPT"
      >
        <Image
          src={SIDE_AD_IMAGE}
          alt="Ưu đãi Microsoft chính hãng tại HPT Tech"
          width={200}
          height={600}
          priority
        />
      </Link>
    </div>
  );
}
