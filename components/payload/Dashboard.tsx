import { getPayload } from "payload";
import config from "@/payload.config";

type AdminCollectionSlug = "products" | "posts" | "banners" | "solutions";
type PayloadClient = Awaited<ReturnType<typeof getPayload>>;

const icons = {
  box: (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="20"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  ),
  file: (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="20"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  image: (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="20"
    >
      <rect height="18" rx="2" width="18" x="3" y="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  zap: (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="20"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
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
  const [products, posts, banners, solutions] = await Promise.all([
    safeCount(payload, "products"),
    safeCount(payload, "posts"),
    safeCount(payload, "banners"),
    safeCount(payload, "solutions"),
  ]);

  return { banners, posts, products, solutions };
}

async function getRecentProducts(payload: PayloadClient) {
  try {
    const result = await payload.find({
      collection: "products",
      depth: 1,
      limit: 5,
      sort: "-createdAt",
    });

    return result.docs;
  } catch {
    return [];
  }
}

function getRelationLabel(value: unknown) {
  if (!value) return "Chưa phân loại";
  if (typeof value === "object" && "name" in value && typeof value.name === "string") {
    return value.name;
  }
  if (typeof value === "object" && "title" in value && typeof value.title === "string") {
    return value.title;
  }
  return String(value);
}

function formatPrice(value: unknown) {
  if (typeof value !== "number") return "Chưa nhập giá";

  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export default async function Dashboard() {
  const payload = await getPayload({ config });
  const [stats, recentProducts] = await Promise.all([getStats(payload), getRecentProducts(payload)]);

  const statCards = [
    {
      color: "#6366f1",
      href: "/admin/collections/products",
      icon: icons.box,
      label: "Sản phẩm",
      value: stats.products,
    },
    {
      color: "#22c55e",
      href: "/admin/collections/posts",
      icon: icons.file,
      label: "Bài viết",
      value: stats.posts,
    },
    {
      color: "#f59e0b",
      href: "/admin/collections/banners",
      icon: icons.image,
      label: "Banner",
      value: stats.banners,
    },
    {
      color: "#ec4899",
      href: "/admin/collections/solutions",
      icon: icons.zap,
      label: "Giải pháp",
      value: stats.solutions,
    },
  ];

  const quickActions = [
    { color: "#6366f1", href: "/admin/collections/products/create", label: "+ Thêm sản phẩm" },
    { color: "#22c55e", href: "/admin/collections/posts/create", label: "+ Viết bài mới" },
    { color: "#94a3b8", href: "/admin/globals/site-settings", label: "Cấu hình website" },
  ];

  return (
    <div
      className="payload-admin-dashboard-shell"
      style={{
        margin: "0 auto",
        maxWidth: 1100,
        padding: "32px 28px",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            color: "var(--hpt-text)",
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 0,
            margin: 0,
          }}
        >
          Dashboard HPT Tech
        </h1>
        <p style={{ color: "var(--hpt-text-muted)", fontSize: 14, margin: "6px 0 0" }}>
          Quản lý nội dung website - Payload CMS
        </p>
      </div>

      <div
        className="payload-admin-stats-grid"
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          marginBottom: 32,
        }}
      >
        {statCards.map((card) => (
          <a
            className="payload-admin-dashboard-card"
            href={card.href}
            key={card.label}
            style={{
              background: "var(--hpt-surface)",
              border: "1px solid var(--hpt-border)",
              borderRadius: 12,
              boxShadow: "var(--hpt-shadow-sm)",
              display: "block",
              padding: "20px 22px",
              textDecoration: "none",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div style={{ color: card.color, opacity: 0.9 }}>{card.icon}</div>
              <div
                aria-hidden="true"
                style={{
                  background: card.color,
                  borderRadius: "50%",
                  boxShadow: `0 0 8px ${card.color}`,
                  height: 8,
                  width: 8,
                }}
              />
            </div>
            <div style={{ color: "var(--hpt-text)", fontSize: 32, fontWeight: 800, lineHeight: 1 }}>
              {card.value}
            </div>
            <div
              style={{
                color: "var(--hpt-text-muted)",
                fontSize: 13,
                fontWeight: 600,
                marginTop: 6,
              }}
            >
              {card.label}
            </div>
          </a>
        ))}
      </div>

      <div
        className="payload-admin-dashboard-grid"
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "1fr 280px",
        }}
      >
        <section
          className="payload-admin-dashboard-panel"
          style={{
            background: "var(--hpt-surface)",
            border: "1px solid var(--hpt-border)",
            borderRadius: 12,
            padding: "20px 24px",
          }}
        >
          <h2
            style={{
              color: "var(--hpt-text-muted)",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.08em",
              margin: "0 0 16px",
              textTransform: "uppercase",
            }}
          >
            Sản phẩm gần đây
          </h2>

          {recentProducts.length === 0 ? (
            <p style={{ color: "var(--hpt-text-muted)", fontSize: 14 }}>
              Chưa có sản phẩm nào.
            </p>
          ) : (
            recentProducts.map((product) => {
              const isPublished = product.status === "published";

              return (
                <a
                  className="payload-admin-recent-row"
                  href={`/admin/collections/products/${product.id}`}
                  key={product.id}
                  style={{
                    alignItems: "center",
                    borderBottom: "1px solid var(--hpt-border)",
                    color: "var(--hpt-text)",
                    display: "flex",
                    gap: 16,
                    justifyContent: "space-between",
                    padding: "10px 0",
                    textDecoration: "none",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {product.title}
                    </div>
                    <div
                      style={{
                        color: "var(--hpt-text-muted)",
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {getRelationLabel(product.brand)} · {formatPrice(product.price)}
                    </div>
                  </div>
                  <span
                    style={{
                      background: isPublished
                        ? "rgba(34,197,94,0.15)"
                        : "rgba(245,158,11,0.15)",
                      borderRadius: 20,
                      color: isPublished ? "#4ade80" : "#fbbf24",
                      flexShrink: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                    }}
                  >
                    {isPublished ? "Đã xuất bản" : "Bản nháp"}
                  </span>
                </a>
              );
            })
          )}

          <a
            href="/admin/collections/products"
            style={{
              color: "#6366f1",
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              marginTop: 14,
              textDecoration: "none",
            }}
          >
            Xem tất cả →
          </a>
        </section>

        <aside
          className="payload-admin-dashboard-panel"
          style={{
            background: "var(--hpt-surface)",
            border: "1px solid var(--hpt-border)",
            borderRadius: 12,
            padding: "20px 24px",
          }}
        >
          <h2
            style={{
              color: "var(--hpt-text-muted)",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.08em",
              margin: "0 0 16px",
              textTransform: "uppercase",
            }}
          >
            Thao tác nhanh
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {quickActions.map((action) => (
              <a
                className="payload-admin-quick-action"
                href={action.href}
                key={action.label}
                style={{
                  background: `${action.color}10`,
                  border: `1px solid ${action.color}33`,
                  borderRadius: 8,
                  color: action.color,
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "11px 14px",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
              >
                {action.label}
              </a>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
