import { getPayload } from "payload";
import config from "@/payload.config";

type AdminCollectionSlug =
  | "products"
  | "product-variants"
  | "product-offers"
  | "product-inventory"
  | "posts"
  | "orders";

type PayloadClient = Awaited<ReturnType<typeof getPayload>>;

function icon(children: React.ReactNode) {
  return (
    <svg aria-hidden="true" fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="22">
      {children}
    </svg>
  );
}

const icons = {
  box: icon(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /></>),
  cart: icon(<><circle cx="9" cy="20" r="1" /><circle cx="19" cy="20" r="1" /><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6" /></>),
  file: icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>),
  layers: icon(<><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>),
  package: icon(<><path d="M16.5 9.4 7.5 4.2" /><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="M3.3 7 12 12l8.7-5" /><path d="M12 22V12" /></>),
  plus: icon(<><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></>),
  upload: icon(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></>),
  warehouse: icon(<><path d="M3 21V8l9-5 9 5v13" /><path d="M3 10h18" /><path d="M8 21v-7h8v7" /></>),
};

async function safeCount(payload: PayloadClient, collection: AdminCollectionSlug) {
  try {
    const result = await payload.count({ collection });
    return result.totalDocs ?? 0;
  } catch {
    return 0;
  }
}

async function getStats(payload: PayloadClient) {
  const [products, variants, offers, inventory, posts, orders] = await Promise.all([
    safeCount(payload, "products"),
    safeCount(payload, "product-variants"),
    safeCount(payload, "product-offers"),
    safeCount(payload, "product-inventory"),
    safeCount(payload, "posts"),
    safeCount(payload, "orders"),
  ]);
  return { inventory, offers, orders, posts, products, variants };
}

async function getRecentProducts(payload: PayloadClient) {
  try {
    const result = await payload.find({ collection: "products", depth: 1, limit: 6, sort: "-updatedAt" });
    return result.docs;
  } catch {
    return [];
  }
}

function relationLabel(value: unknown) {
  if (!value) return "Chưa phân loại";
  if (typeof value === "object" && "name" in value && typeof value.name === "string") return value.name;
  if (typeof value === "object" && "code" in value && typeof value.code === "string") return value.code;
  return String(value);
}

export default async function Dashboard() {
  const payload = await getPayload({ config });
  const [stats, recentProducts] = await Promise.all([getStats(payload), getRecentProducts(payload)]);

  const statCards = [
    { color: "indigo", href: "/admin/collections/products", icon: icons.box, label: "Sản phẩm", value: stats.products },
    { color: "cyan", href: "/admin/collections/product-variants", icon: icons.layers, label: "SKU / Variant", value: stats.variants },
    { color: "emerald", href: "/admin/collections/product-offers", icon: icons.cart, label: "Bảng giá", value: stats.offers },
    { color: "amber", href: "/admin/collections/product-inventory", icon: icons.warehouse, label: "Bản ghi tồn kho", value: stats.inventory },
    { color: "pink", href: "/admin/collections/posts", icon: icons.file, label: "Bài viết", value: stats.posts },
    { color: "violet", href: "/admin/collections/orders", icon: icons.package, label: "Đơn hàng", value: stats.orders },
  ];

  const quickActions = [
    { href: "/admin/collections/products/create", icon: icons.plus, label: "Thêm sản phẩm", note: "Tạo catalog mới" },
    { href: "/admin/collections/product-variants/create", icon: icons.layers, label: "Thêm SKU", note: "Tạo phiên bản bán" },
    { href: "/admin/product-import-export", icon: icons.upload, label: "Import / Export", note: "Xử lý hàng loạt" },
    { href: "/admin/collections/product-offers", icon: icons.cart, label: "Cập nhật giá", note: "Giá, VAT, khuyến mãi" },
  ];

  return (
    <main className="hpt-dashboard">
      <header className="hpt-page-heading hpt-dashboard-heading">
        <div>
          <nav aria-label="Breadcrumb"><span>HPT Tech</span><span>/</span><span>Dashboard</span></nav>
          <h1>Dashboard</h1>
          <p>Theo dõi và quản lý catalog, tồn kho, đơn hàng và nội dung website.</p>
        </div>
        <div className="hpt-dashboard-heading__actions">
          <a className="hpt-tail-button hpt-tail-button--secondary" href="/admin/product-import-export">{icons.upload} Import dữ liệu</a>
          <a className="hpt-tail-button hpt-tail-button--primary" href="/admin/collections/products/create">{icons.plus} Thêm sản phẩm</a>
        </div>
      </header>

      <section className="hpt-dashboard-stats" aria-label="Tổng quan dữ liệu">
        {statCards.map((card) => (
          <a className={`hpt-dashboard-stat hpt-dashboard-stat--${card.color}`} href={card.href} key={card.label}>
            <span className="hpt-dashboard-stat__icon">{card.icon}</span>
            <strong>{card.value}</strong>
            <span>{card.label}</span>
            <i aria-hidden="true">↗</i>
          </a>
        ))}
      </section>

      <section className="hpt-dashboard-main-grid">
        <article className="hpt-tail-card hpt-dashboard-recent">
          <div className="hpt-tail-card__head">
            <div>
              <div><h2>Sản phẩm cập nhật gần đây</h2><p>Danh sách 6 sản phẩm được chỉnh sửa mới nhất.</p></div>
            </div>
            <a href="/admin/collections/products">Xem tất cả →</a>
          </div>
          <div className="hpt-dashboard-recent__list">
            {recentProducts.length ? recentProducts.map((product) => {
              const published = product.status === "published";
              return (
                <a href={`/admin/collections/products/${product.id}`} key={product.id}>
                  <span className="hpt-dashboard-recent__avatar">{String(product.title || "SP").slice(0, 2).toUpperCase()}</span>
                  <span className="hpt-dashboard-recent__main">
                    <strong>{product.title}</strong>
                    <small>{relationLabel(product.brand)} · {product.model || "Chưa có model"}</small>
                  </span>
                  <span className={`hpt-dashboard-status ${published ? "is-published" : "is-draft"}`}>
                    {published ? "Đã xuất bản" : "Bản nháp"}
                  </span>
                </a>
              );
            }) : (
              <div className="hpt-dashboard-empty">{icons.box}<strong>Chưa có sản phẩm</strong><span>Tạo Product đầu tiên để bắt đầu catalog.</span></div>
            )}
          </div>
        </article>

        <aside className="hpt-tail-card hpt-dashboard-quick">
          <div className="hpt-tail-card__head"><div><div><h2>Thao tác nhanh</h2><p>Đi thẳng đến công việc thường dùng.</p></div></div></div>
          <div className="hpt-dashboard-quick__list">
            {quickActions.map((item) => (
              <a href={item.href} key={item.label}>
                <span>{item.icon}</span>
                <div><strong>{item.label}</strong><small>{item.note}</small></div>
                <b aria-hidden="true">→</b>
              </a>
            ))}
          </div>
        </aside>
      </section>

      <section className="hpt-dashboard-catalog">
        <article className="hpt-tail-card">
          <div className="hpt-tail-card__head"><div><div><h2>Quản lý catalog</h2><p>Các lớp dữ liệu sản phẩm đã được chuẩn hóa.</p></div></div></div>
          <div className="hpt-dashboard-catalog__grid">
            <CatalogLink href="/admin/collections/product-types" label="Loại sản phẩm" note="Scanner, printer, photocopier" />
            <CatalogLink href="/admin/collections/attribute-definitions" label="Bộ thông số" note="Schema thuộc tính theo loại máy" />
            <CatalogLink href="/admin/collections/product-offers" label="Giá bán" note="Giá, VAT và khuyến mãi" />
            <CatalogLink href="/admin/collections/product-inventory" label="Tồn kho" note="Số lượng theo từng kho" />
          </div>
        </article>
      </section>
    </main>
  );
}

function CatalogLink({ href, label, note }: { href: string; label: string; note: string }) {
  return (
    <a href={href}>
      <div><strong>{label}</strong><small>{note}</small></div>
      <span aria-hidden="true">→</span>
    </a>
  );
}
