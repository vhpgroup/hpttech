"use client";

import { useEffect, useRef } from "react";

/**
 * Nền hero trang /he-thong-showroom: bản đồ tổng tương tác (Leaflet) thay cho
 * minh họa tĩnh showroom-hero.png — trụ sở chính Hải Phòng là pin đỏ ★ có hiệu
 * ứng pulse, 5 chi nhánh là pin xanh navy kèm nhãn tên tỉnh. Nhấp pin mở popup
 * địa chỉ + giờ làm việc + hotline + nút "Chỉ đường" (Google Maps).
 *
 * Kỹ thuật:
 * - Leaflet nạp runtime từ CDN (unpkg, pin bản 1.9.4) — KHÔNG thêm dependency
 *   vào package.json/package-lock.json, không cần API key (tile CARTO/OSM).
 * - SSR-safe: bản đồ chỉ khởi tạo trong useEffect; lúc chưa tải xong hiển thị
 *   nền primary nhạt + dòng "Đang tải bản đồ…". CDN lỗi → giữ nền tĩnh, không
 *   vỡ trang (nguyên tắc suy giảm mượt của AGENTS.md).
 * - Component này chỉ là LỚP NỀN absolute: section cha (server component) đặt
 *   chiều cao. Bản đồ hiển thị rõ nét toàn khung — không scrim/chữ đè lên.
 * - Màu lấy theo biến sẵn có của trang (--shm-navy/--shm-red khai báo dưới,
 *   trùng #0b2a63/#da2127 đang dùng trong page.tsx; nền map dùng token
 *   --color-primary-100). Font kế thừa --font-body, không import font riêng.
 */

export type ShowroomHeroStore = {
  id: string;
  /** Nhãn ngắn hiển thị cạnh pin (vd "Hà Nội", "Hải Phòng (Trụ sở)"). */
  chip: string;
  /** Tên đầy đủ cơ sở (vd "Trụ sở & Showroom Hải Phòng"). */
  label: string;
  address: string;
  lat: number;
  lng: number;
  /** Trụ sở chính → pin đỏ ★ lớn hơn, có pulse. */
  hq?: boolean;
};

type Props = {
  stores: ShowroomHeroStore[];
  phone: string;
  email: string;
  /** Giờ làm việc, vd "8:00 – 17:30". */
  hours: string;
  /** Ngày làm việc, vd "Thứ 2 – Thứ 7". */
  days: string;
};

/* ── Kiểu tối thiểu cho phần Leaflet API được dùng (nạp từ CDN, không có
      @types/leaflet trong node_modules — không dùng `any` theo AGENTS.md). ── */
type LatLngTuple = [number, number];

interface LeafletMarker {
  addTo(map: LeafletMap): this;
  bindPopup(html: string, options?: Record<string, unknown>): this;
  bindTooltip(html: string, options?: Record<string, unknown>): this;
}

interface LeafletMap {
  on(event: string, handler: () => void): this;
  fitBounds(bounds: unknown, options?: Record<string, unknown>): this;
  invalidateSize(): this;
  closePopup(): this;
  remove(): void;
  scrollWheelZoom: { enable(): void };
  dragging: { disable(): void };
  /** Control attribution mặc định — dùng để bỏ prefix "Leaflet". */
  attributionControl: { setPrefix(prefix: string | false): unknown };
}

interface LeafletStatic {
  map(element: HTMLElement, options?: Record<string, unknown>): LeafletMap;
  tileLayer(url: string, options?: Record<string, unknown>): { addTo(map: LeafletMap): unknown };
  control: { zoom(options: Record<string, unknown>): { addTo(map: LeafletMap): unknown } };
  divIcon(options: Record<string, unknown>): unknown;
  marker(latlng: LatLngTuple, options?: Record<string, unknown>): LeafletMarker;
  latLngBounds(latlngs: LatLngTuple[]): unknown;
  Browser: { touch: boolean };
}

declare global {
  interface Window {
    L?: LeafletStatic;
  }
}

const LEAFLET_VERSION = "1.9.4";
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>';

let leafletPromise: Promise<LeafletStatic> | null = null;

/** Nạp Leaflet từ CDN đúng một lần cho cả trang (idempotent). */
function loadLeaflet(): Promise<LeafletStatic> {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise<LeafletStatic>((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = LEAFLET_CSS;
      document.head.appendChild(css);
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => {
      if (window.L) resolve(window.L);
      else reject(new Error("Leaflet tải xong nhưng window.L không tồn tại"));
    };
    script.onerror = () => {
      leafletPromise = null; // cho phép thử lại ở lần mount sau
      reject(new Error("Không tải được Leaflet từ CDN"));
    };
    document.head.appendChild(script);
  });
  return leafletPromise;
}

/** SVG pin dạng giọt nước; màu ăn theo `currentColor` của lớp bọc. */
function pinIconHtml(hq: boolean): string {
  const svg = hq
    ? '<svg width="46" height="58" viewBox="0 0 46 58" aria-hidden="true">' +
      '<path d="M23 1.5C11.3 1.5 2 10.8 2 22.5 2 37.5 23 56.5 23 56.5s21-19 21-34C44 10.8 34.7 1.5 23 1.5z" fill="currentColor" stroke="#fff" stroke-width="3"/>' +
      '<text x="23" y="30" text-anchor="middle" font-size="19" font-weight="700" fill="#fff">★</text></svg>'
    : '<svg width="35" height="45" viewBox="0 0 35 45" aria-hidden="true">' +
      '<path d="M17.5 1.2C8.4 1.2 1.2 8.4 1.2 17.5c0 11.6 16.3 26.3 16.3 26.3s16.3-14.7 16.3-26.3c0-9.1-7.2-16.3-16.3-16.3z" fill="currentColor" stroke="#fff" stroke-width="2.6"/>' +
      '<circle cx="17.5" cy="17" r="6" fill="#fff"/></svg>';
  return `<div class="shm-pin${hq ? " shm-pin-hq" : ""}">${hq ? '<span class="shm-pulse"></span>' : ""}${svg}</div>`;
}

function popupHtml(store: ShowroomHeroStore, phone: string, email: string, hours: string, days: string): string {
  const tel = phone.replace(/[^\d+]/g, "");
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
  const badge = store.hq ? "★ TRỤ SỞ CHÍNH &amp; SHOWROOM" : "CHI NHÁNH SHOWROOM";
  return (
    `<div class="shm-pp">` +
    `<span class="shm-pp-badge${store.hq ? " shm-hq" : ""}">${badge}</span>` +
    `<h3>${store.label}</h3>` +
    `<p class="shm-pp-addr">${store.address}</p>` +
    `<p class="shm-pp-meta">🕗 ${hours} · ${days}</p>` +
    `<p class="shm-pp-meta">📞 <a href="tel:${tel}">${phone}</a> · ${email}</p>` +
    `<a class="shm-pp-btn${store.hq ? " shm-hq" : ""}" target="_blank" rel="noreferrer" href="${directions}">Chỉ đường ➜</a>` +
    `</div>`
  );
}

/* CSS riêng của hero map — prefix shm- để không đụng class toàn cục. */
const SHM_CSS = `
.shm-root{position:absolute;inset:0;z-index:0}
.shm-map{position:absolute;inset:0;background:var(--color-primary-100,#e7f0fd)}
.shm-map::after{content:"Đang tải bản đồ…";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 13px var(--font-body,ui-sans-serif,system-ui,sans-serif);color:var(--shm-sub);opacity:.75}
.shm-map.leaflet-container::after{display:none}
.shm-root{--shm-navy:#0b2a63;--shm-red:#da2127;--shm-sub:#3d5878;--shm-line:#c9dbf8}
.shm-root .leaflet-container{font-family:var(--font-body,ui-sans-serif,system-ui,sans-serif)}

/* attribution tối giản: giữ © OSM/CARTO theo giấy phép nhưng kín đáo */
.shm-root .leaflet-control-attribution{background:rgba(255,255,255,.6);font-size:9px;line-height:1.6;color:#8195b8;padding:0 6px;border-radius:6px 0 0 0}
.shm-root .leaflet-control-attribution a{color:#8195b8;text-decoration:none}

/* pin + pulse */
.shm-pin{position:relative;color:var(--shm-navy);filter:drop-shadow(0 5px 6px rgba(11,42,99,.35))}
.shm-pin-hq{color:var(--shm-red)}
.shm-pulse{position:absolute;left:50%;bottom:0;width:12px;height:12px;transform:translateX(-50%);border-radius:50%;animation:shm-pulse 2.4s ease-out infinite}
@keyframes shm-pulse{0%{box-shadow:0 0 0 0 rgba(218,33,39,.42)}100%{box-shadow:0 0 0 30px rgba(218,33,39,0)}}

/* nhãn tên tỉnh cạnh pin */
.shm-root .leaflet-tooltip.shm-tip{background:#fff;border:1px solid var(--shm-line);border-radius:999px;padding:3px 11px;font-size:11.5px;font-weight:700;color:var(--shm-navy);box-shadow:0 3px 10px rgba(11,42,99,.16);white-space:nowrap}
.shm-root .leaflet-tooltip.shm-tip-hq{color:var(--shm-red);border-color:#f3bfbf}
.shm-root .leaflet-tooltip.shm-tip::before{display:none}

/* popup */
.shm-root .leaflet-popup-content-wrapper{border-radius:16px;box-shadow:0 16px 40px rgba(11,42,99,.24)}
.shm-root .leaflet-popup-content{margin:15px 17px}
.shm-pp{min-width:225px;max-width:262px;line-height:1.55}
.shm-pp-badge{display:inline-block;background:var(--shm-navy);color:#fff;font-size:9.5px;font-weight:800;letter-spacing:.07em;padding:3px 10px;border-radius:999px;margin-bottom:7px}
.shm-pp-badge.shm-hq{background:var(--shm-red)}
.shm-pp h3{font-size:15px;font-weight:800;color:var(--shm-navy);margin:0 0 3px;line-height:1.3}
.shm-pp-addr{font-size:12.5px;color:#41507a;margin:0 0 7px}
.shm-pp-meta{font-size:12px;color:var(--shm-sub);margin:0 0 2px}
.shm-pp-meta a{color:var(--color-primary-600,#2563eb);font-weight:700;text-decoration:none}
.shm-pp-btn{display:inline-block;margin-top:9px;background:var(--shm-navy);color:#fff;border-radius:9px;padding:7px 15px;font-size:12.5px;font-weight:700;text-decoration:none}
.shm-pp-btn.shm-hq{background:var(--shm-red)}

/* chú giải + nút toàn quốc */
.shm-ui{position:absolute;left:14px;bottom:14px;z-index:1100;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.shm-legend{background:rgba(255,255,255,.95);border:1px solid var(--shm-line);border-radius:11px;padding:8px 13px;font-size:12.5px;font-weight:600;color:var(--shm-navy);box-shadow:0 5px 16px rgba(11,42,99,.16);display:flex;gap:13px;align-items:center;pointer-events:none}
.shm-legend .shm-k{display:inline-flex;align-items:center;gap:6px}
.shm-legend .shm-star{color:var(--shm-red);font-size:15px;line-height:1}
.shm-legend .shm-dot{width:10px;height:10px;border-radius:50%;background:var(--shm-navy)}
.shm-reset{background:#fff;border:1px solid var(--shm-line);border-radius:11px;padding:8px 14px;cursor:pointer;font:700 12.5px var(--font-body,ui-sans-serif,system-ui,sans-serif);color:var(--shm-navy);box-shadow:0 5px 16px rgba(11,42,99,.16);transition:border-color .2s ease,color .2s ease}
.shm-reset:hover{border-color:var(--color-primary-600,#2563eb);color:var(--color-primary-600,#2563eb)}

/* zoom control né chú giải, bo góc đồng bộ */
.shm-root .leaflet-bottom.leaflet-right .leaflet-control-zoom{margin-bottom:52px;margin-right:14px;border-radius:10px;overflow:hidden;box-shadow:0 5px 16px rgba(11,42,99,.16)}

@media (max-width:640px){
  .shm-root .leaflet-tooltip.shm-tip{display:none} /* mobile: chạm pin để xem, tránh rối nhãn */
  .shm-ui{left:10px;bottom:10px}
  .shm-legend{font-size:11.5px;padding:7px 10px;gap:9px}
}
@media (prefers-reduced-motion:reduce){
  .shm-pulse{animation:none}
}
`;

export default function ShowroomHeroMap({ stores, phone, email, hours, days }: Props) {
  const mapElRef = useRef<HTMLDivElement>(null);
  /** Hàm "xem toàn quốc" (fitBounds) — gán sau khi map sẵn sàng. */
  const resetRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = mapElRef.current;
    if (!el || stores.length === 0) return;

    let disposed = false;
    let map: LeafletMap | null = null;
    let cleanupListeners: (() => void) | null = null;

    loadLeaflet()
      .then((L) => {
        if (disposed || !el.isConnected) return;

        map = L.map(el, { scrollWheelZoom: false, zoomControl: false });
        // Bỏ prefix "Leaflet" — chỉ giữ dòng © OpenStreetMap © CARTO tối giản
        // (bắt buộc theo giấy phép tile, style thu nhỏ trong SHM_CSS).
        map.attributionControl.setPrefix(false);
        L.control.zoom({ position: "bottomright" }).addTo(map);
        L.tileLayer(TILE_URL, { maxZoom: 19, subdomains: "abcd", attribution: TILE_ATTRIBUTION }).addTo(map);

        // Không cướp cuộn trang: chỉ bật zoom con lăn sau khi người dùng click map.
        const currentMap = map;
        currentMap.on("click", () => currentMap.scrollWheelZoom.enable());
        // Mobile: tắt kéo 1 ngón để không chặn cuộn trang (vẫn chạm pin xem popup).
        if (L.Browser.touch && window.matchMedia("(max-width: 640px)").matches) {
          currentMap.dragging.disable();
        }

        stores.forEach((store) => {
          const hq = Boolean(store.hq);
          const size: [number, number] = hq ? [46, 58] : [35, 45];
          // Nhãn né nhau: pin phía tây kinh tuyến 106°Đ đặt nhãn bên trái.
          const tipDir = hq ? "right" : store.lng <= 106 ? "left" : "right";
          const tipOffset = hq ? [16, -32] : tipDir === "left" ? [-13, -26] : [13, -26];
          L.marker([store.lat, store.lng], {
            icon: L.divIcon({
              className: "",
              html: pinIconHtml(hq),
              iconSize: size,
              iconAnchor: [size[0] / 2, size[1]],
              popupAnchor: [0, -(size[1] - 4)],
            }),
            riseOnHover: true,
            zIndexOffset: hq ? 1000 : 0,
            alt: `${store.label} — ${store.address}`,
          })
            .addTo(currentMap)
            .bindPopup(popupHtml(store, phone, email, hours, days), { closeButton: true, autoPan: true })
            .bindTooltip(hq ? `★ ${store.chip}` : store.chip, {
              permanent: true,
              direction: tipDir,
              offset: tipOffset,
              className: `shm-tip${hq ? " shm-tip-hq" : ""}`,
              opacity: 1,
            });
        });

        const bounds = L.latLngBounds(stores.map((s) => [s.lat, s.lng] as LatLngTuple));
        const fit = () => {
          currentMap.invalidateSize();
          currentMap.closePopup();
          currentMap.fitBounds(bounds, { paddingTopLeft: [44, 42], paddingBottomRight: [44, 46] });
        };
        resetRef.current = fit;
        fit();
        // Layout ổn định xong (font/kích thước khung) → đo lại một nhịp.
        const refitTimer = window.setTimeout(fit, 400);

        let resizeTimer = 0;
        const onResize = () => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(fit, 180);
        };
        window.addEventListener("resize", onResize);
        cleanupListeners = () => {
          window.removeEventListener("resize", onResize);
          window.clearTimeout(refitTimer);
          window.clearTimeout(resizeTimer);
        };
      })
      .catch(() => {
        // CDN lỗi → giữ nền tĩnh + tiêu đề; không được làm vỡ render trang.
      });

    return () => {
      disposed = true;
      resetRef.current = null;
      cleanupListeners?.();
      map?.remove();
    };
  }, [stores, phone, email, hours, days]);

  return (
    <div className="shm-root" data-testid="showroom-hero-map">
      <style>{SHM_CSS}</style>

      <div
        ref={mapElRef}
        className="shm-map"
        role="application"
        aria-label="Bản đồ hệ thống showroom HPT Tech trên toàn quốc"
      />

      <div className="shm-ui">
        <div className="shm-legend">
          <span className="shm-k">
            <span className="shm-star">★</span> Trụ sở chính
          </span>
          <span className="shm-k">
            <span className="shm-dot" /> Chi nhánh showroom
          </span>
        </div>
        <button className="shm-reset" type="button" onClick={() => resetRef.current?.()}>
          ↺ Toàn quốc
        </button>
      </div>
    </div>
  );
}
