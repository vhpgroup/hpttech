import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { formatVND, getCartSummary, normalizeCartItem, parseVNDPrice, type CartItem } from "@/lib/cart";

const MAX_ITEMS = 50;

type OrderRequest = {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerArea?: string;
  customerNote?: string;
  paymentMethod?: "cod" | "confirm_first";
  items?: Array<Partial<CartItem>>;
};

function clean(value: unknown, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanOptional(value: unknown, maxLength = 500) {
  const text = clean(value, maxLength);
  return text || undefined;
}

function isValidPhone(value: string) {
  return /^(0|\+84)[0-9]{8,10}$/.test(value.replace(/\s+/g, ""));
}

function orderCode() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `HPT-${date}-${suffix}`;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as OrderRequest;
  const customerName = clean(body.customerName, 120);
  const customerPhone = clean(body.customerPhone, 40);
  const customerEmail = cleanOptional(body.customerEmail, 160);
  const customerAddress = clean(body.customerAddress, 500);
  const customerArea = cleanOptional(body.customerArea, 120);
  const customerNote = cleanOptional(body.customerNote, 1000);
  const paymentMethod = body.paymentMethod === "confirm_first" ? "confirm_first" : "cod";

  if (!customerName) {
    return NextResponse.json({ error: "Vui lòng nhập họ tên." }, { status: 400 });
  }

  if (!customerPhone || !isValidPhone(customerPhone)) {
    return NextResponse.json({ error: "Số điện thoại không hợp lệ." }, { status: 400 });
  }

  if (!customerAddress) {
    return NextResponse.json({ error: "Vui lòng nhập địa chỉ giao hàng." }, { status: 400 });
  }

  const items = Array.isArray(body.items)
    ? body.items.slice(0, MAX_ITEMS).map(normalizeCartItem).filter((item): item is CartItem => Boolean(item))
    : [];

  if (!items.length) {
    return NextResponse.json({ error: "Giỏ hàng đang trống." }, { status: 400 });
  }

  const orderItems = items.map((item) => {
    const unitPrice = parseVNDPrice(item.priceLabel) ?? item.unitPrice;
    const quantity = Math.max(1, Math.floor(item.quantity));
    const requiresPriceConfirmation = item.requiresPriceConfirmation || !unitPrice;
    return {
      product: item.productId ? String(item.productId) : undefined,
      slug: item.slug,
      href: item.href,
      title: clean(item.title, 200),
      brand: cleanOptional(item.brand, 120),
      category: cleanOptional(item.category, 120),
      image: cleanOptional(item.image, 500),
      priceLabel: item.priceLabel || (unitPrice ? formatVND(unitPrice) : "Liên hệ"),
      unitPrice,
      quantity,
      lineTotal: unitPrice ? unitPrice * quantity : undefined,
      requiresPriceConfirmation,
    };
  });

  const summary = getCartSummary(
    orderItems.map((item) => ({
      key: item.slug || item.href || item.title,
      title: item.title,
      quantity: item.quantity,
      priceLabel: item.priceLabel,
      unitPrice: item.unitPrice,
      requiresPriceConfirmation: item.requiresPriceConfirmation,
    })),
  );

  try {
    const payload = await getPayloadClient();
    const order = await payload.create({
      collection: "orders",
      data: {
        orderCode: orderCode(),
        status: "new",
        customerName,
        customerPhone,
        customerEmail,
        customerArea,
        customerAddress,
        customerNote,
        paymentMethod,
        shippingFeeStatus: "pending_confirmation",
        items: orderItems,
        subtotal: summary.subtotal,
        totalLabel: summary.totalLabel,
        requiresPriceConfirmation: summary.requiresPriceConfirmation,
      },
      overrideAccess: true,
    });

    return NextResponse.json({
      orderCode: order.orderCode,
      totalLabel: order.totalLabel,
      requiresPriceConfirmation: order.requiresPriceConfirmation,
    });
  } catch (error) {
    console.error("Failed to create order", error);
    return NextResponse.json(
      { error: "Chưa tạo được đơn hàng. Vui lòng thử lại hoặc liên hệ hotline." },
      { status: 500 },
    );
  }
}
