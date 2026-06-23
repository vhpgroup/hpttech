"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Filter,
  Headphones,
  Loader2,
  MessageCircle,
  PackageSearch,
  RotateCcw,
  Search,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  Star,
  Table2,
  Zap,
} from "lucide-react";
import type { HybridProductSearchResponse } from "@/app/api/ai/hybrid-product-search/route";
import type { EnrichedRecommendedProduct } from "@/lib/catalog/match-hpt-product";

const EXAMPLE_PROMPTS = [
  "Tôi cần máy scan cho trường học, scan hồ sơ học sinh, tốc độ khoảng 40 tờ/phút, có LAN, ngân sách dưới 15 triệu",
  "Máy scan cho trường học, cần LAN, khoảng 40 tờ/phút",
  "Máy scan cho đội nhập liệu, cần scan tài liệu và độ ổn định",
  "So sánh DS-790WN và ADS-4300N",
  "Máy scan cho cơ quan nhà nước, giá phải rõ ràng",
];

const INITIAL_QUERY = EXAMPLE_PROMPTS[0];

function statusTone(status: string) {
  if (status === "in_hpt") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "need_verify") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-blue-50 text-blue-700 ring-blue-200";
}

function statusIcon(status: string) {
  if (status === "in_hpt") return <CheckCircle2 size={13} />;
  if (status === "need_verify") return <AlertCircle size={13} />;
  return <MessageCircle size={13} />;
}

function formatIntentValue(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Chưa rõ";
  if (typeof value === "number") return String(value);
  if (typeof value === "string" && value.trim()) return value;
  return "Chưa rõ";
}

function shortCategory(value?: string) {
  if (value === "scanner") return "Máy scan tài liệu";
  if (value === "printer") return "Máy in";
  if (value === "photocopier") return "Máy photocopy";
  return value || "Thiết bị văn phòng";
}

function productImageLabel(product: EnrichedRecommendedProduct) {
  const brand = product.brand?.slice(0, 2).toUpperCase() || "AI";
  const model = product.model?.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "HPT";
  return `${brand}\n${model}`;
}

function productSpec(product: EnrichedRecommendedProduct, pattern: RegExp, fallback: string) {
  const text = `${product.specsSummary || ""} ${product.reason || ""}`;
  const match = text.match(pattern);
  return match?.[0] || fallback;
}

function ratingFor(product: EnrichedRecommendedProduct) {
  return Math.max(4.2, Math.min(4.9, 4.1 + product.score / 1000));
}

function relatedProducts(products: EnrichedRecommendedProduct[]) {
  return products.slice(0, 6);
}

export default function HybridProductSearch() {
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [result, setResult] = useState<HybridProductSearchResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortMode, setSortMode] = useState("fit");
  const [minScore, setMinScore] = useState(75);
  const [statusFilter, setStatusFilter] = useState("all");

  const products = useMemo(() => {
    const filtered = (result?.products || [])
      .filter((product) => product.score >= minScore)
      .filter((product) => statusFilter === "all" || product.hptStatus === statusFilter);
    return [...filtered].sort((left, right) => {
      if (sortMode === "hpt") {
        const leftHpt = left.hptStatus === "in_hpt" ? 1 : 0;
        const rightHpt = right.hptStatus === "in_hpt" ? 1 : 0;
        return rightHpt - leftHpt || right.score - left.score;
      }
      return right.score - left.score;
    });
  }, [minScore, result?.products, sortMode, statusFilter]);

  const runSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) {
      setError("Nhập nhu cầu sản phẩm trước khi tìm.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/hybrid-product-search", {
        body: JSON.stringify({ query: nextQuery }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Không chạy được AI Recommendation.");
      setResult(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="bg-[#0b246c] text-white">
        <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-5">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-50">
              <Sparkles size={13} />
              HPT Tech AI Product Finder
            </div>
            <h1 className="text-2xl font-extrabold tracking-normal sm:text-3xl">
              AI Search - Tìm sản phẩm thông minh
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm font-medium leading-6 text-blue-100">
              Hỏi theo nhu cầu, AI sẽ phân tích và đề xuất sản phẩm phù hợp nhất cho mua sắm B2B.
            </p>

            <form className="mx-auto mt-5 rounded-md bg-white p-2 shadow-lg" onSubmit={runSearch}>
              <div className="flex flex-col gap-2 md:flex-row">
                <label className="sr-only" htmlFor="hybrid-product-query">
                  Nhu cầu sản phẩm
                </label>
                <textarea
                  className="min-h-[58px] flex-1 resize-none rounded border border-slate-200 px-3 py-2 text-sm leading-5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  id="hybrid-product-query"
                  onChange={(event) => setQuery(event.target.value)}
                  value={query}
                />
                <button
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded bg-blue-700 px-4 text-sm font-extrabold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? <Loader2 className="animate-spin" size={17} /> : <SendHorizontal size={17} />}
                  {loading ? "Đang tìm" : "Tìm bằng AI"}
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {EXAMPLE_PROMPTS.slice(1).map((prompt) => (
                <button
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-50 transition hover:bg-white/15"
                  key={prompt}
                  onClick={() => setQuery(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-3 py-4 sm:px-5">
        {error ? (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            <AlertCircle size={17} />
            {error}
          </div>
        ) : null}

        {result?.warnings.length ? (
          <div className="mb-3 grid gap-2 md:grid-cols-2">
            {result.warnings.map((warning) => (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs font-medium text-amber-800" key={warning}>
                <AlertCircle size={15} />
                {warning}
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)_270px]">
          <aside className="space-y-3">
            <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <PackageSearch className="text-blue-700" size={18} />
                <div>
                  <h2 className="text-sm font-extrabold text-slate-950">AI hiểu nhu cầu của bạn</h2>
                  <p className="text-xs text-slate-500">Các tiêu chí được bóc tách từ câu hỏi.</p>
                </div>
              </div>
              <dl className="space-y-2 text-xs">
                {[
                  ["Loại thiết bị", shortCategory(result?.intent.category)],
                  ["Mục đích sử dụng", result?.intent.useCase],
                  ["Môi trường dùng", result?.intent.environment],
                  ["Tốc độ mong muốn", result?.intent.speedPPM ? `${result.intent.speedPPM} ppm` : undefined],
                  ["Kết nối", result?.intent.connectivity],
                  ["Ngân sách", result?.intent.budgetMax ? `Dưới ${result.intent.budgetMax.toLocaleString("vi-VN")}đ` : undefined],
                ].map(([label, value]) => (
                  <div className="grid grid-cols-[105px_minmax(0,1fr)] gap-2 border-b border-slate-100 pb-2 last:border-0" key={String(label)}>
                    <dt className="font-semibold text-slate-500">{label}</dt>
                    <dd className="font-bold text-slate-800">{formatIntentValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Search className="text-blue-700" size={17} />
                <h2 className="text-sm font-extrabold text-slate-950">Câu hỏi bổ sung</h2>
              </div>
              <div className="space-y-2">
                {(result?.intent.missingQuestions.length ? result.intent.missingQuestions : [
                  "Bạn muốn ngân sách khoảng bao nhiêu?",
                  "Mỗi ngày cần xử lý bao nhiêu tài liệu?",
                ]).map((question) => (
                  <button
                    className="flex w-full items-center justify-between rounded border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                    key={question}
                    type="button"
                    onClick={() => setQuery(`${query}. ${question}`)}
                  >
                    {question}
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <div className="space-y-3">
            <section className="grid gap-3 md:grid-cols-3">
              <SummaryCard
                icon={<Sparkles size={18} />}
                label="Tóm tắt đề xuất"
                text={
                  result
                    ? `AI đề xuất ${result.products.length} sản phẩm theo nhu cầu và ưu tiên thực tế.`
                    : "Chạy tìm kiếm để AI đề xuất sản phẩm."
                }
              />
              <SummaryCard
                icon={<ShieldCheck size={18} />}
                label="Đối chiếu HPT"
                text={
                  result
                    ? `${result.products.filter((product) => product.hptStatus === "in_hpt").length} sản phẩm có tại HPT.`
                    : "Payload CMS dùng để kiểm tra tồn kho."
                }
              />
              <SummaryCard
                icon={<Zap size={18} />}
                label="Tự động CTA"
                text="Có tại HPT thì báo giá, chưa có thì liên hệ đặt hàng."
              />
            </section>

            <section className="rounded-md border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Table2 className="text-blue-700" size={18} />
                    <h2 className="text-base font-extrabold text-slate-950">
                      Sản phẩm phù hợp nhất ({products.length})
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Bảng so sánh theo tiêu chí AI và trạng thái HPT.</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  Sắp xếp theo
                  <select
                    className="h-9 rounded border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700"
                    onChange={(event) => setSortMode(event.target.value)}
                    value={sortMode}
                  >
                    <option value="fit">Phù hợp nhất</option>
                    <option value="hpt">Có tại HPT trước</option>
                  </select>
                </label>
              </div>

              {products.length ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-[1120px] table-fixed border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase text-slate-500">
                          {[
                            "Sản phẩm",
                            "Hình ảnh",
                            "Tốc độ/nhóm",
                            "ADF",
                            "Kết nối",
                            "Độ phù hợp",
                            "Trạng thái HPT",
                            "Giá tham khảo",
                            "Đánh giá",
                            "Hành động",
                          ].map((heading) => (
                            <th className="border-r border-slate-200 px-3 py-3 last:border-r-0" key={heading}>
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <ProductRow product={product} key={`${product.rank}-${product.name}`} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
                    <span>Giá chỉ là tham khảo nếu AI có dữ liệu. HPT sẽ xác nhận khi báo giá.</span>
                    <div className="flex gap-2 text-slate-400">
                      <ArrowLeft size={16} />
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-sm font-medium text-slate-500">
                  {result ? "Không có sản phẩm phù hợp bộ lọc hiện tại." : "Nhập nhu cầu và chạy tìm kiếm để xem kết quả."}
                </div>
              )}
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-950">Sản phẩm liên quan khác</h2>
                  <p className="text-xs text-slate-500">Các lựa chọn cùng nhóm để hỏi tiếp hoặc đặt hàng.</p>
                </div>
                <Link className="inline-flex items-center gap-1 text-xs font-bold text-blue-700" href="/san-pham">
                  Xem tất cả
                  <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {(relatedProducts(result?.products || []).length ? relatedProducts(result?.products || []) : []).map((product) => (
                  <RelatedCard product={product} key={`related-${product.name}`} />
                ))}
                {!result ? (
                  <div className="col-span-full rounded border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                    Chạy tìm kiếm để xem sản phẩm liên quan.
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="space-y-3">
            <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="text-blue-700" size={17} />
                  <h2 className="text-sm font-extrabold text-slate-950">Bộ lọc nhanh</h2>
                </div>
                <button
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700"
                  onClick={() => {
                    setMinScore(75);
                    setStatusFilter("all");
                  }}
                  type="button"
                >
                  <RotateCcw size={13} />
                  Đặt lại
                </button>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-bold text-slate-700">Độ phù hợp tối thiểu</span>
                  <input
                    className="mt-2 w-full accent-blue-700"
                    max={100}
                    min={60}
                    onChange={(event) => setMinScore(Number(event.target.value))}
                    step={5}
                    type="range"
                    value={minScore}
                  />
                  <span className="mt-1 block text-xs text-slate-500">Từ {minScore} điểm</span>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-700">Trạng thái HPT</span>
                  <select
                    className="mt-2 h-9 w-full rounded border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700"
                    onChange={(event) => setStatusFilter(event.target.value)}
                    value={statusFilter}
                  >
                    <option value="all">Tất cả</option>
                    <option value="in_hpt">Có tại HPT</option>
                    <option value="orderable">Liên hệ đặt hàng</option>
                    <option value="need_verify">Cần xác nhận</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Headphones className="text-blue-700" size={17} />
                <h2 className="text-sm font-extrabold text-slate-950">Cần tư vấn thêm?</h2>
              </div>
              <p className="text-xs leading-5 text-slate-600">
                Gửi kết quả AI cho tư vấn viên HPT để chốt model, tồn kho, giá và cấu hình phù hợp.
              </p>
              <div className="mt-3 grid gap-2">
                <Link className="inline-flex h-9 items-center justify-center gap-2 rounded border border-blue-700 bg-white text-xs font-bold text-blue-700 hover:bg-blue-50" href="/lien-he">
                  <MessageCircle size={15} />
                  Chat Zalo với chuyên viên
                </Link>
                <a className="inline-flex h-9 items-center justify-center rounded bg-blue-700 text-xs font-bold text-white hover:bg-blue-800" href="tel:0967286889">
                  Gọi ngay: 0918 871 414
                </a>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-blue-700">
        {icon}
        <strong className="text-sm text-slate-950">{label}</strong>
      </div>
      <p className="text-xs leading-5 text-slate-600">{text}</p>
    </article>
  );
}

function ProductImageBox({ product }: { product: EnrichedRecommendedProduct }) {
  return (
    <div className="grid h-20 w-24 place-items-center rounded border border-blue-100 bg-blue-50 text-center text-[11px] font-extrabold leading-4 text-blue-700">
      <span className="whitespace-pre-line">{productImageLabel(product)}</span>
    </div>
  );
}

function ProductRow({ product }: { product: EnrichedRecommendedProduct }) {
  const rating = ratingFor(product);
  return (
    <tr className="border-b border-slate-100 align-middle hover:bg-blue-50/40">
      <td className="border-r border-slate-100 px-3 py-3">
        <div className="font-extrabold text-blue-700">{product.name}</div>
        {product.sourceUrl ? (
          <a
            className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[11px] font-bold text-slate-500 hover:text-blue-700"
            href={product.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            Nguon: {product.sourceName || "web"}
          </a>
        ) : null}
        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{product.reason}</p>
      </td>
      <td className="border-r border-slate-100 px-3 py-3">
        <ProductImageBox product={product} />
      </td>
      <SpecCell>{productSpec(product, /\d+\s?ppm/i, product.category || "scanner")}</SpecCell>
      <SpecCell>{/adf/i.test(`${product.specsSummary} ${product.reason}`) ? "Có ADF" : "Cần xác nhận"}</SpecCell>
      <SpecCell>{/lan/i.test(`${product.specsSummary} ${product.reason}`) ? "LAN" : /wifi/i.test(`${product.specsSummary} ${product.reason}`) ? "WiFi" : "USB/LAN"}</SpecCell>
      <td className="border-r border-slate-100 px-3 py-3">
        <div className="font-extrabold text-slate-950">{product.score}/100</div>
        <div className="mt-1 h-1.5 rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full bg-blue-700" style={{ width: `${Math.min(100, product.score)}%` }} />
        </div>
      </td>
      <td className="border-r border-slate-100 px-3 py-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-extrabold ring-1 ${statusTone(product.hptStatus)}`}>
          {statusIcon(product.hptStatus)}
          {product.hptLabel}
        </span>
      </td>
      <SpecCell>{product.priceText || (product.hptStatus === "in_hpt" ? "Liên hệ" : "Theo báo giá")}</SpecCell>
      <td className="border-r border-slate-100 px-3 py-3">
        <div className="flex items-center gap-1">
          <Star className="fill-amber-400 text-amber-400" size={14} />
          <span className="font-extrabold text-blue-700">{rating.toFixed(1)}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        {product.hptHref ? (
          <Link className="inline-flex h-8 items-center justify-center rounded bg-blue-700 px-3 text-[11px] font-extrabold text-white hover:bg-blue-800" href={product.hptHref}>
            {product.cta}
          </Link>
        ) : (
          <Link className="inline-flex h-8 items-center justify-center rounded border border-blue-700 px-3 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50" href="/lien-he">
            {product.cta}
          </Link>
        )}
      </td>
    </tr>
  );
}

function SpecCell({ children }: { children: React.ReactNode }) {
  return <td className="border-r border-slate-100 px-3 py-3 font-semibold text-slate-700">{children}</td>;
}

function RelatedCard({ product }: { product: EnrichedRecommendedProduct }) {
  return (
    <article className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <div className="grid h-24 place-items-center rounded bg-white">
        <ProductImageBox product={product} />
      </div>
      <h3 className="mt-3 line-clamp-2 min-h-[38px] text-xs font-extrabold leading-5 text-blue-700">{product.name}</h3>
      <p className="mt-1 text-sm font-extrabold text-red-600">{product.priceText || "Liên hệ"}</p>
      <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${statusTone(product.hptStatus)}`}>
        {statusIcon(product.hptStatus)}
        {product.hptStatus === "in_hpt" ? "Có hàng" : "Liên hệ"}
      </span>
    </article>
  );
}
