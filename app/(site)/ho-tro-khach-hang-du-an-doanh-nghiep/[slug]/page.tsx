import type { ComponentProps } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import {
  Archive,
  Bot,
  Cable,
  Cctv,
  CheckCircle2,
  ClipboardCheck,
  FileInput,
  FileCheck2,
  Files,
  HardDrive,
  ImageDown,
  Mail,
  Network,
  PackageCheck,
  Phone,
  Router,
  ScanText,
  ScanLine,
  Search,
  Server,
  Settings,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  TableProperties,
  Tags,
  Users,
  Wifi,
  Wrench,
} from "lucide-react";
import HelpSidebar from "@/components/help/HelpSidebar";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { getEnterpriseServiceBySlugFromPayload } from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";
import { phoneHref } from "@/lib/site-settings";

export const revalidate = 300;

const basePath = "/ho-tro-khach-hang-du-an-doanh-nghiep";
const hotline = "0918 87 14 14";
const email = "bach.pv@hpttech.vn";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EnterpriseServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;

  if (slug === "giai-phap-so-hoa-tai-lieu") {
    return <DocumentDigitizationPage />;
  }

  if (slug === "giai-phap-ocr-va-tu-dong-hoa") {
    return <OCRAutomationPage />;
  }

  if (slug === "ha-tang-mang-doanh-nghiep") {
    return <EnterpriseNetworkPage />;
  }

  const service = await getEnterpriseServiceBySlugFromPayload(slug);

  if (!service) notFound();

  return (
    <main className="subpage-main bg-[#eef0f4]">
      <div className="px-4 pb-12 sm:px-6 lg:px-0">
        <SubpageHeader
          className="mb-7"
          title={service.title}
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Hỗ trợ dự án và doanh nghiệp", href: basePath },
            { label: service.title },
          ]}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <HelpSidebar activePath={basePath} />

          <article className="min-w-0 border border-slate-200 bg-white px-6 py-7 sm:px-8 lg:px-10 lg:py-9">
            <header className="border-b border-slate-200 pb-7">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
                Giải pháp và dịch vụ
              </p>
              <h1 className="mt-3 text-2xl font-black uppercase leading-tight text-[#102b62] sm:text-3xl">
                {service.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{service.summary}</p>
            </header>

            {service.image?.url ? (
              <div className="relative mt-7 aspect-[16/7] overflow-hidden bg-slate-100">
                <Image
                  src={service.image.url}
                  alt={service.image.alt || service.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 900px"
                  className="object-cover"
                />
              </div>
            ) : null}

            {service.content ? (
              <RichText
                data={service.content as ComponentProps<typeof RichText>["data"]}
                className="prose prose-slate mt-8 max-w-none prose-headings:text-[#102b62] prose-a:text-blue-700"
              />
            ) : (
              <div className="mt-8 space-y-4 leading-7 text-slate-700">
                <p>{service.summary}</p>
                <p>
                  Nội dung chi tiết đang được cập nhật. Quý khách vui lòng liên hệ HPT Tech để trao
                  đổi yêu cầu, phạm vi triển khai và nhận phương án phù hợp.
                </p>
              </div>
            )}

            <section className="mt-10 border border-blue-200 bg-blue-50 p-5 sm:p-6">
              <h2 className="text-lg font-black uppercase text-[#102b62]">Liên hệ tư vấn</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={phoneHref(hotline)}
                  className="inline-flex items-center gap-2 bg-[#102b62] px-5 py-3 text-sm font-bold text-white"
                >
                  <Phone size={17} />
                  {hotline}
                </a>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 border border-blue-300 bg-white px-5 py-3 text-sm font-bold text-blue-800"
                >
                  <Mail size={17} />
                  {email}
                </a>
              </div>
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}

function DocumentDigitizationPage() {
  const benefits = [
    {
      icon: Archive,
      title: "Giảm không gian lưu hồ sơ giấy",
      description: "Tài liệu được chuyển thành tệp số để thuận tiện lưu trữ và tổ chức dữ liệu.",
    },
    {
      icon: Search,
      title: "Tìm kiếm thuận tiện hơn",
      description: "Tên tệp, thư mục và dữ liệu OCR hỗ trợ tra cứu tài liệu khi cần sử dụng.",
    },
    {
      icon: ShieldCheck,
      title: "Hạn chế thất lạc và hư hỏng",
      description: "Bản số giúp giảm việc sử dụng trực tiếp hồ sơ giấy trong quá trình khai thác.",
    },
    {
      icon: Share2,
      title: "Hỗ trợ chia sẻ và phân quyền",
      description: "Dữ liệu có thể được sao lưu, chia sẻ và phân quyền theo hệ thống của đơn vị.",
    },
  ];

  const process = [
    { icon: Files, title: "Tiếp nhận hồ sơ" },
    { icon: Archive, title: "Phân loại tài liệu" },
    { icon: ScanLine, title: "Thực hiện scan" },
    { icon: FileCheck2, title: "Kiểm tra chất lượng" },
    { icon: Search, title: "OCR và đặt tên" },
    { icon: HardDrive, title: "Lưu trữ dữ liệu" },
  ];

  return (
    <main className="subpage-main bg-[#eef0f4]">
      <div className="px-4 pb-12 sm:px-6 lg:px-0">
        <SubpageHeader
          className="mb-7"
          title="Giải pháp số hóa tài liệu"
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Hỗ trợ dự án và doanh nghiệp", href: basePath },
            { label: "Giải pháp số hóa tài liệu" },
          ]}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <HelpSidebar activePath={basePath} />

          <article className="min-w-0 border border-slate-200 bg-white px-6 py-7 text-slate-800 sm:px-8 lg:px-10 lg:py-9">
            <header className="border-b border-slate-200 pb-7">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
                Thiết bị và quy trình số hóa
              </p>
              <h1 className="mt-3 text-2xl font-black uppercase leading-tight text-[#102b62] sm:text-3xl">
                Giải pháp số hóa tài liệu
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-slate-600">
                Giải pháp số hóa tài liệu sử dụng máy scan và phần mềm phù hợp để chuyển hồ sơ giấy
                thành dữ liệu số, phục vụ lưu trữ, tìm kiếm và khai thác tài liệu trong hoạt động
                của đơn vị.
              </p>
            </header>

            <ContentSection title="Những vấn đề giải pháp hỗ trợ">
              <div className="grid gap-4 md:grid-cols-2">
                {benefits.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center bg-blue-100 text-blue-700">
                        <Icon size={22} />
                      </span>
                      <div>
                        <h3 className="font-bold leading-6 text-[#102b62]">{title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ContentSection>

            <ContentSection title="Thiết bị và hình thức cung cấp">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard
                  icon={ScanLine}
                  title="Máy scan tài liệu"
                  items={[
                    "Lựa chọn theo khổ giấy, tốc độ và khối lượng sử dụng.",
                    "Cấu hình nạp giấy, scan hai mặt và kết nối tùy nhu cầu.",
                  ]}
                />
                <InfoCard
                  icon={Search}
                  title="Phần mềm scan và OCR"
                  items={[
                    "Tính năng phụ thuộc vào thiết bị và phần mềm đi kèm.",
                    "Hỗ trợ tạo tệp, nhận dạng ký tự và tổ chức dữ liệu.",
                  ]}
                />
                <InfoCard
                  icon={PackageCheck}
                  title="Bán và phương án thuê thiết bị"
                  items={[
                    "Cung cấp máy scan theo nhu cầu sử dụng thực tế.",
                    "Phương án thuê được kiểm tra theo thiết bị có sẵn tại từng thời điểm.",
                  ]}
                />
                <InfoCard
                  icon={Settings}
                  title="Lắp đặt và hướng dẫn"
                  items={[
                    "Lắp đặt, cấu hình và kiểm tra hoạt động của thiết bị.",
                    "Hướng dẫn vận hành theo phạm vi đã thỏa thuận.",
                  ]}
                />
              </div>
            </ContentSection>

            <ContentSection title="Quy trình vận hành tham khảo">
              <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {process.map(({ icon: Icon, title }, index) => (
                  <li key={title} className="flex items-center gap-4 border border-slate-200 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center bg-[#102b62] text-white">
                      <Icon size={19} />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                        Bước {index + 1}
                      </p>
                      <p className="mt-1 font-bold text-slate-900">{title}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-sm leading-6 text-slate-600">
                Quy trình thực tế được điều chỉnh theo loại hồ sơ, tình trạng tài liệu, thiết bị và
                cách tổ chức dữ liệu của từng đơn vị.
              </p>
            </ContentSection>

            <ContentSection title="Dịch vụ kỹ thuật liên quan">
              <ul className="grid gap-3 md:grid-cols-2">
                {[
                  "Lắp đặt và cấu hình thiết bị.",
                  "Hướng dẫn vận hành theo thỏa thuận.",
                  "Kiểm tra và bảo trì thiết bị.",
                  "Thay mực và hỗ trợ máy in tại khu vực phục vụ.",
                ].map((item) => (
                  <li key={item} className="flex gap-3 border border-slate-200 p-4">
                    <CheckCircle2 className="mt-1 shrink-0 text-blue-700" size={18} />
                    <span className="text-sm leading-6">{item}</span>
                  </li>
                ))}
              </ul>
            </ContentSection>

            <section className="mt-10 border border-blue-200 bg-blue-50 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Wrench className="text-blue-700" size={24} />
                <h2 className="text-lg font-black uppercase text-[#102b62]">Liên hệ HPT Tech</h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={phoneHref(hotline)}
                  className="inline-flex items-center gap-2 bg-[#102b62] px-5 py-3 text-sm font-bold text-white"
                >
                  <Phone size={17} />
                  {hotline}
                </a>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 border border-blue-300 bg-white px-5 py-3 text-sm font-bold text-blue-800"
                >
                  <Mail size={17} />
                  {email}
                </a>
              </div>
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}

function OCRAutomationPage() {
  const applications = [
    {
      icon: ScanText,
      title: "Nhận dạng chữ từ tài liệu scan",
      description: "Chuyển nội dung trên hình ảnh hoặc tài liệu scan thành dữ liệu có thể xử lý.",
    },
    {
      icon: TableProperties,
      title: "Trích xuất trường dữ liệu",
      description: "Hỗ trợ lấy thông tin từ biểu mẫu, hóa đơn và hồ sơ có cấu trúc phù hợp.",
    },
    {
      icon: Tags,
      title: "Phân loại và đặt tên tệp",
      description: "Phần mềm có thể hỗ trợ tổ chức tài liệu theo dữ liệu đã nhận dạng.",
    },
    {
      icon: Bot,
      title: "Giảm thao tác nhập liệu",
      description: "Tự động hóa một phần thao tác đọc và nhập lại thông tin từ tài liệu.",
    },
  ];

  const process = [
    { icon: ScanLine, title: "Scan tài liệu" },
    { icon: ImageDown, title: "Tiền xử lý hình ảnh" },
    { icon: ScanText, title: "Nhận dạng OCR" },
    { icon: FileCheck2, title: "Kiểm tra dữ liệu" },
    { icon: Tags, title: "Phân loại và đặt tên" },
    { icon: HardDrive, title: "Xuất hoặc lưu trữ" },
  ];

  return (
    <main className="subpage-main bg-[#eef0f4]">
      <div className="px-4 pb-12 sm:px-6 lg:px-0">
        <SubpageHeader
          className="mb-7"
          title="Giải pháp OCR và tự động hóa"
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Hỗ trợ dự án và doanh nghiệp", href: basePath },
            { label: "Giải pháp OCR và tự động hóa" },
          ]}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <HelpSidebar activePath={basePath} />

          <article className="min-w-0 border border-slate-200 bg-white px-6 py-7 text-slate-800 sm:px-8 lg:px-10 lg:py-9">
            <header className="border-b border-slate-200 pb-7">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
                Nhận dạng và xử lý tài liệu
              </p>
              <h1 className="mt-3 text-2xl font-black uppercase leading-tight text-[#102b62] sm:text-3xl">
                Giải pháp OCR và tự động hóa
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-slate-600">
                OCR nhận dạng nội dung từ tài liệu scan và chuyển thành dữ liệu có thể tìm kiếm,
                trích xuất hoặc tiếp tục xử lý. Các tính năng tự động hóa giúp giảm thao tác thủ
                công trong quá trình phân loại và nhập liệu.
              </p>
            </header>

            <ContentSection title="Các ứng dụng thực tế">
              <div className="grid gap-4 md:grid-cols-2">
                {applications.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center bg-blue-100 text-blue-700">
                        <Icon size={22} />
                      </span>
                      <div>
                        <h3 className="font-bold leading-6 text-[#102b62]">{title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Khả năng nhận dạng và tự động hóa phụ thuộc vào chất lượng tài liệu, cấu hình thiết
                bị và phần mềm được sử dụng.
              </p>
            </ContentSection>

            <ContentSection title="Phạm vi HPT cung cấp">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard
                  icon={Search}
                  title="Tư vấn lựa chọn"
                  items={[
                    "Lựa chọn máy scan theo loại tài liệu và khối lượng sử dụng.",
                    "Tham khảo phần mềm OCR phù hợp với nhu cầu vận hành.",
                  ]}
                />
                <InfoCard
                  icon={PackageCheck}
                  title="Cung cấp thiết bị và phần mềm"
                  items={[
                    "Bán máy scan và phần mềm theo cấu hình đã thống nhất.",
                    "Tính năng OCR phụ thuộc từng thiết bị và giấy phép phần mềm.",
                  ]}
                />
                <InfoCard
                  icon={Settings}
                  title="Lắp đặt và cấu hình"
                  items={[
                    "Lắp đặt thiết bị khi HPT cung cấp sản phẩm.",
                    "Cấu hình chức năng cơ bản theo phạm vi thỏa thuận.",
                  ]}
                />
                <InfoCard
                  icon={FileInput}
                  title="Hướng dẫn sử dụng"
                  items={[
                    "Hướng dẫn scan, nhận dạng và kiểm tra dữ liệu.",
                    "Hướng dẫn thao tác với tính năng tự động hóa được cung cấp.",
                  ]}
                />
              </div>
            </ContentSection>

            <ContentSection title="Quy trình vận hành tham khảo">
              <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {process.map(({ icon: Icon, title }, index) => (
                  <li key={title} className="flex items-center gap-4 border border-slate-200 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center bg-[#102b62] text-white">
                      <Icon size={19} />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                        Bước {index + 1}
                      </p>
                      <p className="mt-1 font-bold text-slate-900">{title}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-sm leading-6 text-slate-600">
                Đây là quy trình vận hành tham khảo của giải pháp. Các bước thực tế phụ thuộc vào
                thiết bị, phần mềm và cách tổ chức dữ liệu của đơn vị.
              </p>
            </ContentSection>

            <ContentSection title="Yếu tố ảnh hưởng độ chính xác OCR">
              <ul className="grid gap-3 md:grid-cols-2">
                {[
                  "Chất lượng bản gốc và hình ảnh sau khi scan.",
                  "Ngôn ngữ, phông chữ và bố cục của tài liệu.",
                  "Chữ viết tay, dấu đóng hoặc nội dung bị che khuất.",
                  "Cấu hình phần mềm và mức độ kiểm tra dữ liệu đầu ra.",
                ].map((item) => (
                  <li key={item} className="flex gap-3 border border-slate-200 p-4">
                    <SlidersHorizontal className="mt-1 shrink-0 text-blue-700" size={18} />
                    <span className="text-sm leading-6">{item}</span>
                  </li>
                ))}
              </ul>
            </ContentSection>

            <section className="mt-10 border border-blue-200 bg-blue-50 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <ScanText className="text-blue-700" size={24} />
                <h2 className="text-lg font-black uppercase text-[#102b62]">Liên hệ HPT Tech</h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={phoneHref(hotline)}
                  className="inline-flex items-center gap-2 bg-[#102b62] px-5 py-3 text-sm font-bold text-white"
                >
                  <Phone size={17} />
                  {hotline}
                </a>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 border border-blue-300 bg-white px-5 py-3 text-sm font-bold text-blue-800"
                >
                  <Mail size={17} />
                  {email}
                </a>
              </div>
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}

function EnterpriseNetworkPage() {
  const needs = [
    "Mở mới hoặc nâng cấp mạng văn phòng.",
    "Mở rộng vùng phủ Wi-Fi.",
    "Kết nối nhiều phòng, tầng hoặc khu vực.",
    "Bổ sung máy chủ và lưu trữ nội bộ.",
    "Lắp đặt hệ thống camera giám sát.",
    "Sắp xếp lại tủ rack và đường cáp.",
  ];

  const process = [
    { icon: ClipboardCheck, title: "Tiếp nhận yêu cầu" },
    { icon: Search, title: "Khảo sát hiện trạng" },
    { icon: Network, title: "Đề xuất thiết bị và sơ đồ" },
    { icon: FileCheck2, title: "Xác nhận báo giá" },
    { icon: Wrench, title: "Lắp đặt và cấu hình" },
    { icon: CheckCircle2, title: "Kiểm tra và bàn giao" },
  ];

  return (
    <main className="subpage-main bg-[#eef0f4]">
      <div className="px-4 pb-12 sm:px-6 lg:px-0">
        <SubpageHeader
          className="mb-7"
          title="Hạ tầng mạng doanh nghiệp"
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Hỗ trợ dự án và doanh nghiệp", href: basePath },
            { label: "Hạ tầng mạng doanh nghiệp" },
          ]}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <HelpSidebar activePath={basePath} />

          <article className="min-w-0 border border-slate-200 bg-white px-6 py-7 text-slate-800 sm:px-8 lg:px-10 lg:py-9">
            <header className="border-b border-slate-200 pb-7">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
                Kết nối và vận hành hệ thống
              </p>
              <h1 className="mt-3 text-2xl font-black uppercase leading-tight text-[#102b62] sm:text-3xl">
                Hạ tầng mạng doanh nghiệp
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-slate-600">
                HPT Tech tư vấn, cung cấp và triển khai thiết bị mạng, Wi-Fi, máy chủ, lưu trữ,
                camera và hạ tầng cáp theo quy mô sử dụng thực tế. Phương án thiết bị và lắp đặt
                được xác định sau khi tiếp nhận yêu cầu hoặc khảo sát hiện trạng.
              </p>
            </header>

            <ContentSection title="Các nhu cầu triển khai thực tế">
              <ul className="grid gap-3 md:grid-cols-2">
                {needs.map((item) => (
                  <li key={item} className="flex gap-3 border border-slate-200 bg-slate-50 p-4">
                    <CheckCircle2 className="mt-1 shrink-0 text-blue-700" size={18} />
                    <span className="text-sm leading-6">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm leading-6 text-slate-600">
                Tốc độ kết nối, vùng phủ và dung lượng hệ thống phụ thuộc vào mặt bằng, số lượng
                thiết bị, hạ tầng hiện có và cấu hình được lựa chọn.
              </p>
            </ContentSection>

            <ContentSection title="Các nhóm giải pháp">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard
                  icon={Wifi}
                  title="Hạ tầng LAN và Wi-Fi"
                  items={[
                    "Router, switch, access point và thiết bị kết nối.",
                    "Triển khai mạng có dây và không dây theo mặt bằng sử dụng.",
                  ]}
                />
                <InfoCard
                  icon={Server}
                  title="Máy chủ và lưu trữ"
                  items={[
                    "Máy chủ và thiết bị lưu trữ theo nhu cầu vận hành.",
                    "Lắp đặt, kết nối mạng và cấu hình cơ bản theo thỏa thuận.",
                  ]}
                />
                <InfoCard
                  icon={Cctv}
                  title="Camera giám sát"
                  items={[
                    "Camera, đầu ghi và thiết bị lưu trữ hình ảnh.",
                    "Bố trí, lắp đặt và kiểm tra hình ảnh theo phạm vi triển khai.",
                  ]}
                />
                <InfoCard
                  icon={Cable}
                  title="Tủ rack, cáp và phụ kiện"
                  items={[
                    "Tủ rack, dây mạng, patch panel và phụ kiện liên quan.",
                    "Sắp xếp thiết bị và đường cáp phù hợp với hiện trạng.",
                  ]}
                />
              </div>
            </ContentSection>

            <ContentSection title="Quy trình triển khai tham khảo">
              <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {process.map(({ icon: Icon, title }, index) => (
                  <li key={title} className="flex items-center gap-4 border border-slate-200 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center bg-[#102b62] text-white">
                      <Icon size={19} />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                        Bước {index + 1}
                      </p>
                      <p className="mt-1 font-bold text-slate-900">{title}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-sm leading-6 text-slate-600">
                Việc khảo sát trực tiếp được thực hiện tùy theo quy mô, mặt bằng và mức độ phức tạp
                của hệ thống cần triển khai.
              </p>
            </ContentSection>

            <ContentSection title="Các yếu tố kỹ thuật cần khảo sát">
              <ul className="grid gap-3 md:grid-cols-2">
                {[
                  { icon: Users, text: "Số lượng người dùng và thiết bị kết nối." },
                  { icon: Wifi, text: "Diện tích, số tầng, vị trí sử dụng và vật cản." },
                  { icon: Router, text: "Vị trí tủ mạng, máy chủ và thiết bị trung tâm." },
                  { icon: Cable, text: "Hạ tầng cáp, điện và đường Internet hiện có." },
                  { icon: Cctv, text: "Vị trí quan sát và nhu cầu lưu trữ camera." },
                  { icon: HardDrive, text: "Dung lượng lưu trữ và khả năng mở rộng." },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex gap-3 border border-slate-200 p-4">
                    <Icon className="mt-1 shrink-0 text-blue-700" size={18} />
                    <span className="text-sm leading-6">{text}</span>
                  </li>
                ))}
              </ul>
            </ContentSection>

            <section className="mt-10 border border-blue-200 bg-blue-50 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Network className="text-blue-700" size={24} />
                <h2 className="text-lg font-black uppercase text-[#102b62]">Liên hệ HPT Tech</h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={phoneHref(hotline)}
                  className="inline-flex items-center gap-2 bg-[#102b62] px-5 py-3 text-sm font-bold text-white"
                >
                  <Phone size={17} />
                  {hotline}
                </a>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 border border-blue-300 bg-white px-5 py-3 text-sm font-bold text-blue-800"
                >
                  <Mail size={17} />
                  {email}
                </a>
              </div>
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}

function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-black uppercase leading-8 text-[#315eff]">{title}</h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function InfoCard({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  items: string[];
}) {
  return (
    <div className="border border-slate-200 p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center bg-blue-100 text-blue-700">
          <Icon size={21} />
        </span>
        <h3 className="font-bold text-[#102b62]">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
            <CheckCircle2 className="mt-1 shrink-0 text-blue-600" size={16} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  if (slug === "giai-phap-so-hoa-tai-lieu") {
    return pageMetadata({
      title: "Giải pháp số hóa tài liệu",
      description:
        "Giải pháp máy scan, phần mềm OCR, lắp đặt và hướng dẫn vận hành phục vụ lưu trữ, tìm kiếm tài liệu số.",
      path: `${basePath}/${slug}`,
    });
  }

  if (slug === "giai-phap-ocr-va-tu-dong-hoa") {
    return pageMetadata({
      title: "Giải pháp OCR và tự động hóa",
      description:
        "Giải pháp OCR nhận dạng, trích xuất và tự động hóa xử lý tài liệu với thiết bị, phần mềm, lắp đặt và hướng dẫn sử dụng.",
      path: `${basePath}/${slug}`,
    });
  }

  if (slug === "ha-tang-mang-doanh-nghiep") {
    return pageMetadata({
      title: "Hạ tầng mạng doanh nghiệp",
      description:
        "Tư vấn, cung cấp và triển khai LAN, Wi-Fi, máy chủ, lưu trữ, camera, tủ rack và hạ tầng cáp cho doanh nghiệp.",
      path: `${basePath}/${slug}`,
    });
  }

  const service = await getEnterpriseServiceBySlugFromPayload(slug);

  return pageMetadata({
    title: service?.title || "Giải pháp doanh nghiệp",
    description: service?.summary || "Giải pháp và dịch vụ công nghệ cho doanh nghiệp tại HPT Tech.",
    path: `${basePath}/${slug}`,
  });
}
