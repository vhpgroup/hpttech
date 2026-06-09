"use client";

import Image from "next/image";
import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Download, FileText, Mail, MapPin, Phone, Printer, X } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { formatVND, parseVNDPrice } from "@/lib/cart";

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

function featuredSpecs(product: CatalogProduct) {
  const preferred = ["Tốc độ", "ADF", "Độ phân giải", "Khổ giấy", "Kết nối", "Hỗ trợ", "Bảo hành"];
  const specs = product.specs || [];
  const selected: Array<{ label: string; value: string }> = [];

  for (const keyword of preferred) {
    const match = specs.find((spec) => spec.label.toLowerCase().includes(keyword.toLowerCase()));
    if (match && !selected.some((item) => item.label === match.label)) selected.push(match);
  }

  for (const spec of specs) {
    if (selected.length >= 7) break;
    if (!selected.some((item) => item.label === spec.label)) selected.push(spec);
  }

  return selected.slice(0, 7);
}

function moneyLabel(value: number) {
  return formatVND(value).replace(/\s₫$/, " đ");
}

function QuoteDocument({
  customer,
  includeVat,
  product,
  quantity,
  quoteId,
  validDays,
}: {
  customer: QuoteCustomer;
  includeVat: boolean;
  product: CatalogProduct;
  quantity: number;
  quoteId: string;
  validDays: number;
}) {
  const unitPrice = parseVNDPrice(product.price) || 0;
  const subtotal = unitPrice * quantity;
  const vat = includeVat ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + vat;
  const image = productImage(product);
  const specs = featuredSpecs(product);

  return (
    <article className="quote-document w-[794px] max-w-full bg-white p-6 text-slate-950 print:w-full print:p-0 lg:p-7">
      <header className="grid gap-5 border-b-4 border-[#0A4BFF] pb-5 md:grid-cols-[190px_1fr]">
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

      <section className="grid gap-6 py-6 md:grid-cols-[1fr_240px]">
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

      <section className="grid gap-5 rounded-xl border border-blue-200 p-5 text-sm md:grid-cols-2">
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
            <col className="w-[125px]" />
            <col />
            <col className="w-[90px]" />
            <col className="w-[122px]" />
            <col className="w-[132px]" />
          </colgroup>
          <thead>
            <tr className="bg-[#0A4BFF] text-center text-xs font-extrabold uppercase text-white">
              <th className="border border-[#0A4BFF] px-2 py-3">STT</th>
              <th className="border border-[#0A4BFF] px-2 py-3">Hình ảnh</th>
              <th className="border border-[#0A4BFF] px-3 py-3">Sản phẩm</th>
              <th className="border border-[#0A4BFF] px-2 py-3">Số lượng</th>
              <th className="border border-[#0A4BFF] px-2 py-3">Đơn giá</th>
              <th className="border border-[#0A4BFF] px-2 py-3">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr className="align-middle">
              <td className="border border-blue-200 px-2 py-4 text-center font-semibold">1</td>
              <td className="border border-blue-200 px-3 py-4 text-center">
                <div className="grid h-32 place-items-center bg-slate-50">
                  {image ? <Image src={image} alt={product.title} width={112} height={112} className="max-h-28 w-auto object-contain" /> : null}
                </div>
              </td>
              <td className="border border-blue-200 px-4 py-4">
                <h3 className="m-0 text-[15px] font-extrabold leading-6 text-slate-950">{product.title}</h3>
                {product.detail ? <p className="mt-1 text-[13px] font-semibold leading-5 text-[#0A4BFF]">{product.detail}</p> : null}
                <ul className="mt-2 list-disc space-y-0.5 pl-5">
                  {specs.map((spec) => (
                    <li key={`${spec.label}-${spec.value}`}>
                      <strong>{spec.label}:</strong> {spec.value}
                    </li>
                  ))}
                  {product.warranty ? <li><strong>Bảo hành:</strong> {product.warranty}</li> : null}
                </ul>
              </td>
              <td className="border border-blue-200 px-2 py-4 text-center font-semibold">{quantity}</td>
              <td className="border border-blue-200 px-2 py-4 text-right font-extrabold text-red-600">{unitPrice ? moneyLabel(unitPrice) : "Liên hệ"}</td>
              <td className="border border-blue-200 px-2 py-4 text-right font-extrabold text-red-600">{unitPrice ? moneyLabel(subtotal) : "Liên hệ"}</td>
            </tr>
          </tbody>
          <tfoot className="text-[13px]">
            <tr className="bg-slate-100">
              <td colSpan={5} className="border border-blue-200 px-3 py-2 text-right font-bold">Tạm tính:</td>
              <td className="border border-blue-200 px-2 py-2 text-right font-extrabold">{unitPrice ? moneyLabel(subtotal) : "Liên hệ"}</td>
            </tr>
            <tr className="bg-slate-100">
              <td colSpan={5} className="border border-blue-200 px-3 py-2 text-right font-bold">Thuế VAT (10%):</td>
              <td className="border border-blue-200 px-2 py-2 text-right font-extrabold">{includeVat && unitPrice ? moneyLabel(vat) : "0 đ"}</td>
            </tr>
            <tr className="bg-slate-100 text-base">
              <td colSpan={5} className="border border-blue-200 px-3 py-3 text-right font-black uppercase text-[#0A4BFF]">Tổng cộng:</td>
              <td className="border border-blue-200 px-2 py-3 text-right font-black text-[#0A4BFF]">{unitPrice ? moneyLabel(total) : "Liên hệ"}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="mt-6 grid gap-6 rounded-xl border border-blue-200 p-5 text-sm md:grid-cols-3">
        <div>
          <h3 className="mb-3 font-extrabold uppercase text-[#0A4BFF]">Điều khoản thương mại</h3>
          <ul className="space-y-2">
            <li>✓ Giá trên {includeVat ? "đã gồm VAT" : "chưa gồm VAT"}</li>
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
    </article>
  );
}

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [customer, setCustomer] = useState(DEFAULT_CUSTOMER);
  const [quantity, setQuantity] = useState(1);
  const [includeVat, setIncludeVat] = useState(true);
  const [validDays, setValidDays] = useState(10);
  const [quoteId, setQuoteId] = useState(quoteCode);
  const quoteRef = useRef<HTMLDivElement>(null);

  const value = useMemo<QuoteContextValue>(() => ({
    openQuote: (nextProduct) => {
      setProduct(nextProduct);
      setQuantity(1);
      setIncludeVat(true);
      setValidDays(10);
      setQuoteId(quoteCode());
    },
  }), []);

  const updateCustomer = (key: keyof QuoteCustomer, nextValue: string) => {
    setCustomer((current) => ({ ...current, [key]: nextValue }));
  };

  const close = () => setProduct(null);

  const quotePayload = () => {
    if (!product) return null;

    return {
      quoteId,
      dateLabel: todayLabel(),
      validDays,
      quantity,
      includeVat,
      customer,
      product: {
        title: product.title,
        detail: product.detail,
        image: productImage(product),
        price: product.price,
        warranty: product.warranty,
        specs: featuredSpecs(product),
      },
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

  const printQuote = async () => {
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;

    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${quoteId}</title>
          <style>
            html,body{height:100%;margin:0;background:#111827;color:white;font-family:Arial,sans-serif}
            .loading{height:100%;display:grid;place-items:center;font-size:14px}
          </style>
        </head>
        <body><div class="loading">Đang render báo giá...</div></body>
      </html>
    `);
    win.document.close();

    const blob = await fetchQuotePdf();
    if (!blob) {
      win.document.body.innerHTML = '<div class="loading">Không render được PDF báo giá.</div>';
      return;
    }

    const url = URL.createObjectURL(blob);
    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${quoteId}</title>
          <style>
            html,body{height:100%;margin:0;background:#111827}
            iframe{width:100%;height:100%;border:0;background:white}
          </style>
        </head>
        <body>
          <iframe src="${url}" onload="setTimeout(() => { this.contentWindow.focus(); this.contentWindow.print(); }, 600)"></iframe>
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

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
      {product ? (
        <div className="quote-modal-shell fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm print:static print:block print:bg-white print:p-0 sm:p-6">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }

              .quote-document,
              .quote-document * {
                visibility: visible !important;
              }

              .quote-document {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                box-shadow: none !important;
              }
            }
          `}</style>
          <div className="flex h-[min(820px,calc(100vh-48px))] w-full max-w-[1220px] overflow-hidden rounded-2xl bg-slate-100 shadow-2xl print:block print:h-auto print:max-w-none print:overflow-visible print:rounded-none print:bg-white print:shadow-none">
            <div className="flex-1 overflow-auto p-3 print:overflow-visible print:p-0 sm:p-4">
              <div ref={quoteRef} className="mx-auto w-fit max-w-full bg-white shadow-sm print:w-full print:max-w-none print:shadow-none">
                <QuoteDocument
                  customer={customer}
                  includeVat={includeVat}
                  product={product}
                  quantity={quantity}
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
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Số lượng
                    <input type="number" min={1} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-[#0A4BFF]" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Hiệu lực
                    <input type="number" min={1} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-[#0A4BFF]" value={validDays} onChange={(event) => setValidDays(Math.max(1, Number(event.target.value) || 1))} />
                  </label>
                </div>

                <label className="flex items-center gap-2 pt-1 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={includeVat} onChange={(event) => setIncludeVat(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#0A4BFF]" />
                  Tính VAT 10%
                </label>
              </div>

              <div className="grid gap-3 border-t border-slate-100 bg-white p-4">
                <button type="button" onClick={printQuote} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0A4BFF] text-sm font-extrabold text-white hover:bg-blue-700">
                  <Printer size={17} />
                  In báo giá
                </button>
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
      ) : null}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const context = useContext(QuoteContext);
  if (!context) throw new Error("useQuote must be used inside QuoteProvider");
  return context;
}
