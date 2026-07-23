import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import HelpSidebar from "@/components/help/HelpSidebar";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { pageMetadata } from "@/lib/seo";
import { phoneHref } from "@/lib/site-settings";

export const metadata = pageMetadata({
  title: "Chính sách bảo mật thông tin",
  description:
    "Chính sách thu thập, sử dụng, lưu trữ và bảo vệ thông tin khách hàng tại HPT Tech.",
  path: "/chinh-sach-bao-mat",
});

const hotline = "0967286889";
const email = "bach.pv@hpttech.vn";
const address = "SB.04 Vinhomes Marina, P. An Biên, TP. Hải Phòng";

export default function PrivacyPolicyPage() {
  return (
    <main className="subpage-main bg-[#eef0f4]">
      <div className="px-4 pb-12 sm:px-6 lg:px-0">
        <SubpageHeader
          className="mb-7"
          title="Chính sách bảo mật thông tin"
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Chính sách bảo mật thông tin" },
          ]}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <HelpSidebar activePath="/chinh-sach-bao-mat" />

          <article className="min-w-0 bg-white px-6 py-7 text-[16px] leading-7 text-slate-800 sm:px-8 lg:px-10 lg:py-8">
            <h1 className="text-center text-2xl font-black uppercase leading-tight text-slate-900 sm:text-3xl">
              Chính sách bảo mật thông tin
            </h1>

            <p className="mx-auto mt-5 max-w-4xl text-center text-slate-600">
              HPT Tech tôn trọng quyền riêng tư và cam kết bảo vệ thông tin của khách hàng trong
              quá trình truy cập website, liên hệ tư vấn và sử dụng sản phẩm, dịch vụ.
            </p>

            <PolicySection number="1" title="Mục đích thu thập thông tin cá nhân">
              <p>
                Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT chỉ thu thập những thông tin
                cần thiết để tư vấn, báo giá, cung cấp sản phẩm, dịch vụ và nâng cao chất lượng chăm
                sóc khách hàng.
              </p>
              <p>
                Khi khách hàng liên hệ hoặc sử dụng các dịch vụ trên website, HPT Tech có thể tiếp
                nhận họ tên, số điện thoại, email, địa chỉ liên hệ và những thông tin cần thiết khác.
                Khách hàng chịu trách nhiệm về tính chính xác của thông tin đã cung cấp.
              </p>
              <p>
                Website cũng có thể tự động ghi nhận dữ liệu kỹ thuật như địa chỉ IP, loại trình
                duyệt, thiết bị, thời gian truy cập và các trang đã xem nhằm phục vụ thống kê, vận
                hành hệ thống và cải thiện trải nghiệm người dùng.
              </p>
            </PolicySection>

            <PolicySection number="2" title="Phạm vi sử dụng thông tin">
              <p>Thông tin khách hàng có thể được sử dụng cho các hoạt động sau:</p>
              <BulletList
                items={[
                  "Tư vấn sản phẩm, gửi báo giá và xác nhận đơn hàng.",
                  "Hỗ trợ kỹ thuật, giải đáp thắc mắc và chăm sóc khách hàng.",
                  "Thông báo tình trạng đơn hàng, chính sách dịch vụ hoặc thông tin liên quan đến sản phẩm khách hàng quan tâm.",
                  "Phân tích, thống kê và cải thiện chất lượng website, sản phẩm và dịch vụ.",
                ]}
              />
              <p>
                HPT Tech không mua bán, chuyển nhượng hoặc chia sẻ dữ liệu khách hàng cho bên thứ ba
                vì mục đích thương mại khi chưa có sự đồng ý, trừ trường hợp pháp luật yêu cầu hoặc
                cần thiết để thực hiện dịch vụ mà khách hàng đã đề nghị.
              </p>
            </PolicySection>

            <PolicySection number="3" title="Thời gian lưu trữ thông tin">
              <p>
                Thông tin được lưu trữ trong khoảng thời gian cần thiết để phục vụ mục đích đã nêu,
                giải quyết các yêu cầu của khách hàng, thực hiện nghĩa vụ hợp đồng và tuân thủ quy
                định pháp luật hiện hành.
              </p>
              <p>
                Khi thông tin không còn cần thiết, HPT Tech sẽ thực hiện xóa, ẩn danh hoặc áp dụng
                biện pháp xử lý phù hợp theo quy trình quản lý dữ liệu nội bộ.
              </p>
            </PolicySection>

            <PolicySection number="4" title="Đối tượng được tiếp cận thông tin">
              <p>
                Thông tin khách hàng chỉ được tiếp cận bởi nhân sự và bộ phận có trách nhiệm tại HPT
                Tech nhằm phục vụ hoạt động kinh doanh, giao nhận, hỗ trợ kỹ thuật và chăm sóc khách
                hàng.
              </p>
              <p>
                Trong phạm vi cần thiết, thông tin có thể được cung cấp cho đối tác hỗ trợ thực hiện
                dịch vụ hoặc cơ quan nhà nước có thẩm quyền khi có yêu cầu hợp pháp. Các bên tiếp
                nhận phải tuân thủ nghĩa vụ bảo mật tương ứng.
              </p>
            </PolicySection>

            <PolicySection number="5" title="Đơn vị thu thập và quản lý thông tin">
              <div className="border border-slate-300 bg-slate-50 p-5 sm:p-6">
                <h3 className="font-black uppercase leading-7 text-slate-900">
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
            </PolicySection>

            <PolicySection number="6" title="Cam kết bảo mật thông tin khách hàng">
              <p>
                HPT Tech áp dụng các biện pháp kỹ thuật và quản lý phù hợp để hạn chế nguy cơ truy
                cập, sử dụng, thay đổi hoặc tiết lộ thông tin trái phép. Các biện pháp bảo mật được
                rà soát và cập nhật phù hợp với hoạt động của hệ thống.
              </p>
              <p>
                Do đặc thù của môi trường Internet, không hệ thống nào có thể bảo đảm an toàn tuyệt
                đối trước mọi rủi ro. Khi xảy ra sự cố ngoài khả năng kiểm soát hợp lý, HPT Tech sẽ
                nhanh chóng đánh giá, hạn chế thiệt hại và phối hợp xử lý theo quy định pháp luật.
              </p>
            </PolicySection>

            <PolicySection number="7" title="Tiếp nhận và giải quyết khiếu nại">
              <p>
                Nếu phát hiện thông tin bị sử dụng sai mục đích, tiết lộ trái phép hoặc có vấn đề
                liên quan đến bảo mật dữ liệu, khách hàng có thể liên hệ trực tiếp với HPT Tech qua
                hotline hoặc email được công bố trên trang này.
              </p>
              <p>
                Mọi phản ánh sẽ được tiếp nhận, xác minh và xử lý trong thời gian phù hợp. HPT Tech
                cam kết phối hợp với khách hàng và cơ quan chức năng có liên quan để giải quyết vụ
                việc minh bạch, đúng quy định và bảo vệ quyền lợi hợp pháp của khách hàng.
              </p>
            </PolicySection>

            <PolicySection number="8" title="Thông tin liên hệ">
              <p>
                Mọi ý kiến đóng góp, yêu cầu hỗ trợ hoặc thắc mắc liên quan đến chính sách bảo mật
                thông tin, vui lòng liên hệ:
              </p>
              <div className="mt-5 space-y-2">
                <p className="font-bold uppercase text-slate-900">
                  Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT
                </p>
                <p>Địa chỉ: {address}</p>
                <p>
                  Hotline:{" "}
                  <a className="font-semibold text-primary-700 hover:underline" href={phoneHref(hotline)}>
                    {hotline}
                  </a>
                </p>
                <p>
                  Email:{" "}
                  <a className="font-semibold text-primary-700 hover:underline" href={`mailto:${email}`}>
                    {email}
                  </a>
                </p>
                <p>
                  Website:{" "}
                  <a
                    className="font-semibold text-primary-700 hover:underline"
                    href="https://hpttech.vn"
                  >
                    hpttech.vn
                  </a>
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
                <a
                  href={phoneHref(hotline)}
                  className="inline-flex items-center gap-2 bg-primary-500 px-5 py-3 font-semibold text-white transition hover:bg-primary-600"
                >
                  <Phone size={18} />
                  Gọi {hotline}
                </a>
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent("Yêu cầu hỗ trợ về chính sách bảo mật")}`}
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
            </PolicySection>
          </article>
        </div>
      </div>
    </main>
  );
}

function PolicySection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-black uppercase leading-8 text-primary-600">
        {number}. {title}
      </h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
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
