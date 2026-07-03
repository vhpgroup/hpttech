import Link from "next/link";
import { FileText, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { pageMetadata } from "@/lib/seo";
import { phoneHref } from "@/lib/site-settings";

export const metadata = pageMetadata({
  title: "Điều khoản sử dụng",
  description:
    "Điều khoản và điều kiện sử dụng website hpttech.vn của HPT Tech: quyền và nghĩa vụ của khách hàng và HPT Tech, đặt hàng, báo giá, thanh toán, bảo hành, sở hữu trí tuệ và giải quyết tranh chấp.",
  path: "/dieu-khoan-su-dung",
});

const hotline = "0967286889";
const email = "bach.pv@hpttech.vn";
const address = "SB.04 Vinhomes Marina, P. An Biên, TP. Hải Phòng";
const termsSections = [
  { id: "gioi-thieu-chung", number: "1", title: "Giới thiệu chung" },
  { id: "doi-tuong-va-pham-vi-ap-dung", number: "2", title: "Đối tượng và phạm vi áp dụng" },
  { id: "tai-khoan-va-thong-tin-khach-hang", number: "3", title: "Tài khoản và thông tin khách hàng" },
  { id: "quyen-va-nghia-vu-cua-khach-hang", number: "4", title: "Quyền và nghĩa vụ của khách hàng" },
  { id: "quyen-va-trach-nhiem-cua-hpt-tech", number: "5", title: "Quyền và trách nhiệm của HPT Tech" },
  { id: "gia-bao-gia-va-thanh-toan", number: "6", title: "Giá, báo giá và thanh toán" },
  { id: "dat-hang-va-xac-nhan-don-hang", number: "7", title: "Đặt hàng và xác nhận đơn hàng" },
  { id: "giao-hang-bao-hanh-va-doi-tra", number: "8", title: "Giao hàng, bảo hành và đổi trả" },
  { id: "quyen-so-huu-tri-tue", number: "9", title: "Quyền sở hữu trí tuệ" },
  { id: "gioi-han-trach-nhiem-va-bat-kha-khang", number: "10", title: "Giới hạn trách nhiệm và bất khả kháng" },
  { id: "luat-ap-dung-va-giai-quyet-tranh-chap", number: "11", title: "Luật áp dụng và giải quyết tranh chấp" },
  { id: "sua-doi-dieu-khoan", number: "12", title: "Sửa đổi điều khoản" },
  { id: "thong-tin-lien-he", number: "13", title: "Thông tin liên hệ" },
] as const;

export default function TermsOfUsePage() {
  return (
    <main className="subpage-main bg-[#eef0f4]">
      <div className="px-4 pb-12 sm:px-6 lg:px-0">
        <SubpageHeader
          className="mb-7"
          title="Điều khoản sử dụng"
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Điều khoản sử dụng" },
          ]}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="border border-slate-300 bg-white lg:sticky lg:top-4">
            <h2 className="bg-[#536fe8] px-4 py-3 text-lg font-bold text-white">Mục lục nội dung</h2>
            <nav aria-label="Mục lục điều khoản sử dụng">
              <ul className="grid sm:grid-cols-2 lg:block">
                {termsSections.map((section) => (
                  <li key={section.id} className="border-b border-slate-100 last:border-b-0">
                    <a
                      href={`#${section.id}`}
                      className="block px-4 py-3 text-[15px] leading-6 text-slate-800 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      {section.number}. {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="min-w-0 bg-white px-6 py-7 text-[16px] leading-7 text-slate-800 sm:px-8 lg:px-10 lg:py-8">
            <h1 className="text-center text-2xl font-black uppercase leading-tight text-slate-900 sm:text-3xl">
              Điều khoản sử dụng
            </h1>

            <p className="mx-auto mt-5 max-w-4xl text-center text-slate-600">
              Điều khoản sử dụng này quy định các điều kiện áp dụng khi Quý khách truy cập và sử dụng
              website hpttech.vn của HPT Tech. Khi tiếp tục truy cập, đặt hàng hoặc sử dụng dịch vụ,
              Quý khách xác nhận đã đọc, hiểu và đồng ý tuân thủ toàn bộ nội dung dưới đây.
            </p>

            <PolicySection id="gioi-thieu-chung" number="1" title="Giới thiệu chung">
              <p>
                Website hpttech.vn được vận hành bởi Công ty TNHH Đầu tư Xây dựng và Thiết bị Công
                nghệ HPT (&quot;HPT Tech&quot;, &quot;chúng tôi&quot;) - đơn vị cung cấp thiết bị CNTT, máy scan, máy in,
                máy photocopy, thiết bị văn phòng và giải pháp số hóa tài liệu cho doanh nghiệp, tổ
                chức và cơ quan nhà nước.
              </p>
              <p>
                Các điều khoản này áp dụng cho toàn bộ nội dung, sản phẩm và dịch vụ được cung cấp
                trên website. Nếu Quý khách không đồng ý với bất kỳ nội dung nào, vui lòng ngừng sử
                dụng website và dịch vụ của chúng tôi.
              </p>
            </PolicySection>

            <PolicySection id="doi-tuong-va-pham-vi-ap-dung" number="2" title="Đối tượng và phạm vi áp dụng">
              <p>
                Điều khoản áp dụng cho mọi cá nhân, tổ chức truy cập, tham khảo thông tin, yêu cầu
                báo giá hoặc thực hiện giao dịch trên website. Khi sử dụng website, Quý khách cam kết:
              </p>
              <BulletList
                items={[
                  "Có đầy đủ năng lực hành vi dân sự để thực hiện giao dịch theo quy định pháp luật.",
                  "Cung cấp thông tin chính xác, trung thực khi liên hệ, đăng ký hoặc đặt hàng.",
                  "Không sử dụng website vào mục đích trái pháp luật, gian lận hoặc gây thiệt hại cho HPT Tech và bên thứ ba.",
                  "Không can thiệp, dò quét, phát tán mã độc hoặc thu thập dữ liệu trái phép từ hệ thống.",
                ]}
              />
            </PolicySection>

            <PolicySection id="tai-khoan-va-thong-tin-khach-hang" number="3" title="Tài khoản và thông tin khách hàng">
              <p>
                Một số tính năng có thể yêu cầu Quý khách cung cấp thông tin liên hệ hoặc tạo tài
                khoản. Quý khách chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động phát
                sinh dưới tài khoản của mình.
              </p>
              <p>
                Việc thu thập và sử dụng thông tin cá nhân được thực hiện theo{" "}
                <Link className="font-semibold text-blue-700 hover:underline" href="/chinh-sach-bao-mat">
                  Chính sách bảo mật thông tin
                </Link>{" "}
                của HPT Tech.
              </p>
            </PolicySection>

            <PolicySection id="quyen-va-nghia-vu-cua-khach-hang" number="4" title="Quyền và nghĩa vụ của khách hàng">
              <p>Quý khách có các quyền và nghĩa vụ sau:</p>
              <BulletList
                items={[
                  "Được cung cấp thông tin đầy đủ, chính xác về sản phẩm, giá, chính sách bảo hành trước khi mua.",
                  "Được tư vấn kỹ thuật, báo giá và hỗ trợ trong suốt quá trình mua và sử dụng sản phẩm.",
                  "Được hưởng quyền lợi bảo hành, đổi trả theo chính sách công bố của HPT Tech.",
                  "Thanh toán đầy đủ, đúng hạn giá trị đơn hàng đã xác nhận.",
                  "Kiểm tra kỹ thông tin, số lượng và tình trạng sản phẩm khi nhận hàng.",
                  "Tuân thủ hướng dẫn sử dụng, lắp đặt để bảo đảm điều kiện bảo hành.",
                ]}
              />
            </PolicySection>

            <PolicySection id="quyen-va-trach-nhiem-cua-hpt-tech" number="5" title="Quyền và trách nhiệm của HPT Tech">
              <BulletList
                items={[
                  "Cung cấp sản phẩm chính hãng 100%, đầy đủ hóa đơn, chứng từ và xuất hóa đơn VAT theo yêu cầu.",
                  "Cập nhật thông tin sản phẩm, giá và chính sách chính xác nhất trong khả năng.",
                  "Bảo mật thông tin khách hàng theo quy định pháp luật.",
                  "Có quyền từ chối hoặc hủy đơn hàng khi thông tin không hợp lệ, nghi ngờ gian lận, sản phẩm hết hàng hoặc có lỗi hiển thị giá do sự cố kỹ thuật.",
                  "Có quyền điều chỉnh giá, chương trình khuyến mại và danh mục sản phẩm mà không cần báo trước.",
                ]}
              />
            </PolicySection>

            <PolicySection id="gia-bao-gia-va-thanh-toan" number="6" title="Giá, báo giá và thanh toán">
              <p>
                Giá sản phẩm được niêm yết bằng Đồng Việt Nam (VNĐ). Tùy thông tin hiển thị tại từng
                sản phẩm, giá có thể đã hoặc chưa bao gồm thuế GTGT. Giá bán, VAT, phí vận chuyển và
                phương thức thanh toán luôn được xác nhận lại với khách hàng trước khi HPT Tech thực
                hiện đơn hàng.
              </p>
              <p>
                Với đơn hàng doanh nghiệp và dự án, HPT Tech hỗ trợ báo giá riêng, hợp đồng và công
                nợ theo thỏa thuận. Trường hợp giá hiển thị sai do lỗi hệ thống, hai bên sẽ thống
                nhất lại mức giá cuối cùng trước khi xử lý đơn hàng. Chi tiết quy trình xem tại{" "}
                <Link className="font-semibold text-blue-700 hover:underline" href="/huong-dan-mua-hang">
                  Hướng dẫn mua hàng
                </Link>
                .
              </p>
            </PolicySection>

            <PolicySection id="dat-hang-va-xac-nhan-don-hang" number="7" title="Đặt hàng và xác nhận đơn hàng">
              <p>
                Quý khách có thể đặt hàng trực tiếp trên website, qua hotline hoặc Zalo. Đơn hàng chỉ
                được coi là xác lập khi HPT Tech xác nhận với Quý khách về sản phẩm, số lượng, giá,
                VAT, phương thức thanh toán và thời gian giao hàng.
              </p>
              <p>
                HPT Tech có quyền liên hệ để xác minh thông tin trước khi xử lý và có thể từ chối các
                đơn hàng không đáp ứng điều kiện nêu tại các mục trên.
              </p>
            </PolicySection>

            <PolicySection id="giao-hang-bao-hanh-va-doi-tra" number="8" title="Giao hàng, bảo hành và đổi trả">
              <p>
                Chính sách giao nhận, bảo hành và đổi trả áp dụng theo các trang chính sách chuyên
                biệt của HPT Tech:
              </p>
              <BulletList
                items={[
                  "Chính sách giao hàng: thời gian, phạm vi và phí vận chuyển theo khu vực.",
                  "Chính sách bảo hành, đổi trả: điều kiện, thời hạn và quy trình xử lý.",
                ]}
              />
              <p>
                Vui lòng tham khảo{" "}
                <Link className="font-semibold text-blue-700 hover:underline" href="/chinh-sach-giao-hang">
                  Chính sách giao hàng
                </Link>{" "}
                và{" "}
                <Link
                  className="font-semibold text-blue-700 hover:underline"
                  href="/chinh-sach-bao-hanh-doi-tra"
                >
                  Chính sách bảo hành đổi trả
                </Link>{" "}
                để biết chi tiết.
              </p>
            </PolicySection>

            <PolicySection id="quyen-so-huu-tri-tue" number="9" title="Quyền sở hữu trí tuệ">
              <p>
                Toàn bộ nội dung trên website - bao gồm logo, thương hiệu, hình ảnh, văn bản, thiết
                kế giao diện, mã nguồn và dữ liệu - thuộc quyền sở hữu của HPT Tech hoặc các đối tác
                cấp quyền và được bảo hộ theo pháp luật về sở hữu trí tuệ.
              </p>
              <p>
                Nghiêm cấm sao chép, tái bản, phân phối, sửa đổi hoặc sử dụng cho mục đích thương mại
                khi chưa có sự đồng ý bằng văn bản của HPT Tech.
              </p>
            </PolicySection>

            <PolicySection id="gioi-han-trach-nhiem-va-bat-kha-khang" number="10" title="Giới hạn trách nhiệm và bất khả kháng">
              <p>
                HPT Tech nỗ lực bảo đảm website hoạt động ổn định nhưng không cam kết website luôn
                liền mạch, không lỗi hoặc không bị gián đoạn do bảo trì, sự cố kỹ thuật hoặc yếu tố
                bất khả kháng (thiên tai, hỏa hoạn, mất điện, tấn công mạng...).
              </p>
              <p>
                Trong phạm vi pháp luật cho phép, HPT Tech không chịu trách nhiệm đối với các thiệt
                hại gián tiếp phát sinh từ việc sử dụng hoặc không thể sử dụng website, ngoài các
                nghĩa vụ theo hợp đồng mua bán đã được hai bên xác nhận.
              </p>
            </PolicySection>

            <PolicySection id="luat-ap-dung-va-giai-quyet-tranh-chap" number="11" title="Luật áp dụng và giải quyết tranh chấp">
              <p>
                Điều khoản này được điều chỉnh và giải thích theo pháp luật nước Cộng hòa Xã hội Chủ
                nghĩa Việt Nam.
              </p>
              <p>
                Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết thông qua thương lượng, hòa giải
                trên tinh thần thiện chí. Trường hợp không đạt được thỏa thuận, tranh chấp sẽ được đưa
                ra Tòa án có thẩm quyền tại Việt Nam giải quyết theo quy định pháp luật.
              </p>
            </PolicySection>

            <PolicySection id="sua-doi-dieu-khoan" number="12" title="Sửa đổi điều khoản">
              <p>
                HPT Tech có quyền cập nhật, sửa đổi hoặc bổ sung Điều khoản sử dụng này vào bất kỳ
                thời điểm nào nhằm phù hợp với hoạt động kinh doanh và quy định pháp luật. Các thay
                đổi có hiệu lực ngay khi được đăng tải trên website.
              </p>
              <p>
                Việc Quý khách tiếp tục sử dụng website sau khi thay đổi được công bố đồng nghĩa với
                việc chấp thuận các điều khoản đã cập nhật.
              </p>
            </PolicySection>

            <PolicySection id="thong-tin-lien-he" number="13" title="Thông tin liên hệ">
              <div className="border border-slate-300 bg-slate-50 p-5 sm:p-6">
                <h3 className="font-black uppercase leading-7 text-slate-900">
                  Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT
                </h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <ContactItem icon={MapPin} label="Địa chỉ" value={address} />
                  <ContactItem icon={Phone} label="Hotline" value={hotline} href={phoneHref(hotline)} />
                  <ContactItem icon={Mail} label="Email" value={email} href={`mailto:${email}`} />
                  <ContactItem icon={ShieldCheck} label="Website" value="hpttech.vn" href="https://hpttech.vn" />
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
                <a
                  href={phoneHref(hotline)}
                  className="inline-flex items-center gap-2 bg-[#536fe8] px-5 py-3 font-semibold text-white transition hover:bg-[#405cd2]"
                >
                  <Phone size={18} />
                  Gọi {hotline}
                </a>
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent("Yêu cầu hỗ trợ về điều khoản sử dụng")}`}
                  className="inline-flex items-center gap-2 border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:border-blue-400 hover:text-blue-700"
                >
                  <Mail size={18} />
                  Gửi email
                </a>
                <Link
                  href="/lien-he"
                  className="inline-flex items-center gap-2 border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:border-blue-400 hover:text-blue-700"
                >
                  <FileText size={18} />
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
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-28">
      <h2 className="text-xl font-black uppercase leading-8 text-[#315eff]">
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
      <Icon className="mt-1 shrink-0 text-[#315eff]" size={19} />
      <div>
        <span className="font-bold text-slate-900">{label}: </span>
        <span>{value}</span>
      </div>
    </>
  );

  return href ? (
    <a href={href} className="flex gap-3 transition hover:text-blue-700">
      {content}
    </a>
  ) : (
    <div className="flex gap-3">{content}</div>
  );
}
