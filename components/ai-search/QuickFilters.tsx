import { Filter, RotateCcw } from "lucide-react";
import type { AISearchFilters } from "@/lib/ai-search/mock-data";

type QuickFiltersProps = {
  filters: AISearchFilters;
  resultCount: number;
  onChange: (filters: AISearchFilters) => void;
  onReset: () => void;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export default function QuickFilters({ filters, resultCount, onChange, onReset }: QuickFiltersProps) {
  const updateFilter = <Key extends keyof AISearchFilters>(key: Key, value: AISearchFilters[Key]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-blue-700" />
          <div>
            <h2 className="text-base font-bold text-slate-950">Bộ lọc nhanh</h2>
            <p className="text-xs text-slate-500">{resultCount} sản phẩm đang khớp</p>
          </div>
        </div>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700">
          <RotateCcw size={14} />
          Đặt lại
        </button>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Khoảng giá</span>
          <input
            type="range"
            min={10000000}
            max={25000000}
            step={500000}
            value={filters.priceCeiling}
            onChange={(event) => updateFilter("priceCeiling", Number(event.target.value))}
            className="mt-3 w-full accent-blue-700"
          />
          <span className="mt-1 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>10.000.000 đ</span>
            <span>Dưới {formatPrice(filters.priceCeiling)} đ</span>
          </span>
        </label>

        <FilterSelect
          label="Tốc độ scan"
          value={String(filters.minimumSpeed)}
          onChange={(value) => updateFilter("minimumSpeed", Number(value))}
          options={[
            ["35", "Từ 35 tờ/phút"],
            ["40", "Từ 40 tờ/phút"],
            ["45", "Từ 45 tờ/phút"],
          ]}
        />

        <FilterSelect
          label="Kết nối"
          value={filters.connectivity}
          onChange={(value) => updateFilter("connectivity", value as AISearchFilters["connectivity"])}
          options={[
            ["all", "Tất cả"],
            ["LAN", "LAN"],
            ["WiFi", "WiFi"],
          ]}
        />

        <FilterSelect
          label="ADF"
          value={filters.adf}
          onChange={(value) => updateFilter("adf", value as AISearchFilters["adf"])}
          options={[
            ["all", "Tất cả"],
            ["50", "Từ 50 tờ"],
            ["80", "Từ 80 tờ"],
            ["100", "Từ 100 tờ"],
          ]}
        />

        <FilterSelect
          label="Thương hiệu"
          value={filters.brand}
          onChange={(value) => updateFilter("brand", value as AISearchFilters["brand"])}
          options={[
            ["all", "Tất cả"],
            ["Brother", "Brother"],
            ["Epson", "Epson"],
            ["Ricoh", "Ricoh"],
          ]}
        />
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
