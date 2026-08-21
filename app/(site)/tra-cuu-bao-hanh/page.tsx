import Link from "next/link";
import { AlertTriangle, BadgeCheck, FileSearch, Phone, Search, ShieldCheck } from "lucide-react";
import HelpSidebar from "@/components/help/HelpSidebar";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { pageMetadata } from "@/lib/seo";
import { phoneHref } from "@/lib/site-settings";
import {
  isWarrantyLookupMode,
  lookupWarranties,
  WARRANTY_LOOKUP_MIN_LENGTH,
  type WarrantyLookupMode,
  type WarrantyRecord,
} from "@/lib/warranty-payload";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Tra cứu bảo hành",
  description:
    "Tra cứu thông tin bảo hành thiết bị HPT Tech theo số serial, tên khách hàng hoặc mã E-HSMT (gói thầu). Xem thời hạn và trạng thái bảo hành trực tuyến.",
  path: "/tra-cuu-bao-hanh",
});

const hotline = "0918871414";
const email = "bach.pv@hpttech.vn";

const MODE_OPTIONS: { value: WarrantyLookupMode; label: string }[] = [
  { value: "serial", label: "Số serial (S/N)" },
  { value: "customer", label: "Tên khách hàng" },
  { value: "ehsmt", label: "Mã E-HSMT" },
];

const MODE_RESULT_LABELS: Record<WarrantyLookupMode, string> = {
  serial: "số serial",
  customer: "tên khách hàng",
  ehsmt: "mã E-HSMT",
};

type WarrantyStatusKind = "active" | "expired" | "voided" | "unknown";

type WarrantyStatus = {
  kind: WarrantyStatusKind;
  label: string;
  detail?: string;
};

const STATUS_BADGE_CLASSES: Record<WarrantyStatusKind, string> = {
  active: "border-success/30 bg-success/10 text-success",
  expired: "border-danger/30 bg-danger/10 text-danger",
  voided: "border-slate-300 bg-slate-100 text-slate-600",
  unknown: "border-warning/30 bg-warning/10 text-warning",
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDate(value: string | null): string {
  if (!value) return "Đang cập nhật";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Đang cập nhật" : dateFormatter.format(date);
}

function getWarrantyStatus(record: WarrantyRecord): WarrantyStatus {
  if (record.voided) {
    return { kind: "voided", label: "Đã hủy hiệu lực" };
  }
  if (!record.endDate) {
    return { kind: "unknown", label: "Liên hệ xác minh" };
  }

  const end = new Date(record.endDate);
  if (Number.isNaN(end.getTime())) {
    return { kind: "unknown", label: "Liên hệ xác minh" };
  }

  const daysLeft = Math.round(
    (Date.parse(dayKeyFormatter.format(end)) - Date.parse(dayKeyFormatter.format(new Date()))) /
      86_400_000,
  );

  if (daysLeft > 0) {
    return { kind: "active", label: "Còn hạn bảo hành", detail: `Còn ${daysLeft} ngày` };
  }
  if (daysLeft === 0) {
    return { kind: "active", label: "Còn hạn bảo hành", detail: "Hết hạn hôm nay" };
  }
  return { kind: "expired", label: "Hết hạn bảo hành", detail: `Đã hết hạn ${Math.abs(daysLeft)} ngày` };
}

function StatusBadge({ status }: { status: WarrantyStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 border px-3 py-1.5 text-[13px] font-semibold ${STATUS_BADGE_CLASSES[status.kind]}`}
    >
      {status.kind === "active" ? <BadgeCheck size={15} /> : null}
      {status.kind === "expired" || status.kind === "unknown" ? <AlertTriangle size={15} /> : null}
      <span>
        {status.label}
        {status.detail ? <span className="font-normal"> · {status.detail}</span> : null}
      </span>
    </span>
  );
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function WarrantyResultCard({ record }: { record: WarrantyRecord }) {
  const status = getWarrantyStatus(record);

  return (
    <li className="border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Serial: <span className="font-semibold text-slate-700">{record.serialNumber}</span>
            {record.sku ? (
              <>
                {" "}
                · Mã SP: <span className="font-semibold text-slate-700">{record.sku}</span>
              </>
            ) : null}
          </p>
          <h3 className="mt-1 text-lg font-bold leading-snug text-slate-900">{record.productName}</h3>
        </div>
        <StatusBadge status={status} />
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoField label="Khách hàng" value={record.customerName} />
        <InfoField label="Mã E-HSMT" value={record.ehsmtCode || "—"} />
        <InfoField label="Ngày bắt đầu BH" value={formatDate(record.startDate)} />
        <InfoField
          label="Hạn bảo hành"
          value={
            <>
              {formatDate(record.endDate)}
              {record.warrantyMonths ? (
                <span className="font-normal text-slate-500"> ({record.warrantyMonths} tháng)</span>
              ) : null}
            </>
          }
        />
      </dl>
    </li>
  );
}

type WarrantyLookupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function WarrantyLookupPage({ searchParams }: WarrantyLookupPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const rawMode = firstParam(resolved.type);
  const mode: WarrantyLookupMode = isWarrantyLookupMode(rawMode) ? rawMode : "serial";
  const query = (firstParam(resolved.q) || "").trim();

  const hasQuery = query.length > 0;
  const minLength = WARRANTY_LOOKUP_MIN_LENGTH[mode];
  const tooShort = hasQuery && query.length < minLength;

  const lookup = hasQuery && !tooShort ? await lookupWarranties(mode, query) : { ok: true, records: [] };

  return (
    <main className="subpage-main bg-[#eef0f4]">
      <div className="px-4 pb-12 sm:px-6 lg:px-0">
        <SubpageHeader
          className="mb-7"
          title="Tra cứu bảo hành"
          breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Tra cứu bảo hành" }]}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <HelpSidebar activePath="/tra-cuu-bao-hanh" />

          <div className="min-w-0 space-y-6">
            <section className="bg-white px-6 py-7 sm:px-8 lg:px-10 lg:py-8">
              <h2 className="text-center text-2xl font-black uppercase leading-tight text-slate-900 sm:text-3xl">
                Tra cứu thông tin bảo hành
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-center text-slate-600">
                Nhập số serial trên tem thiết bị, tên khách hàng/đơn vị hoặc mã E-HSMT của gói thầu
                để xem thời hạn và trạng thái bảo hành do HPT Tech cung cấp.
              </p>

              <form method="get" action="/tra-cuu-bao-hanh" className="mx-auto mt-7 max-w-3xl">
                <fieldset>
                  <legend className="sr-only">Tra cứu theo</legend>
                  <div className="flex flex-wrap justify-center gap-2">
                    {MODE_OPTIONS.map((option) => (
                      <label key={option.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value={option.value}
                          defaultChecked={option.value === mode}
                          className="peer sr-only"
                        />
                        <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-400 hover:text-primary-700 peer-checked:border-primary-600 peer-checked:bg-primary-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary-300">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <label className="sr-only" htmlFor="warranty-lookup-input">
                    Từ khóa tra cứu
                  </label>
                  <input
                    id="warranty-lookup-input"
                    name="q"
                    defaultValue={query}
                    required
                    minLength={3}
                    maxLength={120}
                    autoComplete="off"
                    placeholder="VD: X4C1234567, Công ty TNHH ABC hoặc IB2500123456..."
                    className="h-12 w-full flex-1 border border-slate-300 bg-white px-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 bg-primary-600 px-8 text-[15px] font-semibold text-white transition hover:bg-primary-700"
                  >
                    <Search size={18} />
                    Tra cứu
                  </button>
                </div>

                <p className="mt-3 text-center text-[13px] leading-5 text-slate-500">
                  Serial tra cứu chính xác theo tem trên thiết bị (không phân biệt hoa/thường). Tên
                  khách hàng nhập đầy đủ, có dấu như trên hóa đơn/hợp đồng.
                </p>
              </form>
            </section>

            {hasQuery ? (
              <section aria-live="polite">
                {tooShort ? (
                  <div className="flex items-start gap-3 border border-warning/30 bg-warning/10 px-5 py-4 text-[15px] leading-6 text-slate-800">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0 text-warning" />
                    <p>
                      Vui lòng nhập tối thiểu <strong>{minLength} ký tự</strong> khi tra cứu theo{" "}
                      {MODE_RESULT_LABELS[mode]}.
                    </p>
                  </div>
                ) : !lookup.ok ? (
                  <div className="flex items-start gap-3 border border-danger/30 bg-danger/10 px-5 py-4 text-[15px] leading-6 text-slate-800">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0 text-danger" />
                    <p>
                      Hệ thống tra cứu đang tạm gián đoạn. Vui lòng thử lại sau ít phút hoặc gọi
                      hotline{" "}
                      <a href={phoneHref(hotline)} className="font-semibold text-primary-700">
                        {hotline}
                      </a>{" "}
                      để được hỗ trợ ngay.
                    </p>
                  </div>
                ) : lookup.records.length === 0 ? (
                  <div className="border border-slate-200 bg-white px-6 py-8 text-center">
                    <FileSearch size={36} className="mx-auto text-slate-400" />
                    <h3 className="mt-3 text-lg font-bold text-slate-900">
                      Không tìm thấy hồ sơ bảo hành
                    </h3>
                    <p className="mx-auto mt-2 max-w-xl text-[15px] leading-6 text-slate-600">
                      Không có kết quả khớp với {MODE_RESULT_LABELS[mode]}{" "}
                      <strong className="text-slate-800">&ldquo;{query}&rdquo;</strong>. Vui lòng
                      kiểm tra lại thông tin, hoặc liên hệ hotline{" "}
                      <a href={phoneHref(hotline)} className="font-semibold text-primary-700">
                        {hotline}
                      </a>{" "}
                      / email{" "}
                      <a href={`mailto:${email}`} className="font-semibold text-primary-700">
                        {email}
                      </a>{" "}
                      để được kiểm tra thủ công.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[15px] text-slate-600">
                      Tìm thấy <strong className="text-slate-900">{lookup.records.length}</strong>{" "}
                      hồ sơ bảo hành khớp với {MODE_RESULT_LABELS[mode]}{" "}
                      <strong className="text-slate-900">&ldquo;{query}&rdquo;</strong>:
                    </p>
                    <ul className="mt-4 space-y-4">
                      {lookup.records.map((record) => (
                        <WarrantyResultCard key={record.id} record={record} />
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-3">
              <div className="border border-slate-200 bg-white p-5">
                <ShieldCheck size={24} className="text-primary-600" />
                <h3 className="mt-3 text-[15px] font-bold text-slate-900">Số serial ở đâu?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Serial (S/N) in trên tem dán ở mặt sau/mặt đáy thiết bị và trên vỏ hộp, cạnh mã
                  vạch của nhà sản xuất.
                </p>
              </div>
              <div className="border border-slate-200 bg-white p-5">
                <FileSearch size={24} className="text-primary-600" />
                <h3 className="mt-3 text-[15px] font-bold text-slate-900">Khách hàng dự án</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Đơn vị mua qua gói thầu có thể tra theo mã E-HSMT để xem toàn bộ thiết bị bàn giao
                  thuộc gói.
                </p>
              </div>
              <div className="border border-slate-200 bg-white p-5">
                <Phone size={24} className="text-primary-600" />
                <h3 className="mt-3 text-[15px] font-bold text-slate-900">Cần hỗ trợ thêm?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Hotline{" "}
                  <a href={phoneHref(hotline)} className="font-semibold text-primary-700">
                    {hotline}
                  </a>{" "}
                  — hoặc xem{" "}
                  <Link href="/chinh-sach-bao-hanh-doi-tra" className="font-semibold text-primary-700">
                    chính sách bảo hành đổi trả
                  </Link>
                  .
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
