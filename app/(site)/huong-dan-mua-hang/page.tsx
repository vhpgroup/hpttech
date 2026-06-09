import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PhoneCall,
  ShoppingCart,
  UserRoundCheck,
} from "lucide-react";
import HelpSidebar from "@/components/help/HelpSidebar";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { pageMetadata } from "@/lib/seo";
import { phoneHref } from "@/lib/site-settings";

export const metadata = pageMetadata({
  title: "Hướng dẫn mua hàng",
  description:
    "Hướng dẫn mua hàng, nhận báo giá và liên hệ tư vấn sản phẩm, giải pháp công nghệ tại HPT Tech.",
  path: "/huong-dan-mua-hang",
});

const hotline = "0918 871 414";
const email = "bach.pv@hpttech.vn";
const zaloHref = "https://zalo.me/0918871414";
const address = "SB.04 Vinhomes Marina, P. An Biên, TP. Hải Phòng";

export default function ShoppingGuidePage() {
  return (
    <main className="subpage-main bg-[#eef0f4]">
      <div className="px-4 pb-12 sm:px-6 lg:px-0">
        <SubpageHeader
          className="mb-7"
          title="Hướng dẫn mua hàng"
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Hướng dẫn mua hàng" },
          ]}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <HelpSidebar activePath="/huong-dan-mua-hang" />

          <article className="min-w-0 bg-white px-6 py-7 text-[16px] leading-7 text-slate-800 sm:px-8 lg:px-10 lg:py-8">
            <h1 className="text-center text-2xl font-black uppercase leading-tight text-slate-900 sm:text-3xl">
              Hướng dẫn mua hàng
            </h1>

            <p className="mx-auto mt-5 max-w-4xl text-center text-slate-600">
              Cảm ơn Quý khách đã quan tâm đến sản phẩm và giải pháp công nghệ của HPT Tech. Quý
              khách có thể mua hàng trực tiếp trên website, yêu cầu báo giá hoặc liên hệ tư vấn qua
              hotline và Zalo.
            </p>

            <GuideSection number="1" title="Mua hàng trực tiếp trên website">
              <p>
                Hình thức này phù hợp khi Quý khách đã xác định được sản phẩm cần mua hoặc muốn tham
                khảo thông tin chi tiết trước khi quyết định.
              </p>

              <Step title="Bước 1: Tìm kiếm sản phẩm">
                <p>
                  Truy cập HPTTECH.VN và tìm kiếm theo tên sản phẩm, thương hiệu hoặc danh mục như
                  máy scan, máy in, camera hội nghị, camera PTZ, thiết bị mạng, máy chủ, lưu trữ và
                  thiết bị văn phòng.
                </p>
              </Step>

              <Step title="Bước 2: Tham khảo thông tin">
                <BulletList
                  items={[
                    "Hình ảnh và mô tả sản phẩm.",
                    "Thông số kỹ thuật và tính năng nổi bật.",
                    "Tình trạng hàng, giá hiển thị và ưu đãi nếu có.",
                    "Thông tin xuất xứ và chính sách bảo hành.",
                  ]}
                />
              </Step>

              <Step title="Bước 3: Chọn hình thức phù hợp">
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <ActionCard
                    icon={ShoppingCart}
                    title="Thêm vào giỏ"
                    description="Dùng khi Quý khách muốn đặt mua trực tiếp. Sau khi thêm sản phẩm, mở giỏ hàng, chuyển đến checkout và nhập thông tin giao nhận."
                  />
                  <ActionCard
                    icon={FileText}
                    title="Nhận báo giá"
                    description="Dùng cho doanh nghiệp, dự án hoặc đơn hàng cần tài liệu báo giá. Quý khách có thể nhập thông tin và tạo bản báo giá để tải hoặc in."
                  />
                  <ActionCard
                    icon={PhoneCall}
                    title="Tư vấn ngay"
                    description="Dùng khi cần trao đổi nhanh về cấu hình, giá bán, tình trạng hàng hoặc chưa xác định được sản phẩm phù hợp."
                  />
                </div>
              </Step>

              <Step title="Bước 4: Xác nhận đơn hàng">
                <p>
                  Với đơn mua trực tiếp, Quý khách kiểm tra giỏ hàng, nhập họ tên, số điện thoại,
                  email, khu vực và địa chỉ giao hàng. Sau khi gửi đơn, HPT Tech sẽ liên hệ xác nhận
                  giá, VAT, phí vận chuyển, phương thức thanh toán và thời gian giao hàng.
                </p>
              </Step>
            </GuideSection>

            <GuideSection number="2" title="Đặt hàng qua hotline">
              <p>
                Đây là hình thức nhanh khi Quý khách cần tư vấn ngay hoặc chưa xác định được sản phẩm
                phù hợp.
              </p>
              <ol className="mt-5 space-y-4">
                <NumberedStep
                  number="1"
                  title="Liên hệ hotline"
                  description={
                    <>
                      Gọi trực tiếp{" "}
                      <a className="font-bold text-blue-700 hover:underline" href={phoneHref(hotline)}>
                        {hotline}
                      </a>
                      .
                    </>
                  }
                />
                <NumberedStep
                  number="2"
                  title="Trình bày nhu cầu"
                  description="Cung cấp loại thiết bị, mục đích sử dụng, số lượng, ngân sách dự kiến hoặc yêu cầu kỹ thuật."
                />
                <NumberedStep
                  number="3"
                  title="Nhận tư vấn và báo giá"
                  description="Đội ngũ kinh doanh, kỹ thuật sẽ đề xuất sản phẩm phù hợp và gửi báo giá qua Zalo hoặc email."
                />
                <NumberedStep
                  number="4"
                  title="Xác nhận đơn hàng"
                  description="Sau khi thống nhất sản phẩm, số lượng, giá, VAT, thanh toán và giao nhận, HPT Tech sẽ xử lý đơn hàng."
                />
              </ol>
            </GuideSection>

            <GuideSection number="3" title="Đặt hàng qua Zalo">
              <p>
                Zalo thuận tiện cho việc gửi hình ảnh, đường dẫn sản phẩm, danh sách thiết bị và trao
                đổi báo giá.
              </p>
              <div className="mt-5 border border-blue-200 bg-blue-50 p-5">
                <p className="font-semibold text-slate-900">Zalo HPT Tech</p>
                <a
                  className="mt-1 inline-flex items-center gap-2 text-lg font-bold text-blue-700 hover:underline"
                  href={zaloHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={20} />
                  {hotline}
                </a>
              </div>
              <BulletList
                items={[
                  "Gửi tên, hình ảnh hoặc link sản phẩm cần mua.",
                  "Gửi danh sách thiết bị cần báo giá và số lượng dự kiến.",
                  "Mô tả nhu cầu sử dụng để được tư vấn cấu hình phù hợp.",
                  "Xác nhận thông tin giao nhận sau khi đồng ý với báo giá.",
                ]}
              />
            </GuideSection>

            <GuideSection number="4" title="Quy trình xử lý đơn hàng">
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 border border-slate-200 bg-slate-50 p-5 text-center font-semibold text-slate-900">
                {[
                  "Tiếp nhận yêu cầu",
                  "Tư vấn sản phẩm",
                  "Gửi báo giá",
                  "Xác nhận đơn hàng",
                  "Xác nhận thanh toán",
                  "Giao hàng",
                  "Hỗ trợ sau bán hàng",
                ].map((item, index, items) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <span>{item}</span>
                    {index < items.length - 1 ? <span className="text-blue-600">→</span> : null}
                  </span>
                ))}
              </div>
              <p className="mt-5">
                Giá bán, VAT, phí vận chuyển, thời gian giao hàng và phương thức thanh toán được xác
                nhận với khách hàng trước khi HPT Tech thực hiện đơn hàng.
              </p>
            </GuideSection>

            <GuideSection number="5" title="Thông tin nên chuẩn bị khi yêu cầu báo giá">
              <BulletList
                items={[
                  "Tên sản phẩm hoặc mô tả nhu cầu sử dụng.",
                  "Số lượng dự kiến.",
                  "Địa điểm giao hàng hoặc khu vực triển khai.",
                  "Thời gian cần hàng.",
                  "Thông tin xuất hóa đơn VAT nếu có.",
                ]}
              />
              <p>
                Với dự án hoặc hệ thống doanh nghiệp, HPT Tech có thể hỗ trợ khảo sát và tư vấn giải
                pháp tổng thể phù hợp với điều kiện vận hành thực tế.
              </p>
            </GuideSection>

            <GuideSection number="6" title="Câu hỏi thường gặp">
              <Faq
                question="Tôi có thể nhận báo giá trong bao lâu?"
                answer="HPT Tech sẽ phản hồi sớm nhất trong giờ làm việc. Thời gian cụ thể phụ thuộc vào sản phẩm, số lượng và mức độ phức tạp của yêu cầu."
              />
              <Faq
                question="HPT Tech có giao hàng toàn quốc không?"
                answer="Có. HPT Tech hỗ trợ giao hàng toàn quốc qua đơn vị vận chuyển hoặc giao trực tiếp tùy khu vực và quy mô dự án."
              />
              <Faq
                question="Doanh nghiệp có được xuất hóa đơn VAT không?"
                answer="Có. HPT Tech cung cấp hóa đơn VAT theo quy định hiện hành sau khi xác nhận đầy đủ thông tin xuất hóa đơn."
              />
              <Faq
                question="Tôi chưa biết chọn sản phẩm nào thì sao?"
                answer="Quý khách chỉ cần mô tả nhu cầu, ngân sách và môi trường sử dụng. Đội ngũ HPT Tech sẽ tư vấn sản phẩm hoặc giải pháp phù hợp."
              />
            </GuideSection>

            <GuideSection number="7" title="Thông tin liên hệ">
              <div className="border border-slate-300 bg-slate-50 p-5 sm:p-6">
                <h3 className="font-black uppercase leading-7 text-slate-900">
                  Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT
                </h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <ContactItem icon={MapPin} label="Địa chỉ" value={address} />
                  <ContactItem icon={Phone} label="Hotline/Zalo" value={hotline} href={phoneHref(hotline)} />
                  <ContactItem icon={Mail} label="Email" value={email} href={`mailto:${email}`} />
                  <ContactItem
                    icon={UserRoundCheck}
                    label="Website"
                    value="hpttech.vn"
                    href="https://hpttech.vn"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/san-pham"
                  className="inline-flex items-center gap-2 bg-[#536fe8] px-5 py-3 font-semibold text-white transition hover:bg-[#405cd2]"
                >
                  <ShoppingCart size={18} />
                  Xem sản phẩm
                </Link>
                <a
                  href={zaloHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:border-blue-400 hover:text-blue-700"
                >
                  <MessageCircle size={18} />
                  Tư vấn Zalo
                </a>
              </div>
            </GuideSection>
          </article>
        </div>
      </div>
    </main>
  );
}

function GuideSection({
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
      <h2 className="text-xl font-black uppercase leading-8 text-[#315eff]">
        {number}. {title}
      </h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="border border-slate-200 p-5">
      <Icon className="text-[#315eff]" size={25} />
      <h4 className="mt-3 font-bold text-slate-900">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
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

function NumberedStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center bg-blue-50 text-sm font-bold text-blue-700">
        {number}
      </span>
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="mt-1">{description}</p>
      </div>
    </li>
  );
}

function Faq({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-slate-200 pb-5 last:border-0 last:pb-0">
      <h3 className="font-bold text-slate-900">{question}</h3>
      <p className="mt-2">{answer}</p>
    </div>
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
