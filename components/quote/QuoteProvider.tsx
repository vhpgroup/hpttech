"use client";

import Image from "next/image";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, Mail, MapPin, Phone, Printer, Trash2, X } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { formatVND, parseVNDPrice } from "@/lib/cart";
import { getVatInclusiveQuoteTotals } from "@/lib/quote-totals";

type QuoteCustomer = {
  company: string;
  address: string;
  contact: string;
  phone: string;
  email: string;
};

type QuoteContextValue = {
  openQuote: (product: CatalogProduct) => void;
};

type QuoteLine = {
  key: string;
  product: CatalogProduct;
  quantity: number;
};

type PrintMode = "color" | "grayscale";

const QuoteContext = createContext<QuoteContextValue | null>(null);

const HPT_INFO = {
  company: "CÔNG TY TNHH ĐẦU TƯ XÂY DỰNG VÀ THIẾT BỊ CÔNG NGHỆ HPT",
  address: "SB.04 khu đô thị Vinhomes Marina, P. An Biên, TP. Hải Phòng",
  phone: "0918 87 14 14",
  website: "www.hpttech.vn",
  taxCode: "0202253444",
  bankOwner: "CÔNG TY TNHH ĐẦU TƯ XÂY DỰNG VÀ THIẾT BỊ CÔNG NGHỆ HPT",
  bankAccount: "929223339",
  bankName: "Techcombank - CN Hải Phòng",
  consultant: "Phạm Văn Bách",
  consultantRole: "Chuyên viên tư vấn giải pháp",
  consultantEmail: "bach.pv@hpttech.vn",
};

const DEFAULT_CUSTOMER: QuoteCustomer = {
  company: "Công ty TNHH ABC",
  address: "Số 123 đường Lê Hồng Phong, Ngô Quyền, Hải Phòng",
  contact: "Nguyễn Văn A",
  phone: "0912 345 678",
  email: "nguyenvana@abc.com.vn",
};

function quoteCode() {
  const now = new Date();
  const year = now.getFullYear();
  const suffix = Math.floor(Math.random() * 90000 + 10000);
  return `BG-${year}-${suffix}`;
}

function todayLabel() {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

function productImage(product: CatalogProduct) {
  return product.images?.[0]?.url || product.image;
}

function quoteLineKey(product: CatalogProduct) {
  return String(product.id || product.slug || product.sku || product.title);
}

function quoteSpecs(product: CatalogProduct) {
  return (product.specs || []).filter(
    (spec) => spec.label.trim().length > 0 && spec.value.trim().length > 0,
  );
}

function moneyLabel(value: number) {
  return formatVND(value).replace(/\s₫$/, " đ");
}

function QuoteDocument({
  customer,
  lines,
  quoteId,
  validDays,
}: {
  customer: QuoteCustomer;
  lines: QuoteLine[];
  quoteId: string;
  validDays: number;
}) {
  const lineTotals = lines.map((line) => {
    const unitPrice = parseVNDPrice(line.product.price) || 0;
    return {
      ...line,
      image: productImage(line.product),
      specs: quoteSpecs(line.product),
      unitPrice,
      totals: getVatInclusiveQuoteTotals(unitPrice, line.quantity),
    };
  });
  const hasImages = lineTotals.some((line) => Boolean(line.image));
  const summaryColSpan = hasImages ? 5 : 4;
  const totals = lineTotals.reduce(
    (sum, line) => ({
      subtotal: sum.subtotal + line.totals.subtotal,
      vat: sum.vat + line.totals.vat,
      total: sum.total + line.totals.total,
    }),
    { subtotal: 0, vat: 0, total: 0 },
  );

  return (
    <article
      className="quote-document w-[794px] max-w-full bg-white p-6 text-slate-950 print:w-full print:p-0 lg:p-7"
      data-line-count={lines.length}
      data-print-density={lines.length > 1 ? "compact" : "normal"}
    >
      <header className="quote-intro grid gap-5 border-b-4 border-[#0A4BFF] pb-5 md:grid-cols-[190px_1fr]">
        <div className="flex items-center">
          <Image
            src="/assets/logo/hptlogo.png"
            alt="HPT Technology"
            width={170}
            height={92}
            priority
            className="h-auto w-[170px] object-contain"
          />
        </div>
        <div className="min-w-0 space-y-3 text-sm leading-6">
          <h2 className="whitespace-nowrap text-[15px] font-extrabold uppercase leading-5 tracking-[-0.01em] lg:text-[16px]">{HPT_INFO.company}</h2>
          <p className="flex gap-2"><MapPin size={18} className="mt-0.5 text-[#0A4BFF]" /> {HPT_INFO.address}</p>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <span className="flex items-center gap-2"><Phone size={16} className="text-[#0A4BFF]" /> {HPT_INFO.phone}</span>
            <span>{HPT_INFO.website}</span>
            <span>MST: {HPT_INFO.taxCode}</span>
          </div>
        </div>
      </header>

      <section className="quote-heading grid gap-6 py-6 md:grid-cols-[1fr_240px]">
        <div className="text-center md:col-start-1 md:col-end-2 md:row-start-1">
          <h1 className="text-3xl font-black uppercase tracking-wide text-[#0A4BFF] lg:text-4xl">Báo giá sản phẩm</h1>
          <div className="mx-auto mt-3 h-1 w-44 rounded-full bg-[#0A4BFF]/35" />
        </div>
        <div className="space-y-3 text-sm md:col-start-2 md:row-start-1">
          <p>Mã báo giá: <strong>{quoteId}</strong></p>
          <p>Ngày báo giá: <strong>{todayLabel()}</strong></p>
          <p>Hiệu lực: <strong>{validDays} ngày</strong></p>
        </div>
      </section>

      <section className="quote-customer grid gap-5 rounded-xl border border-blue-200 p-5 text-sm md:grid-cols-2">
        <div className="space-y-4">
          <p><strong>Kính gửi:</strong> <span className="ml-4">{customer.company || "Quý khách hàng"}</span></p>
          <p><strong>Địa chỉ:</strong> <span className="ml-7">{customer.address || "Đang cập nhật"}</span></p>
          <p><strong>Người liên hệ:</strong> <span className="ml-2">{customer.contact || "Đang cập nhật"}</span></p>
        </div>
        <div className="space-y-4">
          <p><strong>Số điện thoại:</strong> <span className="ml-4">{customer.phone || "Đang cập nhật"}</span></p>
          <p><strong>Email:</strong> <span className="ml-16">{customer.email || "Đang cập nhật"}</span></p>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-blue-300">
        <table className="w-full table-fixed border-collapse text-[13px] leading-5">
          <colgroup>
            <col className="w-[46px]" />
            {hasImages ? <col className="w-[112px]" /> : null}
            <col />
            <col className="w-[90px]" />
            <col className="w-[122px]" />
            <col className="w-[132px]" />
          </colgroup>
          <thead>
            <tr className="bg-[#0A4BFF] text-center text-xs font-extrabold uppercase text-white">
              <th className="border border-[#0A4BFF] px-2 py-3">STT</th>
              {hasImages ? <th className="border border-[#0A4BFF] px-2 py-3">Hình ảnh</th> : null}
              <th className="border border-[#0A4BFF] px-3 py-3">Sản phẩm</th>
              <th className="border border-[#0A4BFF] px-2 py-3">Số lượng</th>
              <th className="border border-[#0A4BFF] px-2 py-3">Đơn giá</th>
              <th className="border border-[#0A4BFF] px-2 py-3">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {lineTotals.map((line, index) => (
              <tr key={line.key} className="quote-product-row align-middle">
                <td className="border border-blue-200 px-2 py-3 text-center font-semibold">{index + 1}</td>
                {hasImages ? (
                  <td className="border border-blue-200 px-2 py-3 text-center">
                    <div className="grid h-24 place-items-center bg-slate-50">
                      {line.image ? (
                        <Image
                          src={line.image}
                          alt={line.product.title}
                          width={96}
                          height={96}
                          className="max-h-20 w-auto object-contain"
                        />
                      ) : null}
                    </div>
                  </td>
                ) : null}
                <td className="border border-blue-200 px-3 py-3">
                  <h3 className="m-0 text-[14px] font-extrabold leading-5 text-slate-950">{line.product.title}</h3>
                  {line.product.detail ? <p className="mt-1 text-[12px] font-semibold leading-4 text-[#0A4BFF]">{line.product.detail}</p> : null}
                  <ul className="mt-1.5 list-disc space-y-0 pl-4 text-[12px] leading-4">
                    {line.specs.map((spec) => (
                      <li key={`${spec.label}-${spec.value}`}>
                        <strong>{spec.label}:</strong> {spec.value}
                      </li>
                    ))}
                    {line.product.warranty ? <li><strong>Báº£o hÃ nh:</strong> {line.product.warranty}</li> : null}
                  </ul>
                </td>
                <td className="border border-blue-200 px-2 py-3 text-center font-semibold">{line.quantity}</td>
                <td className="border border-blue-200 px-2 py-3 text-right font-extrabold text-red-600">{line.unitPrice ? moneyLabel(line.unitPrice) : "Liên hệ"}</td>
                <td className="border border-blue-200 px-2 py-3 text-right font-extrabold text-red-600">{line.unitPrice ? moneyLabel(line.totals.total) : "Liên hệ"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="text-[13px]">
            <tr className="bg-slate-100">
              <td colSpan={summaryColSpan} className="border border-blue-200 px-3 py-2 text-right font-bold">Tạm tính (chưa VAT):</td>
              <td className="border border-blue-200 px-2 py-2 text-right font-extrabold">{totals.total ? moneyLabel(totals.subtotal) : "Liên hệ"}</td>
            </tr>
            <tr className="bg-slate-100">
              <td colSpan={summaryColSpan} className="border border-blue-200 px-3 py-2 text-right font-bold">Thuế VAT (10%):</td>
              <td className="border border-blue-200 px-2 py-2 text-right font-extrabold">{totals.total ? moneyLabel(totals.vat) : "0 đ"}</td>
            </tr>
            <tr className="bg-slate-100 text-base">
              <td colSpan={summaryColSpan} className="border border-blue-200 px-3 py-3 text-right font-black uppercase text-[#0A4BFF]">Tổng cộng:</td>
              <td className="border border-blue-200 px-2 py-3 text-right font-black text-[#0A4BFF]">{totals.total ? moneyLabel(totals.total) : "Liên hệ"}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <div className="quote-final-block">
        <section className="quote-commercial mt-6 grid gap-6 rounded-xl border border-blue-200 p-5 text-sm md:grid-cols-3">
          <div>
            <h3 className="mb-3 font-extrabold uppercase text-[#0A4BFF]">Điều khoản thương mại</h3>
            <ul className="space-y-2">
              <li>✓ Giá trên đã gồm VAT</li>
              <li>✓ Hàng hóa chính hãng 100%</li>
              <li>✓ Bảo hành theo tiêu chuẩn hãng</li>
              <li>✓ Báo giá có hiệu lực trong {validDays} ngày</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-extrabold uppercase text-[#0A4BFF]">Thông tin thanh toán</h3>
            <p><strong>Chủ tài khoản:</strong></p>
            <p>{HPT_INFO.bankOwner}</p>
            <p className="mt-2"><strong>Số tài khoản:</strong> {HPT_INFO.bankAccount}</p>
            <p><strong>Ngân hàng:</strong> {HPT_INFO.bankName}</p>
          </div>
          <div>
            <h3 className="mb-3 font-extrabold uppercase text-[#0A4BFF]">Người phụ trách báo giá</h3>
            <p className="font-bold">{HPT_INFO.consultant}</p>
            <p className="mt-2">{HPT_INFO.phone}</p>
            <p>{HPT_INFO.consultantEmail}</p>
          </div>
        </section>

        <p className="mt-8 text-center text-lg font-extrabold italic text-[#0A4BFF]">
          HPT Tech trân trọng cảm ơn Quý khách hàng!
        </p>
      </div>
    </article>
  );
}

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [customer, setCustomer] = useState(DEFAULT_CUSTOMER);
  const [validDays, setValidDays] = useState(10);
  const [printMode, setPrintMode] = useState<PrintMode>("color");
  const [mounted, setMounted] = useState(false);
  const [quoteId] = useState(quoteCode);
  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const value = useMemo<QuoteContextValue>(() => ({
    openQuote: (nextProduct) => {
      const key = quoteLineKey(nextProduct);
      setLines((current) => {
        const existing = current.find((line) => line.key === key);
        if (existing) {
          return current.map((line) =>
            line.key === key ? { ...line, quantity: line.quantity + 1 } : line,
          );
        }
        return [...current, { key, product: nextProduct, quantity: 1 }];
      });
      setIsOpen(true);
    },
  }), []);

  const updateCustomer = (key: keyof QuoteCustomer, nextValue: string) => {
    setCustomer((current) => ({ ...current, [key]: nextValue }));
  };

  const close = () => setIsOpen(false);

  const updateQuantity = (key: string, quantity: number) => {
    setLines((current) =>
      current.map((line) =>
        line.key === key ? { ...line, quantity: Math.max(1, Math.floor(quantity) || 1) } : line,
      ),
    );
  };

  const removeLine = (key: string) => {
    setLines((current) => {
      const next = current.filter((line) => line.key !== key);
      if (!next.length) setIsOpen(false);
      return next;
    });
  };

  const quotePayload = () => {
    if (!lines.length) return null;

    return {
      quoteId,
      dateLabel: todayLabel(),
      validDays,
      includeVat: true,
      customer,
      products: lines.map((line) => ({
        quantity: line.quantity,
        product: {
          title: line.product.title,
          detail: line.product.detail,
          image: productImage(line.product),
          price: line.product.price,
          warranty: line.product.warranty,
          specs: quoteSpecs(line.product),
        },
      })),
    };
  };

  const fetchQuotePdf = async () => {
    const payload = quotePayload();
    if (!payload) return null;

    const response = await fetch("/api/quotes/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;
    return response.blob();
  };

  const printQuote = () => window.print();

  const downloadWord = () => {
    const html = quoteRef.current?.innerHTML;
    if (!html) return;
    const blob = new Blob([`<html><head><meta charset="utf-8"></head><body>${html}</body></html>`], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${quoteId}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    const blob = await fetchQuotePdf();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${quoteId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <QuoteContext.Provider value={value}>
      {children}
      {mounted && isOpen && lines.length ? createPortal(
        <div className="quote-modal-shell fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm print:static print:block print:bg-white print:p-0 sm:p-6">
          <style>{`
            .quote-preview-grayscale {
              filter: grayscale(1) !important;
            }

            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm;
              }

              html,
              body {
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
              }

              body > *:not(.quote-modal-shell) {
                display: none !important;
              }

              .quote-modal-shell {
                position: static !important;
                inset: auto !important;
                display: block !important;
                width: auto !important;
                height: auto !important;
                min-height: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                background: #fff !important;
                backdrop-filter: none !important;
              }

              .quote-modal-shell > div,
              .quote-modal-shell > div > div,
              .quote-modal-shell [data-quote-preview] {
                display: block !important;
                width: auto !important;
                height: auto !important;
                max-width: none !important;
                padding: 0 !important;
                overflow: visible !important;
                border: 0 !important;
                border-radius: 0 !important;
                background: #fff !important;
                box-shadow: none !important;
              }

              .quote-document {
                width: 190mm !important;
                max-width: 190mm !important;
                margin: 0 auto !important;
                padding: 0 !important;
                zoom: 0.86;
                box-shadow: none !important;
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
              }

              .quote-document[data-print-density="compact"] {
                zoom: 0.82;
              }

              .quote-intro {
                grid-template-columns: 190px minmax(0, 1fr) !important;
              }

              .quote-heading {
                grid-template-columns: minmax(0, 1fr) 240px !important;
              }

              .quote-heading > :first-child {
                grid-column: 1 / 2 !important;
                grid-row: 1 !important;
              }

              .quote-heading > :last-child {
                grid-column: 2 / 3 !important;
                grid-row: 1 !important;
              }

              .quote-customer {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }

              .quote-commercial {
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              }

              .quote-document thead {
                display: table-header-group !important;
              }

              .quote-document tbody tr,
              .quote-document tfoot,
              .quote-final-block {
                break-inside: avoid;
                page-break-inside: avoid;
              }

              .quote-document table {
                break-inside: auto;
                page-break-inside: auto;
              }
            }
          `}</style>
          <div className="flex h-[min(820px,calc(100vh-48px))] w-full max-w-[1220px] overflow-hidden rounded-2xl bg-slate-100 shadow-2xl print:block print:h-auto print:max-w-none print:overflow-visible print:rounded-none print:bg-white print:shadow-none">
            <div className="flex-1 overflow-auto p-3 print:overflow-visible print:p-0 sm:p-4">
              <div
                ref={quoteRef}
                data-quote-preview
                className={`mx-auto w-fit max-w-full bg-white shadow-sm print:w-full print:max-w-none print:shadow-none ${
                  printMode === "grayscale" ? "quote-preview-grayscale" : ""
                }`}
              >
                <QuoteDocument
                  customer={customer}
                  lines={lines}
                  quoteId={quoteId}
                  validDays={validDays}
                />
              </div>
            </div>

            <aside className="flex w-full max-w-[320px] flex-col border-l border-slate-200 bg-white print:hidden">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#0A4BFF]">Quote Builder</p>
                  <h2 className="text-lg font-extrabold text-slate-950">Báo giá sản phẩm</h2>
                </div>
                <button type="button" onClick={close} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-auto p-4">
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-slate-600">Sản phẩm báo giá</p>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-[#0A4BFF]">{lines.length}</span>
                  </div>
                  <div className="space-y-2">
                    {lines.map((line) => (
                      <div key={line.key} className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <div className="flex items-start gap-2">
                          <p className="min-w-0 flex-1 text-xs font-bold leading-5 text-slate-800">{line.product.title}</p>
                          <button
                            type="button"
                            aria-label={`Xóa ${line.product.title}`}
                            onClick={() => removeLine(line.key)}
                            className="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <label className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
                          Số lượng
                          <input
                            type="number"
                            min={1}
                            className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-right outline-none focus:border-[#0A4BFF]"
                            value={line.quantity}
                            onChange={(event) => updateQuantity(line.key, Number(event.target.value))}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </section>

                <label className="block text-sm font-semibold text-slate-700">
                  Công ty khách hàng
                  <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-[#0A4BFF]" value={customer.company} onChange={(event) => updateCustomer("company", event.target.value)} />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Địa chỉ
                  <textarea className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#0A4BFF]" value={customer.address} onChange={(event) => updateCustomer("address", event.target.value)} />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Người liên hệ
                  <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-[#0A4BFF]" value={customer.contact} onChange={(event) => updateCustomer("contact", event.target.value)} />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Số điện thoại
                  <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-[#0A4BFF]" value={customer.phone} onChange={(event) => updateCustomer("phone", event.target.value)} />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Email
                  <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-[#0A4BFF]" value={customer.email} onChange={(event) => updateCustomer("email", event.target.value)} />
                </label>
                <div className="grid grid-cols-1 gap-3 pt-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Hiệu lực
                    <input type="number" min={1} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-[#0A4BFF]" value={validDays} onChange={(event) => setValidDays(Math.max(1, Number(event.target.value) || 1))} />
                  </label>
                </div>

              </div>

              <div className="grid gap-3 border-t border-slate-100 bg-white p-4">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Chế độ in</p>
                  <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setPrintMode("color")}
                      aria-pressed={printMode === "color"}
                      className={`h-9 rounded-md text-sm font-bold transition ${
                        printMode === "color" ? "bg-white text-[#0A4BFF] shadow-sm" : "text-slate-600"
                      }`}
                    >
                      In màu
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintMode("grayscale")}
                      aria-pressed={printMode === "grayscale"}
                      className={`h-9 rounded-md text-sm font-bold transition ${
                        printMode === "grayscale" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
                      }`}
                    >
                      Đen trắng
                    </button>
                  </div>
                </div>
                <button type="button" onClick={printQuote} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0A4BFF] text-sm font-extrabold text-white hover:bg-blue-700">
                  <Printer size={17} />
                  In báo giá
                </button>
                <p className="text-center text-[11px] leading-4 text-slate-500">
                  Tắt “Đầu trang và chân trang” trong hộp thoại in để bỏ ngày, URL và số trang của trình duyệt.
                </p>
                <button type="button" onClick={downloadPdf} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-[#0A4BFF]">
                  <Download size={17} />
                  Tải PDF
                </button>
                <button type="button" onClick={downloadWord} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-[#0A4BFF]">
                  <FileText size={17} />
                  Tải Word
                </button>
                <a href={`mailto:lienhe@hpttech.vn?subject=${encodeURIComponent(`Yêu cầu tư vấn ${quoteId}`)}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-[#0A4BFF]">
                  <Mail size={17} />
                  Gửi yêu cầu tư vấn
                </a>
              </div>
            </aside>
          </div>
        </div>
      , document.body) : null}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const context = useContext(QuoteContext);
  if (!context) throw new Error("useQuote must be used inside QuoteProvider");
  return context;
}
