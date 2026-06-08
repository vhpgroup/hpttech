import { BadgeCheck, CircleDollarSign, ClipboardList, Sparkles } from "lucide-react";
import type { AISearchProduct } from "@/lib/ai-search/mock-data";

type AIRecommendationSummaryProps = {
  products: AISearchProduct[];
};

export default function AIRecommendationSummary({ products }: AIRecommendationSummaryProps) {
  const bestProduct = products[0];
  const averageScore = products.length
    ? Math.round(products.reduce((total, product) => total + product.matchScore, 0) / products.length)
    : 0;

  return (
    <section className="rounded-lg border border-blue-100 bg-blue-50/70 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-blue-700">
          <Sparkles size={18} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Tóm tắt đề xuất</h2>
          <p className="text-sm text-slate-600">Kết quả demo dựa trên dữ liệu sản phẩm HPT Tech.</p>
        </div>
      </div>

      {bestProduct ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-700">
            <strong className="text-slate-950">{bestProduct.title}</strong> là lựa chọn tối ưu trong tầm giá,
            đáp ứng yêu cầu về tốc độ, kết nối LAN và độ ổn định khi dùng lâu dài trong môi trường trường học.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryMetric icon={BadgeCheck} label="Phù hợp cao nhất" value={`${bestProduct.matchScore}%`} />
            <SummaryMetric icon={ClipboardList} label="Số mẫu đề xuất" value={`${products.length} sản phẩm`} />
            <SummaryMetric icon={CircleDollarSign} label="Điểm trung bình" value={`${averageScore}%`} />
          </div>

          <div className="rounded-lg border border-blue-100 bg-white p-4">
            <p className="text-sm font-bold text-slate-900">Vì sao AI chọn nhóm này?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {bestProduct.strengths.map((item) => (
                <span key={item} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-6 text-slate-600">
          Chưa có sản phẩm nào khớp bộ lọc hiện tại. Hãy nới khoảng giá hoặc giảm tiêu chí tốc độ.
        </p>
      )}
    </section>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BadgeCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white p-3">
      <div className="flex items-center gap-2 text-blue-700">
        <Icon size={16} />
        <span className="text-xs font-semibold uppercase tracking-[0.08em]">{label}</span>
      </div>
      <p className="mt-2 text-lg font-extrabold text-slate-950">{value}</p>
    </div>
  );
}
