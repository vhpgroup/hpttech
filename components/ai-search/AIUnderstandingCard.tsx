import { Building2, Gauge, Network, ScanLine, Target, WalletCards } from "lucide-react";
import type { AIRequirement, AIRequirementKey } from "@/lib/ai-search/mock-data";

const requirementIcons: Record<AIRequirementKey, typeof ScanLine> = {
  deviceType: ScanLine,
  purpose: Target,
  environment: Building2,
  speed: Gauge,
  connectivity: Network,
  budget: WalletCards,
};

type AIUnderstandingCardProps = {
  requirements: AIRequirement[];
};

export default function AIUnderstandingCard({ requirements }: AIUnderstandingCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
          <ScanLine size={19} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-950">AI hiểu nhu cầu của bạn</h2>
          <p className="text-sm text-slate-500">Các tiêu chí được trích xuất từ câu hỏi.</p>
        </div>
      </div>

      <dl className="grid gap-2">
        {requirements.map((item) => {
          const Icon = requirementIcons[item.key];
          return (
            <div key={item.key} className="grid grid-cols-[minmax(120px,0.9fr)_1.1fr] items-center gap-3 border-b border-slate-100 py-2.5 last:border-b-0">
              <dt className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-600">
                <Icon className="shrink-0 text-blue-600" size={16} />
                <span className="truncate">{item.label}</span>
              </dt>
              <dd className="text-sm font-semibold text-slate-900">{item.value}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
