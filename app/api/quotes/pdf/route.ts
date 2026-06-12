import { NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";
import { getVatInclusiveQuoteTotals } from "@/lib/quote-totals";

type QuoteProduct = {
  title?: string;
  detail?: string;
  image?: string;
  price?: string;
  warranty?: string;
  specs?: Array<{ label?: string; value?: string }>;
};

type QuoteRequest = {
  quoteId?: string;
  dateLabel?: string;
  validDays?: number;
  quantity?: number;
  includeVat?: boolean;
  customer?: {
    company?: string;
    address?: string;
    contact?: string;
    phone?: string;
    email?: string;
  };
  product?: QuoteProduct;
  products?: Array<{
    quantity?: number;
    product?: QuoteProduct;
  }>;
};

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
  consultantEmail: "bach.pv@hpttech.vn",
};

function escapeHTML(value: unknown) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseVND(value?: string) {
  const digits = value?.replace(/[^\d]/g, "") || "";
  return digits ? Number(digits) : 0;
}

function money(value: number) {
  return value ? `${value.toLocaleString("vi-VN")} đ` : "Liên hệ";
}

function todayLabel() {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

function absoluteImageUrl(image: string | undefined, origin: string) {
  if (!image) return "";
  try {
    return new URL(image, origin).toString();
  } catch {
    return "";
  }
}

function quoteHTML(data: QuoteRequest, origin: string) {
  const customer = data.customer || {};
  const includeVat = data.includeVat !== false;
  const validDays = Math.max(1, Math.floor(Number(data.validDays) || 10));
  const requestedProducts = data.products?.length
    ? data.products
    : [{ quantity: data.quantity, product: data.product }];
  const products = requestedProducts.map((line, index) => {
    const product = line.product || {};
    const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1));
    const unitPrice = parseVND(product.price);
    return {
      index,
      product,
      quantity,
      unitPrice,
      totals: getVatInclusiveQuoteTotals(unitPrice, quantity),
      image: absoluteImageUrl(product.image, origin),
      specs: (product.specs || []).filter((spec) => spec.label && spec.value),
    };
  });
  const hasImages = products.some((line) => Boolean(line.image));
  const totals = products.reduce(
    (sum, line) => ({
      subtotal: sum.subtotal + line.totals.subtotal,
      vat: sum.vat + line.totals.vat,
      total: sum.total + line.totals.total,
    }),
    { subtotal: 0, vat: 0, total: 0 },
  );
  const logo = new URL("/assets/logo/hptlogo.png", origin).toString();
  const summaryColSpan = hasImages ? 5 : 4;
  const productRows = products
    .map(
      ({ image, index, product, quantity, specs, totals: lineTotals, unitPrice }) => `
            <tr class="product-row">
              <td class="stt-col">${index + 1}</td>
              ${hasImages ? `<td class="image-col"><div class="image-box">${image ? `<img src="${escapeHTML(image)}" />` : ""}</div></td>` : ""}
              <td>
                <p class="product-title">${escapeHTML(product.title || "Sản phẩm")}</p>
                ${product.detail ? `<p class="detail">${escapeHTML(product.detail)}</p>` : ""}
                <ul>
                  ${specs.map((spec) => `<li><strong>${escapeHTML(spec.label)}:</strong> ${escapeHTML(spec.value)}</li>`).join("")}
                  ${product.warranty ? `<li><strong>Bảo hành:</strong> ${escapeHTML(product.warranty)}</li>` : ""}
                </ul>
              </td>
              <td class="qty-col">${quantity}</td>
              <td class="price-col red">${unitPrice ? money(unitPrice) : "Liên hệ"}</td>
              <td class="total-col red">${unitPrice ? money(lineTotals.total) : "Liên hệ"}</td>
            </tr>`,
    )
    .join("");

  return `<!doctype html>
  <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <style>
        @page { size: A4; margin: 9mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: Arial, "DejaVu Sans", sans-serif;
          color: #0f172a;
          background: #fff;
          font-size: 12px;
          line-height: 1.45;
        }
        .page { width: 100%; }
        .header {
          display: grid;
          grid-template-columns: 165px 1fr;
          gap: 26px;
          padding-bottom: 18px;
          border-bottom: 4px solid #0A4BFF;
        }
        .logo-image { width: 155px; height: auto; object-fit: contain; display: block; }
        .company { font-size: 15px; line-height: 1.25; font-weight: 900; text-transform: uppercase; margin: 0 0 10px; white-space: nowrap; letter-spacing: -0.1px; }
        .muted { color: #475569; }
        .company-lines { display: flex; gap: 24px; flex-wrap: wrap; margin-top: 8px; }
        .title-row { display: grid; grid-template-columns: 1fr 230px; gap: 20px; padding: 30px 0 22px; align-items: start; }
        h1 { margin: 0; text-align: center; color: #0A4BFF; font-size: 42px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
        .title-rule { width: 190px; height: 2px; background: #94b7ff; margin: 10px auto 0; }
        .quote-meta { font-size: 13px; line-height: 1.9; }
        .customer {
          display: grid;
          grid-template-columns: 1.25fr .9fr;
          gap: 24px;
          border: 1px solid #b8cdfd;
          border-radius: 9px;
          padding: 16px 20px;
          margin-bottom: 22px;
        }
        .customer p { margin: 0 0 12px; }
        .quote-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #b8cdfd; }
        .quote-table th { background: #0A4BFF; color: #fff; font-size: 11px; font-weight: 900; padding: 10px 6px; text-align: center; text-transform: uppercase; border: 1px solid #0A4BFF; }
        .quote-table td { border: 1px solid #b8cdfd; padding: 10px 8px; vertical-align: middle; }
        .stt-col { width: 42px; text-align: center; }
        .image-col { width: 108px; text-align: center; }
        .qty-col { width: 82px; text-align: center; }
        .price-col { width: 116px; text-align: right; }
        .total-col { width: 126px; text-align: right; }
        .image-box { height: 92px; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
        .image-box img { max-width: 88px; max-height: 82px; object-fit: contain; }
        .product-title { font-size: 14px; line-height: 1.35; font-weight: 900; margin: 0 0 5px; }
        .detail { color: #0A4BFF; font-weight: 700; margin: 0 0 7px; line-height: 1.35; }
        ul { margin: 0; padding-left: 18px; }
        li { margin: 2px 0; line-height: 1.35; }
        .red { color: #ff0000; font-weight: 900; }
        .summary-row td { background: #f1f5f9; font-weight: 800; padding: 8px; }
        .summary-label { text-align: right; }
        .grand-total td { color: #0A4BFF; font-size: 16px; font-weight: 900; text-transform: uppercase; }
        .footer-box {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 18px;
          border: 1px solid #b8cdfd;
          border-radius: 8px;
          padding: 18px;
          margin-top: 22px;
        }
        .footer-box h3 { color: #0A4BFF; font-size: 15px; margin: 0 0 10px; text-transform: uppercase; }
        .thanks { margin-top: 24px; text-align: center; color: #0A4BFF; font-weight: 900; font-size: 18px; font-style: italic; }
        .product-row { break-inside: avoid; page-break-inside: avoid; }
        .footer-box { break-inside: avoid; page-break-inside: avoid; }
      </style>
    </head>
    <body>
      <main class="page">
        <section class="header">
          <div>
            <img class="logo-image" src="${escapeHTML(logo)}" alt="HPT Technology" />
          </div>
          <div>
            <h2 class="company">${escapeHTML(HPT_INFO.company)}</h2>
            <div class="muted">📍 ${escapeHTML(HPT_INFO.address)}</div>
            <div class="company-lines">
              <span>☎ ${escapeHTML(HPT_INFO.phone)}</span>
              <span>🌐 ${escapeHTML(HPT_INFO.website)}</span>
              <span>MST: ${escapeHTML(HPT_INFO.taxCode)}</span>
            </div>
          </div>
        </section>

        <section class="title-row">
          <div>
            <h1>Báo giá sản phẩm</h1>
            <div class="title-rule"></div>
          </div>
          <div class="quote-meta">
            <div>Mã báo giá: <strong>${escapeHTML(data.quoteId || "BG")}</strong></div>
            <div>Ngày báo giá: <strong>${escapeHTML(data.dateLabel || todayLabel())}</strong></div>
            <div>Hiệu lực: <strong>${validDays} ngày</strong></div>
          </div>
        </section>

        <section class="customer">
          <div>
            <p><strong>Kính gửi:</strong> ${escapeHTML(customer.company || "Quý khách hàng")}</p>
            <p><strong>Địa chỉ:</strong> ${escapeHTML(customer.address || "Đang cập nhật")}</p>
            <p><strong>Người liên hệ:</strong> ${escapeHTML(customer.contact || "Đang cập nhật")}</p>
          </div>
          <div>
            <p><strong>Số điện thoại:</strong> ${escapeHTML(customer.phone || "Đang cập nhật")}</p>
            <p><strong>Email:</strong> ${escapeHTML(customer.email || "Đang cập nhật")}</p>
          </div>
        </section>

        <table class="quote-table">
          <colgroup>
            <col class="stt-col" />
            ${hasImages ? '<col class="image-col" />' : ""}
            <col />
            <col class="qty-col" />
            <col class="price-col" />
            <col class="total-col" />
          </colgroup>
          <thead>
            <tr>
              <th>STT</th>
              ${hasImages ? "<th>Hình ảnh</th>" : ""}
              <th>Sản phẩm</th>
              <th>Số lượng</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
          <tfoot>
            <tr class="summary-row"><td colspan="${summaryColSpan}" class="summary-label">Tạm tính (chưa VAT):</td><td class="total-col">${totals.total ? money(totals.subtotal) : "Liên hệ"}</td></tr>
            <tr class="summary-row"><td colspan="${summaryColSpan}" class="summary-label">Thuế VAT (10%):</td><td class="total-col">${includeVat && totals.total ? money(totals.vat) : "0 đ"}</td></tr>
            <tr class="summary-row grand-total"><td colspan="${summaryColSpan}" class="summary-label">Tổng cộng:</td><td class="total-col">${totals.total ? money(totals.total) : "Liên hệ"}</td></tr>
          </tfoot>
        </table>

        <section class="footer-box">
          <div>
            <h3>Điều khoản thương mại</h3>
            <ul>
              <li>Giá trên ${includeVat ? "đã gồm VAT" : "chưa gồm VAT"}</li>
              <li>Hàng hóa chính hãng 100%</li>
              <li>Bảo hành theo tiêu chuẩn hãng</li>
              <li>Báo giá có hiệu lực trong ${validDays} ngày</li>
            </ul>
          </div>
          <div>
            <h3>Thông tin thanh toán</h3>
            <p><strong>Chủ tài khoản:</strong><br/>${escapeHTML(HPT_INFO.bankOwner)}</p>
            <p><strong>Số tài khoản:</strong> ${escapeHTML(HPT_INFO.bankAccount)}</p>
            <p><strong>Ngân hàng:</strong> ${escapeHTML(HPT_INFO.bankName)}</p>
          </div>
          <div>
            <h3>Hỗ trợ mua hàng nhanh</h3>
            <p><strong>${escapeHTML(HPT_INFO.consultant)}</strong></p>
            <p>${escapeHTML(HPT_INFO.phone)}</p>
            <p>${escapeHTML(HPT_INFO.consultantEmail)}</p>
          </div>
        </section>

        <p class="thanks">HPT Tech trân trọng cảm ơn Quý khách hàng!</p>
      </main>
    </body>
  </html>`;
}

async function chromiumExecutablePath() {
  const localCandidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  if (process.platform === "win32") {
    const localPath = localCandidates.find((candidate) => existsSync(candidate));
    if (localPath) return localPath;
  }

  const serverlessPath = await chromium.executablePath().catch(() => "");
  if (serverlessPath && existsSync(serverlessPath)) return serverlessPath;

  return localCandidates.find((candidate) => existsSync(candidate)) || serverlessPath;
}

export async function POST(request: Request) {
  const data = (await request.json().catch(() => ({}))) as QuoteRequest;
  const origin = new URL(request.url).origin;

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: await chromiumExecutablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(quoteHTML(data, origin), { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "9mm", right: "9mm", bottom: "9mm", left: "9mm" },
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${escapeHTML(data.quoteId || "bao-gia")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to render quote PDF", error);
    return NextResponse.json({ error: "Không render được PDF báo giá." }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
