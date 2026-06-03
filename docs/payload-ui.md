# Nâng cấp UI Admin Payload CMS — HPT Tech

## Đã xác nhận

| Quyết định | Giá trị |
|---|---|
| Accent color | `#6366f1` (Indigo) |
| Theme mode | Dark **+** Light toggle (Payload built-in switcher) |
| Dashboard data | **Server-side** — dùng `getPayload({ config })` |

---

## Tổng quan kiến trúc

```
app/(payload)/
├── admin-theme.css          ← [MODIFY] Viết lại toàn bộ (Phase 1)
├── layout.tsx               ← không đổi
└── admin/
    └── importMap.js         ← [AUTO] regenerate sau khi chạy payload

components/payload/          ← [NEW] thư mục mới (Phase 2)
├── Dashboard.tsx            ← server component, fetch stats
├── NavLogo.tsx              ← branding sidebar
└── AfterNavLinks.tsx        ← quick links cuối sidebar

payload.config.ts            ← [MODIFY] đăng ký components
```

---

## Phase 1 — Viết lại `admin-theme.css`

**File:** `app/(payload)/admin-theme.css`  
**Ghi đè toàn bộ nội dung hiện tại.**

### 1.1 — Cấu trúc CSS cần implement

```css
/* ─── GOOGLE FONT ─────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* ─── DARK TOKEN (default) ────────────────────────── */
:root,
[data-theme="dark"] {
  /* backgrounds */
  --hpt-bg:          #0c0e1a;
  --hpt-surface:     #111827;  /* card / panel */
  --hpt-surface-2:   #1a2035;  /* elevated */
  --hpt-overlay:     rgba(255,255,255,0.04);

  /* border */
  --hpt-border:      rgba(255,255,255,0.08);
  --hpt-border-focus:rgba(99,102,241,0.55);

  /* text */
  --hpt-text:        #f1f5f9;
  --hpt-text-2:      #94a3b8;
  --hpt-text-muted:  #475569;

  /* brand */
  --hpt-primary:     #6366f1;
  --hpt-primary-d:   #4f46e5;
  --hpt-primary-glow:rgba(99,102,241,0.28);
  --hpt-danger:      #ef4444;
  --hpt-success:     #22c55e;
  --hpt-warning:     #f59e0b;

  /* sidebar */
  --hpt-sidebar:        #080c18;
  --hpt-sidebar-2:      #0e1428;
  --hpt-sidebar-text:   #c7d2fe;
  --hpt-sidebar-muted:  #4f5f8a;
  --hpt-sidebar-active: rgba(99,102,241,0.18);

  /* shadow */
  --hpt-shadow-sm:   0 1px 3px rgba(0,0,0,0.4);
  --hpt-shadow:      0 8px 24px rgba(0,0,0,0.36);
  --hpt-shadow-lg:   0 20px 48px rgba(0,0,0,0.44);
  --hpt-glow:        0 0 0 3px var(--hpt-primary-glow);

  /* Payload internal overrides */
  --theme-bg:           var(--hpt-bg);
  --theme-input-bg:     var(--hpt-surface);
  --theme-text:         var(--hpt-text);
  --theme-border-color: var(--hpt-border);
}

/* ─── LIGHT TOKEN ─────────────────────────────────── */
[data-theme="light"] {
  --hpt-bg:          #f4f6fb;
  --hpt-surface:     #ffffff;
  --hpt-surface-2:   #f0f2f9;
  --hpt-overlay:     rgba(0,0,0,0.03);

  --hpt-border:      rgba(0,0,0,0.08);
  --hpt-border-focus:rgba(99,102,241,0.4);

  --hpt-text:        #0f172a;
  --hpt-text-2:      #475569;
  --hpt-text-muted:  #94a3b8;

  --hpt-primary:     #6366f1;
  --hpt-primary-d:   #4f46e5;
  --hpt-primary-glow:rgba(99,102,241,0.18);
  --hpt-danger:      #dc2626;
  --hpt-success:     #16a34a;
  --hpt-warning:     #d97706;

  /* sidebar vẫn dark — giữ brand nhất quán */
  --hpt-sidebar:        #080c18;
  --hpt-sidebar-2:      #0e1428;
  --hpt-sidebar-text:   #c7d2fe;
  --hpt-sidebar-muted:  #4f5f8a;
  --hpt-sidebar-active: rgba(99,102,241,0.18);

  --hpt-shadow-sm:   0 1px 3px rgba(0,0,0,0.08);
  --hpt-shadow:      0 8px 24px rgba(0,0,0,0.1);
  --hpt-shadow-lg:   0 20px 48px rgba(0,0,0,0.12);
  --hpt-glow:        0 0 0 3px var(--hpt-primary-glow);

  --theme-bg:           var(--hpt-bg);
  --theme-input-bg:     var(--hpt-surface);
  --theme-text:         var(--hpt-text);
  --theme-border-color: var(--hpt-border);
}
```

### 1.2 — Các block CSS cần implement

#### Global & Font
```css
*, *::before, *::after { box-sizing: border-box; }

body {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  background: var(--hpt-bg);
  color: var(--hpt-text);
  letter-spacing: 0;
  -webkit-font-smoothing: antialiased;
}

* { transition: background-color 0.15s ease, border-color 0.15s ease, color 0.12s ease; }
```

#### App Header (glassmorphism)
```css
.app-header {
  background: rgba(8,12,24,0.75);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--hpt-border);
}
[data-theme="light"] .app-header {
  background: rgba(244,246,251,0.8);
}
.app-header__bg { display: none; }
```

#### Sidebar
```css
.nav {
  background: linear-gradient(180deg, var(--hpt-sidebar) 0%, var(--hpt-sidebar-2) 100%);
  border-right: 1px solid rgba(255,255,255,0.05);
  box-shadow: 4px 0 32px rgba(0,0,0,0.4);
}

/* Active nav link — indigo glow pill */
.nav__link:has(.nav__link-indicator) {
  background: var(--hpt-sidebar-active);
  border: 1px solid rgba(99,102,241,0.35);
  color: #a5b4fc;
  box-shadow: 0 0 16px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.06);
}

/* Hover */
.nav a.nav__link:hover,
.nav a.nav__link:focus-visible {
  background: rgba(255,255,255,0.06);
  color: #e0e7ff;
  text-decoration: none;
}

.nav-group__toggle {
  color: var(--hpt-sidebar-muted);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
```

#### Panels / Cards (glassmorphism)
```css
.document-fields__sidebar-fields > .render-fields > .field-type,
.collection-edit__main .tabs-field,
.collection-list__wrap,
.collections__wrap,
.dashboard__wrap,
.create-first-user,
.login__wrap {
  background: var(--hpt-surface);
  border: 1px solid var(--hpt-border);
  border-radius: 12px;
  box-shadow: var(--hpt-shadow);
}
[data-theme="dark"] .collections__card-list > li > .card {
  background: var(--hpt-surface) !important;
  border: 1px solid var(--hpt-border) !important;
  backdrop-filter: blur(8px);
}
.collections__card-list > li > .card:hover {
  border-color: rgba(99,102,241,0.4) !important;
  box-shadow: 0 0 0 1px rgba(99,102,241,0.2), var(--hpt-shadow) !important;
  transform: translateY(-2px);
}
```

#### Form Fields
```css
.field-type.text input,
.field-type.email input,
.field-type.password input,
.field-type.number input,
.field-type.textarea textarea,
.react-select .rs__control {
  background: var(--hpt-surface-2);
  border: 1px solid var(--hpt-border);
  border-radius: 8px;
  color: var(--hpt-text);
  min-height: 42px;
}
.field-type.text input:focus,
.field-type.textarea textarea:focus,
.react-select .rs__control--is-focused {
  border-color: var(--hpt-primary);
  box-shadow: var(--hpt-glow);
  outline: none;
}
.field-label { color: var(--hpt-text); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
.field-description { color: var(--hpt-text-muted); font-size: 12px; }
```

#### Buttons
```css
.btn { border-radius: 8px; font-weight: 700; letter-spacing: 0; transition: all 0.15s ease; }
.btn--style-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  border: none;
  box-shadow: 0 4px 14px rgba(99,102,241,0.35);
}
.btn--style-primary:hover { background: linear-gradient(135deg, #818cf8, #6366f1); box-shadow: 0 6px 20px rgba(99,102,241,0.5); transform: translateY(-1px); }
.btn--style-secondary, .btn--style-subtle {
  background: var(--hpt-overlay);
  border: 1px solid var(--hpt-border);
  color: var(--hpt-text-2);
}
.btn--style-secondary:hover { border-color: rgba(99,102,241,0.4); color: var(--hpt-text); }
```

#### Tabs (pill style)
```css
.tabs-field__tabs-wrap { background: var(--hpt-surface-2); border-bottom: 1px solid var(--hpt-border); }
.tabs-field__tab-button { color: var(--hpt-text-muted); font-weight: 700; }
.tabs-field__tab-button--active { color: var(--hpt-primary); }
.tabs-field__tab-button::after { background: var(--hpt-primary); height: 2px; border-radius: 2px; }
```

#### Table
```css
.table table { background: var(--hpt-surface); border: 1px solid var(--hpt-border); border-radius: 10px; overflow: hidden; }
.table th { background: var(--hpt-surface-2); color: var(--hpt-text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
.table tbody tr:hover td { background: var(--hpt-overlay); }
```

#### Login page (full-screen dark, split layout)
```css
.login,
.create-first-user {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 70% 20%, rgba(99,102,241,0.15), transparent 50%),
    radial-gradient(ellipse at 10% 80%, rgba(79,70,229,0.1), transparent 40%),
    var(--hpt-bg);
  align-items: center;
  justify-content: center;
}
.login__wrap, .create-first-user {
  width: min(420px, calc(100vw - 32px));
  padding: 36px;
  border-radius: 16px;
  background: var(--hpt-surface);
  border: 1px solid var(--hpt-border);
  box-shadow: var(--hpt-shadow-lg);
}
```

#### Doc controls (sticky glassmorphism bar)
```css
.doc-controls {
  background: rgba(8,12,24,0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--hpt-border);
}
[data-theme="light"] .doc-controls { background: rgba(244,246,251,0.85); }
.doc-controls::before, .doc-controls::after { display: none; }
```

#### Dropzone / Upload
```css
.dropzone {
  border: 2px dashed var(--hpt-border);
  border-radius: 10px;
  background: var(--hpt-surface-2);
  min-height: 120px;
  transition: border-color 0.2s, background 0.2s;
}
.dropzone:hover { border-color: var(--hpt-primary); background: rgba(99,102,241,0.05); }
```

#### Status badges (select options)
```css
/* Styling cho các badge trạng thái trong table */
.pill.status--published,
.pill--style-success { background: rgba(34,197,94,0.15); color: #4ade80; }
.pill.status--draft,
.pill--style-warning { background: rgba(245,158,11,0.15); color: #fbbf24; }
.pill.status--archived,
.pill--style-error { background: rgba(239,68,68,0.15); color: #f87171; }
```

---

## Phase 2 — Custom React Components

### 2.1 — `components/payload/NavLogo.tsx`

```tsx
// components/payload/NavLogo.tsx
export default function NavLogo() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0 4px',
    }}>
      {/* Logo mark */}
      <div style={{
        width: 32, height: 32,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
        flexShrink: 0,
      }}>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: -0.5 }}>H</span>
      </div>

      {/* Text */}
      <div style={{ lineHeight: 1.1 }}>
        <div style={{
          background: 'linear-gradient(90deg, #a5b4fc, #c7d2fe)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 800,
          fontSize: 16,
          letterSpacing: -0.3,
        }}>
          HPT TECH
        </div>
        <div style={{ color: '#4f5f8a', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          CMS Admin
        </div>
      </div>
    </div>
  );
}
```

### 2.2 — `components/payload/AfterNavLinks.tsx`

```tsx
// components/payload/AfterNavLinks.tsx
'use client';

export default function AfterNavLinks() {
  return (
    <div style={{
      marginTop: 'auto',
      padding: '16px 0',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      {/* View website */}
      <a
        href="https://hpttech.vn"
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 8,
          color: '#94a3b8', fontSize: 13, fontWeight: 600,
          textDecoration: 'none', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#c7d2fe'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        Xem website →
      </a>

      {/* System status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px',
        color: '#4f5f8a', fontSize: 12,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 6px rgba(34,197,94,0.6)',
          animation: 'pulse-dot 2s infinite',
        }} />
        Hệ thống hoạt động
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
```

### 2.3 — `components/payload/Dashboard.tsx` (Server Component)

```tsx
// components/payload/Dashboard.tsx
import { getPayload } from 'payload';
import config from '@payload-config';

// Lucide icons (inline SVG để tránh import thêm dependency)
const icons = {
  box: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  image: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  zap:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
};

async function getStats(payload: Awaited<ReturnType<typeof getPayload>>) {
  const [products, posts, banners, solutions] = await Promise.all([
    payload.count({ collection: 'products' }).catch(() => ({ totalDocs: 0 })),
    payload.count({ collection: 'posts' }).catch(() => ({ totalDocs: 0 })),
    payload.count({ collection: 'banners' }).catch(() => ({ totalDocs: 0 })),
    payload.count({ collection: 'solutions' }).catch(() => ({ totalDocs: 0 })),
  ]);
  return { products: products.totalDocs, posts: posts.totalDocs, banners: banners.totalDocs, solutions: solutions.totalDocs };
}

async function getRecentProducts(payload: Awaited<ReturnType<typeof getPayload>>) {
  const res = await payload.find({
    collection: 'products',
    limit: 5,
    sort: '-createdAt',
    depth: 1,
  }).catch(() => ({ docs: [] }));
  return res.docs as any[];
}

export default async function Dashboard() {
  const payload = await getPayload({ config });
  const [stats, recentProducts] = await Promise.all([
    getStats(payload),
    getRecentProducts(payload),
  ]);

  const statCards = [
    { label: 'Sản phẩm', value: stats.products, icon: icons.box, color: '#6366f1', href: '/admin/collections/products' },
    { label: 'Bài viết', value: stats.posts, icon: icons.file, color: '#22c55e', href: '/admin/collections/posts' },
    { label: 'Banner', value: stats.banners, icon: icons.image, color: '#f59e0b', href: '/admin/collections/banners' },
    { label: 'Giải pháp', value: stats.solutions, icon: icons.zap, color: '#ec4899', href: '/admin/collections/solutions' },
  ];

  const quickActions = [
    { label: '+ Thêm sản phẩm', href: '/admin/collections/products/create', color: '#6366f1' },
    { label: '+ Viết bài mới', href: '/admin/collections/posts/create', color: '#22c55e' },
    { label: '⚙ Cấu hình website', href: '/admin/globals/site-settings', color: '#94a3b8' },
  ];

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: 'var(--hpt-text)' }}>
          Dashboard HPT Tech
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--hpt-text-muted)', fontSize: 14 }}>
          Quản lý nội dung website — Payload CMS
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statCards.map(card => (
          <a
            key={card.label}
            href={card.href}
            style={{
              display: 'block', padding: '20px 22px', borderRadius: 12,
              background: 'var(--hpt-surface)',
              border: '1px solid var(--hpt-border)',
              boxShadow: 'var(--hpt-shadow-sm)',
              textDecoration: 'none',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ color: card.color, opacity: 0.9 }}>{card.icon}</div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: card.color, boxShadow: `0 0 8px ${card.color}` }} />
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--hpt-text)', lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--hpt-text-muted)', marginTop: 6, fontWeight: 600 }}>
              {card.label}
            </div>
          </a>
        ))}
      </div>

      {/* Bottom 2-col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

        {/* Recent products */}
        <div style={{ background: 'var(--hpt-surface)', border: '1px solid var(--hpt-border)', borderRadius: 12, padding: '20px 24px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--hpt-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
            Sản phẩm gần đây
          </h2>
          {recentProducts.length === 0
            ? <p style={{ color: 'var(--hpt-text-muted)', fontSize: 14 }}>Chưa có sản phẩm nào.</p>
            : recentProducts.map((p: any) => (
              <a
                key={p.id}
                href={`/admin/collections/products/${p.id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--hpt-border)',
                  textDecoration: 'none', color: 'var(--hpt-text)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--hpt-text-muted)', marginTop: 2 }}>
                    {typeof p.brand === 'object' ? p.brand?.name : p.brand} · {p.price || '—'}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: p.status === 'published' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                  color: p.status === 'published' ? '#4ade80' : '#fbbf24',
                }}>
                  {p.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                </span>
              </a>
            ))
          }
          <a href="/admin/collections/products" style={{ display: 'block', marginTop: 14, fontSize: 13, color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
            Xem tất cả →
          </a>
        </div>

        {/* Quick actions */}
        <div style={{ background: 'var(--hpt-surface)', border: '1px solid var(--hpt-border)', borderRadius: 12, padding: '20px 24px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--hpt-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
            Thao tác nhanh
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quickActions.map(a => (
              <a
                key={a.label}
                href={a.href}
                style={{
                  display: 'block', padding: '11px 14px', borderRadius: 8,
                  border: `1px solid ${a.color}33`,
                  background: `${a.color}10`,
                  color: a.color, fontSize: 13, fontWeight: 700,
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
              >
                {a.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 3 — Đăng ký vào `payload.config.ts`

**File:** `payload.config.ts`  
Thêm `components` vào block `admin`:

```ts
// Trước:
admin: {
  importMap: { baseDir: dirname },
  user: Users.slug,
},

// Sau:
admin: {
  importMap: { baseDir: dirname },
  user: Users.slug,
  components: {
    graphics: {
      Logo: '@/components/payload/NavLogo',
      Icon: '@/components/payload/NavLogo',
    },
    afterNavLinks: ['@/components/payload/AfterNavLinks'],
    views: {
      Dashboard: {
        Component: '@/components/payload/Dashboard',
      },
    },
  },
},
```

---

## Thứ tự thực hiện

```
1. Viết lại app/(payload)/admin-theme.css (xóa cũ, paste mới)
2. Tạo components/payload/NavLogo.tsx
3. Tạo components/payload/AfterNavLinks.tsx
4. Tạo components/payload/Dashboard.tsx
5. Sửa payload.config.ts — thêm admin.components
6. Chạy: npm run payload   (regenerate importMap.js)
7. Chạy: npm run dev
8. Mở http://localhost:3000/admin kiểm tra
```

> **Quan trọng:** Bước 6 `npm run payload` là bắt buộc sau khi thêm custom components vào `payload.config.ts`, nếu không Payload sẽ báo lỗi importMap.

---

## Checklist kiểm tra sau khi hoàn thành

- [ ] Login page: dark background với gradient glow tím, card glassmorphism
- [ ] Dashboard: hiển thị 4 stat cards với số đúng + recent products
- [ ] Sidebar: NavLogo HPT Tech, nav links active với glow indigo
- [ ] Sidebar: AfterNavLinks — "Xem website →" + status dot xanh
- [ ] Dark/Light toggle: click icon ở header chuyển đổi đúng
- [ ] Light mode: nền sáng, sidebar vẫn dark (nhất quán brand)
- [ ] Products form: tabs pill, input focus ring tím
- [ ] Table: dark rows, hover highlight
- [ ] Upload dropzone: border tím khi hover
- [ ] Mobile: nav collapse, layout không vỡ
