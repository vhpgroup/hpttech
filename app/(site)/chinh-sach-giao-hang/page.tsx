import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Truck,
} from "lucide-react";
import HelpSidebar from "@/components/help/HelpSidebar";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { pageMetadata } from "@/lib/seo";
import { phoneHref } from "@/lib/site-settings";

export const metadata = pageMetadata({
  title: "Chính sách giao hàng",
  description:
    "Phạm vi, thời gian, chi phí và quy định giao nhận hàng hóa của HPT Tech trên toàn quốc.",
  path: "/chinh-sach-giao-hang",
});

const hotline = "0918 87 14 14";
const email = "bach.pv@hpttech.vn";
const address = "SB.04 Vinhomes Marina, P. An Biên, TP. Hải Phòng";

export default function DeliveryPolicyPage() {
  return (
    <main className="subpage-main bg-[#eef0f4]">
      <div className="px-4 pb-12 sm:px-6 lg:px-0">
        <SubpageHeader
          className="mb-7"
          title="Chính sách giao hàng"
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Chính sách giao hàng" },
          ]}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <HelpSidebar activePath="/chinh-sach-giao-hang" />

          <article className="min-w-0 bg-white px-6 py-7 text-[16px] leading-7 text-slate-800 sm:px-8 lg:px-10 lg:py-8">
            <h1 className="text-center text-2xl font-black uppercase leading-tight text-slate-900 sm:text-3xl">
              Chính sách giao nhận hàng hóa
            </h1>

            <p className="mx-auto mt-5 max-w-4xl text-center text-slate-600">
              HPT Tech hỗ trợ giao nhận sản phẩm và giải pháp công nghệ trên toàn quốc. Phương án,
              chi phí và thời gian giao hàng được xác nhận với khách hàng trước khi thực hiện.
            </p>

            <PolicySection icon={MapPin} title="Phạm vi giao hàng">
              <p>
                HPT Tech cung cấp dịch vụ giao hàng trên toàn quốc đối với các sản phẩm và giải pháp
                do công ty phân phối.
              </p>
              <p>
                Tại Hải Phòng, hàng hóa có thể được giao trực tiếp bởi đội ngũ HPT Tech hoặc bằng
                phương tiện phù hợp với đặc điểm của từng sản phẩm.
              </p>
              <p>
                Với khách hàng tại tỉnh, thành phố khác, hàng hóa được gửi qua đơn vị vận chuyển uy
                tín hoặc theo phương án đã thống nhất với khách hàng.
              </p>
            </PolicySection>

            <PolicySection icon={Clock3} title="Thời gian giao hàng">
              <p>
                Thời gian dưới đây là thời gian dự kiến, được tính từ khi đơn hàng đã được xác nhận,
                khách hàng hoàn tất thanh toán theo thỏa thuận và sản phẩm có sẵn trong kho:
              </p>
              <BulletList
                items={[
                  "Nội thành Hải Phòng: từ 01 đến 02 ngày làm việc.",
                  "Ngoại thành Hải Phòng: từ 01 đến 03 ngày làm việc.",
                  "Các tỉnh, thành phố khác: từ 02 đến 05 ngày làm việc.",
                ]}
              />
              <p>
                Sản phẩm đặt trước, chờ nhập hàng hoặc đơn hàng dự án có thời gian giao riêng và sẽ
                được HPT Tech thông báo khi xác nhận đơn hàng.
              </p>
              <p>
                Trong trường hợp thời tiết xấu, thiên tai, ùn tắc giao thông, gián đoạn vận chuyển
                hoặc nguyên nhân khách quan khác, thời gian giao có thể kéo dài. HPT Tech sẽ chủ động
                cập nhật khi phát sinh chậm trễ.
              </p>
            </PolicySection>

            <PolicySection icon={Truck} title="Phí giao hàng tại Hải Phòng">
              <p>
                Chính sách dưới đây áp dụng cho đơn hàng thông thường có thể vận chuyển bằng xe máy
                hoặc phương tiện giao nhận phù hợp của công ty:
              </p>
              <BulletList
                items={[
                  "Đơn hàng từ 5.000.000 VNĐ trở lên được miễn phí giao hàng trong phạm vi 08 km tính từ văn phòng HPT Tech.",
                  "Nếu địa chỉ giao hàng cách văn phòng trên 08 km, chỉ phần quãng đường vượt quá 08 km được tính phụ phí 5.000 VNĐ/km.",
                  "Đơn hàng dưới 5.000.000 VNĐ được tính phí theo khoảng cách và điều kiện giao nhận thực tế; mức phí được thông báo trước khi xác nhận đơn.",
                ]}
              />

              <div className="mt-5 border border-blue-200 bg-blue-50 p-5">
                <h3 className="font-bold text-slate-900">Ví dụ cách tính</h3>
                <ul className="mt-3 space-y-2">
                  <li>
                    - Đơn hàng 6.000.000 VNĐ, địa chỉ cách văn phòng 12 km: miễn phí 08 km đầu và
                    tính phí 04 km vượt quá.
                  </li>
                  <li>
                    - Đơn hàng 3.000.000 VNĐ: HPT Tech báo phí giao hàng thực tế trước khi giao.
                  </li>
                </ul>
              </div>
            </PolicySection>

            <PolicySection icon={Building2} title="Hàng cồng kềnh và đơn hàng dự án">
              <p>
                Chi phí vận chuyển được tính theo thực tế hoặc báo giá của đơn vị vận chuyển đối với
                các sản phẩm cần ô tô, phương tiện chuyên dụng hoặc phương án giao nhận riêng, gồm:
              </p>
              <BulletList
                items={[
                  "Máy photocopy.",
                  "Máy chủ, tủ Rack và UPS công suất lớn.",
                  "Màn hình tương tác.",
                  "Hệ thống camera dự án.",
                  "Thiết bị CNTT triển khai số lượng lớn.",
                ]}
              />
              <p>
                Chi phí bốc xếp, giao lên tầng, cẩu hàng, lắp đặt, cấu hình hoặc nhân sự kỹ thuật
                không mặc định nằm trong phí giao hàng và sẽ được báo trước theo điều kiện thực tế.
              </p>
              <p>
                Với đơn hàng dự án, doanh nghiệp hoặc cơ quan nhà nước, HPT Tech sẽ thống nhất phương
                án vận chuyển, bàn giao và triển khai trước khi thực hiện.
              </p>
            </PolicySection>

            <PolicySection icon={Truck} title="Giao hàng ngoại tỉnh">
              <BulletList
                items={[
                  "Hàng hóa được gửi qua đơn vị vận chuyển uy tín hoặc theo yêu cầu phù hợp của khách hàng.",
                  "Phí vận chuyển được tính theo biểu phí của đơn vị vận chuyển tại thời điểm gửi hàng.",
                  "HPT Tech thông báo chi phí dự kiến để khách hàng xác nhận trước khi giao.",
                  "Đơn hàng giá trị lớn hoặc dự án đặc biệt có thể được hỗ trợ chi phí theo từng trường hợp cụ thể.",
                ]}
              />
            </PolicySection>

            <PolicySection icon={PackageCheck} title="Kiểm tra hàng hóa khi nhận">
              <p>Khách hàng có quyền kiểm tra hàng hóa trước khi ký nhận, bao gồm:</p>
              <BulletList
                items={[
                  "Tình trạng bao bì và dấu hiệu va đập hoặc ẩm ướt.",
                  "Đúng sản phẩm, model và số lượng đã đặt.",
                  "Phụ kiện đi kèm đầy đủ.",
                  "Phiếu bảo hành, hóa đơn hoặc giấy tờ liên quan nếu có.",
                ]}
              />
              <p>
                Nếu phát hiện hư hỏng, thiếu phụ kiện, giao sai sản phẩm hoặc dấu hiệu bất thường,
                khách hàng cần ghi chú trên biên bản giao nhận, chụp ảnh hoặc quay video và thông báo
                cho HPT Tech ngay khi nhận hàng, chậm nhất trong vòng 24 giờ.
              </p>
              <p>
                Thông báo sau thời hạn trên vẫn được tiếp nhận hỗ trợ, tuy nhiên việc xác định trách
                nhiệm của đơn vị vận chuyển có thể bị hạn chế.
              </p>
            </PolicySection>

            <PolicySection icon={CheckCircle2} title="Trách nhiệm giao nhận">
              <p>
                HPT Tech chịu trách nhiệm tổ chức giao hàng đến đúng địa chỉ khách hàng cung cấp và
                phối hợp với đơn vị vận chuyển xử lý các trường hợp mất mát, hư hỏng hoặc giao thiếu
                phát sinh trước khi khách hàng hoàn tất kiểm tra và ký nhận.
              </p>
              <p>
                Sau khi hàng hóa được kiểm tra và ký nhận không có ghi chú bất thường, trách nhiệm
                bảo quản sản phẩm thuộc về khách hàng.
              </p>
              <p>
                Nếu giao hàng không thành công do địa chỉ hoặc thông tin liên hệ không chính xác,
                khách hàng không nhận hàng theo lịch đã thống nhất hoặc yêu cầu giao lại, HPT Tech có
                thể thu phí giao lại phát sinh và sẽ thông báo trước khi thực hiện.
              </p>
              <p>
                Trường hợp khách hàng đổi ý khi hàng hóa được giao đúng, đủ và không hư hỏng không
                được xem là lỗi giao nhận. Việc đổi hoặc trả hàng được xử lý theo{" "}
                <Link
                  href="/chinh-sach-bao-hanh-doi-tra"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  Chính sách bảo hành đổi trả
                </Link>
                , và khách hàng có thể phải thanh toán chi phí vận chuyển phát sinh.
              </p>
            </PolicySection>

            <PolicySection icon={Phone} title="Thông tin liên hệ">
              <div className="border border-slate-300 bg-slate-50 p-5 sm:p-6">
                <h3 className="font-black uppercase leading-7 text-slate-900">
                  Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT
                </h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <ContactItem icon={MapPin} label="Địa chỉ" value={address} />
                  <ContactItem icon={Phone} label="Hotline" value={hotline} href={phoneHref(hotline)} />
                  <ContactItem icon={Mail} label="Email" value={email} href={`mailto:${email}`} />
                  <ContactItem
                    icon={Building2}
                    label="Website"
                    value="hpttech.vn"
                    href="https://hpttech.vn"
                  />
                </div>
              </div>
            </PolicySection>
          </article>
        </div>
      </div>
    </main>
  );
}

function PolicySection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-3">
        <Icon className="shrink-0 text-[#315eff]" size={24} />
        <h2 className="text-xl font-black uppercase leading-8 text-[#315eff]">{title}</h2>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <CheckCircle2 className="mt-1 shrink-0 text-blue-600" size={18} />
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
