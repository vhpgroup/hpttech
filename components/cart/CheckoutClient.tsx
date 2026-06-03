"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { formatVND } from "@/lib/cart";

type CheckoutForm = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerArea: string;
  customerNote: string;
  paymentMethod: "cod" | "confirm_first";
};

const initialForm: CheckoutForm = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  customerArea: "",
  customerNote: "",
  paymentMethod: "cod",
};

export default function CheckoutClient() {
  const { clearCart, items, requiresPriceConfirmation, subtotal, totalLabel } = useCart();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ orderCode: string; totalLabel: string } | null>(null);

  const update = (key: keyof CheckoutForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Chưa tạo được đơn hàng.");
      setSuccess({ orderCode: payload.orderCode, totalLabel: payload.totalLabel });
      clearCart();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Chưa tạo được đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="subpage-main">
        <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto text-green-600" size={52} />
          <h1 className="mt-4 text-3xl font-bold text-slate-950">Đã tạo đơn hàng</h1>
          <p className="mt-3 text-slate-600">
            Mã đơn <strong className="text-slate-950">{success.orderCode}</strong>. HPT Tech sẽ liên hệ xác nhận giá, vận chuyển và thời gian giao hàng.
          </p>
          <p className="mt-2 text-sm text-slate-500">Tổng hiển thị: {success.totalLabel}</p>
          <Link className="mt-6 inline-flex rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800" href="/san-pham">
            Tiếp tục xem sản phẩm
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="subpage-main">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Checkout</p>
        <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">Thanh toán</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Đặt hàng COD hoặc gửi thông tin để HPT Tech liên hệ xác nhận. Phí vận chuyển/lắp đặt sẽ được báo sau.
        </p>
      </section>

      {items.length ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={submit}>
            <h2 className="text-lg font-semibold text-slate-950">Thông tin khách hàng</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Họ tên *
                <input className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-blue-600" value={form.customerName} onChange={(event) => update("customerName", event.target.value)} required />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Số điện thoại *
                <input className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-blue-600" value={form.customerPhone} onChange={(event) => update("customerPhone", event.target.value)} required />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-blue-600" type="email" value={form.customerEmail} onChange={(event) => update("customerEmail", event.target.value)} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Tỉnh/thành hoặc khu vực
                <input className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-blue-600" value={form.customerArea} onChange={(event) => update("customerArea", event.target.value)} />
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Địa chỉ giao hàng *
                <textarea className="mt-2 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-blue-600" value={form.customerAddress} onChange={(event) => update("customerAddress", event.target.value)} required />
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Ghi chú
                <textarea className="mt-2 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-blue-600" value={form.customerNote} onChange={(event) => update("customerNote", event.target.value)} />
              </label>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-950">Phương thức</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-4">
                  <input type="radio" name="paymentMethod" value="cod" checked={form.paymentMethod === "cod"} onChange={() => update("paymentMethod", "cod")} />
                  <span>
                    <strong className="block text-sm text-slate-950">COD</strong>
                    <small className="text-slate-500">Thanh toán khi nhận hàng.</small>
                  </span>
                </label>
                <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-4">
                  <input type="radio" name="paymentMethod" value="confirm_first" checked={form.paymentMethod === "confirm_first"} onChange={() => update("paymentMethod", "confirm_first")} />
                  <span>
                    <strong className="block text-sm text-slate-950">Liên hệ xác nhận</strong>
                    <small className="text-slate-500">Chốt giá, ship và VAT trước.</small>
                  </span>
                </label>
              </div>
            </div>

            {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}

            <button className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60" type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : null}
              Tạo đơn hàng
            </button>
          </form>

          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold text-slate-950">Đơn hàng</h2>
            <div className="mt-4 space-y-4">
              {items.map((item) => (
                <div key={item.key} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-md bg-slate-50">
                    <ShoppingCart size={20} className="text-slate-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">SL: {item.quantity}</p>
                    <p className="mt-1 text-sm font-semibold text-orange-600">{item.unitPrice ? formatVND(item.unitPrice * item.quantity) : "Cần xác nhận"}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Tạm tính sản phẩm có giá</span>
                <strong>{formatVND(subtotal)}</strong>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">Tổng hiển thị</span>
                <strong className="text-lg text-slate-950">{totalLabel}</strong>
              </div>
              {requiresPriceConfirmation ? <p className="mt-3 text-xs leading-5 text-slate-500">Một số sản phẩm cần xác nhận giá trước khi xử lý.</p> : null}
            </div>
          </aside>
        </div>
      ) : (
        <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <ShoppingCart className="mx-auto text-slate-300" size={44} />
          <h2 className="mt-4 text-xl font-semibold text-slate-950">Giỏ hàng đang trống</h2>
          <Link className="mt-5 inline-flex rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800" href="/san-pham">
            Xem sản phẩm
          </Link>
        </section>
      )}
    </main>
  );
}
