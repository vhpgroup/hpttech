import { cn } from "@/lib/cn";

interface Spec {
  label: string;
  value: string;
}

interface ProductSpecTableProps {
  specs: Spec[];
}

export function ProductSpecTable({ specs }: ProductSpecTableProps) {
  if (specs.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[18px] bg-slate-50/80 ring-1 ring-slate-200/70">
      <table className="w-full text-sm">
        <tbody>
          {specs.map((row, idx) => (
            <tr
              key={`${row.label}-${idx}`}
              className={cn(
                "grid grid-cols-[160px_1fr] transition-colors sm:grid-cols-[200px_1fr]",
                idx % 2 === 0 ? "bg-white/90" : "bg-slate-50/50",
                "hover:bg-[#0057FF]/[0.04]",
              )}
            >
              <td className="border-r border-slate-200/60 px-4 py-3 font-medium text-slate-500">
                {row.label}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
