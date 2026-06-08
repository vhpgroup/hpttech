import { SendHorizontal, Sparkles } from "lucide-react";

type AISearchInputProps = {
  value: string;
  prompts: string[];
  onChange: (value: string) => void;
  onPromptSelect: (value: string) => void;
  onSubmit: () => void;
};

export default function AISearchInput({
  value,
  prompts,
  onChange,
  onPromptSelect,
  onSubmit,
}: AISearchInputProps) {
  return (
    <div className="mx-auto mt-6 max-w-5xl">
      <div className="rounded-lg border border-blue-200 bg-white p-2 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.65)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="sr-only" htmlFor="ai-search-question">
            Nhập nhu cầu sản phẩm
          </label>
          <textarea
            id="ai-search-question"
            value={value}
            rows={2}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                onSubmit();
              }
            }}
            placeholder="Mô tả nhu cầu, môi trường dùng, tốc độ, kết nối, ngân sách..."
            className="min-h-[72px] flex-1 resize-none rounded-md border border-transparent px-4 py-3 text-[15px] leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-200 focus:bg-blue-50/40"
          />
          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-blue-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          >
            <SendHorizontal size={18} />
            Tìm bằng AI
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-blue-100">
          <Sparkles size={15} />
          Gợi ý
        </span>
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPromptSelect(prompt)}
            className="rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-white transition hover:border-white/40 hover:bg-white/15"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
