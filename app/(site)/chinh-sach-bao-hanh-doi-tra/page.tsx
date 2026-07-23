import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import HelpSidebar from "@/components/help/HelpSidebar";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { pageMetadata } from "@/lib/seo";
import { phoneHref } from "@/lib/site-settings";

export const metadata = pageMetadata({
  title: "Chính sách bảo hành đổi trả",
  description:
    "Chính sách đổi trả, bảo hành và thông tin Trung tâm bảo hành HPT Tech dành cho khách hàng cá nhân và doanh nghiệp.",
  path: "/chinh-sach-bao-hanh-doi-tra",
});

const hotline = "0967286889";
const email = "bach.pv@hpttech.vn";
const address = "SB.04 Vinhomes Marina, P. An Biên, TP. Hải Phòng";

const refusalConditions = [
  "Sản phẩm hết thời hạn bảo hành.",
  "Tem bảo hành, serial number hoặc mã sản phẩm bị rách, mất hoặc có dấu hiệu chỉnh sửa.",
  "Sản phẩm bị hư hỏng do thiên tai, hỏa hoạn, sét đánh, nguồn điện không ổn định hoặc các tác nhân khách quan khác.",
  "Sản phẩm bị rơi vỡ, va đập, ngấm nước, oxy hóa hoặc biến dạng vật lý.",
  "Sản phẩm bị tự ý tháo lắp, sửa chữa bởi đơn vị hoặc cá nhân không được ủy quyền.",
  "Hư hỏng do sử dụng sai hướng dẫn của nhà sản xuất.",
  "Phần mềm, dữ liệu và các thông tin lưu trữ của khách hàng.",
];

export default function WarrantyCenterPage() {
  return (
    <main className="subpage-main bg-[#eef0f4]">
      <div className="px-4 pb-12 sm:px-6 lg:px-0">
        <SubpageHeader
          className="mb-7"
          title="Chính sách bảo hành đổi trả"
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Chính sách bảo hành đổi trả" },
          ]}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <HelpSidebar activePath="/chinh-sach-bao-hanh-doi-tra" />

          <article className="min-w-0 bg-white px-6 py-7 text-[16px] leading-7 text-slate-800 sm:px-8 lg:px-10 lg:py-8">
            <h2 className="text-center text-2xl font-black uppercase leading-tight text-slate-900 sm:text-3xl">
              Trung tâm bảo hành và dịch vụ khách hàng
            </h2>

            <p className="mx-auto mt-5 max-w-4xl text-center text-slate-600">
              HPT Tech cam kết cung cấp sản phẩm chính hãng cùng dịch vụ bảo hành chuyên nghiệp,
              nhanh chóng và minh bạch nhằm bảo đảm quyền lợi cao nhất cho khách hàng.
            </p>

            <section className="mt-12 scroll-mt-5" aria-labelledby="policy-a">
              <DocumentTitle id="policy-a">A. Chính sách đổi trả và bảo hành</DocumentTitle>

              <DocumentSection id="chinh-sach-doi-tra" title="I. Chính sách đổi trả">
                <Subheading>1. Đổi mới sản phẩm lỗi do nhà sản xuất</Subheading>
                <BulletList
                  items={[
                    "Sản phẩm mới mua trong thời gian quy định của từng mặt hàng, nếu phát sinh lỗi kỹ thuật được xác nhận từ nhà sản xuất sẽ được đổi mới theo chính sách của HPT Tech và hãng sản xuất.",
                    "Các trường hợp đổi mới phải đáp ứng đầy đủ điều kiện về tem nhãn, phụ kiện, bao bì và chứng từ mua hàng.",
                  ]}
                />

                <Subheading>Điều kiện đổi trả</Subheading>
                <BulletList
                  items={[
                    "Sản phẩm không bị tác động vật lý như rơi vỡ, móp méo, trầy xước nghiêm trọng hoặc có dấu hiệu sử dụng sai quy cách.",
                    "Còn đầy đủ hộp, phụ kiện, tài liệu hướng dẫn và phiếu bảo hành nếu có.",
                    "Có hóa đơn hoặc chứng từ mua hàng hợp lệ từ HPT Tech.",
                    "Các trường hợp không đủ điều kiện đổi mới sẽ được áp dụng theo chính sách bảo hành của hãng sản xuất.",
                  ]}
                />
              </DocumentSection>

              <DocumentSection id="bao-hanh-chung" title="II. Chính sách bảo hành chung">
                <BulletList
                  items={[
                    "Tất cả sản phẩm do HPT Tech cung cấp đều được bảo hành theo tiêu chuẩn của hãng sản xuất hoặc nhà phân phối chính thức tại Việt Nam.",
                    "Thời gian xử lý bảo hành thông thường từ 07 - 15 ngày làm việc, tùy từng hãng và tình trạng sản phẩm.",
                    "Trường hợp cần gửi hãng kiểm tra chuyên sâu, thời gian xử lý sẽ được thông báo cụ thể tới khách hàng.",
                    "HPT Tech hỗ trợ tiếp nhận, kiểm tra và tư vấn miễn phí các trường hợp sản phẩm gặp sự cố.",
                  ]}
                />
              </DocumentSection>

              <DocumentSection id="bao-hanh-doanh-nghiep" title="III. Bảo hành doanh nghiệp">
                <BulletList
                  items={[
                    "Hỗ trợ kiểm tra và bảo hành tận nơi đối với khách hàng doanh nghiệp theo thỏa thuận trong hợp đồng.",
                    "Hỗ trợ thiết bị thay thế tạm thời nếu có trong thời gian chờ bảo hành.",
                    "Ưu tiên xử lý các trường hợp ảnh hưởng đến hoạt động sản xuất kinh doanh của khách hàng.",
                  ]}
                />
              </DocumentSection>

              <DocumentSection id="bao-hanh-tan-noi" title="IV. Bảo hành tận nơi">
                <BulletList
                  items={[
                    "Áp dụng theo từng nhóm sản phẩm và khu vực địa lý.",
                    "Hỗ trợ kỹ thuật tận nơi đối với các dự án, hệ thống CNTT, camera giám sát, máy scan, máy in và thiết bị văn phòng do HPT Tech triển khai.",
                    "Không bảo hành dữ liệu, phần mềm hoặc các lỗi phát sinh từ hệ điều hành, virus và phần mềm bên thứ ba.",
                  ]}
                />
              </DocumentSection>

              <DocumentSection id="khach-hang-ngoai-tinh" title="V. Khách hàng ngoại tỉnh">
                <BulletList
                  items={[
                    "Khách hàng có thể gửi sản phẩm qua đơn vị vận chuyển hoặc chuyển phát nhanh.",
                    "Chi phí gửi sản phẩm đến trung tâm bảo hành do khách hàng thanh toán.",
                    "Chi phí gửi trả sau bảo hành sẽ được HPT Tech hỗ trợ hoặc thỏa thuận tùy từng trường hợp.",
                    "Vui lòng liên hệ HPT Tech trước khi gửi để được xác nhận thông tin tiếp nhận và hướng dẫn đóng gói.",
                  ]}
                />
              </DocumentSection>
            </section>

            <section id="tu-choi-bao-hanh" className="mt-12 scroll-mt-5" aria-labelledby="refusal-title">
              <DocumentTitle id="refusal-title">Điều kiện từ chối bảo hành</DocumentTitle>
              <p className="mt-6">Các trường hợp sau không thuộc phạm vi bảo hành:</p>
              <ol className="mt-4 space-y-3 pl-6">
                {refusalConditions.map((item) => (
                  <li key={item} className="list-decimal pl-1">
                    {item}
                  </li>
                ))}
              </ol>
            </section>

            <section id="thong-tin-lien-he" className="mt-14 scroll-mt-5" aria-labelledby="contact-title">
              <DocumentTitle id="contact-title">
                B. Trung tâm bảo hành và dịch vụ khách hàng HPT Tech
              </DocumentTitle>

              <div className="mt-7 border border-slate-300 bg-slate-50 p-5 sm:p-6">
                <h3 className="text-lg font-black uppercase leading-7 text-slate-900">
                  Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT
                </h3>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <ContactItem icon={MapPin} label="Địa chỉ" value={address} />
                  <ContactItem icon={Phone} label="Hotline" value={hotline} href={phoneHref(hotline)} />
                  <ContactItem icon={Mail} label="Email" value={email} href={`mailto:${email}`} />
                  <ContactItem
                    icon={ShieldCheck}
                    label="Website"
                    value="hpttech.vn"
                    href="https://hpttech.vn"
                  />
                </div>
              </div>

              <h3 className="mt-8 text-xl font-bold uppercase text-slate-900">Thời gian làm việc</h3>
              <ul className="mt-4 space-y-2">
                <li>- Thứ Hai - Thứ Sáu: 08:00 - 17:30</li>
                <li>- Thứ Bảy: 08:00 - 12:00</li>
                <li>- Chủ Nhật và ngày lễ: Nghỉ</li>
              </ul>

              <h3 className="mt-8 text-xl font-bold uppercase text-slate-900">Hỗ trợ khách hàng</h3>
              <p className="mt-4">
                Mọi yêu cầu bảo hành, hỗ trợ kỹ thuật, góp ý hoặc khiếu nại về sản phẩm và dịch vụ,
                Quý khách vui lòng liên hệ HPT Tech qua hotline hoặc email để được hỗ trợ nhanh nhất.
              </p>
              <p className="mt-4 font-semibold">
                Xin chân thành cảm ơn Quý khách đã tin tưởng và sử dụng sản phẩm, dịch vụ của HPT Tech.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
                <a
                  href={phoneHref(hotline)}
                  className="inline-flex items-center gap-2 bg-primary-500 px-5 py-3 font-semibold text-white transition hover:bg-primary-600"
                >
                  <Phone size={18} />
                  Gọi {hotline}
                </a>
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent("Yêu cầu bảo hành HPT Tech")}`}
                  className="inline-flex items-center gap-2 border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:border-primary-400 hover:text-primary-700"
                >
                  <Mail size={18} />
                  Gửi email
                </a>
                <Link
                  href="/lien-he"
                  className="inline-flex items-center border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:border-primary-400 hover:text-primary-700"
                >
                  Trang liên hệ
                </Link>
              </div>
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}

function DocumentTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-center text-xl font-black uppercase leading-8 text-primary-600 sm:text-2xl">
      {children}
    </h2>
  );
}

function DocumentSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-5">
      <h3 className="text-xl font-black uppercase leading-8 text-primary-600">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Subheading({ children }: { children: React.ReactNode }) {
  return <h4 className="mt-5 font-bold text-slate-900 first:mt-0">{children}</h4>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden="true">-</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <Icon className="mt-1 shrink-0 text-primary-600" size={19} />
      <div>
        <span className="font-bold text-slate-900">{label}: </span>
        <span>{value}</span>
      </div>
    </>
  );

  return href ? (
    <a href={href} className="flex gap-3 transition hover:text-primary-700">
      {content}
    </a>
  ) : (
    <div className="flex gap-3">{content}</div>
  );
}
