import { Clock3 } from "lucide-react";
import HelpSidebar from "@/components/help/HelpSidebar";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import type { HelpPath } from "@/lib/help-links";

export default function HelpPlaceholderPage({
  title,
  activePath,
}: {
  title: string;
  activePath: HelpPath;
}) {
  return (
    <main className="subpage-main bg-[#eef0f4]">
      <div className="px-4 pb-12 sm:px-6 lg:px-0">
        <SubpageHeader
          className="mb-7"
          title={title}
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: title },
          ]}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <HelpSidebar activePath={activePath} />

          <article className="min-h-[520px] bg-white px-6 py-7 sm:px-8 lg:px-10 lg:py-8">
            <div className="mt-8 flex flex-col items-center justify-center text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-primary-50 text-primary-500">
                <Clock3 size={30} />
              </span>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">Nội dung đang được cập nhật</h2>
              <p className="mt-3 max-w-xl leading-7 text-slate-600">
                HPT Tech đang hoàn thiện thông tin cho trang này. Vui lòng quay lại sau hoặc liên hệ
                bộ phận hỗ trợ nếu bạn cần tư vấn ngay.
              </p>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
