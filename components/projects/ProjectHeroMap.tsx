"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Nền hero trang /du-an: bản đồ địa bàn dự án toàn quốc, thay cho panel ảnh
 * tĩnh mattruoc.jpg. Mỗi tỉnh là một bong bóng ghi số gói thầu (tỉnh 1–2 gói
 * rút gọn thành chấm tròn cho đỡ rối), tỉnh có showroom gắn thêm ★ đỏ. Dải chip
 * bên dưới bấm để bay tới từng tỉnh và mở popup.
 *
 * Kỹ thuật — bám theo components/showroom/ShowroomHeroMap.tsx:
 * - Leaflet nạp runtime từ CDN (unpkg, pin 1.9.4) — KHÔNG thêm dependency vào
 *   package.json, không cần API key (tile CARTO/OSM).
 * - SSR-safe: chỉ khởi tạo trong useEffect; chưa tải xong thì hiện nền primary
 *   nhạt + "Đang tải bản đồ…". CDN lỗi → giữ nền tĩnh, không vỡ trang.
 * - Không dùng `any` (AGENTS.md mục 7): khai báo interface tối thiểu cho phần
 *   Leaflet API thực sự dùng, vì repo không cài @types/leaflet.
 * - Màu theo biến scoped --pjm-navy/--pjm-red (trùng #0b2a63/#da2127 mà
 *   ShowroomHeroMap đang dùng để hai trang đồng bộ); nền map và màu nhấn lấy
 *   token --color-primary-*. Font kế thừa --font-body.
 *
 * TOẠ ĐỘ theo 34 đơn vị hành chính sau sáp nhập (Nghị quyết 202/2025/QH15):
 * - 6 tỉnh có showroom → dùng toạ độ showroom thật (khớp trang /he-thong-showroom)
 * - 18 tỉnh còn lại    → dùng trung tâm hành chính (tỉnh lỵ) mới
 *
 * Bản đồ KHÔNG hiển thị nguồn dữ liệu. Dòng "© OpenStreetMap © CARTO" góc phải
 * là giấy phép tile — bắt buộc giữ, đã thu nhỏ như trang showroom.
 */

export type ProjectProvince = {
  /** Tên tỉnh theo 34 đơn vị sau sáp nhập. */
  name: string;
  /** Toạ độ thật: showroom, hoặc tỉnh lỵ mới. */
  lat: number;
  lng: number;
  /** Toạ độ giãn cách — chỉ dùng khi zoom xa để marker đỡ chồng nhau. */
  spreadLat?: number;
  spreadLng?: number;
  /** Số gói thầu đã tham gia trên địa bàn. */
  packages: number;
  /** Địa chỉ showroom, nếu tỉnh đó có showroom. */
  showroom?: string;
  /** Trụ sở chính. */
  hq?: boolean;
  /** Ghim nhãn cố định; tỉnh khác chỉ hiện nhãn khi hover. */
  pinLabel?: boolean;
  /** Hướng đặt nhãn cạnh marker. */
  dir?: "top" | "bottom" | "left" | "right";
};

/** Cập nhật số liệu ở đây khi hồ sơ năng lực thay đổi. */
export const PROJECT_PROVINCES: ProjectProvince[] = [
  // ── 6 tỉnh có showroom: toạ độ showroom thật ──
  {
    name: "Hải Phòng",
    lat: 20.8213602,
    lng: 106.6875277,
    packages: 38,
    hq: true,
    pinLabel: true,
    dir: "right",
    showroom: "SB04 Vinhomes Marina, phường An Biên",
  },
  {
    name: "Hà Nội",
    lat: 20.9936017,
    lng: 105.8307945,
    spreadLat: 21.06,
    spreadLng: 105.72,
    packages: 19,
    pinLabel: true,
    dir: "left",
    showroom: "Số 3, Ngõ 198 Lê Trọng Tấn, phường Phương Liệt",
  },
  {
    name: "TP. Hồ Chí Minh",
    lat: 10.7613673,
    lng: 106.6793788,
    packages: 15,
    pinLabel: true,
    dir: "right",
    showroom: "285 Trần Bình Trọng, Phường 4, Quận 5",
  },
  {
    name: "Thanh Hóa",
    lat: 19.7758149,
    lng: 105.7775896,
    packages: 2,
    pinLabel: true,
    dir: "left",
    showroom: "Lô 32 Nơ 18 Nguyễn Thị Anh, phường Hạc Thành",
  },
  {
    name: "Cần Thơ",
    lat: 10.0399637,
    lng: 105.7852092,
    packages: 1,
    pinLabel: true,
    dir: "left",
    showroom: "69 Nguyễn Trãi, phường Ninh Kiều",
  },
  {
    name: "Quảng Ngãi",
    lat: 14.3499089,
    lng: 108.0018309,
    packages: 0,
    pinLabel: true,
    dir: "right",
    showroom: "199 Đoàn Thị Điểm, phường Kon Tum",
  },

  // ── 18 tỉnh còn lại: trung tâm hành chính sau sáp nhập ──
  { name: "Hưng Yên", lat: 20.6557625, lng: 106.0546413, spreadLat: 20.48, spreadLng: 106.35, packages: 5, dir: "right" },
  { name: "Ninh Bình", lat: 20.2676067, lng: 105.9582372, spreadLat: 20.1, spreadLng: 105.6, packages: 4, dir: "left" },
  { name: "Khánh Hòa", lat: 12.2409935, lng: 109.1963968, packages: 4, dir: "right" },
  { name: "Đắk Lắk", lat: 12.7131519, lng: 108.0361555, packages: 4, dir: "left" },
  { name: "Phú Thọ", lat: 21.3340031, lng: 105.4009508, spreadLat: 21.32, spreadLng: 105.15, packages: 4, dir: "left" },
  { name: "Đồng Nai", lat: 10.9307035, lng: 106.8001396, spreadLat: 11.55, spreadLng: 107.15, packages: 3, dir: "right" },
  { name: "Quảng Ninh", lat: 20.9417785, lng: 107.1277751, spreadLat: 21.15, spreadLng: 107.45, packages: 3, dir: "right" },
  { name: "Đà Nẵng", lat: 16.0611566, lng: 108.2246421, packages: 2, dir: "right" },
  { name: "An Giang", lat: 9.966537, lng: 105.1142011, packages: 2, dir: "left" },
  { name: "Cà Mau", lat: 9.1763493, lng: 105.1516313, packages: 2, dir: "left" },
  { name: "Lâm Đồng", lat: 11.9430226, lng: 108.4368778, packages: 1, dir: "right" },
  { name: "Lạng Sơn", lat: 21.8466499, lng: 106.7579429, packages: 1, dir: "right" },
  { name: "Điện Biên", lat: 21.4258502, lng: 103.0472164, packages: 1, dir: "left" },
  { name: "Vĩnh Long", lat: 10.2510125, lng: 105.9470479, spreadLat: 10.3, spreadLng: 106.25, packages: 1, dir: "bottom" },
  { name: "Thái Nguyên", lat: 21.5947868, lng: 105.8406426, spreadLat: 21.75, spreadLng: 105.85, packages: 1, dir: "top" },
  { name: "Nghệ An", lat: 18.6687882, lng: 105.683229, packages: 1, dir: "left" },
  { name: "Gia Lai", lat: 13.7782174, lng: 109.2415233, packages: 1, dir: "right" },
  { name: "Quảng Trị", lat: 17.4663168, lng: 106.6173415, packages: 1, dir: "left" },
];

type Props = {
  /** Hotline hiển thị trong popup. Bỏ trống thì popup ẩn dòng "Tư vấn". */
  phone?: string;
};

/* ── Kiểu tối thiểu cho phần Leaflet API được dùng (nạp từ CDN, không có
      @types/leaflet trong node_modules — không dùng `any` theo AGENTS.md). ── */
type LatLngTuple = [number, number];

interface LeafletLatLng {
  lat: number;
  lng: number;
}

interface LeafletMarker {
  addTo(map: LeafletMap): this;
  bindPopup(html: string, options?: Record<string, unknown>): this;
  bindTooltip(html: string, options?: Record<string, unknown>): this;
  on(event: string, handler: () => void): this;
  openPopup(): this;
  setLatLng(latlng: LatLngTuple): this;
  getLatLng(): LeafletLatLng;
}

interface LeafletMap {
  on(event: string, handler: () => void): this;
  fitBounds(bounds: unknown, options?: Record<string, unknown>): this;
  flyTo(latlng: LatLngTuple, zoom: number, options?: Record<string, unknown>): this;
  getZoom(): number;
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

/** Dưới mức zoom này thì dùng toạ độ giãn cách cho dễ đọc. */
const SPREAD_MAX_ZOOM = 7.5;

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
    const onReady = () => {
      if (window.L) resolve(window.L);
      else reject(new Error("Leaflet tải xong nhưng window.L không tồn tại"));
    };
    // Trang khác có thể đã chèn sẵn thẻ script — bám vào thẻ đó, đừng chèn lần hai.
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      existing.addEventListener("load", onReady);
      existing.addEventListener("error", () => {
        leafletPromise = null;
        reject(new Error("Không tải được Leaflet từ CDN"));
      });
      return;
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => {
      leafletPromise = null; // cho phép thử lại ở lần mount sau
      reject(new Error("Không tải được Leaflet từ CDN"));
    };
    document.head.appendChild(script);
  });
  return leafletPromise;
}

/** >=15 gói: bong bóng lớn có số | 3–5: bong bóng nhỏ có số | 1–2: chấm tròn. */
function bubbleSize(packages: number): number {
  if (packages >= 30) return 36;
  if (packages >= 18) return 30;
  if (packages >= 15) return 28;
  if (packages >= 3) return 22;
  return 12;
}

function bubbleFont(size: number): number {
  if (size >= 36) return 14;
  if (size >= 28) return 12.5;
  return 10.5;
}

/** Tỉnh 1–2 gói vẽ thành chấm tròn — vùng đồng bằng sông Hồng quá dày marker. */
function isDot(packages: number): boolean {
  return packages > 0 && packages < 3;
}

const SHOWROOM_PIN =
  '<svg width="30" height="40" viewBox="0 0 24 32" aria-hidden="true" fill="currentColor">' +
  '<path d="M12 0C5.37 0 0 5.37 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.37 18.63 0 12 0z"/>' +
  '<circle cx="12" cy="12" r="4.6" fill="#fff"/></svg>';

function markerIconHtml(province: ProjectProvince): string {
  if (province.packages === 0) {
    return `<div class="pjm-pin">${SHOWROOM_PIN}<span class="pjm-pulse"></span></div>`;
  }
  const size = bubbleSize(province.packages);
  const star = province.showroom ? '<span class="pjm-star"></span>' : "";
  if (isDot(province.packages)) {
    return `<div class="pjm-dot" style="width:${size}px;height:${size}px">${star}</div>`;
  }
  const lead = province.packages >= 15 ? " pjm-lead" : "";
  return (
    `<div class="pjm-bub${lead}" style="width:${size}px;height:${size}px;font-size:${bubbleFont(size)}px">` +
    `${province.packages}${star}</div>`
  );
}

function popupHtml(province: ProjectProvince, phone?: string): string {
  const tel = phone ? phone.replace(/[^\d+]/g, "") : "";
  const isShowroom = Boolean(province.showroom);
  const badge = province.hq ? "TRỤ SỞ &amp; SHOWROOM" : isShowroom ? "SHOWROOM" : "ĐỊA BÀN DỰ ÁN";
  const detail =
    province.packages > 0
      ? `<p class="pjm-pp-meta"><strong>${province.packages}</strong> gói thầu thiết bị CNTT &amp; số hóa</p>`
      : '<p class="pjm-pp-meta">Showroom trưng bày &amp; hỗ trợ kỹ thuật khu vực</p>';
  return (
    '<div class="pjm-pp">' +
    `<span class="pjm-pp-badge${isShowroom ? " pjm-hq" : ""}">${badge}</span>` +
    `<h3>${province.name}</h3>` +
    (province.showroom ? `<p class="pjm-pp-addr">${province.showroom}</p>` : "") +
    detail +
    (phone ? `<p class="pjm-pp-meta">Tư vấn: <a href="tel:${tel}">${phone}</a></p>` : "") +
    `<a class="pjm-pp-btn${isShowroom ? " pjm-hq" : ""}" href="${isShowroom ? "/he-thong-showroom" : "#project-list"}">` +
    `${isShowroom ? "Thông tin showroom" : "Xem dự án"}</a>` +
    "</div>"
  );
}

/* CSS riêng của hero map — prefix pjm- để không đụng shm- của trang showroom. */
const PJM_CSS = `
.pjm-root{position:absolute;inset:0;z-index:0}
.pjm-root{--pjm-navy:#0b2a63;--pjm-red:#da2127;--pjm-sub:#3d5878;--pjm-line:#c9dbf8}
.pjm-map{position:absolute;inset:0;background:var(--color-primary-100,#dbeafe)}
.pjm-map::after{content:"Đang tải bản đồ…";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 13px var(--font-body,ui-sans-serif,system-ui,sans-serif);color:var(--pjm-sub);opacity:.75}
.pjm-map.leaflet-container::after{display:none}
.pjm-root .leaflet-container{font-family:var(--font-body,ui-sans-serif,system-ui,sans-serif)}

/* attribution tối giản: giữ © OSM/CARTO theo giấy phép nhưng kín đáo */
.pjm-root .leaflet-control-attribution{background:rgba(255,255,255,.6);font-size:9px;line-height:1.6;color:#8195b8;padding:0 6px;border-radius:6px 0 0 0}
.pjm-root .leaflet-control-attribution a{color:#8195b8;text-decoration:none}

/* bong bóng số gói thầu / chấm tròn / pin showroom */
.pjm-bub{position:relative;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--pjm-navy);color:#fff;font-weight:800;letter-spacing:-.02em;border:2.5px solid #fff;box-shadow:0 6px 16px rgba(11,42,99,.34);cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}
.pjm-bub:hover{transform:scale(1.12);box-shadow:0 9px 24px rgba(11,42,99,.46)}
.pjm-bub.pjm-lead{background:linear-gradient(158deg,#14428f,#0b2a63)}
.pjm-dot{position:relative;border-radius:50%;background:var(--pjm-navy);border:2.5px solid #fff;box-shadow:0 3px 9px rgba(11,42,99,.4);cursor:pointer;transition:transform .18s ease}
.pjm-dot:hover{transform:scale(1.45)}
.pjm-pin{position:relative;color:var(--pjm-red);filter:drop-shadow(0 5px 6px rgba(218,33,39,.4));cursor:pointer}
.pjm-pulse{position:absolute;left:50%;bottom:2px;width:12px;height:12px;transform:translateX(-50%);border-radius:50%;animation:pjm-pulse 2.4s ease-out infinite;pointer-events:none}
@keyframes pjm-pulse{0%{box-shadow:0 0 0 0 rgba(218,33,39,.42)}100%{box-shadow:0 0 0 30px rgba(218,33,39,0)}}

/* ★ đánh dấu tỉnh có showroom, gắn ở góc marker */
.pjm-star{position:absolute;top:-5px;right:-6px;width:18px;height:18px;border-radius:50%;background:var(--pjm-red);border:2px solid #fff;box-shadow:0 2px 5px rgba(218,33,39,.5)}
.pjm-star::after{content:"★";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;line-height:1}
.pjm-dot .pjm-star{top:-7px;right:-8px;width:14px;height:14px}
.pjm-dot .pjm-star::after{font-size:8px}

/* nhãn tên tỉnh cạnh marker */
.pjm-root .leaflet-tooltip.pjm-tip{background:#fff;border:1px solid var(--pjm-line);border-radius:999px;padding:3px 11px;font-size:11.5px;font-weight:700;color:var(--pjm-navy);box-shadow:0 3px 10px rgba(11,42,99,.16);white-space:nowrap}
.pjm-root .leaflet-tooltip.pjm-tip-hq{color:var(--pjm-red);border-color:#f3bfbf}
.pjm-root .leaflet-tooltip.pjm-tip::before{display:none}

/* popup */
.pjm-root .leaflet-popup-content-wrapper{border-radius:16px;box-shadow:0 16px 40px rgba(11,42,99,.24)}
.pjm-root .leaflet-popup-content{margin:15px 17px}
.pjm-pp{min-width:222px;max-width:264px;line-height:1.55}
.pjm-pp-badge{display:inline-block;background:var(--pjm-navy);color:#fff;font-size:9.5px;font-weight:800;letter-spacing:.07em;padding:3px 10px;border-radius:999px;margin-bottom:7px}
.pjm-pp-badge.pjm-hq{background:var(--pjm-red)}
.pjm-pp h3{font-size:15px;font-weight:800;color:var(--pjm-navy);margin:0 0 3px;line-height:1.3}
.pjm-pp-addr{font-size:12.5px;color:#41507a;margin:0 0 7px}
.pjm-pp-meta{font-size:12px;color:var(--pjm-sub);margin:0 0 2px}
.pjm-pp-meta strong{color:var(--pjm-navy);font-weight:800}
.pjm-pp-meta a{color:var(--color-primary-600,#2563eb);font-weight:700;text-decoration:none}
/* selector đủ mạnh để thắng '.leaflet-container a{color:#0078A8}' của Leaflet */
.pjm-root .leaflet-popup-content a.pjm-pp-btn{display:inline-block;margin-top:9px;background:var(--pjm-navy);color:#fff;border-radius:9px;padding:7px 15px;font-size:12.5px;font-weight:700;text-decoration:none}
.pjm-root .leaflet-popup-content a.pjm-pp-btn.pjm-hq{background:var(--pjm-red)}

/* chú giải + nút toàn quốc */
.pjm-ui{position:absolute;left:14px;bottom:14px;z-index:1100;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.pjm-legend{background:rgba(255,255,255,.95);border:1px solid var(--pjm-line);border-radius:11px;padding:8px 13px;font-size:12.5px;font-weight:600;color:var(--pjm-navy);box-shadow:0 5px 16px rgba(11,42,99,.16);display:flex;gap:13px;align-items:center;pointer-events:none}
.pjm-legend .pjm-k{display:inline-flex;align-items:center;gap:6px}
.pjm-legend .pjm-k-star{color:var(--pjm-red);font-size:15px;line-height:1}
.pjm-legend .pjm-k-dot{width:11px;height:11px;border-radius:50%;background:var(--pjm-navy);border:2px solid #fff;box-shadow:0 1px 4px rgba(11,42,99,.4)}
.pjm-legend .pjm-k-num{display:inline-flex;align-items:center;justify-content:center;width:19px;height:19px;border-radius:50%;background:var(--pjm-navy);color:#fff;font-size:9.5px;font-weight:800;border:1.5px solid #fff;box-shadow:0 2px 5px rgba(11,42,99,.3)}
.pjm-reset{background:#fff;border:1px solid var(--pjm-line);border-radius:11px;padding:8px 14px;cursor:pointer;font:700 12.5px var(--font-body,ui-sans-serif,system-ui,sans-serif);color:var(--pjm-navy);box-shadow:0 5px 16px rgba(11,42,99,.16);transition:border-color .2s ease,color .2s ease}
.pjm-reset:hover{border-color:var(--color-primary-600,#2563eb);color:var(--color-primary-600,#2563eb)}

/* zoom control né chú giải, bo góc đồng bộ */
.pjm-root .leaflet-bottom.leaflet-right .leaflet-control-zoom{margin-bottom:52px;margin-right:14px;border-radius:10px;overflow:hidden;box-shadow:0 5px 16px rgba(11,42,99,.16)}

@media (max-width:640px){
  .pjm-root .leaflet-tooltip.pjm-tip{display:none} /* mobile: chạm marker để xem, tránh rối nhãn */
  .pjm-ui{left:10px;bottom:10px}
  .pjm-legend{font-size:11.5px;padding:7px 10px;gap:9px}
}
@media (prefers-reduced-motion:reduce){
  .pjm-pulse{animation:none}
  .pjm-bub,.pjm-dot{transition:none}
}
`;

/** Thứ tự chip: showroom trước (theo số gói), rồi các tỉnh còn lại giảm dần. */
const CHIP_ORDER: string[] = [
  ...PROJECT_PROVINCES.filter((p) => p.showroom).map((p) => p.name),
  ...PROJECT_PROVINCES.filter((p) => !p.showroom).map((p) => p.name),
];

/** Nhãn chip gọn hơn tên đầy đủ ở vài tỉnh. */
const CHIP_LABEL: Record<string, string> = {
  "Hải Phòng": "Hải Phòng (Trụ sở)",
  "TP. Hồ Chí Minh": "Hồ Chí Minh",
};

export default function ProjectHeroMap({ phone }: Props) {
  const mapElRef = useRef<HTMLDivElement>(null);
  /** Xem toàn quốc (fitBounds) — gán sau khi map sẵn sàng. */
  const resetRef = useRef<(() => void) | null>(null);
  /** Bay tới một tỉnh và mở popup — gán sau khi map sẵn sàng. */
  const flyToRef = useRef<((name: string) => void) | null>(null);
  const [activeProvince, setActiveProvince] = useState<string | null>(null);

  useEffect(() => {
    const el = mapElRef.current;
    if (!el) return;

    let disposed = false;
    let map: LeafletMap | null = null;
    let cleanupListeners: (() => void) | null = null;

    loadLeaflet()
      .then((L) => {
        if (disposed || !el.isConnected) return;

        map = L.map(el, { scrollWheelZoom: false, zoomControl: false, zoomSnap: 0.25 });
        // Bỏ prefix "Leaflet" — chỉ giữ dòng © OpenStreetMap © CARTO tối giản
        // (bắt buộc theo giấy phép tile, style thu nhỏ trong PJM_CSS).
        map.attributionControl.setPrefix(false);
        L.control.zoom({ position: "bottomright" }).addTo(map);
        L.tileLayer(TILE_URL, { maxZoom: 19, subdomains: "abcd", attribution: TILE_ATTRIBUTION }).addTo(map);

        const currentMap = map;
        // Không cướp cuộn trang: chỉ bật zoom con lăn sau khi người dùng click map.
        currentMap.on("click", () => currentMap.scrollWheelZoom.enable());
        // Mobile: tắt kéo 1 ngón để không chặn cuộn trang (vẫn chạm marker xem popup).
        if (L.Browser.touch && window.matchMedia("(max-width: 640px)").matches) {
          currentMap.dragging.disable();
        }

        const markers = new Map<string, LeafletMarker>();
        const shifted: { marker: LeafletMarker; real: LatLngTuple; spread: LatLngTuple }[] = [];

        // Vẽ bong bóng lớn trước để chấm nhỏ nằm trên, vẫn bấm được.
        [...PROJECT_PROVINCES]
          .sort((a, b) => b.packages - a.packages)
          .forEach((province) => {
            const size = province.packages === 0 ? 40 : bubbleSize(province.packages);
            const width = province.packages === 0 ? 30 : size;
            const anchor: [number, number] =
              province.packages === 0 ? [15, 40] : [size / 2, size / 2];
            const gap = province.packages === 0 ? 20 : size / 2 + (isDot(province.packages) ? 7 : 8);
            const dir = province.dir ?? "top";
            const tipOffset: [number, number] =
              province.packages === 0
                ? dir === "right"
                  ? [14, -20]
                  : dir === "left"
                    ? [-14, -20]
                    : [0, -38]
                : dir === "right"
                  ? [gap, 0]
                  : dir === "left"
                    ? [-gap, 0]
                    : dir === "bottom"
                      ? [0, gap]
                      : [0, -gap];

            const start: LatLngTuple = [
              province.spreadLat ?? province.lat,
              province.spreadLng ?? province.lng,
            ];
            const marker = L.marker(start, {
              icon: L.divIcon({
                className: "",
                html: markerIconHtml(province),
                iconSize: [width, size],
                iconAnchor: anchor,
                popupAnchor: [0, province.packages === 0 ? -38 : -(size / 2)],
              }),
              riseOnHover: true,
              zIndexOffset: (40 - province.packages) * 10,
              alt: `${province.name}${province.packages > 0 ? ` — ${province.packages} gói thầu` : ""}`,
            })
              .addTo(currentMap)
              .bindPopup(popupHtml(province, phone), { closeButton: true, autoPan: true })
              .bindTooltip(
                province.hq
                  ? `★ ${CHIP_LABEL[province.name] ?? province.name}`
                  : isDot(province.packages)
                    ? `${province.name} · ${province.packages} gói`
                    : province.name,
                {
                  permanent: Boolean(province.pinLabel),
                  direction: dir,
                  offset: tipOffset,
                  className: `pjm-tip${province.showroom ? " pjm-tip-hq" : ""}`,
                  opacity: 1,
                },
              );

            // Bấm thẳng marker trên bản đồ → chip tương ứng cũng sáng.
            marker.on("popupopen", () => setActiveProvince(province.name));

            markers.set(province.name, marker);
            if (province.spreadLat !== undefined && province.spreadLng !== undefined) {
              shifted.push({
                marker,
                real: [province.lat, province.lng],
                spread: [province.spreadLat, province.spreadLng],
              });
            }
          });

        // Zoom sâu → trả marker về toạ độ thật; zoom xa → giãn cách cho dễ đọc.
        const syncPositions = () => {
          const useSpread = currentMap.getZoom() < SPREAD_MAX_ZOOM;
          shifted.forEach((item) => {
            const target = useSpread ? item.spread : item.real;
            const current = item.marker.getLatLng();
            if (Math.abs(current.lat - target[0]) > 1e-6 || Math.abs(current.lng - target[1]) > 1e-6) {
              item.marker.setLatLng(target);
            }
          });
        };
        currentMap.on("zoomend", syncPositions);

        const bounds = L.latLngBounds(
          PROJECT_PROVINCES.map(
            (p) => [p.spreadLat ?? p.lat, p.spreadLng ?? p.lng] as LatLngTuple,
          ),
        );
        const fit = () => {
          currentMap.invalidateSize();
          currentMap.closePopup();
          currentMap.fitBounds(bounds, {
            paddingTopLeft: [40, 38],
            paddingBottomRight: [40, 52],
            maxZoom: 7,
          });
          syncPositions();
        };
        resetRef.current = fit;
        flyToRef.current = (name: string) => {
          const province = PROJECT_PROVINCES.find((p) => p.name === name);
          const marker = markers.get(name);
          if (!province || !marker) return;
          currentMap.flyTo([province.lat, province.lng], 9, { duration: 0.85 });
          window.setTimeout(() => {
            syncPositions();
            marker.openPopup();
          }, 950);
        };
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
        // CDN lỗi → giữ nền tĩnh; không được làm vỡ render trang.
      });

    return () => {
      disposed = true;
      resetRef.current = null;
      flyToRef.current = null;
      cleanupListeners?.();
      map?.remove();
    };
  }, [phone]);

  const handleReset = useCallback(() => {
    setActiveProvince(null);
    resetRef.current?.();
  }, []);

  const handleGoTo = useCallback((name: string) => {
    setActiveProvince(name);
    flyToRef.current?.(name);
  }, []);

  return (
    <>
      <section className="relative h-[620px] overflow-hidden rounded-t-[28px] bg-primary-100 lg:h-[640px]">
        <h1 className="sr-only">
          Dự án HPT Tech — thiết bị CNTT, máy scan và giải pháp số hóa tài liệu đã triển khai trên 23 tỉnh thành toàn quốc
        </h1>

        <div className="pjm-root" data-testid="project-hero-map">
          <style>{PJM_CSS}</style>

          <div
            ref={mapElRef}
            className="pjm-map"
            role="application"
            aria-label="Bản đồ địa bàn dự án HPT Tech tại 23 tỉnh thành trên toàn quốc"
          />

          <div className="pjm-ui">
            <div className="pjm-legend">
              <span className="pjm-k">
                <span className="pjm-k-num">12</span> Số gói thầu
              </span>
              <span className="pjm-k">
                <span className="pjm-k-dot" /> Địa bàn dự án
              </span>
              <span className="pjm-k">
                <span className="pjm-k-star">★</span> Có showroom
              </span>
            </div>
            <button className="pjm-reset" type="button" onClick={handleReset}>
              ↺ Toàn quốc
            </button>
          </div>
        </div>
      </section>

      <nav
        aria-label="Chọn tỉnh thành trên bản đồ dự án"
        className="flex flex-wrap justify-center gap-2 border-x border-slate-200 bg-white px-4 py-4"
      >
        <button
          type="button"
          onClick={handleReset}
          aria-pressed={activeProvince === null}
          className={
            activeProvince === null
              ? "inline-flex h-9 items-center rounded-full bg-primary-900 px-4 text-[13px] font-bold text-white transition"
              : "inline-flex h-9 items-center rounded-full border border-primary-100 bg-primary-50 px-4 text-[13px] font-bold text-primary-700 transition hover:bg-primary-100"
          }
        >
          ↺ Toàn quốc
        </button>
        {CHIP_ORDER.map((name) => {
          const province = PROJECT_PROVINCES.find((p) => p.name === name);
          const isActive = activeProvince === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => handleGoTo(name)}
              aria-pressed={isActive}
              className={
                isActive
                  ? "inline-flex h-9 items-center gap-1.5 rounded-full bg-primary-600 px-4 text-[13px] font-bold text-white transition"
                  : "inline-flex h-9 items-center gap-1.5 rounded-full border border-primary-100 bg-primary-50 px-4 text-[13px] font-bold text-primary-700 transition hover:bg-primary-100"
              }
            >
              {province?.showroom ? (
                <span aria-hidden="true" className={isActive ? "text-white" : "text-danger"}>
                  ★
                </span>
              ) : null}
              {CHIP_LABEL[name] ?? name}
            </button>
          );
        })}
      </nav>
    </>
  );
}
