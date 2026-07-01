# HARNESS P2-1 (BẢN CHỐT) — RFQ → lưu Payload + đẩy lead lên Google Sheet

> Repo `vhpgroup/hpttech`. Tuân thủ AGENTS.md. **Một chiều**: web gửi báo giá → lưu Payload (archive) + **append 1 dòng vào Google Sheet** (sales quản lý ở đó). KHÔNG đồng bộ ngược. Giữ nguyên builder/PDF/Word/In.

## Sheet đích — ĐÃ DỰNG SẴN (không cần tạo lại)
- spreadsheetId: `1T1wy4eTrjMbn4SWPtNUoCan1TKHvWwxHbhLThqEXtuc` (file "Bảng giá sản phẩm - Hpttech.vn")
- Tab: **`Yêu cầu báo giá`**. Cột:
  `A STT (CÔNG THỨC tự sinh)` · `B Mã BG` · `C Ngày` · `D Trạng thái` · `E Người phụ trách` · `F Công ty` · `G MST` · `H Người liên hệ` · `I SĐT` · `J Email` · `K Sản phẩm (SL)` · `L Tổng (đã VAT)` · `M Ghi chú`
- Dropdown trạng thái (Mới/Đang tư vấn/Đã gửi báo giá/Đang giao hàng/Thành công/Thất bại), tô màu, filter, STT tự sinh, tab "Thống kê" → **đã thiết lập sẵn**.
- ⇒ **Route chỉ APPEND vào cột B:M (12 giá trị), KHÔNG ghi cột A** (STT là công thức ARRAYFORMULA).
- **Service account `GOOGLE_SERVICE_ACCOUNT_JSON` đã có quyền ghi file này** (price sync `prices:sync-gsheet` đang ghi vào đó) → dùng `lib/google-sheets.ts` luôn, không cần cấp quyền thêm.

## Definition of Done
```bash
npm run typecheck && npm run lint && npm run build
npm run payload -- generate:types   # vì thêm collection QuoteRequests
```

---

## TASK A — Collection `collections/QuoteRequests.ts` (Payload = bản lưu gốc)
```ts
import type { CollectionConfig } from "payload";

export const QuoteRequests: CollectionConfig = {
  slug: "quote-requests",
  labels: { singular: "Yêu cầu báo giá", plural: "Yêu cầu báo giá" },
  access: {
    create: ({ req }) => Boolean(req.user),   // tạo qua API dùng overrideAccess
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    defaultColumns: ["quoteId", "company", "phone", "status", "totalLabel", "createdAt"],
    group: "Bán hàng",
    useAsTitle: "quoteId",
  },
  fields: [
    { name: "quoteId", label: "Mã báo giá", type: "text", required: true, index: true },
    {
      name: "status", label: "Trạng thái", type: "select", defaultValue: "new",
      options: [
        { label: "Mới", value: "new" },
        { label: "Đang tư vấn", value: "consulting" },
        { label: "Đã gửi báo giá", value: "quoted" },
        { label: "Đang giao hàng", value: "shipping" },
        { label: "Thành công", value: "success" },
        { label: "Thất bại", value: "failed" },
      ],
    },
    { type: "row", fields: [
      { name: "company", label: "Công ty", type: "text", admin: { width: "50%" } },
      { name: "taxCode", label: "Mã số thuế (xuất VAT)", type: "text", admin: { width: "50%" } },
    ]},
    { type: "row", fields: [
      { name: "contact", label: "Người liên hệ", type: "text", admin: { width: "50%" } },
      { name: "phone", label: "Số điện thoại", type: "text", required: true, admin: { width: "50%" } },
    ]},
    { type: "row", fields: [
      { name: "email", label: "Email", type: "email", admin: { width: "50%" } },
      { name: "source", label: "Nguồn", type: "text", admin: { width: "50%", readOnly: true } },
    ]},
    { name: "address", label: "Địa chỉ", type: "textarea" },
    { name: "note", label: "Ghi chú yêu cầu", type: "textarea" },
    {
      name: "items", label: "Sản phẩm", type: "array", minRows: 1,
      fields: [
        { name: "title", label: "Tên sản phẩm", type: "text", required: true },
        { name: "sku", label: "Mã SP", type: "text" },
        { name: "quantity", label: "Số lượng", type: "number", required: true, min: 1 },
        { name: "priceLabel", label: "Đơn giá (hiển thị)", type: "text" },
      ],
    },
    { type: "row", fields: [
      { name: "subtotal", label: "Tạm tính", type: "number", admin: { width: "33%" } },
      { name: "vat", label: "VAT", type: "number", admin: { width: "33%" } },
      { name: "totalLabel", label: "Tổng (đã VAT)", type: "text", admin: { width: "33%" } },
    ]},
    { name: "internalNote", label: "Ghi chú nội bộ", type: "textarea" },
  ],
};
```
Đăng ký trong `payload.config.ts`: import `{ QuoteRequests }` và thêm vào mảng `collections: [...]` (cạnh `Orders`).
⚠️ Đổi schema → migrate DB **local** + `npm run payload -- generate:types` + commit `payload-types.ts`. KHÔNG đụng DB prod.
> Ghi chú: vì không đồng bộ ngược, `status` trong Payload giữ "Mới" (ảnh chụp lúc nhận). Trạng thái thật do sales quản trên Google Sheet.

---

## TASK B — `lib/google-sheets.ts`: cho append từ cột tùy ý
Sửa hàm `appendSpreadsheetValues` thêm tham số `anchorCell` (mặc định "A1", giữ tương thích cũ):
```ts
export async function appendSpreadsheetValues(
  spreadsheetId: string,
  title: string,
  values: string[][],
  anchorCell = "A1",   // MỚI: vd "B1" để chừa cột A cho công thức STT
) {
  if (!values.length) return;

  await googleSheetsFetch(
    `spreadsheets/${spreadsheetId}/values/${encodeURIComponent(title)}!${anchorCell}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      body: JSON.stringify({ majorDimension: "ROWS", values }),
      method: "POST",
    },
  );
}
```

---

## TASK C — `lib/quote-sheet.ts` (mới): append lead vào tab
```ts
import { appendSpreadsheetValues } from "@/lib/google-sheets";

const SHEET_ID = process.env.QUOTE_SHEET_ID;
const TAB = process.env.QUOTE_SHEET_TAB || "Yêu cầu báo giá";

export type QuoteLeadRow = {
  quoteId: string;
  dateLabel: string;     // dd/mm/yyyy (khớp cột Ngày + tab Thống kê)
  company: string;
  taxCode: string;
  contact: string;
  phone: string;
  email: string;
  productsLabel: string; // "Máy scan ... x2; Hộp mực ... x4"
  totalLabel: string;    // "78.540.000 đ" hoặc "Liên hệ"
  note: string;
};

// Append vào cột B:M (chừa cột A = STT tự sinh). Thứ tự B→M:
export async function appendQuoteToSheet(lead: QuoteLeadRow) {
  if (!SHEET_ID) return;
  const row = [
    lead.quoteId,        // B  Mã BG
    lead.dateLabel,      // C  Ngày
    "Mới",               // D  Trạng thái (mặc định)
    "",                  // E  Người phụ trách (sales tự gán trên Sheet)
    lead.company,        // F  Công ty
    lead.taxCode,        // G  MST
    lead.contact,        // H  Người liên hệ
    lead.phone,          // I  SĐT
    lead.email,          // J  Email
    lead.productsLabel,  // K  Sản phẩm (SL)
    lead.totalLabel,     // L  Tổng (đã VAT)
    lead.note,           // M  Ghi chú
  ];
  await appendSpreadsheetValues(SHEET_ID, TAB, [row], "B1");
}
```

---

## TASK D — Route `app/api/quotes/submit/route.ts` (mẫu theo /api/contact)
```ts
import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { appendQuoteToSheet } from "@/lib/quote-sheet";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip") || "local";
}
function isRateLimited(key: string) {
  const now = Date.now();
  for (const [k, e] of rateLimitStore.entries()) if (e.resetAt <= now) rateLimitStore.delete(k);
  const cur = rateLimitStore.get(key);
  if (!cur || cur.resetAt <= now) { rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }); return false; }
  cur.count += 1;
  return cur.count > RATE_LIMIT_MAX_REQUESTS;
}
function clean(v: unknown, max = 1000) { return String(v ?? "").trim().slice(0, max); }
function num(v: unknown) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function isLikelyPhone(v: string) { return /^[0-9+().\-\s]{8,24}$/.test(v); }

export async function POST(request: Request) {
  if (isRateLimited(clientKey(request)))
    return NextResponse.json({ ok: false, error: "Bạn gửi hơi nhanh. Vui lòng thử lại sau ít phút." }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  const c = body.customer ?? {};
  const lead = {
    quoteId: clean(body.quoteId, 40) || `BG-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`,
    dateLabel: clean(body.dateLabel, 20) || new Intl.DateTimeFormat("vi-VN").format(new Date()),
    company: clean(c.company, 200),
    taxCode: clean(c.taxCode, 40),
    contact: clean(c.contact, 120),
    phone: clean(c.phone, 40),
    email: clean(c.email, 160),
    address: clean(c.address, 400),
    note: clean(c.note, 1500),
    source: clean(body.source, 60) || "quote-builder",
  };
  const items = (Array.isArray(body.products) ? body.products : [])
    .map((p: Record<string, unknown>) => {
      const prod = (p?.product ?? {}) as Record<string, unknown>;
      return {
        title: clean(prod.title ?? p?.title, 300),
        sku: clean(prod.sku ?? p?.sku, 80),
        quantity: Math.max(1, Math.floor(num(p?.quantity)) || 1),
        priceLabel: clean(prod.price ?? p?.priceLabel, 60),
      };
    })
    .filter((i) => i.title);

  if (!lead.phone || !items.length)
    return NextResponse.json({ ok: false, error: "Cần ít nhất 1 sản phẩm và số điện thoại." }, { status: 400 });
  if (!isLikelyPhone(lead.phone))
    return NextResponse.json({ ok: false, error: "Số điện thoại chưa đúng định dạng." }, { status: 400 });

  const totals = (body.totals ?? {}) as Record<string, unknown>;
  const totalLabel = clean(totals.totalLabel, 60) || "Liên hệ";
  const productsLabel = items.map((i) => `${i.title} x${i.quantity}`).join("; ");

  // 1) LƯU Payload — bản lưu gốc (archive)
  try {
    const payload = await getPayloadClient();
    await payload.create({
      collection: "quote-requests",
      overrideAccess: true,
      data: {
        ...lead, items, totalLabel,
        subtotal: num(totals.subtotal), vat: num(totals.vat),
        status: "new",
      },
    });
  } catch (error) {
    console.error("quote-submit: lưu Payload lỗi", error);
    return NextResponse.json({ ok: false, error: "Không lưu được yêu cầu. Vui lòng thử lại." }, { status: 500 });
  }

  // 2) ĐẨY lên Google Sheet (fail mềm — lỗi Sheet KHÔNG chặn, lead đã lưu Payload)
  try {
    await appendQuoteToSheet({
      quoteId: lead.quoteId, dateLabel: lead.dateLabel, company: lead.company, taxCode: lead.taxCode,
      contact: lead.contact, phone: lead.phone, email: lead.email,
      productsLabel, totalLabel, note: lead.note,
    });
  } catch (error) {
    console.error("quote-submit: append Google Sheet lỗi (lead đã lưu Payload)", error);
  }

  // 3) (tùy chọn) ping webhook/Telegram cho sales nếu có cấu hình
  const webhookURL = process.env.CONTACT_WEBHOOK_URL;
  if (webhookURL) {
    try {
      await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(process.env.CONTACT_WEBHOOK_SECRET ? { "x-contact-secret": process.env.CONTACT_WEBHOOK_SECRET } : {}) },
        body: JSON.stringify({ type: "quote-request", ...lead, items, totalLabel, createdAt: new Date().toISOString() }),
        signal: AbortSignal.timeout(Number(process.env.CONTACT_WEBHOOK_TIMEOUT_MS) || 8000),
      });
    } catch (error) {
      console.error("quote-submit: webhook lỗi (bỏ qua)", error);
    }
  }

  return NextResponse.json({ ok: true, quoteId: lead.quoteId });
}
```

---

## TASK E — Sửa `components/quote/QuoteProvider.tsx`
**E1.** Type `QuoteCustomer` thêm 2 trường:
```ts
type QuoteCustomer = { company: string; address: string; contact: string; phone: string; email: string; taxCode: string; note: string; };
```
**E2.** `DEFAULT_CUSTOMER` để rỗng (bỏ dữ liệu mẫu "Công ty ABC"):
```ts
const DEFAULT_CUSTOMER: QuoteCustomer = { company: "", address: "", contact: "", phone: "", email: "", taxCode: "", note: "" };
```
**E3.** Trong `QuoteProvider`, thêm state + hàm gửi (đặt cạnh `fetchQuotePdf`):
```ts
const [submitState, setSubmitState] = useState<"idle" | "sending" | "sent" | "error">("idle");
const [submitError, setSubmitError] = useState("");

const submitQuote = async () => {
  const payload = quotePayload();
  if (!payload) return;
  setSubmitState("sending"); setSubmitError("");

  const sums = lines.reduce((s, l) => {
    const up = parseVNDPrice(l.product.price) || 0;
    const t = getVatInclusiveQuoteTotals(up, l.quantity);
    return { subtotal: s.subtotal + t.subtotal, vat: s.vat + t.vat, total: s.total + t.total };
  }, { subtotal: 0, vat: 0, total: 0 });

  try {
    const res = await fetch("/api/quotes/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        source: "quote-builder",
        totals: { subtotal: sums.subtotal, vat: sums.vat, totalLabel: sums.total ? moneyLabel(sums.total) : "Liên hệ" },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setSubmitState("error"); setSubmitError(data.error || "Không gửi được, vui lòng thử lại."); return; }
    setSubmitState("sent");
  } catch {
    setSubmitState("error"); setSubmitError("Không kết nối được hệ thống. Vui lòng thử lại hoặc gọi hotline.");
  }
};
```
> `quotePayload()` đã gồm `customer` (giờ có taxCode+note), `products`, `dateLabel`, `validDays`. `moneyLabel`, `parseVNDPrice`, `getVatInclusiveQuoteTotals` đã import sẵn.

**E4.** Thêm 2 ô nhập: sau ô "Công ty khách hàng" chèn ô **Mã số thuế (xuất VAT)** (`value={customer.taxCode}` `onChange→updateCustomer("taxCode",...)`); sau ô "Email" chèn textarea **Ghi chú yêu cầu** (`value={customer.note}` `onChange→updateCustomer("note",...)`). Dùng class giống các input hiện có.

**E5.** Thay khối `<a href={\`mailto:...\`}>` "Gửi yêu cầu tư vấn" bằng nút gửi + trạng thái (đặt làm nút chính, đầu cụm):
```tsx
<button type="button" onClick={submitQuote} disabled={submitState === "sending"}
  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0A4BFF] text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-60">
  <Mail size={17} />
  {submitState === "sending" ? "Đang gửi..." : "Gửi yêu cầu báo giá"}
</button>
{submitState === "sent" ? (
  <p className="rounded-lg bg-green-50 p-3 text-center text-sm font-semibold text-green-700">✓ Đã gửi yêu cầu! Bộ phận kinh doanh sẽ liên hệ sớm.</p>
) : null}
{submitState === "error" ? (
  <p className="rounded-lg bg-amber-50 p-3 text-center text-sm font-semibold text-amber-800">{submitError}</p>
) : null}
```
Giữ nguyên nút In/Tải PDF/Tải Word.

---

## ENV (khai báo trong Coolify)
- `QUOTE_SHEET_ID=1T1wy4eTrjMbn4SWPtNUoCan1TKHvWwxHbhLThqEXtuc`
- `QUOTE_SHEET_TAB=Yêu cầu báo giá` (mặc định đã đúng nếu bỏ trống)
- `GOOGLE_SERVICE_ACCOUNT_JSON` — **đã có** (dùng chung với sync giá). `CONTACT_WEBHOOK_URL` tùy chọn.

## Acceptance
- Gửi báo giá trên web → (a) có record trong **Admin → Bán hàng → Yêu cầu báo giá**; (b) có **1 dòng mới trong tab "Yêu cầu báo giá"** của Google Sheet (Mã BG, ngày, trạng thái "Mới", sản phẩm, tổng đã VAT…), **STT tự lên số**, cột Người phụ trách trống; (c) tab "Thống kê" tự cộng thêm.
- Lỗi Sheet/webhook KHÔNG làm hỏng việc gửi (lead vẫn lưu Payload).
- PDF/Word/In vẫn chạy; không còn dữ liệu khách mẫu.
- `typecheck` + `lint` + `build` sạch; `payload-types.ts` đã regenerate + commit.

## Prompt dán cho Codex
> "Tuân thủ AGENTS.md. Làm P2-1: (A) tạo collection `collections/QuoteRequests.ts` + đăng ký payload.config.ts; (B) thêm tham số `anchorCell` cho `appendSpreadsheetValues` trong `lib/google-sheets.ts`; (C) tạo `lib/quote-sheet.ts` append lead vào tab 'Yêu cầu báo giá' cột B:M (anchor B1, chừa cột A STT); (D) tạo `app/api/quotes/submit/route.ts` lưu Payload (overrideAccess) + appendQuoteToSheet (fail mềm) + webhook tùy chọn, rate-limit như /api/contact; (E) sửa `components/quote/QuoteProvider.tsx`: thêm taxCode+note vào QuoteCustomer, làm rỗng DEFAULT_CUSTOMER, thêm submitQuote() POST /api/quotes/submit, thêm 2 ô nhập, thay nút mailto thành 'Gửi yêu cầu báo giá' + trạng thái. Đổi schema → migrate DB local + generate:types + commit payload-types.ts. KHÔNG đụng DB prod. Chạy typecheck+lint+build."