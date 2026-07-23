import { Bot, CheckCircle2, DatabaseZap, ShieldCheck } from "lucide-react";
import AISearchInput from "@/components/ai-search/AISearchInput";

type AISearchHeroProps = {
  query: string;
  prompts: string[];
  onQueryChange: (value: string) => void;
  onPromptSelect: (value: string) => void;
  onSearch: () => void;
};

export default function AISearchHero({
  query,
  prompts,
  onQueryChange,
  onPromptSelect,
  onSearch,
}: AISearchHeroProps) {
  return (
    <section className="overflow-hidden rounded-lg bg-primary-900 px-4 py-8 text-white shadow-[0_24px_70px_-45px_rgba(15,23,42,0.8)] md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-100">
            <Bot size={16} />
            HPT Tech AI Product Finder
          </div>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight md:text-4xl">
            AI Search - Tìm sản phẩm thông minh
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-100 md:text-base">
            Hỏi nhu cầu của bạn, AI sẽ phân tích tiêu chí và đề xuất sản phẩm phù hợp nhất cho mua sắm B2B.
          </p>
        </div>

        <AISearchInput
          value={query}
          prompts={prompts}
          onChange={onQueryChange}
          onPromptSelect={onPromptSelect}
          onSubmit={onSearch}
        />

        <div className="mx-auto mt-6 grid max-w-4xl gap-3 text-left sm:grid-cols-3">
          {[
            { icon: CheckCircle2, label: "Gợi ý theo nhu cầu", value: "Tốc độ, ADF, kết nối" },
            { icon: DatabaseZap, label: "Sẵn sàng nối CMS", value: "Payload/API adapter" },
            { icon: ShieldCheck, label: "Dành cho B2B", value: "Trường học, cơ quan, doanh nghiệp" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/10 px-4 py-3">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 text-primary-200" size={18} />
                  <div>
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <p className="mt-1 text-xs text-primary-100">{item.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
